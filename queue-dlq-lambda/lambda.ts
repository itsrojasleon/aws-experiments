import { SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = async (event) => {
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    // DeadLetterQueueSourceArn does not exist within the attributes ts types.
    // Modify the `attributes` attrs to add the property or just ignore it.
    // @ts-ignore
    console.log(record.attributes.DeadLetterQueueSourceArn || 'Main queue');
    try {
      throw new Error('Something went wrong');
    } catch (err) {
      failedMessageIds.push(record.messageId);
    }
  });

  await Promise.allSettled(promises);
  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
