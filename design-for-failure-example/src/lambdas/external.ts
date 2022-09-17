import { APIGatewayProxyHandler } from 'aws-lambda';
import { Product } from '../types';

export const getProduct: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.pathParameters?.id) {
      throw new Error('Must provide a product id');
    }

    const { id } = event.pathParameters;

    const products: Product[] = [];

    for (let i = 0; i < 10; i++) {
      products.push({
        id: (i + 1).toString(),
        name: `product #${i}`,
        price: Math.random() * i + 10
      });
    }

    const product = products.find((product) => product.id === id) ?? {
      name: 'Generic product',
      price: 100,
      id: 'coolid'
    };

    return {
      statusCode: 201,
      body: JSON.stringify({ product })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};
