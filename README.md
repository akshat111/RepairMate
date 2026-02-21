# 🔧 RepairMate

A full-stack device repair management platform connecting customers, technicians, and admins. RepairMate handles the complete workflow — from booking a repair job, assigning technicians, tracking progress in real-time, managing inventory, processing earnings, and admin-level financial reporting.

---

## 📚 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Features](#-features)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [User Roles](#-user-roles)
- [Database Models](#-database-models)

---

## 🌐 Overview

RepairMate is a service platform for device repairs (smartphones, laptops, smartwatches, and more). It provides three distinct portals:

| Role | Portal | Description |
|------|--------|-------------|
| **Customer** | `/` | Book repairs, track status, view history |
| **Technician** | `/technician/dashboard` | Manage jobs, earnings, and parts inventory |
| **Admin** | `/admin` | Full oversight of bookings, technicians, revenue, and inventory |

---

## 🛠 Tech Stack

### Backend
| Package | Purpose |
|---------|---------|
| `express` v5 | REST API framework |
| `mongoose` | MongoDB ODM |
| `socket.io` | Real-time updates |
| `jsonwebtoken` | JWT-based auth (access + refresh tokens) |
| `bcryptjs` | Password hashing |
| `helmet` | Security headers |
| `express-rate-limit` | API rate limiting |
| `joi` | Schema validation |
| `multer` + `imagekit` | File upload & CDN storage |
| `morgan` | HTTP request logging |

### Frontend
| Package | Purpose |
|---------|---------|
| `react` v19 | UI framework |
| `react-router-dom` v7 | Client-side routing |
| `axios` | HTTP client |
| `vite` | Build tool & dev server |
| `tailwindcss` | Utility-first CSS |

---

## 📁 Project Structure

```
RepairMate/
├── backend/
│   ├── app.js                 # Express app config (CORS, middleware, routes)
│   ├── server.js              # Entry point (HTTP + Socket.IO server)
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/           # Route handler logic
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── analyticsController.js
│   │   ├── earningsController.js
│   │   ├── inventoryController.js
│   │   └── technicianController.js
│   ├── models/                # Mongoose schemas
│   │   ├── Booking.js
│   │   ├── Earning.js
│   │   ├── Inventory.js
│   │   ├── Payment.js
│   │   ├── Technician.js
│   │   └── User.js
│   ├── routes/                # Express routers
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── earningsRoutes.js
│   │   ├── inventoryRoutes.js
│   │   └── technicianRoutes.js
│   ├── middleware/
│   │   ├── auth.js            # JWT protect + role-based authorize
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── analyticsService.js
│   │   ├── bookingService.js
│   │   └── earningsService.js
│   ├── validators/            # Joi validation schemas
│   └── utils/                 # Async handler, logger, etc.
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── routes/index.jsx   # React Router config + role guards
    │   ├── context/           # AuthContext (global user state)
    │   ├── services/          # Axios API service modules
    │   │   ├── api.js
    │   │   ├── adminService.js
    │   │   ├── bookingService.js
    │   │   ├── inventoryService.js
    │   │   └── technicianService.js
    │   ├── components/
    │   │   ├── AdminLayout/
    │   │   └── TechnicianLayout/
    │   └── pages/
    │       ├── admin/         # Admin section pages
    │       ├── technician/    # Technician section pages
    │       └── ...            # Customer-facing pages
    └── index.html
```

---

## ✨ Features

### Customer
- Register, login, and manage profile
- Book device repair jobs with service type, device info, urgency, and address
- View booking status updates in real-time (via Socket.IO)
- Track booking history and estimated costs

### Technician
- Dedicated dashboard with separate sections: **My Jobs**, **History**, **Parts Inventory**, and **Earnings**
- Accept or reject open job assignments
- Start and complete jobs, triggering automated workflows
- **Mark a job as "Paid"** when a customer pays in cash
- View a read-only parts inventory to see available stock
- View earnings history and payout summary

### Admin
- Full booking management: view, assign, reschedule, and cancel jobs
- Technician management: approve/reject applications, view profiles
- Inventory management: add, update, and delete parts with SKU, category, and compatibility
- Revenue & Finance dashboard: total revenue, platform commission, technician payouts, trend charts
- Analytics: booking metrics by status, service type, urgency, and completion time

### Automated Features
- **Inventory Auto-Deduction**: When a job is marked as completed, the system automatically identifies the matching part (based on service type and device model) in the inventory and reduces its quantity by 1.
- **Earnings Generation**: Technician earnings are automatically generated upon job completion, applying the configured platform commission rate.
- **Real-Time Booking Events**: Booking status changes emit Socket.IO events to update connected clients instantly.

---

## 📡 API Reference

All API routes are prefixed with `/api/v1`.

### Authentication
| Method | Endpoint | Access |
|--------|----------|--------|
| `POST` | `/auth/register` | Public |
| `POST` | `/auth/login` | Public |
| `POST` | `/auth/logout` | Private |
| `POST` | `/auth/refresh-token` | Public |
| `GET` | `/auth/me` | Private |

### Bookings
| Method | Endpoint | Access |
|--------|----------|--------|
| `POST` | `/bookings` | Customer |
| `GET` | `/bookings/my` | Customer |
| `GET` | `/bookings/assigned/me` | Technician |
| `PATCH` | `/bookings/:id/start` | Technician |
| `PATCH` | `/bookings/:id/complete` | Technician |
| `PATCH` | `/bookings/:id/paid` | Technician |
| `PATCH` | `/bookings/:id/accept` | Technician |
| `GET` | `/bookings` | Admin |
| `PATCH` | `/bookings/:id/assign` | Admin |
| `PATCH` | `/bookings/:id/status` | Admin |
| `PATCH` | `/bookings/:id/admin-cancel` | Admin |

### Inventory
| Method | Endpoint | Access |
|--------|----------|--------|
| `GET` | `/inventory` | Admin, Technician |
| `POST` | `/inventory` | Admin |
| `PATCH` | `/inventory/:id` | Admin |
| `DELETE` | `/inventory/:id` | Admin |

### Analytics
| Method | Endpoint | Access |
|--------|----------|--------|
| `GET` | `/analytics/dashboard` | Admin |
| `GET` | `/analytics/revenue` | Admin |
| `GET` | `/analytics/revenue/trend` | Admin |
| `GET` | `/analytics/bookings` | Admin |
| `GET` | `/analytics/payouts` | Admin |

### Earnings
| Method | Endpoint | Access |
|--------|----------|--------|
| `GET` | `/earnings/dashboard` | Technician |
| `GET` | `/earnings/my` | Technician |
| `GET` | `/earnings` | Admin |

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory using `.env.example` as a reference:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/repairmate

# JWT
JWT_SECRET=your_access_token_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Payment Gateway: manual | razorpay | stripe
PAYMENT_GATEWAY=manual

# Platform Commission Rate (0.15 = 15%)
PLATFORM_COMMISSION_RATE=0.15
```

For the frontend, create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository
```bash
git clone https://github.com/akshat111/RepairMate.git
cd RepairMate
```

### 2. Start the Backend
```bash
cd backend
npm install
cp .env.example .env   # Fill in your environment variables
npm run dev
```
> Backend runs at `http://localhost:5000`

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
> Frontend runs at `http://localhost:5173`

---

## 👤 User Roles

| Role | Registration | Notes |
|------|-------------|-------|
| `user` | Self-register at `/register` | Standard customer |
| `technician` | Self-register with additional profile info | Requires admin approval before accepting jobs |
| `admin` | Seeded via `seedRoles.js` | Full platform access |

Run the seed script to create the initial admin account:
```bash
cd backend
node seedRoles.js
```

---

## 🗄 Database Models

| Model | Key Fields |
|-------|-----------|
| `User` | name, email, password, role |
| `Technician` | user (ref), skills, verificationStatus, isOnline, averageRating |
| `Booking` | user, technician, serviceType, deviceInfo, status, paymentStatus |
| `Earning` | technician, booking, bookingAmount, commissionAmount, netEarning, status |
| `Payment` | booking, user, amount, status, gateway, refundedAmount |
| `Inventory` | name, sku, category, quantity, unitPrice, compatibility |

---

## 📜 License

ISC License — see [LICENSE](LICENSE) for details.

---

> Built with ❤️ by [Akshat](https://github.com/akshat111) and Antigravity
