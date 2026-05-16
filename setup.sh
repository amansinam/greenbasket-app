#!/bin/bash
set -e

echo ""
echo "🌿 GreenBasket Distribution Management System — Setup"
echo "======================================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js v18+ from https://nodejs.org"
  exit 1
fi
echo "✅ Node.js $(node -v) found"

# Check MongoDB
if ! command -v mongod &> /dev/null && ! command -v mongo &> /dev/null && ! command -v mongosh &> /dev/null; then
  echo "⚠  MongoDB CLI not found locally."
  echo "   Make sure MongoDB is running (local or Atlas)."
  echo "   Update backend/.env with your MONGODB_URI if using Atlas."
fi

echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

echo ""
echo "🌱 Seeding database with demo data..."
cd ../backend
cp -n .env.example .env 2>/dev/null || true
npm run seed
echo "✅ Database seeded"

echo ""
echo "======================================================"
echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo ""
echo "  Terminal 1 (Backend):  cd backend && npm run dev"
echo "  Terminal 2 (Frontend): cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "Login: director@greenbasket.com / password123"
echo "======================================================"
