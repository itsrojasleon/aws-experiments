import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { s3 } from '../s3';

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const key = `${Date.now()}.txt}`;

    const url = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: key
      }),
      { expiresIn: 3600 } // 1 hour.
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ url, key })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Something went wrong'
    };
  }
};
