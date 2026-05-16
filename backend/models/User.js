const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: {
    type: String,
    enum: ['director', 'sales', 'warehouse_supervisor', 'warehouse_worker', 'driver', 'accounting', 'customer'],
    default: 'customer'
  },
  phone:    { type: String },
  active:   { type: Boolean, default: true },
  avatar:   { type: String },
  // For drivers
  vehicleNumber: { type: String },
  // For customers
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = mongoose.model('User', UserSchema);
