# Universal SaaS POS + ERP — Production Deployment Guide

## 1. Production Architecture

In production, the application is deployed as a distributed web service:
- **Client**: Static SPA hosted on CDN (Cloudflare Pages, Vercel, Netlify, or Nginx).
- **Backend API**: Node.js 20+ Express cluster behind an HTTPS reverse proxy (Nginx, AWS ALB, or Caddy).
- **Database**: Managed Supabase PostgreSQL with high availability and automated snapshots.

---

## 2. Environment Variables

### Backend (`server/.env`)
```bash
NODE_ENV=production
PORT=5000
CLIENT_URL=https://app.posplatform.com
JWT_SECRET=production-crypto-random-secret-key-min-64-characters
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_KEY=eyJhbGciOi... (Service Role Key or Scoped Backend Key)
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

### Frontend (`client/.env`)
```bash
VITE_API_BASE_URL=https://api.posplatform.com/api
```

---

## 3. Production Build & Startup

### Building Client
```bash
cd client
npm ci
npm run build
# Output directory: client/dist
```

### Running Backend
```bash
cd server
npm ci --omit=dev
node src/server.js
```

### Docker Deployment
```dockerfile
# Multi-stage Dockerfile for Backend
FROM node:20-alpine AS backend
WORKDIR /app
COPY server/package*.json ./server/
COPY shared ./shared/
RUN npm --prefix server ci --omit=dev
COPY server ./server/
EXPOSE 5000
CMD ["node", "server/src/server.js"]
```

---

## 4. Health Checks & Monitoring
- **Health Check Endpoint**: `GET /health` -> `{ "ok": true, "timestamp": "2026-10-30T17:00:00Z" }`
- **Error Middleware**: Automatically catches unhandled exceptions and outputs structured error logs with timestamp and method without leaking stack traces to clients.

