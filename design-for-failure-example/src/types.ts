export interface Product {
  id: string;
  name: string;
  price: number;
}

/**
 * Product request being save within s3 bucket in json format.
 */
export interface ProductRequest {
  productId: string;
  reason: 'question' | 'purchase';
}

export interface GetProductsEvent {
  bucketPath: string;
}
