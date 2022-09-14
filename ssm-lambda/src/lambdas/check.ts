import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { APIGatewayProxyHandler } from 'aws-lambda';

const ssm = new SSMClient({});

export const handler: APIGatewayProxyHandler = async () => {
  const res = await ssm.send(
    new GetParameterCommand({
      Name: process.env.PARAM_NAME
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      name: process.env.PARAM_NAME,
      value: res.Parameter!.Value
    })
  };
};
