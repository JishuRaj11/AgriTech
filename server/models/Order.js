const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

/**
 * Order collection. Status flow: pending -> approved -> delivered (or rejected/cancelled).
 */
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    items: {
      type: [orderItemSchema],
      validate: [(items) => items.length > 0, 'An order needs at least one item']
    },
    totalAmount: { type: Number, required: true, min: 0 },
    deliveryAddress: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true,
      maxlength: 300
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'delivered', 'rejected', 'cancelled'],
      default: 'pending',
      index: true
    },
    placedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    deliveredAt: { type: Date }
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
