# Fluense — Next.js Full Stack Platform

One unified Next.js 14 project with API Routes (backend) + React pages (frontend) + MongoDB.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB + Mongoose
- **Auth**: JWT via `jose` + bcryptjs
- **UI**: Recharts, shared light teal theme with system typography

## Project Structure
```
src/
├── app/
│   ├── api/                  ← All backend API routes
│   │   ├── auth/login/       ← POST /api/auth/login
│   │   ├── auth/me/          ← GET  /api/auth/me
│   │   ├── auth/impersonate/ ← POST /api/auth/impersonate/:id
│   │   ├── users/            ← GET/POST /api/users
│   │   ├── users/[id]/       ← GET/PATCH + toggle-status + avatar
│   │   ├── attendance/       ← GET + check-in + check-out + today-summary
│   │   ├── visits/           ← GET/POST + trend
│   │   ├── clients/          ← GET/POST + DELETE/:id
│   │   ├── regions/          ← GET
│   │   └── dashboard/        ← stats, mr-performance, product-stats, region-comparison, goals
│   ├── (dashboard)/          ← Protected pages (auth-guarded layout)
│   │   ├── dashboard/        ← Overview page
│   │   ├── mr/               ← MR list + [id] detail
│   │   ├── attendance/       ← Attendance logs
│   │   ├── clients/          ← Client directory
│   │   ├── reports/          ← Analytics & reports
│   │   └── profile/          ← User profile
│   ├── login/                ← Public login page
│   └── globals.css
├── components/layout/Sidebar.tsx
├── context/AuthContext.tsx
└── lib/
    ├── db/mongoose.ts        ← DB singleton
    ├── models/index.ts       ← All Mongoose models
    ├── auth.ts               ← JWT sign/verify, password hash
    ├── api-client.ts         ← Frontend fetch wrapper
    └── utils.ts              ← ok(), err(), serializeDoc(), etc.
scripts/
└── seed.mjs                  ← One-time DB seeder
```

---

## 🚀 Option 1 — Manual Run

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`)

```bash
# Install
npm install

# Seed database (first time only)
node scripts/seed.mjs

# Start dev server
npm run dev
```

Open: http://localhost:3000

---

## 🐳 Option 2 — Docker Compose

```bash
docker compose up --build
```

Open: http://localhost:3000

The app auto-seeds on first run via the seed script.
To reset: `docker compose down -v && docker compose up --build`

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Head Admin | rajesh.mehta@fluense.com | admin123 |
| Admin (Baner) | sneha.kulkarni@fluense.com | admin123 |
| Admin (Kothrud) | amit.joshi@fluense.com | admin123 |
| MR (Baner) | arjun.patil@fluense.com | mr123 |
| MR (Kothrud) | deepika.rao@fluense.com | mr123 |

> Click any credential row on the login page to auto-fill it.

---

## 📡 API Reference

`GET /api/products` and `GET /api/regions` are public read-only endpoints; management operations still require authorization.

All routes require `Authorization: Bearer <token>` except `/api/auth/login`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login → returns JWT + user |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/impersonate/:id` | Get token for another user |
| GET | `/api/users` | List users (role-filtered) |
| POST | `/api/users` | Create user |
| GET/PATCH | `/api/users/:id` | Get / update user |
| PATCH | `/api/users/:id/toggle-status` | Activate / deactivate |
| POST | `/api/users/:id/avatar` | Upload profile picture |
| GET | `/api/regions` | List all regions |
| GET | `/api/products` | Public product catalogue |
| POST | `/api/products` | Create product (head admin) |
| PATCH/DELETE | `/api/products/:id` | Update / delete product (head admin) |
| POST | `/api/products/:id/image` | Upload medicine image (JPG, PNG or WebP; head admin) |
| GET | `/api/attendance` | Get attendance logs |
| POST | `/api/attendance/check-in` | MR check in |
| POST | `/api/attendance/check-out` | MR check out |
| GET | `/api/attendance/today-summary` | Present/absent counts |
| GET | `/api/visits` | Visit logs |
| POST | `/api/visits` | Log a visit |
| GET | `/api/visits/trend` | Visit counts by date |
| GET | `/api/clients` | Client directory |
| POST | `/api/clients` | Add client |
| DELETE | `/api/clients/:id` | Soft-delete client |
| GET | `/api/dashboard/stats` | KPI cards |
| GET | `/api/dashboard/mr-performance` | Per-MR visit counts |
| GET | `/api/dashboard/product-stats` | Product mentions |
| GET | `/api/dashboard/region-comparison` | Region vs region |
| GET/POST | `/api/dashboard/goals` | Daily goals |

---

## 🏗 Role Access

| Feature | Head Admin | Regional Admin | MR |
|---------|-----------|----------------|-----|
| All regions | ✅ | ❌ own region | ❌ own data |
| Create/edit MR | ✅ | ✅ own region | ❌ |
| Deactivate MR | ✅ | ✅ own region | ❌ |
| Impersonate | ✅ anyone | ✅ own MRs | ❌ |
| Change avatar | ✅ | ✅ | ✅ |
| Log visits | ❌ | ❌ | ✅ |
| Check in/out | ❌ | ❌ | ✅ |
| Reports page | ✅ | ✅ | ❌ |
