const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const InventoryLog = require('../models/InventoryLog');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
// Both director and accounting can see reports
router.use(authorize('director', 'accounting'));

// GET /api/reports/sales?from=&to=
router.get('/sales', async (req, res) => {
  try {
    const { from, to } = req.query;
    const start = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      status: 'Delivered',
      deliveredAt: { $gte: start, $lte: end }
    }).populate('customer', 'name type city');

    const totalRevenue = orders.reduce((s, o) => s + (o.deliveredAmount || o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    const byDay = {};
    orders.forEach(o => {
      const day = (o.deliveredAt || o.createdAt).toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = { date: day, orders: 0, revenue: 0 };
      byDay[day].orders++;
      byDay[day].revenue += o.deliveredAmount || o.totalAmount || 0;
    });

    const byType = {};
    orders.forEach(o => {
      const t = o.customer?.type || 'Unknown';
      if (!byType[t]) byType[t] = { type: t, orders: 0, revenue: 0 };
      byType[t].orders++;
      byType[t].revenue += o.deliveredAmount || o.totalAmount || 0;
    });

    res.json({
      success: true,
      data: {
        summary: { totalRevenue, totalOrders, avgOrderValue },
        byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
        byCustomerType: Object.values(byType),
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/reports/inventory
router.get('/inventory', async (req, res) => {
  try {
    const products = await Product.find({ active: true }).sort('name');
    const logs = await InventoryLog.find()
      .populate('product', 'name').populate('performedBy', 'name')
      .sort('-createdAt').limit(100);

    const summary = products.map(p => ({
      id: p._id, name: p.name, category: p.category, unit: p.unit,
      stock: p.stock, reserved: p.reservedStock, available: p.availableStock,
      minStock: p.minStockLevel, isLow: p.isLowStock,
      stockValue: p.stock * p.pricePerUnit,
    }));

    const totalValue = summary.reduce((s, p) => s + p.stockValue, 0);
    const lowStockItems = summary.filter(p => p.isLow);

    res.json({
      success: true,
      data: { summary, totalValue, lowStockCount: lowStockItems.length, lowStockItems, recentLogs: logs }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/reports/customers
router.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.find({ active: true });
    const result = await Promise.all(customers.map(async c => {
      const orders = await Order.find({ customer: c._id });
      const revenue = orders.filter(o => o.status === 'Delivered')
        .reduce((s, o) => s + (o.deliveredAmount || o.totalAmount || 0), 0);
      return {
        id: c._id, name: c.name, type: c.type, city: c.city,
        totalOrders: orders.length,
        deliveredOrders: orders.filter(o => o.status === 'Delivered').length,
        totalRevenue: revenue,
        outstandingBalance: c.outstandingBalance,
      };
    }));
    result.sort((a, b) => b.totalRevenue - a.totalRevenue);
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/reports/delivery
router.get('/delivery', async (req, res) => {
  try {
    const { from, to } = req.query;
    const start = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);

    const delivered = await Order.find({ status: 'Delivered', deliveredAt: { $gte: start, $lte: end } })
      .populate('assignedDriver', 'name');

    const byDriver = {};
    delivered.forEach(o => {
      const name = o.assignedDriver?.name || 'Unassigned';
      if (!byDriver[name]) byDriver[name] = { driver: name, deliveries: 0, revenue: 0 };
      byDriver[name].deliveries++;
      byDriver[name].revenue += o.deliveredAmount || o.totalAmount || 0;
    });

    res.json({
      success: true,
      data: {
        totalDelivered: delivered.length,
        byDriver: Object.values(byDriver).sort((a, b) => b.deliveries - a.deliveries),
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
