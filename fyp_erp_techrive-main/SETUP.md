# TechRive ERP — Setup Guide (Fresh Install)

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

## Step 1 — Clone & Install

```bash
git clone https://github.com/Sadeemahmad/fyp_erp_techrive.git
cd fyp_erp_techrive/fyp_erp_techrive-main

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Step 2 — Create Database

In PostgreSQL (pgAdmin or psql):
```sql
CREATE DATABASE fyp_erp;
```

## Step 3 — Configure Environment

Create file `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/fyp_erp"
JWT_SECRET="fyp_erp_super_secret_jwt_key_2026"
JWT_EXPIRES_IN="7d"
PORT=5000
```

## Step 4 — Create Tables (Prisma)

```bash
cd backend
npx prisma db push --schema=src/prisma/schema.prisma
```

## Step 5 — Seed Data

```bash
# Still inside backend folder
psql -h localhost -p 5432 -U postgres -d fyp_erp -f seed.sql
```

## Step 6 — Generate Prisma Client

```bash
npx prisma generate --schema=src/prisma/schema.prisma
```

## Step 7 — Run Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

## Step 8 — Login

Open: http://localhost:5173

| Role   | Email                  | Password    |
|--------|------------------------|-------------|
| Admin  | admin@techrive.com     | admin123    |
| Parent | parent@techrive.edu    | Parent@123  |

## Troubleshooting

### "relation does not exist" error in seed.sql
Run Step 4 (prisma db push) first — it creates all tables.

### "Cannot find module" errors
Run `npm install` in both backend and frontend folders.

### Prisma client errors
Run: `npx prisma generate --schema=src/prisma/schema.prisma`