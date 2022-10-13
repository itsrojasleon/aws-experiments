import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(event)).length;

    return {
      statusCode: 201,
      body: JSON.stringify({
        bytes
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error })
    };
  }
};
