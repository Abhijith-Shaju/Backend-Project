import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema({
  licensePlate: { type: String, required: true, unique: true },
  type: { type: String, enum: ["bike", "van", "truck", "container_truck"] },
  capacity: Number,
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  currentLocation: { lat: Number, lng: Number, updatedAt: Date },
  isAvailable: { type: Boolean, default: true },
  fuelLogs: [{ date: Date, liters: Number, cost: Number, odometer: Number }],
  maintenanceLogs: [{ date: Date, type: String, cost: Number, notes: String }]
}, { timestamps: true });

export default mongoose.model("Vehicle", VehicleSchema);

