import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const buff = Buffer.alloc(128 * 1024 * 1024);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: buff.byteLength })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message })
    };
  }
};
