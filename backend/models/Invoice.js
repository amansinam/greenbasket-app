const mongoose = require('mongoose');
const Counter = require('./Counter');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  order:      { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [{
    productName: String,
    quantity: Number,
    pricePerUnit: Number,
    lineTotal: Number,
    unit: String,
  }],
  subtotal:   { type: Number },
  taxAmount:  { type: Number, default: 0 },
  totalAmount:{ type: Number },
  paidAmount: { type: Number, default: 0 },
  status:     { type: String, enum: ['Draft', 'Issued', 'Partial', 'Paid', 'Overdue'], default: 'Issued' },
  dueDate:    { type: Date },
  paidAt:     { type: Date },
  paymentMode:{ type: String },
  tallyExported: { type: Boolean, default: false },
  tallyExportedAt: { type: Date },
  notes:      { type: String },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

InvoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'invoiceId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.invoiceNumber = `INV-${String(counter.seq).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
