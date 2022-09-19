import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { Upload } from '@aws-sdk/lib-storage';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { HandleRequestEvent } from '../../../common/types';
import { s3, sqs } from '../clients';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const reasons = ['question', 'purchase'];

    const reason = reasons[Math.round(Math.random())];
    const productId = '1';

    const bucketPath = `requests/${(Math.random() + 1)
      .toString(36)
      .substring(7)}.json`;

    const multiPartUpload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.BUCKET_NAME,
        Key: bucketPath,
        Body: JSON.stringify({ productId, reason }),
        ContentType: 'application/json'
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 5,
      leavePartsOnError: false
    });

    await multiPartUpload.done();

    const msgBody: HandleRequestEvent = { bucketPath, productId };

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.OBTAINING_PRODUCT_QUEUE_URL,
        MessageBody: JSON.stringify(msgBody)
      })
    );
    return {
      statusCode: 200,
      body: JSON.stringify({ msg: 'Request saved!' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error })
    };
  }
};
