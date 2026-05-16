const express = require('express');
const r = express.Router();
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');
r.use(protect);
r.get('/packing-queue', async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ['Processing', 'Packed'] } })
      .populate('customer', 'name').populate('items.product', 'name unit sku').sort('createdAt');
    res.json({ success: true, data: orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
module.exports = r;
