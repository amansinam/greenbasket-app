require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Counter = require('../models/Counter');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/greenbasket';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany(), Customer.deleteMany(), Product.deleteMany(),
    Order.deleteMany(), Invoice.deleteMany(), Counter.deleteMany(),
  ]);
  console.log('Cleared existing data');

  // Users
  const users = await User.create([
    { name: 'Arjun Sharma', email: 'director@greenbasket.com', password: 'password123', role: 'director', phone: '9876543210' },
    { name: 'Priya Mehta', email: 'sales@greenbasket.com', password: 'password123', role: 'sales', phone: '9876543211' },
    { name: 'Rajesh Kumar', email: 'wsup@greenbasket.com', password: 'password123', role: 'warehouse_supervisor', phone: '9876543212' },
    { name: 'Suresh Yadav', email: 'worker@greenbasket.com', password: 'password123', role: 'warehouse_worker', phone: '9876543213' },
    { name: 'Ramesh Verma', email: 'driver1@greenbasket.com', password: 'password123', role: 'driver', phone: '9876543214', vehicleNumber: 'PB-65-AB-1234' },
    { name: 'Vikram Singh', email: 'driver2@greenbasket.com', password: 'password123', role: 'driver', phone: '9876543215', vehicleNumber: 'HR-29-CD-5678' },
    { name: 'Neha Gupta', email: 'accounting@greenbasket.com', password: 'password123', role: 'accounting', phone: '9876543216' },
    { name: 'Spice Garden', email: 'customer1@greenbasket.com', password: 'password123', role: 'customer', phone: '9876543217' },
  ]);
  console.log(`Created ${users.length} users`);

  // Customers
  const customers = await Customer.create([
    { name: 'Spice Garden Restaurant', type: 'Restaurant', contactName: 'Mahesh Patel', phone: '9876543217', email: 'spicegarden@gmail.com', address: 'SCO 45, Sector 17', city: 'Chandigarh', gstin: '03AAACG1234A1Z5', outstandingBalance: 4850 },
    { name: 'Metro Supermart', type: 'Supermarket', contactName: 'Anil Gupta', phone: '9765432109', email: 'metro@supermart.com', address: 'Phase 7, Industrial Area', city: 'Mohali', gstin: '03AAACM5678B2Z6', outstandingBalance: 0 },
    { name: 'Green Café', type: 'Café', contactName: 'Sunita Sharma', phone: '9654321098', email: 'greencafe@gmail.com', address: 'Main Market', city: 'Ropar', outstandingBalance: 3100 },
    { name: 'Hotel Sunrise', type: 'Hotel', contactName: 'Deepak Nair', phone: '9543210987', email: 'sunrise@hotel.com', address: 'Sector 22-B', city: 'Chandigarh', gstin: '03AAACH9012C3Z7', outstandingBalance: 5600 },
    { name: 'City Food Plaza', type: 'Restaurant', contactName: 'Ramesh Tiwari', phone: '9432109876', email: 'cityfood@plaza.com', address: 'Leela Bhawan', city: 'Patiala', outstandingBalance: 0 },
    { name: 'Royal Kitchen', type: 'Restaurant', contactName: 'Harpreet Singh', phone: '9321098765', email: 'royal@kitchen.com', address: 'Phase 3B2', city: 'Mohali', outstandingBalance: 900 },
    { name: 'Tasty Bites Café', type: 'Café', contactName: 'Kavita Rani', phone: '9210987654', email: 'tastybites@gmail.com', address: 'College Road', city: 'Ropar', outstandingBalance: 1950 },
    { name: 'Fresh Mart Express', type: 'Supermarket', contactName: 'Sanjay Verma', phone: '9109876543', email: 'freshmart@express.com', address: 'Sector 34', city: 'Chandigarh', outstandingBalance: 3340 },
  ]);
  console.log(`Created ${customers.length} customers`);

  // Products
  const products = await Product.create([
    { sku: 'VEG-001', name: 'Tomatoes', category: 'Vegetable', unit: 'kg', pricePerUnit: 35, stock: 450, reservedStock: 0, minStockLevel: 50 },
    { sku: 'VEG-002', name: 'Onions', category: 'Vegetable', unit: 'kg', pricePerUnit: 22, stock: 380, reservedStock: 0, minStockLevel: 60 },
    { sku: 'LEA-001', name: 'Spinach', category: 'Leafy', unit: 'bundle', pricePerUnit: 18, stock: 210, reservedStock: 0, minStockLevel: 40 },
    { sku: 'VEG-003', name: 'Potatoes', category: 'Vegetable', unit: 'kg', pricePerUnit: 28, stock: 620, reservedStock: 0, minStockLevel: 80 },
    { sku: 'VEG-004', name: 'Capsicum', category: 'Vegetable', unit: 'kg', pricePerUnit: 55, stock: 45, reservedStock: 0, minStockLevel: 30 },
    { sku: 'HRB-001', name: 'Coriander', category: 'Herb', unit: 'bundle', pricePerUnit: 12, stock: 320, reservedStock: 0, minStockLevel: 50 },
    { sku: 'VEG-005', name: 'Cauliflower', category: 'Vegetable', unit: 'piece', pricePerUnit: 45, stock: 95, reservedStock: 0, minStockLevel: 20 },
    { sku: 'SPC-001', name: 'Ginger', category: 'Spice', unit: 'kg', pricePerUnit: 80, stock: 140, reservedStock: 0, minStockLevel: 25 },
    { sku: 'SPC-002', name: 'Garlic', category: 'Spice', unit: 'kg', pricePerUnit: 120, stock: 230, reservedStock: 0, minStockLevel: 35 },
    { sku: 'EXO-001', name: 'Mushrooms', category: 'Exotic', unit: 'kg', pricePerUnit: 180, stock: 18, reservedStock: 0, minStockLevel: 20 },
    { sku: 'FRT-001', name: 'Bananas', category: 'Fruit', unit: 'kg', pricePerUnit: 40, stock: 300, reservedStock: 0, minStockLevel: 40 },
    { sku: 'LEA-002', name: 'Lettuce', category: 'Leafy', unit: 'piece', pricePerUnit: 25, stock: 160, reservedStock: 0, minStockLevel: 30 },
  ]);
  console.log(`Created ${products.length} products`);

  // Orders
  const orderData = [
    { customer: customers[0]._id, status: 'Delivered', createdBy: users[1]._id, assignedDriver: users[4]._id,
      items: [{ product: products[0]._id, productName: 'Tomatoes', unit: 'kg', quantityOrdered: 20, quantityDelivered: 20, pricePerUnit: 35, isPacked: true },
              { product: products[3]._id, productName: 'Potatoes', unit: 'kg', quantityOrdered: 15, quantityDelivered: 15, pricePerUnit: 28, isPacked: true }] },
    { customer: customers[1]._id, status: 'Out for Delivery', createdBy: users[1]._id, assignedDriver: users[5]._id,
      items: [{ product: products[1]._id, productName: 'Onions', unit: 'kg', quantityOrdered: 40, pricePerUnit: 22, isPacked: true },
              { product: products[2]._id, productName: 'Spinach', unit: 'bundle', quantityOrdered: 30, pricePerUnit: 18, isPacked: true },
              { product: products[5]._id, productName: 'Coriander', unit: 'bundle', quantityOrdered: 50, pricePerUnit: 12, isPacked: true }] },
    { customer: customers[2]._id, status: 'Packed', createdBy: users[1]._id,
      items: [{ product: products[4]._id, productName: 'Capsicum', unit: 'kg', quantityOrdered: 10, pricePerUnit: 55, isPacked: true },
              { product: products[9]._id, productName: 'Mushrooms', unit: 'kg', quantityOrdered: 5, pricePerUnit: 180, isPacked: true }] },
    { customer: customers[3]._id, status: 'Processing', createdBy: users[1]._id,
      items: [{ product: products[0]._id, productName: 'Tomatoes', unit: 'kg', quantityOrdered: 30, pricePerUnit: 35 },
              { product: products[6]._id, productName: 'Cauliflower', unit: 'piece', quantityOrdered: 10, pricePerUnit: 45 },
              { product: products[7]._id, productName: 'Ginger', unit: 'kg', quantityOrdered: 5, pricePerUnit: 80 }] },
    { customer: customers[4]._id, status: 'New', createdBy: users[1]._id,
      items: [{ product: products[1]._id, productName: 'Onions', unit: 'kg', quantityOrdered: 50, pricePerUnit: 22 },
              { product: products[3]._id, productName: 'Potatoes', unit: 'kg', quantityOrdered: 30, pricePerUnit: 28 }] },
    { customer: customers[5]._id, status: 'Delivered', createdBy: users[1]._id, assignedDriver: users[4]._id,
      items: [{ product: products[5]._id, productName: 'Coriander', unit: 'bundle', quantityOrdered: 60, quantityDelivered: 60, pricePerUnit: 12, isPacked: true },
              { product: products[8]._id, productName: 'Garlic', unit: 'kg', quantityOrdered: 10, quantityDelivered: 10, pricePerUnit: 120, isPacked: true }] },
    { customer: customers[6]._id, status: 'New', createdBy: users[7]._id,
      items: [{ product: products[2]._id, productName: 'Spinach', unit: 'bundle', quantityOrdered: 20, pricePerUnit: 18 },
              { product: products[4]._id, productName: 'Capsicum', unit: 'kg', quantityOrdered: 15, pricePerUnit: 55 }] },
    { customer: customers[7]._id, status: 'Processing', createdBy: users[1]._id,
      items: [{ product: products[8]._id, productName: 'Garlic', unit: 'kg', quantityOrdered: 8, pricePerUnit: 120 },
              { product: products[7]._id, productName: 'Ginger', unit: 'kg', quantityOrdered: 10, pricePerUnit: 80 }] },
  ];

  const orders = await Order.create(orderData);
  console.log(`Created ${orders.length} orders`);

  // Invoices for delivered orders
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  for (const order of deliveredOrders) {
    const custData = customers.find(c => String(c._id) === String(order.customer));
    const invItems = order.items.map(i => ({
      productName: i.productName, unit: i.unit,
      quantity: i.quantityDelivered || i.quantityOrdered,
      pricePerUnit: i.pricePerUnit,
      lineTotal: (i.quantityDelivered || i.quantityOrdered) * i.pricePerUnit,
    }));
    const subtotal = invItems.reduce((s, i) => s + i.lineTotal, 0);
    await Invoice.create({
      order: order._id, customer: order.customer, items: invItems,
      subtotal, totalAmount: subtotal,
      status: custData?.outstandingBalance > 0 ? 'Issued' : 'Paid',
      paidAmount: custData?.outstandingBalance > 0 ? 0 : subtotal,
      paidAt: custData?.outstandingBalance > 0 ? null : new Date(),
      dueDate: new Date(Date.now() + 7 * 86400000),
      createdBy: users[0]._id,
    });
  }
  console.log('Created invoices');

  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Director:             director@greenbasket.com  / password123');
  console.log('  Sales:                sales@greenbasket.com     / password123');
  console.log('  Warehouse Supervisor: wsup@greenbasket.com      / password123');
  console.log('  Warehouse Worker:     worker@greenbasket.com    / password123');
  console.log('  Driver 1:             driver1@greenbasket.com   / password123');
  console.log('  Driver 2:             driver2@greenbasket.com   / password123');
  console.log('  Accounting:           accounting@greenbasket.com/ password123');
  console.log('  Customer:             customer1@greenbasket.com / password123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
