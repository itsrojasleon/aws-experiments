import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { dynamodb, sqs } from '../clients';
import { generateId, validateNodeEnv } from '../utils';

export const handler: APIGatewayProxyHandler = async (event) => {
  validateNodeEnv();

  if (!process.env.TABLE_NAME) {
    throw new Error('TABLE_NAME is not defined');
  }
  if (!process.env.QUEUE_URL) {
    throw new Error('QUEUE_URL is not defined');
  }

  try {
    let body;

    try {
      body = JSON.parse(event.body || '{}');
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid body' })
      };
    }

    const id = generateId();

    await dynamodb.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          id,
          name: body.name,
          content: body.content
        }
      })
    );

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: JSON.stringify({ id })
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Blog post created successfully' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error })
    };
  }
};
