import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { SQSHandler } from 'aws-lambda';
import { dynamodb } from '../clients';
import { validateNodeEnv } from '../utils';

export const handler: SQSHandler = async (event) => {
  validateNodeEnv();

  if (!process.env.TABLE_NAME) {
    throw new Error('TABLE_NAME is not defined');
  }

  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      const body = JSON.parse(record.body);

      const { Item } = await dynamodb.send(
        new GetCommand({
          TableName: process.env.TABLE_NAME,
          Key: {
            id: body.id
          }
        })
      );

      console.log({ Item });
    } catch (err) {
      console.log(err);
      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.all(promises);
  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
