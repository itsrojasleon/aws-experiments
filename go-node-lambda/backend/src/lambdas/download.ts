import { GetObjectCommand } from '@aws-sdk/client-s3';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { dynamo, s3 } from '../clients';
import { Status } from '../types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const pathParams = event.pathParameters || {};

    if (!pathParams.id) {
      return {
        statusCode: 400,
        body: 'Missing id path parameter'
      };
    }

    const { Item } = await dynamo.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME!,
        Key: { id: pathParams.id }
      })
    );

    if (!Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'Item not found'
        })
      };
    }

    if (Item.status === Status.Processing) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Item is still processing...'
        })
      };
    }

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `validations/${pathParams.id}.json.gz`
      }),
      { expiresIn: 3600 } // 1 hour.
    );

    // TODO: Add some logic to retrieve the downloadable url from dynamo
    // instead of generating it in every request.
    // Add a new field to store the expiration date of the url and start
    // generating a new one when the current one expires.

    await dynamo.send(
      new UpdateCommand({
        TableName: process.env.TABLE_NAME!,
        Key: { id: pathParams.id },
        UpdateExpression: 'SET #get = :get',
        ExpressionAttributeNames: {
          '#get': 'get'
        },
        ExpressionAttributeValues: {
          ':get': { url }
        }
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        url,
        id: pathParams.id
      })
    };
  } catch (err) {
    console.error({ err });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Something went wrong'
      })
    };
  }
};
