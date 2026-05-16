const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  sku:          { type: String, required: true, unique: true, uppercase: true },
  name:         { type: String, required: true, trim: true },
  category:     { type: String, enum: ['Vegetable', 'Fruit', 'Herb', 'Leafy', 'Spice', 'Exotic', 'Packaged', 'Other'], required: true },
  unit:         { type: String, enum: ['kg', 'g', 'piece', 'bundle', 'box', 'litre'], required: true },
  pricePerUnit: { type: Number, required: true, min: 0 },
  stock:        { type: Number, default: 0, min: 0 },
  reservedStock:{ type: Number, default: 0, min: 0 },
  minStockLevel:{ type: Number, default: 20 },
  description:  { type: String },
  active:       { type: Boolean, default: true },
  imageUrl:     { type: String },
}, { timestamps: true });

ProductSchema.virtual('availableStock').get(function() {
  return Math.max(0, this.stock - this.reservedStock);
});

ProductSchema.virtual('isLowStock').get(function() {
  return (this.stock - this.reservedStock) < this.minStockLevel;
});

ProductSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);
