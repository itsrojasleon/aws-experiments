import { SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = async (event) => {
  event.Records.map((record) => {
    console.log({ record });
  });
};
