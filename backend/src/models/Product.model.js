import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: String,
  unit: { type: String, default: "pcs" },
  costPrice: { type: Number, required: true },
  sellingPrice: Number,
  stockQty: { type: Number, default: 0 },
  reorderPoint: { type: Number, default: 10 },
  eoq: Number,
  warehouseZone: String,
  binLocation: String,
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  images: [String],
  isActive: { type: Boolean, default: true },
  stockHistory: [{ type: String, quantity: Number, reason: String, createdBy: mongoose.Schema.Types.ObjectId, createdAt: Date }]
}, { timestamps: true });

export default mongoose.model("Product", ProductSchema);

