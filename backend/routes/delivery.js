// delivery.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.get('/drivers', authorize('director', 'warehouse_supervisor'), async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver', active: true }).select('-password');
    // Attach active delivery count
    const result = await Promise.all(drivers.map(async d => {
      const active = await Order.countDocuments({ assignedDriver: d._id, status: 'Out for Delivery' });
      const done = await Order.countDocuments({ assignedDriver: d._id, status: 'Delivered' });
      return { ...d.toJSON(), activeDeliveries: active, completedToday: done };
    }));
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.get('/my-deliveries', authorize('driver'), async (req, res) => {
  try {
    const orders = await Order.find({ assignedDriver: req.user._id, status: { $in: ['Out for Delivery', 'Delivered'] } })
      .populate('customer', 'name address city phone').populate('items.product', 'name unit').sort('-dispatchedAt');
    res.json({ success: true, data: orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
module.exports = router;
