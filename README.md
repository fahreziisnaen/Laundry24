# Laundry24 🧺

> Enterprise-grade laundry management system with POS, CRM, HR, Inventory, Delivery & IoT simulation.

---

## Architecture Overview

```
Laundry24/
├── backend/          # NestJS API (TypeScript)
├── frontend/         # React + Tailwind Admin Dashboard
├── mobile/           # React Native Customer App (Expo)
├── database/         # SQL schema
├── docs/             # API documentation
├── docker-compose.yml
└── .env.example
```

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | NestJS 10, TypeScript, Prisma 5   |
| Frontend   | React 18, TailwindCSS, Recharts   |
| Mobile     | React Native (Expo)               |
| Database   | MariaDB 11.2                      |
| Realtime   | Socket.IO                         |
| Auth       | JWT + Refresh Tokens + RBAC       |
| Deploy     | Docker + Docker Compose           |

---

## Quick Start (Docker — Recommended)

### 1. Clone & configure

```bash
git clone https://github.com/your-org/laundry24.git
cd laundry24
cp .env.example .env
# Edit .env with your secrets
```

### 2. Start all services

```bash
docker-compose up --build
```

This will:
- Start MariaDB and run the schema
- Run Prisma migrations
- Seed demo data
- Start the NestJS backend on port 3000
- Serve the React frontend on port 80

### 3. Access the application

| Service           | URL                          |
|-------------------|------------------------------|
| Admin Dashboard   | http://localhost              |
| Backend API       | http://localhost:3000/api/v1  |
| Swagger Docs      | http://localhost:3000/api/docs |
| Adminer (DB UI)   | http://localhost:8080 (`--profile dev`) |

### Demo credentials

| Role     | Email / Phone          | Password    |
|----------|------------------------|-------------|
| Owner    | owner@laundry24.com    | owner123    |
| Staff    | staff@laundry24.com    | staff123    |
| Customer | 08512345678            | customer123 |

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- MariaDB 11+ or MySQL 8+
- pnpm / npm

### Backend

```bash
cd backend
cp .env.example .env
# Fill DATABASE_URL, JWT_SECRET, etc.

npm install
npx prisma generate
npx prisma migrate dev
npx ts-node prisma/seed.ts

npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Mobile App

```bash
cd mobile
npm install
npx expo start
# Scan QR with Expo Go app
# For emulator: press 'a' (Android) or 'i' (iOS)
```

---

## Modules

### 1. POS / Orders
- Create kiloan, satuan, express orders
- Automatic pricing from service type
- Promo code engine (%, fixed, cashback)
- Multi-payment: Cash, Transfer, QRIS, Wallet
- Invoice generation (PDF + WhatsApp mock)

### 2. Order Lifecycle
- Status: `RECEIVED → WASHING → IRONING → DONE → DELIVERED`
- Real-time updates via Socket.IO
- SLA tracking & estimated completion time
- Full audit history

### 3. CRM (Customer Management)
- Customer profiles with transaction history
- Digital wallet (top-up / deduct)
- Loyalty points
- Push notifications

### 4. HR (Employee Management)
- Role-based: OWNER, ADMIN, STAFF, DRIVER
- GPS attendance check-in/out
- Shift scheduling
- Automated payroll calculation

### 5. Inventory
- Track detergent, softener, perfume, plastic, hanger
- Automatic low-stock alerts (daily cron job)
- Full movement logs (IN/OUT/ADJUSTMENT)

### 6. Reports & Analytics
- KPI dashboard (revenue, orders, customers)
- Revenue area charts (Recharts)
- Order status breakdown
- Export to Excel and PDF

### 7. Delivery
- Pickup & delivery task management
- Driver assignment
- Status tracking: PENDING → ASSIGNED → ON_WAY → DONE

### 8. IoT Simulation
- Washing machine status tracking
- Machine ping API (simulates IoT device)
- NFC card scan simulation
- Real-time machine updates via Socket.IO

### 9. Multi-Outlet
- Centralized owner view
- Staff scoped to their outlet
- Per-outlet inventory, shifts, machines

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL="mysql://laundry24:password@localhost:3306/laundry24_db"
JWT_SECRET=minimum_32_character_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=different_refresh_secret_32_chars
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
FRONTEND_URL=http://localhost:5173
```

---

## Database

The full SQL schema is in [database/schema.sql](database/schema.sql).  
The Prisma schema is in [backend/prisma/schema.prisma](backend/prisma/schema.prisma).

### Key tables
| Table               | Description                        |
|---------------------|------------------------------------|
| `users`             | Staff, admin, owners, drivers      |
| `customers`         | Customer profiles + wallet         |
| `orders`            | Laundry orders with lifecycle      |
| `order_items`       | Per-garment items (satuan service) |
| `payments`          | Multi-method payments              |
| `employees`         | HR records linked to users         |
| `attendance`        | GPS check-in/out records           |
| `inventory_items`   | Consumables stock                  |
| `machines`          | IoT washing machines               |
| `delivery_tasks`    | Pickup/delivery assignments        |
| `notifications`     | In-app + push notifications        |

---

## API Documentation

Full REST API docs: [docs/API.md](docs/API.md)  
Interactive Swagger: http://localhost:3000/api/docs

---

## Role Permissions

| Action              | OWNER | ADMIN | STAFF | DRIVER | CUSTOMER |
|---------------------|:-----:|:-----:|:-----:|:------:|:--------:|
| All outlets view    | ✅    | ❌    | ❌    | ❌     | ❌       |
| Create orders       | ✅    | ✅    | ✅    | ❌     | ✅ (own) |
| Manage employees    | ✅    | ✅    | ❌    | ❌     | ❌       |
| View reports        | ✅    | ✅    | ❌    | ❌     | ❌       |
| Delivery tasks      | ✅    | ✅    | ❌    | ✅     | ❌       |
| Customer profile    | ✅    | ✅    | ✅    | ❌     | ✅ (own) |

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT © Laundry24 Team
