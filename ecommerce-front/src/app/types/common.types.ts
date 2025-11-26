export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  products?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CartItem {
  product: {
    _id?: string;
    id?: number;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    imagesUrl?: string[];
    category: string | { _id: string; name: string };
    stock: number;
  };
  quantity: number;
  total: number;
}
