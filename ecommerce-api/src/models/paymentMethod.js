import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      "credit_card",
      "debit_card",
      "paypal",
      "bank_transfer",
      "cash_on_delivery",
    ],
  },
  cardNumber: {
    type: String,
  },
  cardHolderName: {
    type: String,
  },
  expiryDate: {
    type: String,
  },
  // Para PayPal
  paypalEmail: {
    type: String,
  },
  // Para transferencia bancaria
  bankName: {
    type: String,
  },
  accountNumber: {
    type: String,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);

export default PaymentMethod;
