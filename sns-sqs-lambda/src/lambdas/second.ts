import { SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = async (event) => {
  console.log({ second: event.Records });
};
