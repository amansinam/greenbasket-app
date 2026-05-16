const mongoose = require('mongoose');

const InventoryLogSchema = new mongoose.Schema({
  product:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type:       { type: String, enum: ['stock_in', 'stock_out', 'adjustment', 'spoilage', 'damage', 'reserved', 'unreserved'], required: true },
  quantity:   { type: Number, required: true },
  stockBefore:{ type: Number },
  stockAfter: { type: Number },
  reason:     { type: String },
  reference:  { type: String },
  performedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('InventoryLog', InventoryLogSchema);
