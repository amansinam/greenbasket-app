const express = require('express');
const router = express.Router();
const InventoryLog = require('../models/InventoryLog');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);

router.get('/logs', authorize('director', 'warehouse_supervisor'), async (req, res) => {
  try {
    const { product, type, limit = 100 } = req.query;
    let query = {};
    if (product) query.product = product;
    if (type) query.type = type;
    const logs = await InventoryLog.find(query)
      .populate('product', 'name unit').populate('performedBy', 'name')
      .sort('-createdAt').limit(Number(limit));
    res.json({ success: true, data: logs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
