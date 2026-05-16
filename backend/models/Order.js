const mongoose = require('mongoose');
const Counter = require('./Counter');

const OrderItemSchema = new mongoose.Schema({
  product:           { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:       { type: String },
  unit:              { type: String },
  quantityOrdered:   { type: Number, required: true, min: 1 },
  quantityDelivered: { type: Number, default: null },
  pricePerUnit:      { type: Number, required: true },
  packedAt:          { type: Date },
  isPacked:          { type: Boolean, default: false },
}, { _id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });

OrderItemSchema.virtual('lineTotal').get(function () {
  return (this.quantityDelivered ?? this.quantityOrdered) * this.pricePerUnit;
});

const OrderSchema = new mongoose.Schema({
  orderId:         { type: String, unique: true },
  customer:        { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items:           [OrderItemSchema],
  status: {
    type: String,
    enum: ['New', 'Processing', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'New',
  },
  totalAmount:       { type: Number, default: 0 },
  deliveredAmount:   { type: Number },
  assignedDriver:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveryNotes:     { type: String },
  receivedBy:        { type: String },
  paymentMode:       { type: String, enum: ['Cash', 'UPI', 'Credit', 'Bank Transfer'], default: 'Credit' },
  paymentStatus:     { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
  signature:         { type: String },
  deliveredAt:       { type: Date },
  packedAt:          { type: Date },
  dispatchedAt:      { type: Date },
  notes:             { type: String },
  isRepeatOrder:     { type: Boolean, default: false },
  parentOrder:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

OrderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'orderId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.orderId = `ORD-${String(counter.seq).padStart(4, '0')}`;
  }
  this.totalAmount = this.items.reduce((sum, i) => sum + i.quantityOrdered * i.pricePerUnit, 0);
  if (this.status === 'Delivered') {
    this.deliveredAmount = this.items.reduce(
      (sum, i) => sum + (i.quantityDelivered ?? i.quantityOrdered) * i.pricePerUnit, 0
    );
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
