# FleetFlow - Logistics & Delivery Management Platform

A production-grade logistics, fleet, and delivery management platform built with Next.js, TypeScript, PostgreSQL, and Prisma.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict)
- **Frontend**: React 19, Tailwind CSS 4, Lucide Icons
- **Database**: PostgreSQL
- **ORM**: Prisma 7
- **Validation**: Zod
- **Authentication**: NextAuth.js v5 (Auth.js) with Credentials provider
- **Password Hashing**: bcryptjs

## Architecture

```
src/
├── app/                    # Next.js pages, layouts, API routes
│   ├── api/               # REST API route handlers
│   │   ├── auth/          # NextAuth.js handlers
│   │   ├── shipments/     # Shipment CRUD + cancel/reschedule/tracking
│   │   ├── assignments/   # Driver+Vehicle assignment
│   │   ├── deliveries/    # Delivery status updates
│   │   ├── drivers/       # Driver management
│   │   ├── vehicles/      # Vehicle management
│   │   ├── customers/     # Customer management
│   │   ├── proofs/        # Proof of delivery upload/retrieval
│   │   └── reports/       # Operational reports
│   ├── dashboard/
│   │   ├── admin/         # Admin/Dispatcher dashboard
│   │   ├── driver/        # Driver portal
│   │   └── customer/      # Customer portal
│   └── login/             # Authentication page
├── components/            # Reusable UI components
├── lib/                   # Core libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── auth-helpers.ts   # Auth/role helpers for API routes
│   ├── db.ts             # Prisma client singleton
│   ├── state-machine.ts  # Shipment state machine
│   ├── validations.ts    # Zod schemas
│   └── utils.ts          # Utility functions
├── services/              # Business logic layer
│   ├── shipment.service.ts    # Shipment operations
│   ├── assignment.service.ts  # Concurrent driver/vehicle assignment
│   ├── delivery.service.ts    # Delivery status with idempotency
│   ├── proof.service.ts       # Proof of delivery
│   └── audit.service.ts       # Audit logging
└── types/                 # TypeScript type declarations
```

## Security Challenges Implemented

| Challenge | Solution |
|-----------|----------|
| 1. Concurrent Driver Assignment | PostgreSQL SELECT FOR UPDATE with Serializable isolation |
| 2. Shipment State Machine | Centralized transition map; backend rejects invalid transitions |
| 3. Unauthorized Access | Ownership verification in every API route |
| 4. Vehicle Availability | Row-level locks + status checks |
| 5. Proof-of-Delivery Security | Only assigned driver can upload; ownership verified |
| 6. Duplicate Delivery Updates | Unique idempotency_key per event |
| 7. Cancellation and Reassignment | Atomic cancellation releases driver+vehicle |

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Install
```bash
npm install
```

### 2. Configure
```bash
cp .env.example .env
# Edit .env with your PostgreSQL connection string
```

### 3. Database
```bash
npm run db:push
npm run db:seed
```

### 4. Run
```bash
npm run dev
```

Open http://localhost:3000

## Demo Login Credentials

All accounts use password: **password123**

| Role | Email |
|------|-------|
| Admin | alice.admin@example.com |
| Dispatcher | bob.dispatcher@example.com |
| Driver | charlie.driver@example.com |
| Driver | dave.driver@example.com |
| Customer | eve.customer@example.com |
| Customer | frank.customer@example.com |
| Customer | grace.customer@example.com |

## API Endpoints

### Shipments
- `GET /api/shipments` - List (paginated, filtered)
- `POST /api/shipments` - Create
- `GET /api/shipments/:id` - Details
- `POST /api/shipments/:id/cancel` - Cancel
- `GET /api/shipments/:id/tracking` - Timeline
- `POST /api/shipments/:id/reschedule` - Reschedule

### Assignments
- `GET /api/assignments` - List
- `POST /api/assignments` - Create (concurrent-safe)

### Deliveries
- `GET /api/deliveries` - Driver's deliveries
- `POST /api/deliveries` - Update status (idempotent)

### Drivers / Vehicles / Customers
- Standard CRUD endpoints

### Proof of Delivery
- `GET /api/proofs?shipmentId=xxx` - Get proofs
- `POST /api/proofs` - Upload (multipart)

### Reports
- `GET /api/reports` - Metrics

## Shipment State Machine

```
CREATED -> ASSIGNED -> PICKUP_CONFIRMED -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED
CREATED/ASSIGNED/DELIVERY_FAILED -> CANCELLED
OUT_FOR_DELIVERY -> DELIVERY_FAILED -> RESCHEDULED -> ASSIGNED
```

## Deployment

### Vercel + Neon PostgreSQL
1. Push to GitHub
2. Import to Vercel
3. Set env vars: DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL
4. Run: `npx prisma db push && npm run db:seed`
