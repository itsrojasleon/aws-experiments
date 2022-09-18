import { SQSBatchResponse, SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      const { product, offline } = JSON.parse(record.body);
      console.log('Question solved when we were offline', {
        product,
        offline
      });
    } catch (error) {
      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.allSettled(promises);
  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
