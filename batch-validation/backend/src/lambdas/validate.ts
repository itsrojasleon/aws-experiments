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
import * as zlib from 'zlib';
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

      const { Body, Metadata } = await s3.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: record.s3.object.key
        })
      );

      // Here's the metadata!
      console.log({ Metadata });

      const input = Body as Readable;
      const output = new PassThrough();
      const csvParser = parse({ columns: true });

      const gzip = zlib.createGzip({
        // Emit a 'data' event after each write, rather than buffering
        // the data until the stream is closed.
        flush: zlib.constants.Z_SYNC_FLUSH
      });

      class Validator extends Transform {
        private numChunks = 0;

        constructor() {
          super({ objectMode: true });
        }

        _transform(chunk: any, _: BufferEncoding, cb: TransformCallback) {
          this.numChunks++;

          const { valid, errors } = schemaValidator.validate(chunk, schema);

          // Modify each chunk so we can know where there was an error or not.
          const transformedChunk = JSON.stringify(
            {
              ...chunk,
              valid,
              ...(errors.length && {
                errors: errors.map((e) => e.stack)
              })
            },
            null,
            2
          );
          const auxChar = this.numChunks === 1 ? '[' : ',';

          cb(null, auxChar + transformedChunk);
        }

        _flush(cb: TransformCallback) {
          cb(null, ']');
        }
      }

      const validator = new Validator();

      const id = record.s3.object.key
        .replace('uploads/', '')
        .replace('.csv', '');

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: bucketName,
          Key: `validations/${id}.json.gz`,
          Body: output
        }
      });

      const pipelinePromise = pipelineAsync(
        input,
        csvParser,
        validator,
        gzip,
        output
      );
      const uploadPromise = upload.done();

      await Promise.all([pipelinePromise, uploadPromise]);

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
  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
