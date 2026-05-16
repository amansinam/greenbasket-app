const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, lowStock, search } = req.query;
    let query = { active: true };
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    let products = await Product.find(query).sort('name');
    if (lowStock === 'true') products = products.filter(p => p.isLowStock);
    res.json({ success: true, count: products.length, data: products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/products
router.post('/', authorize('director', 'warehouse_supervisor'), async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'SKU already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', authorize('director', 'warehouse_supervisor'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/products/:id/add-stock
router.post('/:id/add-stock', authorize('director', 'warehouse_supervisor'), async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const before = product.stock;
    product.stock += Number(quantity);
    await product.save();
    await InventoryLog.create({ product: product._id, type: 'stock_in', quantity, stockBefore: before, stockAfter: product.stock, reason: reason || 'Stock received', performedBy: req.user._id });
    res.json({ success: true, data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/products/:id/record-loss
router.post('/:id/record-loss', authorize('director', 'warehouse_supervisor'), async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock - product.reservedStock < quantity)
      return res.status(400).json({ success: false, message: 'Not enough available stock' });
    const before = product.stock;
    product.stock -= Number(quantity);
    await product.save();
    await InventoryLog.create({ product: product._id, type: reason === 'Spoilage' ? 'spoilage' : 'damage', quantity, stockBefore: before, stockAfter: product.stock, reason, performedBy: req.user._id });
    res.json({ success: true, data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/products/:id/logs
router.get('/:id/logs', authorize('director', 'warehouse_supervisor'), async (req, res) => {
  try {
    const logs = await InventoryLog.find({ product: req.params.id })
      .populate('performedBy', 'name').sort('-createdAt').limit(50);
    res.json({ success: true, data: logs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
