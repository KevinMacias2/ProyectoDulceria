import { CartItem } from "./cart-item";

export interface Boucher {
  orderNumber: string;
  orderDate: string;
  customer: {
    name: string;
    email: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  shipping: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  payment: {
    method: string;
    paymentStatus: string;
  };
  totals: {
    subtotal: number;
    shipping: number;
    total: number;
  };
  status: string;
}

export interface Order {
    id: string;
    _id?: string;
    items: CartItem[];
    customerName: string;
    email: string;
    address: string;
    phone: string;
    total: number;
    date: Date;
    payment?: any;
    boucher?: Boucher;
  }