# TransitOps

A full-stack Smart Transport Operations Platform for fleet management, trip dispatching, maintenance scheduling, fuel & expense tracking, and operational analytics.

TransitOps simulates a real logistics company's daily operations, enforcing business rules through transactional workflows and role-based access control. Built with React, Express, TypeScript, and PostgreSQL.

![alt text](dashboard.png)

---

## Live Demo

Link: [transit-ops](https://transit-ops-five-umber.vercel.app/)

---
## Screenshots
![alt text](fleetm.png)

![alt text](kanben.png)

![alt text](image.png)
## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Database Design](#database-design)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Docker Setup](#docker-setup)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Role Based Access Control](#role-based-access-control)
- [Business Rules](#business-rules)
- [Major Workflows](#major-workflows)
- [Analytics](#analytics)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Features

### Authentication & Authorization

- JWT-based login and registration with HTTP-only cookies
- Token refresh with automatic rotation
- Role-based access control (RBAC) across all modules

### Fleet Management

- Full CRUD for vehicles with registration, model, type, capacity, and odometer tracking
- Status management: Available, On Trip, In Shop, Retired
- Vehicle retirement workflow that prevents re-dispatch

### Driver Management

- Driver profiles with license details, categories, and expiry dates
- Safety score tracking and automatic suspension at threshold
- Availability management tied to trip dispatch

### Trip Management

- Complete trip lifecycle: Draft -> Dispatched -> In Progress -> Completed / Cancelled
- Dispatch engine with transactional validation of vehicle, driver, capacity, and license
- Automatic fuel log and expense creation on trip completion

### Maintenance

- Schedule and complete maintenance records
- Automatic vehicle status management (vehicle becomes unavailable while in shop)

### Fuel & Expense Tracking

- Per-trip fuel consumption logging
- Operational expense recording (tolls, incidentals)
- Cost tracking tied to trips and vehicles

### Analytics & Reporting

- Fleet utilization dashboard
- Fuel efficiency metrics
- Monthly revenue and operational cost breakdown
- Vehicle ROI calculations
- CSV export for all reports

### Settings & Configuration

- Depot, currency, and distance unit configuration
- Editable RBAC permission matrix

---

## Architecture



```
Client (Browser)
       |
       v
 React Frontend  (Vite + TypeScript + TailwindCSS)
       |
       |  REST API (JSON)
       v
 Express Backend  (TypeScript)
       |
       |  Business Logic Layer
       v
 PostgreSQL  (Relational Database)
```

The **Frontend** is a single-page application built with React and TypeScript, using React Query for server state management and React Router for client-side navigation. TailwindCSS provides utility-first styling.

The **Backend** is a layered Express API with route handlers, service layer for business logic, and Drizzle ORM for database access. Middleware handles authentication (JWT), authorization (RBAC), request validation (Zod), and error handling.

The **Database** is PostgreSQL with normalized schemas, foreign key constraints, and indexed columns on frequently queried fields.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, TypeScript | UI framework |
| | Vite | Build tool and dev server |
| | TailwindCSS | Utility-first CSS |
| | React Router | Client-side routing |
| | React Query | Server state and caching |
| | Axios | HTTP client |
| | Recharts | Charts and analytics |
| **Backend** | Node.js, Express | API server |
| | TypeScript | Type safety |
| | Drizzle ORM | Database access and migrations |
| | PostgreSQL | Relational database |
| | JWT, bcrypt | Authentication |
| | Zod | Request validation |
| | Pino | Structured logging |
| **Testing** | Jest, Supertest | Unit and integration tests |
| **Documentation** | Swagger / OpenAPI | API documentation |
| **Containerization** | Docker, Docker Compose | Deployment |

---

## System Architecture

### Frontend Layer

The React SPA uses a component-based architecture with shadcn/ui primitives. Each page fetches data through custom React Query hooks that wrap an Axios client configured with automatic JWT refresh interceptor. The auth context provides user state and permission checking across the application.

### API Layer

Express routers map to domain modules (auth, vehicles, drivers, trips, maintenance, fuel-logs, expenses, dashboard, reports). Each route applies authentication middleware, optional RBAC authorization, and optional Zod validation before delegating to a service function.

### Service Layer

Business logic is encapsulated in service modules. Complex operations like trip dispatching use database transactions to ensure atomicity across multiple table updates. The dispatch engine validates vehicle availability, driver status, license expiry, and cargo capacity before proceeding.

### Database Layer

PostgreSQL with Drizzle ORM provides type-safe queries, migration generation, and relation mapping. Indexes are defined on foreign keys, status columns, and date fields to support the filtering and sorting operations exposed by the API.

---

## Database Design

### Entity Relationship

The database is normalized into nine core tables with foreign key constraints and cascade deletes where appropriate.

| Table | Key Columns | Foreign Keys |
|---|---|---|
| `users` | id, email, password, name, role | — |
| `sessions` | id, refresh_token, expires_at | user_id -> users |
| `role_permissions` | id, role, fleet, drivers, trips, maintenance, fuel_expenses, analytics | — |
| `vehicles` | id, registration_number, model, type, capacity_kg, odometer_km, acquisition_cost, status | — |
| `drivers` | id, name, license_number, license_expiry, safety_score, status | — |
| `trips` | id, source, destination, cargo_weight_kg, distance_km, status | vehicle_id -> vehicles, driver_id -> drivers |
| `maintenance_logs` | id, description, cost, date, status | vehicle_id -> vehicles |
| `fuel_logs` | id, liters, cost | trip_id -> trips, vehicle_id -> vehicles |
| `expenses` | id, type, amount | trip_id -> trips |

### Indexes

- `vehicles`: status, registration_number
- `drivers`: status, license_number
- `trips`: status, vehicle_id, driver_id, created_at
- `maintenance_logs`: status, vehicle_id
- `fuel_logs`: trip_id, vehicle_id
- `expenses`: trip_id

---

## Project Structure

```
TransitOps/
├── backend/
│   ├── src/
│   │   ├── config/            # Environment config (Zod-validated)
│   │   ├── db/
│   │   │   ├── schema/        # Drizzle table definitions
│   │   │   ├── relations.ts   # Foreign key relations
│   │   │   ├── index.ts       # DB client
│   │   │   ├── seed.ts        # Seed scripts
│   │   │   └── migrate.ts     # Migration runner
│   │   ├── middleware/        # Auth, RBAC, validation, error handling
│   │   ├── routes/            # Express route handlers
│   │   ├── services/          # Business logic layer
│   │   ├── validators/        # Zod schemas
│   │   ├── types/             # Shared TypeScript types
│   │   └── index.ts           # App entry point
│   ├── drizzle/               # Generated SQL migrations
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/            # shadcn/ui primitives
│   │   ├── hooks/             # Auth context + data hooks
│   │   ├── lib/               # API client, utilities
│   │   ├── pages/             # Route page components
│   │   ├── App.tsx            # Router + providers
│   │   └── main.tsx           # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## Installation

### Prerequisites

- Node.js 18 or later
- PostgreSQL 14 or later
- Docker (optional, for containerized setup)

### Clone

```bash
git clone https://github.com/VasoyaViraj/TransitOps.git
cd TransitOps
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/transitops
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Running Locally

### Backend

```bash
cd backend
npm install
cp .env.sample .env          # Configure DATABASE_URL and JWT_SECRET
npm run db:push               # Push schema to PostgreSQL
npm run db:seed               # Seed demo data
npm run dev                   # Starts on http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
cp .env.sample .env           # Set VITE_API_URL
npm run dev                   # Starts on http://localhost:5173
```

### Seeded Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@transitops.com | admin123 |
| Fleet Manager | manager@transitops.com | password123 |
| Dispatcher | dispatcher@transitops.com | password123 |
| Safety Officer | safety@transitops.com | password123 |
| Financial Analyst | finance@transitops.com | password123 |

---

## Docker Setup

```bash
docker-compose up --build
```

This starts PostgreSQL, the backend API, and the frontend dev server in containers. The backend runs on port 3000 and the frontend on port 5173.

---


### Core Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create account | — |
| POST | `/api/auth/login` | Login | — |
| POST | `/api/auth/refresh` | Refresh token | Cookie |
| POST | `/api/auth/logout` | Logout | Cookie |
| GET | `/api/auth/me` | Current user | JWT |
| GET | `/api/auth/permissions` | User permissions | JWT |
| GET | `/api/vehicles` | List vehicles | JWT |
| POST | `/api/vehicles` | Create vehicle | JWT + RBAC |
| PATCH | `/api/vehicles/:id` | Update vehicle | JWT + RBAC |
| DELETE | `/api/vehicles/:id` | Retire vehicle | JWT + RBAC |
| GET | `/api/drivers` | List drivers | JWT |
| POST | `/api/drivers` | Create driver | JWT + RBAC |
| PATCH | `/api/drivers/:id` | Update driver | JWT + RBAC |
| GET | `/api/trips` | List trips | JWT |
| POST | `/api/trips` | Create trip | JWT + RBAC |
| POST | `/api/trips/:id/dispatch` | Dispatch trip | JWT + RBAC |
| POST | `/api/trips/:id/complete` | Complete trip | JWT + RBAC |
| GET | `/api/maintenance` | List maintenance | JWT |
| POST | `/api/maintenance` | Schedule maintenance | JWT + RBAC |
| PATCH | `/api/maintenance/:id/complete` | Complete maintenance | JWT + RBAC |
| GET | `/api/fuel-logs` | List fuel logs | JWT |
| POST | `/api/fuel-logs` | Create fuel log | JWT + RBAC |
| GET | `/api/expenses` | List expenses | JWT |
| POST | `/api/expenses` | Create expense | JWT + RBAC |
| GET | `/api/dashboard/stats` | Dashboard stats | JWT |
| GET | `/api/reports/fuel-efficiency` | Fuel efficiency report | JWT |
| GET | `/api/reports/fleet-utilization` | Fleet utilization report | JWT |
| GET | `/api/reports/operational-cost` | Operational cost report | JWT |
| GET | `/api/reports/roi` | Vehicle ROI report | JWT |

---

## Authentication

TransitOps uses JWT-based authentication with a dual-token strategy:

1. **Access token** (15 minute expiry) is sent as an HTTP-only cookie and Bearer header. It carries the user ID and role for request authorization.
2. **Refresh token** (7 day expiry) is stored in a database-backed session table. When the access token expires, the client automatically attempts a refresh via an Axios interceptor. The old session is revoked and a new one is created.

On the backend, every protected route uses the `authenticate` middleware that extracts and verifies the JWT from either the cookie or Authorization header.

---

## Role Based Access Control

RBAC is implemented at two levels:

### Module-Level Permissions

Each role has a stored permission matrix with three access levels per module: `NONE`, `VIEW`, or `EDIT`. The `authorizePermission` middleware checks the matrix before allowing write operations.

| Module | Admin | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
|---|---|---|---|---|---|
| Fleet | EDIT | EDIT | VIEW | VIEW | NONE |
| Drivers | EDIT | EDIT | VIEW | VIEW | NONE |
| Trips | EDIT | EDIT | EDIT | NONE | NONE |
| Maintenance | EDIT | EDIT | VIEW | EDIT | NONE |
| Fuel & Expenses | EDIT | EDIT | NONE | NONE | EDIT |
| Analytics | EDIT | EDIT | VIEW | VIEW | VIEW |

### Static Role Checks

The `authorize` middleware is used for operations that require a specific role regardless of module permissions (e.g., editing the RBAC matrix requires ADMIN).

The Admin role bypasses all permission checks and has full access to every module.

---

## Business Rules

The system enforces operational constraints through transactional service logic:

### Vehicle Constraints
- Registration numbers must be unique
- Retired vehicles cannot be dispatched or assigned to trips
- Vehicles in maintenance (status IN_SHOP) cannot be dispatched

### Driver Constraints
- License numbers must be unique
- Suspended drivers cannot be dispatched
- Drivers with expired licenses are blocked from dispatch
- Safety scores below 30 automatically suspend the driver

### Trip Constraints
- Cargo weight cannot exceed the assigned vehicle's capacity
- A trip must be in DRAFT status to be dispatched
- A trip must be in DISPATCHED status to be completed
- Final odometer must be greater than the vehicle's current odometer

### Transactional Workflows

**Trip Dispatch** atomically:
1. Validates trip exists and is in DRAFT status
2. Validates vehicle is AVAILABLE
3. Validates driver is AVAILABLE
4. Validates driver license is not expired
5. Validates cargo does not exceed vehicle capacity
6. Updates trip status to DISPATCHED
7. Updates vehicle status to ON_TRIP
8. Updates driver status to ON_TRIP

**Trip Completion** atomically:
1. Validates trip exists and is in DISPATCHED status
2. Validates final odometer is greater than current
3. Updates trip with final data (odometer, fuel, costs, revenue)
4. Sets trip status to COMPLETED
5. Updates vehicle status to AVAILABLE and sets new odometer
6. Updates driver status to AVAILABLE
7. Creates a fuel log record
8. Creates expense records (toll, other)

---

## Major Workflows

### Vehicle Lifecycle

```
Registered -> Available -> On Trip (via dispatch)
                                       |
                                       v
                                  Completed -> Available
                                       
In Shop (via maintenance) -> Available (via complete maintenance)
Retired (terminal state)
```

### Trip Lifecycle

```
Draft -> Dispatched -> In Progress -> Completed
                              |
                              v
                          Cancelled
```

### Maintenance Lifecycle

```
Scheduled -> In Progress -> Completed
```

---

## Analytics

The analytics module provides four report types accessible via the Reports API and visualized on the Analytics dashboard.

### Fuel Efficiency
- Liters per 100 km per vehicle
- Fuel cost per km
- Comparative vehicle efficiency rankings

### Fleet Utilization
- Percentage of vehicles actively on trips
- Idle vehicle count vs. in-use count
- Utilization trends over time

### Operational Cost
- Total fuel costs, toll costs, and other expenses
- Cost per trip and cost per km
- Monthly cost breakdown

### Vehicle ROI
- Revenue generated per vehicle
- Cost-to-revenue ratio
- Profitability ranking across the fleet
- Top and bottom performers
- CSV export for all report views

---

## Future Improvements

- GPS integration with real-time vehicle tracking on a live map
- Mobile application for drivers to update trip status and receive notifications
- AI-powered route optimization for fuel efficiency
- SMS and email alerting for delayed trips, maintenance due dates, and license expirations
- Automated Kanban task creation triggered by maintenance events, license expiry, insurance renewal, trip cancellations, and safety score thresholds

---

## Contributing

Contributions are welcome. Please open an issue or pull request on GitHub.

---

## License

This project is provided for educational and demonstration purposes.

---

## Author

**Viraj Vasoya** \
**Aayush Parekh** \
**Dev Desai**


