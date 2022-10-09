import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import axios from 'axios';
import {
  HandleRequestEvent,
  Product,
  RedirectRequestEvent
} from '../../../../common/types';
import { sqs } from '../../clients';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  console.log({ RecordsOffline: event.Records });
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      const { productId, bucketPath }: HandleRequestEvent = JSON.parse(
        record.body
      );

      const { data: product } = await axios.get<Product>(
        `https://tvqgn89h2g.execute-api.us-east-1.amazonaws.com/prod/api/${productId}`
      );

      const msgBody: RedirectRequestEvent = {
        product,
        bucketPath,
        offline: true
      };

      await sqs.send(
        new SendMessageCommand({
          QueueUrl: process.env.REQUEST_REDIRECTION_QUEUE_URL,
          MessageBody: JSON.stringify(msgBody)
        })
      );
    } catch (error) {
      failedMessageIds.push(record.messageId);
    }
  });

  // Try to fail as fast as possible.
  await Promise.all(promises);
  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
