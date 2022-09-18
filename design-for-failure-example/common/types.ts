export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface ProductRequest {
  productId: string;
  reason: 'question' | 'purchase';
}

export interface HandleRequestEvent {
  productId: string;
  bucketPath: string;
}

export interface RedirectRequestEvent {
  product: Product;
  bucketPath: string;
  offline: boolean;
}
