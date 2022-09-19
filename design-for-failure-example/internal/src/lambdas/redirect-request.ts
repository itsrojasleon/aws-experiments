import { GetObjectCommand } from '@aws-sdk/client-s3';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import { Readable } from 'stream';
import { ProductRequest, RedirectRequestEvent } from '../../../common/types';
import { s3, sqs } from '../clients';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const failedMessageIds: string[] = [];

  const streamToString = (stream: Readable) => {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  };

  const promises = event.Records.map(async (record) => {
    try {
      const { bucketPath, product, offline }: RedirectRequestEvent = JSON.parse(
        record.body
      );

      const { Body: stream } = await s3.send(
        new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: bucketPath
        })
      );

      const { reason } = (await streamToString(
        stream as Readable
      )) as ProductRequest;

      if (offline) {
        await sqs.send(
          new SendMessageCommand({
            QueueUrl:
              reason === 'purchase'
                ? process.env.HANDLE_OFFLINE_PURCHASE_QUEUE_URL
                : process.env.HANDLE_OFFLINE_QUESTION_QUEUE_URL,
            MessageBody: JSON.stringify({ product, offline })
          })
        );
      } else {
        await sqs.send(
          new SendMessageCommand({
            QueueUrl:
              reason === 'purchase'
                ? process.env.HANDLE_PURCHASE_QUEUE_URL
                : process.env.HANDLE_QUESTION_QUEUE_URL,
            MessageBody: JSON.stringify({ product })
          })
        );
      }
    } catch (error) {
      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.allSettled(promises);
  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
