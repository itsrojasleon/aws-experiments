import { APIGatewayProxyHandler } from 'aws-lambda';
import { Product } from '../../../common/types';

export const handler: APIGatewayProxyHandler = async () => {
  const product: Product = { id: 'coolId', name: 'product name', price: 233 };
  return {
    statusCode: 201,
    body: JSON.stringify(product)
  };
};
