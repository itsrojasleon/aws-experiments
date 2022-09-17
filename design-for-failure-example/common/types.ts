export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface ProductRequest {
  productId: string;
  reason: 'question' | 'purchase';
}

export interface GetProductsEvent {
  bucketPath: string;
}
