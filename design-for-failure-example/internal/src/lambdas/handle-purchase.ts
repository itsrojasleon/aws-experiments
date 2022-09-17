import { SQSBatchResponse, SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      console.log('Purchase solved!');
    } catch (error) {
      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.allSettled(promises);

  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
