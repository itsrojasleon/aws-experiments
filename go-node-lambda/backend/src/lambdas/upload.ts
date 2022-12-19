import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { ulid } from 'ulid';
import { s3 } from '../clients';

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const id = ulid();
    const key = `${id}.csv`;

    const { url, fields } = await createPresignedPost(s3, {
      Bucket: process.env.BUCKET_NAME!,
      Key: key,
      // TODO: Think about adding the `Fields` and `Conditions` properties.
      Expires: 3600
    });

    return {
      statusCode: 201,
      body: JSON.stringify({ url, fields, id })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Something went wrong'
    };
  }
};
