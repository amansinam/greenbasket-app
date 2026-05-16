const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production the frontend and backend share the same domain via Vercel
// rewrites, so we accept the production URL AND localhost for dev.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── DB ─────────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/greenbasket')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/inventory',  require('./routes/inventory'));
app.use('/api/warehouse',  require('./routes/warehouse'));
app.use('/api/delivery',   require('./routes/delivery'));
app.use('/api/invoices',   require('./routes/invoices'));
app.use('/api/customers',  require('./routes/customers'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/reports',    require('./routes/reports'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date(), env: process.env.NODE_ENV }));

// ── Error handler ──────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`));
