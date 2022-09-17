import { GetObjectCommand } from '@aws-sdk/client-s3';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import axios from 'axios';
import { consumers, Readable } from 'stream';
import {
  GetProductsEvent,
  Product,
  ProductRequest
} from '../../../common/types';
import { s3, sqs } from '../clients';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      const { bucketPath }: GetProductsEvent = JSON.parse(record.body);

      const { Body } = await s3.send(
        new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: bucketPath
        })
      );

      const readableBody = Body as Readable;
      const { productId, reason } = (await consumers.json(
        readableBody
      )) as ProductRequest;

      const { data } = await axios.get<Product>(
        `${process.env.GET_PRODUCT_FN_URL!}/${productId}`
      );

      if (reason === 'question') {
        await sqs.send(
          new SendMessageCommand({
            QueueUrl: process.env.QUESTION_HANDLER_QUEUE_URL,
            MessageBody: JSON.stringify(data)
          })
        );
      } else {
        await sqs.send(
          new SendMessageCommand({
            QueueUrl: process.env.PURCHASE_HANDLER_QUEUE_URL,
            MessageBody: JSON.stringify(data)
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
