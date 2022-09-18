import { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import { Product } from '../../../common/types';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      const product: Product = JSON.parse(record.body);
      console.log('Purchase solved!', { product });
    } catch (error) {
      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.allSettled(promises);

  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
