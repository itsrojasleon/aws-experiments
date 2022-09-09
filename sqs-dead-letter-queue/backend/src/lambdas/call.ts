import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { APIGatewayProxyHandler } from 'aws-lambda';

const sqs = new SQSClient({});

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const command = new SendMessageCommand({
      QueueUrl: process.env.SIMPLE_QUEUE_URL,
      MessageBody: JSON.stringify({ msg: 'Hi there' })
    });

    await sqs.send(command);

    return {
      statusCode: 200,
      body: 'Just called!'
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error })
    };
  }
};
