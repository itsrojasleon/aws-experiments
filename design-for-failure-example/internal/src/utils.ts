import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { SQSEvent } from 'aws-lambda';
import axios from 'axios';
import { sqs } from './clients';

export const processHealthChecks = async (event: SQSEvent) => {
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      const incomingMessage = JSON.parse(record.body); // Will look like: {"bucketPath": "value/here"}

      await axios.get(process.env.MONITOR_HEALTH_FN_URL!, {
        timeout: 1000
      });

      await sqs.send(
        new SendMessageCommand({
          QueueUrl: 'todo',
          MessageBody: JSON.stringify({ ...incomingMessage })
        })
      );

      // Just for debugging.
      return true;
    } catch (error) {
      console.log({ error });
      failedMessageIds.push(record.messageId);
    }
  });

  const values = await Promise.all(promises);
  console.log({ values });

  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
