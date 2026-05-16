const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { type, city, search } = req.query;
    let query = { active: true };
    if (type) query.type = type;
    if (city) query.city = { $regex: city, $options: 'i' };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];

    // Security Fix: Customers can only see their own customer profile
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
        // Feature: Automatically create a Customer Business Profile for new customer logins
        const newCustomer = await Customer.create({
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || '0000000000',
          city: 'Online',
          type: 'Other',
          active: true
        });
        
        // Link it back to the User model so we don't have to regex match next time
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user._id, { customerId: newCustomer._id });
        
        // Use this newly auto-created customer
        linkedCustomerIds.push(newCustomer._id);
      }
      query._id = { $in: linkedCustomerIds };
    }
    const customers = await Customer.find(query).sort('name');
    res.json({ success: true, count: customers.length, data: customers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const orders = await Order.find({ customer: req.params.id }).sort('-createdAt').limit(10);
    res.json({ success: true, data: { ...customer.toJSON(), recentOrders: orders } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', authorize('director', 'sales'), async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', authorize('director', 'sales'), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
