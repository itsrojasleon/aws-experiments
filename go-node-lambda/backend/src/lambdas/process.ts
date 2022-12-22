import { GetObjectCommand } from '@aws-sdk/client-s3';
import { S3Event, SQSHandler } from 'aws-lambda';
import { pipeline, Readable, Transform, TransformCallback } from 'stream';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { promisify } from 'util';
import { createGunzip } from 'zlib';
import { s3 } from '../clients';

const pipelineAsync = promisify(pipeline);

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
      const gunzip = createGunzip();

      class FilterByValid extends Transform {
        constructor() {
          super({ objectMode: true });
        }
        _transform(chunk: any, _: BufferEncoding, cb: TransformCallback) {
          if (chunk.valid) {
            // TODO: Start emission flow...
          }
          cb();
        }
      }

      await pipelineAsync(
        input,
        gunzip,
        parser(),
        streamArray(),
        new FilterByValid()
      );
    } catch (err) {
      console.error({ err });
      failedMessageIds.push(messageId);
    }
  });

  await Promise.allSettled(promises);
  console.log('All done processing...');
  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
