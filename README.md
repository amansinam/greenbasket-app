# 🌿 GreenBasket Distribution Management System

A full-stack web application for managing daily operations of GreenBasket Distribution Pvt. Ltd., including order handling, inventory tracking, warehouse packing, deliveries, billing, and management dashboards.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone / Extract the Project
```
greenbasket/
├── backend/       ← Express.js API
└── frontend/      ← React + Vite UI
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI if needed
npm install
npm run seed       # Seeds demo data + users
npm run dev        # Starts on http://localhost:5000
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev        # Starts on http://localhost:3000
```

### 4. Open the App
Go to **http://localhost:3000**

---

## 🔐 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Operations Director | director@greenbasket.com | password123 |
| Sales Staff | sales@greenbasket.com | password123 |
| Warehouse Supervisor | wsup@greenbasket.com | password123 |
| Warehouse Worker | worker@greenbasket.com | password123 |
| Delivery Driver | driver1@greenbasket.com | password123 |
| Accounting Team | accounting@greenbasket.com | password123 |
| Customer | customer1@greenbasket.com | password123 |

---

## 📋 Features (All SRS Requirements Implemented)

### ✅ Order Management
- Create orders (Sales Staff / Customers)
- View & search all orders with status filters
- Edit/cancel orders before packing
- Repeat previous orders
- Full order timeline with timestamps
- Auto-generated unique Order IDs (ORD-0001, ORD-0002…)

### ✅ Inventory Management
- Real-time stock level tracking
- Automatic stock reservation when orders are processed
- Low-stock alerts with visual indicators
- Add stock (supplier deliveries)
- Record stock loss (spoilage, damage, theft)
- Manual stock adjustments by supervisors
- Full inventory log / audit trail
- Stock value reporting

### ✅ Warehouse Operations
- Packing queue showing all Processing orders
- Per-item checkbox packing with visual progress bar
- Mark full order as "Packed & Ready"
- Mobile-optimized interface for warehouse workers

### ✅ Delivery Management
- Assign delivery drivers to packed orders
- Auto status transition: Packed → Out for Delivery
- Driver status dashboard (Active/Available/Completed)
- Delivery confirmation modal (receiver name, payment mode, notes)
- Digital signature capture placeholder
- Auto invoice generation on delivery confirmation
- Delivery driver's personal "My Deliveries" view

### ✅ Delivery Tracking
- Real-time order status visible on dashboard
- Driver activity tracking (active deliveries, completed today)

### ✅ Accounting & Invoicing
- Auto-invoice generation on every delivery
- Invoice detail view with itemized amounts
- Mark invoices as paid (full/partial)
- Customer outstanding balance tracking
- Tally XML export for accounting software integration
- Overdue/Partial/Paid status tracking

### ✅ Management Dashboard
- Today's orders count
- Orders by status (bar chart + donut chart)
- Weekly order trend chart
- Revenue collected
- Low-stock alerts
- Driver status panel
- Recent orders quick view

### ✅ Reports & Analytics
- Sales reports with daily revenue chart
- Revenue by customer type breakdown
- Inventory summary with stock values
- Customer ranking by revenue
- Delivery performance by driver
- CSV export for all reports

### ✅ Role-Based Access Control
- 7 distinct user roles with route-level protection
- Each role sees only relevant navigation and features
- API-level authorization on all sensitive endpoints

### ✅ Customer Management
- Full customer directory (Restaurants, Supermarkets, Cafés)
- Add / edit customers with GSTIN, credit limit
- Outstanding balance per customer
- Order history per customer

---

## 🏗️ Architecture

```
Frontend (React + Vite)
  ├── React Router v6       — client-side routing
  ├── Axios                 — HTTP client with JWT interceptors
  ├── Recharts              — dashboard charts
  ├── react-hot-toast       — notifications
  └── Context API           — auth state

Backend (Express.js)
  ├── JWT Authentication     — stateless auth
  ├── Role-based middleware  — route authorization
  ├── Mongoose ODM          — MongoDB models
  └── Auto-increment IDs    — ORD-XXXX, INV-XXXX

Database (MongoDB)
  ├── Users
  ├── Customers
  ├── Products
  ├── Orders (with embedded items)
  ├── Invoices
  ├── InventoryLogs
  └── Counters (for auto-increment IDs)
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/dashboard | Dashboard stats |
| GET/POST | /api/orders | List / Create orders |
| GET | /api/orders/:id | Order detail |
| PUT | /api/orders/:id/process | Move to Processing |
| PUT | /api/orders/:id/pack-item | Mark item packed |
| PUT | /api/orders/:id/packed | Mark order packed |
| PUT | /api/orders/:id/assign-driver | Assign driver |
| PUT | /api/orders/:id/deliver | Confirm delivery |
| PUT | /api/orders/:id/cancel | Cancel order |
| POST | /api/orders/:id/repeat | Repeat order |
| GET/POST | /api/products | List / Create products |
| POST | /api/products/:id/add-stock | Add stock |
| POST | /api/products/:id/record-loss | Record loss |
| GET/POST | /api/customers | List / Create customers |
| GET/POST | /api/invoices | List invoices |
| PUT | /api/invoices/:id/mark-paid | Mark paid |
| GET | /api/invoices/export/tally | Tally XML export |
| GET | /api/delivery/drivers | Driver list with status |
| GET | /api/delivery/my-deliveries | Driver's own deliveries |
| GET | /api/warehouse/packing-queue | Warehouse packing queue |
| GET | /api/reports/sales | Sales report |
| GET | /api/reports/inventory | Inventory report |
| GET | /api/reports/customers | Customer report |
| GET | /api/reports/delivery | Delivery report |
| GET/PUT | /api/users | Manage users (Director only) |

---

## 🔮 Future Enhancements (from SRS)
- Delivery route optimization
- Supplier management module
- Demand forecasting
- Automated low-stock procurement alerts
- Advanced analytics & AI insights
- Mobile app (React Native) for drivers & workers
- Real-time WebSocket notifications
- Offline sync for delivery drivers
