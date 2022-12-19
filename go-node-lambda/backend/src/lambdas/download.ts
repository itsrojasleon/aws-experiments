import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SQSHandler } from 'aws-lambda';
import { s3 } from '../clients';

export const handler: SQSHandler = async (event) => {
  const failedMessageIds: string[] = [];

  const promises = event.Records.map(async (record) => {
    try {
      const { bucketName, bucketKey } = JSON.parse(record.body);

      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: bucketName,
          Key: bucketKey
        }),
        { expiresIn: 3600 * 6 } // 6 hours.
      );

      // TODO: Where do we send the URL?
    } catch (err) {
      console.error({ err });
    }
  });

  await Promise.allSettled(promises);

  return {
    batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id }))
  };
};
