const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const InventoryLog = require('../models/InventoryLog');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const { status, customer, driver, date, page = 1, limit = 50 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (customer) query.customer = customer;
    if (driver) query.assignedDriver = driver;
    if (date) {
      const start = new Date(date); start.setHours(0,0,0,0);
      const end = new Date(date); end.setHours(23,59,59,999);
      query.createdAt = { $gte: start, $lte: end };
    }
    // Customers can only see their own orders
    if (req.user.role === 'customer') {
      let linkedCustomerIds = [];
      if (req.user.customerId) {
        linkedCustomerIds.push(req.user.customerId);
      } else {
        const match = await Customer.find({ 
          $or: [
            { name: new RegExp('^' + req.user.name + '$', 'i') },
            { email: new RegExp('^' + req.user.email + '$', 'i') }
          ] 
        }).select('_id');
        linkedCustomerIds = match.map(c => c._id);
      }

      if (linkedCustomerIds.length === 0) {
        const Customer = require('../models/Customer');
        const newCustomer = await Customer.create({
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || '0000000000',
          city: 'Online',
          type: 'Other',
          active: true
        });
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user._id, { customerId: newCustomer._id });
        linkedCustomerIds.push(newCustomer._id);
      }
      query.customer = { $in: linkedCustomerIds };
    }
    // Drivers only see their assigned orders
    if (req.user.role === 'driver') {
      query.assignedDriver = req.user._id;
      query.status = { $in: ['Out for Delivery', 'Delivered'] };
    }
    const orders = await Order.find(query)
      .populate('customer', 'name city phone type')
      .populate('assignedDriver', 'name vehicleNumber')
      .populate('items.product', 'name unit sku')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Order.countDocuments(query);
    res.json({ success: true, count: orders.length, total, data: orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer')
      .populate('assignedDriver', 'name vehicleNumber phone')
      .populate('items.product')
      .populate('createdBy', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/orders - Create order
router.post('/', authorize('director', 'sales', 'customer'), async (req, res) => {
  try {
    const { customerId, items, notes, paymentMode } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    // Validate stock and enrich items
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      if (product.availableStock < item.quantity)
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.availableStock}` });
      enrichedItems.push({
        product: product._id, productName: product.name, unit: product.unit,
        quantityOrdered: item.quantity, pricePerUnit: item.pricePerUnit || product.pricePerUnit,
      });
    }

    const order = await Order.create({
      customer: customerId, items: enrichedItems, notes, paymentMode,
      createdBy: req.user._id, status: 'New'
    });

    await order.populate(['customer', 'items.product']);
    res.status(201).json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/orders/:id/process - Move to Processing, reserve stock
router.put('/:id/process', authorize('director', 'sales', 'warehouse_supervisor'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'New') return res.status(400).json({ success: false, message: 'Order is not in New status' });

    // Reserve stock
    for (const item of order.items) {
      const product = await Product.findById(item.product._id || item.product);
      if (!product) continue;
      if (product.availableStock < item.quantityOrdered)
        return res.status(400).json({ success: false, message: `Insufficient stock for ${item.productName}` });
      const before = product.stock;
      product.reservedStock += item.quantityOrdered;
      await product.save();
      await InventoryLog.create({ product: product._id, type: 'reserved', quantity: item.quantityOrdered, stockBefore: before, stockAfter: product.stock, reason: `Reserved for ${order.orderId}`, performedBy: req.user._id });
    }

    order.status = 'Processing';
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/orders/:id/pack-item - Mark individual item as packed
router.put('/:id/pack-item', authorize('director', 'warehouse_supervisor', 'warehouse_worker'), async (req, res) => {
  try {
    const { productId, isPacked } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'Processing') return res.status(400).json({ success: false, message: 'Order must be Processing' });
    const item = order.items.find(i => String(i.product) === String(productId));
    if (!item) return res.status(404).json({ success: false, message: 'Item not found in order' });
    item.isPacked = isPacked;
    if (isPacked) item.packedAt = new Date();
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/orders/:id/packed - Mark full order as packed
router.put('/:id/packed', authorize('director', 'warehouse_supervisor', 'warehouse_worker'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'Processing') return res.status(400).json({ success: false, message: 'Order must be Processing' });
    order.status = 'Packed';
    order.packedAt = new Date();
    order.items.forEach(i => { i.isPacked = true; });
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/orders/:id/assign-driver
router.put('/:id/assign-driver', authorize('director', 'warehouse_supervisor'), async (req, res) => {
  try {
    const { driverId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'Packed') return res.status(400).json({ success: false, message: 'Order must be Packed' });
    order.assignedDriver = driverId;
    order.status = 'Out for Delivery';
    order.dispatchedAt = new Date();
    await order.save();
    await order.populate('assignedDriver', 'name vehicleNumber');
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/orders/:id/deliver - Confirm delivery
router.put('/:id/deliver', authorize('director', 'driver', 'warehouse_supervisor'), async (req, res) => {
  try {
    const { receivedBy, paymentMode, deliveryNotes, deliveredItems, signature } = req.body;
    const order = await Order.findById(req.params.id).populate('customer items.product');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'Out for Delivery') return res.status(400).json({ success: false, message: 'Order not out for delivery' });

    // Update delivered quantities and deduct stock
    for (const item of order.items) {
      const deliveredItem = deliveredItems?.find(d => String(d.productId) === String(item.product._id));
      const qtyDelivered = deliveredItem ? Number(deliveredItem.quantity) : item.quantityOrdered;
      item.quantityDelivered = qtyDelivered;
      const product = await Product.findById(item.product._id);
      if (product) {
        const before = product.stock;
        product.stock -= qtyDelivered;
        product.reservedStock = Math.max(0, product.reservedStock - item.quantityOrdered);
        await product.save();
        await InventoryLog.create({ product: product._id, type: 'stock_out', quantity: qtyDelivered, stockBefore: before, stockAfter: product.stock, reason: `Delivered for ${order.orderId}`, performedBy: req.user._id });
      }
    }

    order.status = 'Delivered';
    order.receivedBy = receivedBy;
    order.paymentMode = paymentMode || order.paymentMode;
    order.deliveryNotes = deliveryNotes;
    order.signature = signature;
    order.deliveredAt = new Date();
    await order.save();

    // Auto-generate invoice
    const Invoice = require('../models/Invoice');
    const invoiceItems = order.items.map(i => ({
      productName: i.productName, quantity: i.quantityDelivered ?? i.quantityOrdered,
      pricePerUnit: i.pricePerUnit, unit: i.unit,
      lineTotal: (i.quantityDelivered ?? i.quantityOrdered) * i.pricePerUnit
    }));
    const subtotal = invoiceItems.reduce((s, i) => s + i.lineTotal, 0);
    const invoice = await Invoice.create({
      order: order._id, customer: order.customer._id, items: invoiceItems,
      subtotal, totalAmount: subtotal, paymentMode,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: req.user._id
    });

    // Update customer balance
    await Customer.findByIdAndUpdate(order.customer._id, { $inc: { outstandingBalance: subtotal } });

    res.json({ success: true, data: order, invoice });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', authorize('director', 'sales'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (['Delivered', 'Cancelled'].includes(order.status))
      return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
    // Unreserve stock if was processing
    if (order.status === 'Processing' || order.status === 'Packed') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { reservedStock: -item.quantityOrdered } });
      }
    }
    order.status = 'Cancelled';
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/orders/:id/repeat
router.post('/:id/repeat', authorize('director', 'sales', 'customer'), async (req, res) => {
  try {
    const original = await Order.findById(req.params.id).populate('items.product');
    if (!original) return res.status(404).json({ success: false, message: 'Order not found' });
    const newItems = original.items.map(i => ({
      product: i.product._id, productName: i.productName, unit: i.unit,
      quantityOrdered: i.quantityOrdered, pricePerUnit: i.pricePerUnit
    }));
    const newOrder = await Order.create({
      customer: original.customer, items: newItems, notes: req.body.notes || original.notes,
      createdBy: req.user._id, isRepeatOrder: true, parentOrder: original._id
    });
    res.status(201).json({ success: true, data: newOrder });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
