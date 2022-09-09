import { SQSBatchResponse, SQSEvent } from 'aws-lambda';

// Lambda will begin polling the SQS queue using five parallel
// connections.
export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const failedMessageIds: string[] = [];

  console.log('event.Records', event.Records);

  const promises = event.Records.map(async (record) => {
    try {
      // Do some work...
    } catch (err) {
      console.error('An error ocurred: ', err);
      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.allSettled(promises);

  return {
    batchItemFailures: failedMessageIds.map((id) => ({
      itemIdentifier: id
    }))
  };
};
