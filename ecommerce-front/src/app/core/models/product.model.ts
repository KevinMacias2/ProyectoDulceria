export interface Product {
    id?: number;
    _id?: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    imagesUrl?: string[]; 
    category: string | { _id: string; name: string };
    stock: number;
  }