const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.use(authorize('director'));

router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('name');
    res.json({ success: true, data: users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, role, active, vehicleNumber } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { name, phone, role, active, vehicleNumber }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
