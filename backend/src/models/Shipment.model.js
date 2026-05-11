import mongoose from "mongoose";
import { generateTracking } from "../utils/generateTracking.js";

const ShipmentSchema = new mongoose.Schema({
  trackingNumber: { type: String, unique: true, default: () => generateTracking() },
  origin: { address: String, city: String, pincode: String, coordinates: [Number] },
  destination: { address: String, city: String, pincode: String, coordinates: [Number] },
  cargo: { description: String, weight: Number, dimensions: { l: Number, w: Number, h: Number }, category: String },
  status: {
    type: String,
    enum: ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed"],
    default: "pending"
  },
  statusHistory: [{ status: String, timestamp: Date, note: String, updatedBy: mongoose.Schema.Types.ObjectId }],
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  estimatedDelivery: Date,
  actualDelivery: Date,
  proofOfDelivery: { imageUrl: String, signature: String, receivedBy: String },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }
}, { timestamps: true });

ShipmentSchema.pre("save", function addInitialHistory(next) {
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({ status: this.status, timestamp: new Date(), note: "Shipment created" });
  }
  next();
});

export default mongoose.model("Shipment", ShipmentSchema);

