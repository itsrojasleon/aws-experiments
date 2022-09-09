import { APIGatewayProxyHandler } from "aws-lambda";
import { readdir } from "fs/promises";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const dirs = await readdir("/tmp");

    return {
      statusCode: 201,
      body: JSON.stringify({ count: dirs.length }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};
