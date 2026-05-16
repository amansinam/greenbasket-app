# GreenBasket DMS — Deployment Guide (Vercel)

## Architecture on Vercel
```
Vercel Frontend (React/Vite)
  └─ /api/* ──proxy──▶ Vercel Backend (Node/Express serverless)
                              └─ MongoDB Atlas (cloud database)
```

Both frontend and backend deploy as separate Vercel projects.
The frontend's `vercel.json` rewrites `/api/*` to the backend URL so the
browser only ever talks to one domain (no CORS issues in production).

---

## Prerequisites

1. **MongoDB Atlas account** — free tier works fine  
   → https://www.mongodb.com/cloud/atlas/register
2. **Vercel account** — free tier works fine  
   → https://vercel.com/signup
3. **Node.js 18+** installed locally
4. **Vercel CLI** (optional but helpful):  
   `npm i -g vercel`

---

## Step 1 — Set up MongoDB Atlas

1. Create a free cluster (M0)
2. Under **Database Access** → Add database user  
   (e.g. user: `greenbasket`, password: generate a strong one)
3. Under **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`)  
   *(Required for Vercel's dynamic IP range)*
4. Click **Connect** → **Connect your application** → copy the connection string  
   It looks like: `mongodb+srv://greenbasket:<password>@cluster0.xxxxx.mongodb.net/greenbasket?retryWrites=true&w=majority`
5. Replace `<password>` with your actual password

---

## Step 2 — Deploy the Backend

### Option A: Vercel Dashboard (easiest)

1. Push your code to GitHub (see git setup below)
2. Go to https://vercel.com/new
3. Import your repository
4. Set **Root Directory** to `backend`
5. Framework preset: **Other**
6. Add these **Environment Variables**:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://...` (your Atlas URI) |
| `JWT_SECRET` | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste result |
| `JWT_EXPIRE` | `7d` |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | `https://greenbasket-frontend.vercel.app` *(set after frontend deploys)* |

7. Click **Deploy**
8. Note the backend URL: `https://greenbasket-api-xxx.vercel.app`

### Option B: Vercel CLI

```bash
cd backend
vercel --prod
# Follow prompts, then set env vars:
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add JWT_EXPIRE production
vercel env add NODE_ENV production
vercel env add ALLOWED_ORIGINS production
# Redeploy after setting vars:
vercel --prod
```

---

## Step 3 — Seed the Database (first time only)

After the backend is deployed, seed your database with sample data:

```bash
cd backend
# Install deps locally
npm install

# Set your env vars temporarily
export MONGODB_URI="mongodb+srv://..."
export JWT_SECRET="your_jwt_secret"
export NODE_ENV="production"

# Run the seed script
npm run seed
```

This creates:
- 8 users (director, sales, warehouse_supervisor, warehouse_worker, 2 drivers, accounting, customer)
- 8 customers  
- 10 products  
- Sample orders and invoices

**Login credentials after seeding:**

| Role | Email | Password |
|------|-------|----------|
| Director | director@greenbasket.com | password123 |
| Sales | sales@greenbasket.com | password123 |
| Warehouse Supervisor | wsup@greenbasket.com | password123 |
| Warehouse Worker | worker@greenbasket.com | password123 |
| Driver 1 | driver1@greenbasket.com | password123 |
| Driver 2 | driver2@greenbasket.com | password123 |
| Accounting | accounting@greenbasket.com | password123 |
| Customer | customer1@greenbasket.com | password123 |

> **Important:** Change all passwords after first login in production!

---

## Step 4 — Deploy the Frontend

1. Update `frontend/vercel.json` — replace the backend URL:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://YOUR-BACKEND-URL.vercel.app/api/:path*"
       },
       ...
     ]
   }
   ```

2. Deploy:
   ```bash
   cd frontend
   vercel --prod
   ```
   Or use the Vercel Dashboard — set **Root Directory** to `frontend`

3. Note the frontend URL: `https://greenbasket-frontend-xxx.vercel.app`

---

## Step 5 — Update Backend CORS

Go to your backend Vercel project → **Settings** → **Environment Variables**  
Update `ALLOWED_ORIGINS` to your actual frontend URL:
```
https://greenbasket-frontend-xxx.vercel.app
```
Then redeploy the backend: `vercel --prod` (in the backend directory)

---

## Step 6 — Verify Everything Works

1. Open `https://your-frontend.vercel.app`
2. Login as `director@greenbasket.com` / `password123`
3. Verify the dashboard loads with stats
4. Test the health endpoint: `https://your-backend.vercel.app/api/health`
   → should return `{"status":"ok",...}`

---

## Git Setup (if not already done)

```bash
cd greenbasket_dms
git init
git add .
git commit -m "Initial deployment-ready commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/greenbasket-dms.git
git push -u origin main
```

---

## Alternative: Docker Deployment (VPS / DigitalOcean / AWS EC2)

If you prefer Docker instead of Vercel:

```bash
# 1. SSH into your server
# 2. Install Docker and Docker Compose
# 3. Clone/upload your project
# 4. Create the .env file
cp .env.example .env
nano .env  # fill in JWT_SECRET

# 5. Build and start
docker compose up -d --build

# 6. Seed the database (first time only)
docker exec greenbasket_backend node config/seed.js

# 7. Check logs
docker compose logs -f
```

Your app runs on port 80 (frontend). Backend is internal on :5000.
Point your domain's A record to your server IP.

For HTTPS with Docker, use Caddy:
```yaml
# Add to docker-compose.yml services:
  caddy:
    image: caddy:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
```

`Caddyfile`:
```
yourdomain.com {
    reverse_proxy frontend:80
}
```

---

## Troubleshooting

**"Cannot connect to MongoDB"**  
→ Check Atlas Network Access allows `0.0.0.0/0`  
→ Verify the connection string has the correct password

**"CORS blocked"**  
→ Check `ALLOWED_ORIGINS` env var on backend matches the exact frontend URL (no trailing slash)

**"Page not found" on refresh**  
→ The `vercel.json` rewrite rule handles this. If using Docker, the nginx.conf try_files handles it.

**Login works but API calls fail (401)**  
→ Verify `JWT_SECRET` is identical on backend — it must not change after seeding

**Reports page shows nothing**  
→ Make sure you're logged in as `director` or `accounting` role — other roles are blocked

