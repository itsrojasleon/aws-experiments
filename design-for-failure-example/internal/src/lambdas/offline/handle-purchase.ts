import { SQSBatchResponse, SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      const { product, offline } = JSON.parse(record.body);
      console.log('Purchase solved when we were offline', {
        product,
        offline
      });

      // Put object into a special S3 bucket path so we can see it was handled
      // in offline modde.

      // Send SQS message to lambda.

      // Lambda will list objects, push them.
    } catch (error) {
      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.allSettled(promises);
  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
