import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { ulid } from 'ulid';
import { dynamo, s3 } from '../clients';
import { Status } from '../types';

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const id = ulid();

    const { url, fields } = await createPresignedPost(s3, {
      Bucket: process.env.BUCKET_NAME!,
      Key: `uploads/${id}.csv`,
      Expires: 3600, // 1 hour.
      Fields: {
        'x-amz-meta-user-id': '123',
        'x-amz-meta-resource-id': '321'
      }
      // TODO: Think about adding the `Fields` and `Conditions` properties.
    });

    // TODO: Add userId to the created item to keep a control who created it.
    // ...
    await dynamo.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME!,
        Item: {
          id,
          post: {
            url,
            fields
          },
          status: Status.Processing
        }
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        id,
        url,
        fields
      })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: 'Something went wrong'
    };
  }
};
