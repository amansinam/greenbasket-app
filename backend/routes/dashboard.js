const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const { protect } = require('../middleware/auth');
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);

    const [
      todayOrders, totalOrders, pendingOrders, deliveredToday,
      outForDelivery, packedOrders, processingOrders,
      totalRevenue, products, pendingInvoiceAmount, customers
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today, $lte: todayEnd } }),
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['New', 'Processing'] } }),
      Order.countDocuments({ status: 'Delivered', deliveredAt: { $gte: today } }),
      Order.countDocuments({ status: 'Out for Delivery' }),
      Order.countDocuments({ status: 'Packed' }),
      Order.countDocuments({ status: 'Processing' }),
      Invoice.aggregate([{ $match: { status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Product.find({ active: true }),
      Invoice.aggregate([{ $match: { status: { $in: ['Issued', 'Partial'] } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Customer.countDocuments({ active: true }),
    ]);

    const lowStockProducts = products.filter(p => p.isLowStock);
    const recentOrders = await Order.find().populate('customer', 'name').sort('-createdAt').limit(8);

    // Weekly order chart data (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const dEnd = new Date(d); dEnd.setHours(23,59,59,999);
      const count = await Order.countDocuments({ createdAt: { $gte: d, $lte: dEnd } });
      weeklyData.push({ date: d.toLocaleDateString('en', { weekday: 'short' }), count });
    }

    res.json({
      success: true,
      data: {
        stats: {
          todayOrders, totalOrders, pendingOrders, deliveredToday,
          outForDelivery, packedOrders, processingOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          pendingInvoiceAmount: pendingInvoiceAmount[0]?.total || 0,
          totalProducts: products.length,
          lowStockCount: lowStockProducts.length,
          totalCustomers: customers,
        },
        lowStockProducts: lowStockProducts.slice(0, 5),
        recentOrders,
        weeklyData,
        orderStatusBreakdown: {
          New: await Order.countDocuments({ status: 'New' }),
          Processing: processingOrders,
          Packed: packedOrders,
          'Out for Delivery': outForDelivery,
          Delivered: await Order.countDocuments({ status: 'Delivered' }),
        }
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
