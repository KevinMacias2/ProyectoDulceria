export interface PaymentMethod {
  _id?: string;
  id?: number;
  name: string;
  description?: string;
  isActive: boolean;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'cash' | 'bank_transfer';
  icon?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
