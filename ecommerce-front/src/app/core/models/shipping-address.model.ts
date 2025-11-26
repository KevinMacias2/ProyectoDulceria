export interface ShippingAddress {
  _id?: string;
  id?: number;
  userId: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
