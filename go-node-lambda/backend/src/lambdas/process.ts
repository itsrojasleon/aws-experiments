import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { S3Handler } from 'aws-lambda';
import { Validator } from 'jsonschema';
import { PassThrough, pipeline, Readable, Transform } from 'stream';
import { parser } from 'stream-json';
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
  try {
    const promises = event.Records.map(async (record) => {
      const bucketName = record.s3.bucket.name;
      const key = record.s3.object.key;

      // TODO: Solve access denied error.
      const { Body } = await s3.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: key
        })
      );
      const input = Body as Readable;
      const output = new PassThrough();
      const jsonParser = parser();
      const gzip = createGzip();

      const validator = new Transform({
        objectMode: true,
        transform(chunk, _, cb) {
          const { valid, errors } = schemaValidator.validate(chunk, schema);

          const transformedChunk = {
            ...chunk,
            valid,
            ...(errors.length && {
              errors
            })
          };

          this.push(JSON.stringify(transformedChunk));

          cb();
        }
      });

      await pipelineAsync(input, jsonParser, validator, gzip, output);

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: `${ulid()}.json.gz`,
          Body: output
        })
      );
    });

    await Promise.all(promises);
  } catch (err) {
    console.error(err);
  }
};
