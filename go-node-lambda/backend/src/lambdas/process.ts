import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { S3Handler } from 'aws-lambda';
import { parse } from 'csv-parse';
import { Validator } from 'jsonschema';
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

const pipelineAsync = promisify(pipeline);

const s3 = new S3Client({});

const schemaValidator = new Validator();
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    value: { type: 'string' }
  }
};

export const handler: S3Handler = async (event) => {
  const promises = event.Records.map(async (record) => {
    try {
      const bucketName = record.s3.bucket.name;
      const key = record.s3.object.key;

      const { Body } = await s3.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: key
        })
      );
      const input = Body as Readable;
      const output = new PassThrough();
      const csvParser = parse({ columns: true });
      const gzip = createGzip();

      class Val extends Transform {
        numChunks = 0;

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

      await pipelineAsync(input, csvParser, new Val(), gzip, output);

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: bucketName,
          Key: `${ulid()}.json.gz`,
          Body: output
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 5, // 5 MB.
        leavePartsOnError: false
      });

      await upload.done();
    } catch (err) {
      console.error({ err });
    }
  });

  await Promise.allSettled(promises);
};
