import { GetObjectCommand } from '@aws-sdk/client-s3';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { Upload } from '@aws-sdk/lib-storage';
import { S3Handler } from 'aws-lambda';
import { parse } from 'csv-parse';
import { Validator as JsonSchemaValidator } from 'jsonschema';
import {
  PassThrough,
  pipeline,
  Readable,
  Transform,
  TransformCallback
} from 'stream';
import { ulid } from 'ulid';
import { promisify } from 'util';
import { createGzip } from 'zlib';
import { s3, sqs } from '../clients';

const pipelineAsync = promisify(pipeline);

const schemaValidator = new JsonSchemaValidator();
const schema = {
  type: 'object',
  properties: {
    Suppressed: { type: 'string', minLength: 1 }
  },
  required: ['Suppressed']
};

export const handler: S3Handler = async (event) => {
  const promises = event.Records.map(async (record) => {
    try {
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

      // We'll get a BAD gzip file if we do this.
      // Do not do this!
      // output.write('[');

      class Validator extends Transform {
        private numChunks = 0;

        constructor() {
          super({ objectMode: true });
        }

        _transform(chunk: any, _: BufferEncoding, callback: TransformCallback) {
          this.numChunks++;

          const { valid, errors } = schemaValidator.validate(chunk, schema);

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

      const key = `${ulid()}.json.gz`;

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

      await sqs.send(
        new SendMessageCommand({
          QueueUrl: process.env.QUEUE_URL!,
          MessageBody: JSON.stringify({ bucketKey: key, bucketName })
        })
      );
    } catch (err) {
      console.error({ err });
    }
  });

  await Promise.allSettled(promises);
};
