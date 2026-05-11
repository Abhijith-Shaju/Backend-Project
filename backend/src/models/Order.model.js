import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  type: { type: String, enum: ["purchase", "sales"], required: true },
  status: { type: String, enum: ["draft", "confirmed", "processing", "shipped", "invoiced", "closed"], default: "draft" },
  items: [{ product: mongoose.Schema.Types.ObjectId, quantity: Number, unitPrice: Number, totalPrice: Number }],
  totalAmount: Number,
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  customer: { name: String, email: String, phone: String, address: String },
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment" },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("Order", OrderSchema);

