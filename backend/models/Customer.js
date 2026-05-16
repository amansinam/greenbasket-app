const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  type:         { type: String, enum: ['Restaurant', 'Supermarket', 'Café', 'Hotel', 'Other'], required: true },
  contactName:  { type: String },
  phone:        { type: String, required: true },
  email:        { type: String },
  address:      { type: String },
  city:         { type: String, required: true },
  gstin:        { type: String },
  outstandingBalance: { type: Number, default: 0 },
  creditLimit:  { type: Number, default: 50000 },
  active:       { type: Boolean, default: true },
  notes:        { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

CustomerSchema.virtual('orders', {
  ref: 'Order', localField: '_id', foreignField: 'customer'
});

module.exports = mongoose.model('Customer', CustomerSchema);
