# POS System

Monorepo with a Vite + React client and an Express server.

## Prereqs
- Node.js 18+ (recommended: 20+)

## Run (dev)
In two terminals:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

- Client: http://localhost:5173
- Server: http://localhost:5001

## Build
```bash
npm run build:client
```

## Notes
- The backend currently uses in-memory demo data for products and a demo auth login.
- Replace the placeholder DB connection in `server/src/config/db.js` when you’re ready.
