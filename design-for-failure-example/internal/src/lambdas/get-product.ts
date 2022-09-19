import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import axios from 'axios';
import {
  HandleRequestEvent,
  Product,
  RedirectRequestEvent
} from '../../../common/types';
import { sqs } from '../clients';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      const { productId, bucketPath }: HandleRequestEvent = JSON.parse(
        record.body
      );

      const { data: product } = await axios.get<Product>(
        `https://0tpnq8j330.execute-api.us-east-1.amazonaws.com/prod/api/${productId}`
      );

      const msgBody: RedirectRequestEvent = {
        // NOTE: If the product payload were huge, then passing it down as an
        // event property is not a great idea.
        product,
        bucketPath,
        offline: false
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

  await Promise.allSettled(promises);
  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
