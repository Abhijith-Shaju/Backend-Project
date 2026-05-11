import mongoose from "mongoose";

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: String,
  email: String,
  phone: String,
  address: { street: String, city: String, country: String },
  paymentTerms: { type: String, default: "Net 30" },
  creditLimit: Number,
  rating: { type: Number, min: 1, max: 5 },
  isActive: { type: Boolean, default: true },
  documents: [{ name: String, url: String, uploadedAt: Date }]
}, { timestamps: true });

export default mongoose.model("Vendor", VendorSchema);

