import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { ulid } from 'ulid';
import { s3 } from '../s3';

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const key = `${ulid()}.csv`;

    const { url, fields } = await createPresignedPost(s3, {
      Bucket: process.env.BUCKET_NAME!,
      Key: key,
      // Think about adding the `Fields` and `Conditions` properties.
      Expires: 3600
    });

    return {
      statusCode: 201,
      body: JSON.stringify({ url, fields })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Something went wrong'
    };
  }
};
