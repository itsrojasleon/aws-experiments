import { SQSBatchResponse, SQSEvent } from 'aws-lambda';

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  console.log({ records: event.Records });

  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      console.log('Working hard...');
    } catch (err) {
      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.allSettled(promises);

  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
