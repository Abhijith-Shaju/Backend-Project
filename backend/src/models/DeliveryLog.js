const mongoose = require('mongoose');

const deliveryLogSchema = new mongoose.Schema(
  {
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PACKED', 'QUEUED', 'IN_TRANSIT', 'DELIVERED'],
      required: true
    },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String, default: null }
  },
  {
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false }
  }
);

module.exports = mongoose.model('DeliveryLog', deliveryLogSchema);
