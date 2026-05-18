const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: 0 },
    priority: { type: String, default: 'Normal' },
    status: {
      type: String,
      enum: ['PENDING', 'PACKED', 'IN_TRANSIT', 'DELIVERED'],
      default: 'PENDING'
    },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null },
    deliveryDate: { type: Date, default: null },
    trackingNumber: { type: String, unique: true, sparse: true }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false }
  }
);

shipmentSchema.virtual('driver', {
  ref: 'Driver',
  localField: 'driverId',
  foreignField: '_id',
  justOne: true
});

shipmentSchema.virtual('warehouse', {
  ref: 'Warehouse',
  localField: 'warehouseId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Shipment', shipmentSchema);
