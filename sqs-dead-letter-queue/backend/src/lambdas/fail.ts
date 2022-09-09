import { SQSBatchResponse, SQSEvent } from 'aws-lambda';

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      throw new Error('Call the retry lambda function');
    } catch (err) {
      console.log({ err });

      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.allSettled(promises);

  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
