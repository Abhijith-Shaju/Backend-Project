const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    vehicleNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ON_DELIVERY', 'UNAVAILABLE'],
      default: 'AVAILABLE'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false }
  }
);

module.exports = mongoose.model('Driver', driverSchema);
