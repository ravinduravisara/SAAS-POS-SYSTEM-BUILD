# Universal SaaS POS + ERP — Environment Setup & Local Development

## 1. Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **Git**

---

## 2. Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ravinduravisara/SAAS-POS-SYSTEM-BUILD.git
   cd SAAS-POS-SYSTEM-BUILD
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd ../client
   npm install
   ```

---

## 3. Database Execution Modes

The platform supports two runtime database modes:

### Mode A: Offline Hermetic Mode (Default in Test)
Does not require an internet connection or external Supabase credentials:
- Set `USE_MOCK_DB=true` in `server/.env`.
- An in-memory PostgreSQL emulator (`inMemoryDb.js`) runs with pre-seeded test accounts:
  - Super Admin: `superadmin@posplatform.com` / `SuperAdmin123!`
  - Tenant Admin: `admin@example.com` / `Admin123!`

### Mode B: Cloud Supabase Mode
Connects directly to your Supabase PostgreSQL project:
- Provide `SUPABASE_URL` and `SUPABASE_KEY` in `server/.env`.
- Run migrations located in `server/database/migrations/`.

---

## 4. Starting the Application

### Start Backend Dev Server
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

### Start Frontend Dev Server
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

