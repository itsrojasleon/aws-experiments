import { GetObjectCommand } from '@aws-sdk/client-s3';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Upload } from '@aws-sdk/lib-storage';
import { S3Event, SQSHandler } from 'aws-lambda';
import { parse } from 'csv-parse';
import { Validator as JsonSchemaValidator } from 'jsonschema';

import {
  PassThrough,
  pipeline,
  Readable,
  Transform,
  TransformCallback
} from 'stream';
import { promisify } from 'util';
import { createGzip } from 'zlib';
import { dynamo, s3 } from '../clients';
import { Status } from '../types';

const pipelineAsync = promisify(pipeline);

const schemaValidator = new JsonSchemaValidator();
const schema = {
  type: 'object',
  properties: {
    Suppressed: { type: 'string', minLength: 1 }
  },
  required: ['Suppressed']
};

export const handler: SQSHandler = async (event) => {
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async ({ body, messageId }) => {
    try {
      const { Records }: S3Event = JSON.parse(body);
      const record = Records[0];

      const bucketName = record.s3.bucket.name;

      const { Body } = await s3.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: record.s3.object.key
        })
      );
      const input = Body as Readable;
      const output = new PassThrough();
      const csvParser = parse({ columns: true });
      const gzip = createGzip();

      class Validator extends Transform {
        private numChunks = 0;

        constructor() {
          super({ objectMode: true });
        }

        _transform(chunk: any, _: BufferEncoding, callback: TransformCallback) {
          this.numChunks++;

          const { valid, errors } = schemaValidator.validate(chunk, schema);

          // Modify each chunk so we can know where there was an error or not.
          const transformedChunk = JSON.stringify(
            {
              ...chunk,
              valid,
              ...(errors.length && {
                errors
              })
            },
            null,
            2
          );

          const auxChar = this.numChunks === 1 ? '[' : ',';

          callback(null, auxChar + transformedChunk);
        }

        _flush(callback: TransformCallback): void {
          callback(null, ']');
        }
      }

      await pipelineAsync(input, csvParser, new Validator(), gzip, output);

      const id = record.s3.object.key
        .replace('uploads/', '')
        .replace('.csv', '');

      const key = `validations/${id}.json.gz`;

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: bucketName,
          Key: key,
          Body: output
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 5, // 5 MB.
        leavePartsOnError: false
      });

      await upload.done();

      await dynamo.send(
        new UpdateCommand({
          TableName: process.env.TABLE_NAME!,
          Key: { id },
          UpdateExpression: 'SET #status = :status',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': Status.Completed
          }
        })
      );
    } catch (err) {
      console.error({ err });
      failedMessageIds.push(messageId);
    }
  });

  await Promise.allSettled(promises);
};
