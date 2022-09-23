import { GetObjectCommand, ListObjectsCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import CombinedStream from 'combined-stream';
import { PassThrough, Readable } from 'stream';
import { s3 } from '../clients';

const upload = (key: string, stream: Readable) => {
  const parallelUpload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.BUCKET_NAME,
      Key: `${key}.zip`,
      Body: stream,
      ContentEncoding: 'gzip'
    },
    queueSize: 4,
    partSize: 1024 * 1024 * 5,
    leavePartsOnError: false
  });

  return parallelUpload.done();
};

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const failedMessageIds: string[] = [];
  const promises = event.Records.map(async (record) => {
    try {
      const { prefix } = JSON.parse(record.body);

      const { Contents } = await s3.send(
        new ListObjectsCommand({
          Bucket: process.env.BUCKET_NAME,
          Prefix: prefix
        })
      );

      const combinedStream = CombinedStream.create();

      Contents?.map(async ({ Key }) => {
        const { Body } = await s3.send(
          new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key })
        );
        combinedStream.append(Body as Readable);
      });
      const passThrough = new PassThrough();
      combinedStream.pipe(passThrough);

      await upload('hello/there', passThrough);
    } catch (error) {
      console.log({ error });
      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.allSettled(promises);
  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
