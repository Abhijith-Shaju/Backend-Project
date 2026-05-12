const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    locationName: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    capacity: { type: Number, required: true, min: 1 },
    currentUsage: { type: Number, default: 0, min: 0 }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false }
  }
);

module.exports = mongoose.model('Warehouse', warehouseSchema);
