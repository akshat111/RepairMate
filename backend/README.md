# RepairMate — Backend

The production-ready Express.js + MongoDB REST API powering the RepairMate device repair management platform. Supports JWT authentication, real-time Socket.IO events, automated earnings, role-based access control, and admin analytics.

---

## 🛠 Tech Stack

| Package | Purpose |
|---------|---------|
| `express` v5 | REST API framework |
| `mongoose` v9 | MongoDB ODM |
| `socket.io` v4 | Real-time booking events |
| `jsonwebtoken` | Access + refresh token auth |
| `bcryptjs` | Password hashing |
| `joi` | Request body / param validation |
| `helmet` | Security HTTP headers |
| `express-rate-limit` | API rate limiting |
| `hpp` | HTTP parameter pollution protection |
| `multer` + `imagekit` | File upload & CDN storage |
| `morgan` | HTTP request logging |
| `dotenv` | Environment variable loader |

---

## 📁 Project Structure

```
backend/
├── server.js              # Entry point: starts HTTP server + Socket.IO
├── app.js                 # Express app: middleware stack + route mounting
├── config/
│   └── db.js              # MongoDB connection via Mongoose
├── controllers/           # Route handler functions (thin, delegates to services)
│   ├── authController.js
│   ├── bookingController.js
│   ├── analyticsController.js
│   ├── earningsController.js
│   ├── inventoryController.js
│   ├── paymentController.js
│   ├── pricingController.js
│   └── technicianController.js
├── models/                # Mongoose schemas & models
│   ├── Booking.js
│   ├── Earning.js
│   ├── IdempotencyKey.js
│   ├── Inventory.js
│   ├── Notification.js
│   ├── Payment.js
│   ├── PricingRule.js
│   ├── Technician.js
│   └── User.js
├── routes/                # Express routers
│   ├── index.js           # Mounts all routers under /api/v1
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── analyticsRoutes.js
│   ├── earningsRoutes.js
│   ├── healthRoutes.js
│   ├── inventoryRoutes.js
│   ├── paymentRoutes.js
│   ├── pricingRoutes.js
│   └── technicianRoutes.js
├── middleware/
│   ├── auth.js            # protect (JWT verify) + authorize (role check)
│   ├── errorHandler.js    # Global error handler
│   ├── idempotent.js      # Idempotency key middleware
│   ├── notFound.js        # 404 handler
│   └── validate.js        # Joi schema validation middleware
├── services/              # Business logic called by controllers
│   ├── analyticsService.js
│   ├── bookingService.js
│   ├── cancelBookingService.js
│   ├── earningsService.js
│   └── rescheduleService.js
├── notifications/         # Socket.IO event emitters
├── validators/            # Joi validation schema definitions
├── utils/
│   ├── asyncHandler.js    # Wraps async controllers to catch errors
│   ├── AppError.js        # Custom error class
│   └── logger.js
├── seedRoles.js           # Creates the initial admin user
└── .env.example           # Environment variable template
```

---

## 🔐 Auth & Security

- **JWT Strategy**: Short-lived access tokens (15 min default) + long-lived refresh tokens (7 days), stored in `HttpOnly` cookies.
- **Role-based Access**: Three roles — `user`, `technician`, `admin`. Each route is protected using `protect` + `authorize(...roles)` middleware.
- **Idempotency**: Critical write operations (cancellations, etc.) use an `IdempotencyKey` model to prevent duplicate mutations from retried requests.
- **Rate Limiting**: All routes are rate-limited via `express-rate-limit`.
- **Security Headers**: `helmet` sets strict HTTP headers. CORS is configured to allow only trusted origins.

---

## 📡 API Routes

All routes are mounted under `/api/v1`.

### Auth — `/auth`
| Method | Path | Access |
|--------|------|--------|
| `POST` | `/register` | Public |
| `POST` | `/login` | Public |
| `POST` | `/logout` | Private |
| `POST` | `/refresh-token` | Public |
| `GET` | `/me` | Private |
| `PATCH` | `/me` | Private |

### Bookings — `/bookings`
| Method | Path | Access |
|--------|------|--------|
| `POST` | `/` | Customer |
| `GET` | `/my` | Customer |
| `PATCH` | `/:id/cancel` | Customer |
| `PATCH` | `/:id/reschedule` | Customer |
| `GET` | `/assigned/me` | Technician |
| `GET` | `/open` | Technician |
| `PATCH` | `/:id/accept` | Technician |
| `PATCH` | `/:id/reject-assignment` | Technician |
| `PATCH` | `/:id/start` | Technician |
| `PATCH` | `/:id/complete` | Technician |
| `PATCH` | `/:id/paid` | Technician |
| `GET` | `/` | Admin |
| `PATCH` | `/:id/assign` | Admin |
| `PATCH` | `/:id/status` | Admin |
| `PATCH` | `/:id/admin-cancel` | Admin |
| `PATCH` | `/:id/admin-reschedule` | Admin |

### Inventory — `/inventory`
| Method | Path | Access |
|--------|------|--------|
| `GET` | `/` | Admin, Technician |
| `POST` | `/` | Admin |
| `PATCH` | `/:id` | Admin |
| `DELETE` | `/:id` | Admin |

### Analytics — `/analytics`
| Method | Path | Access |
|--------|------|--------|
| `GET` | `/dashboard` | Admin |
| `GET` | `/revenue` | Admin |
| `GET` | `/revenue/trend` | Admin |
| `GET` | `/bookings` | Admin |
| `GET` | `/payouts` | Admin |

### Earnings — `/earnings`
| Method | Path | Access |
|--------|------|--------|
| `GET` | `/dashboard` | Technician |
| `GET` | `/my` | Technician |
| `GET` | `/` | Admin |

### Health — `/health`
| Method | Path | Access |
|--------|------|--------|
| `GET` | `/` | Public |

---

## 🗄 Data Models

### `Booking`
Core entity. Status lifecycle: `pending → assigned → in_progress → completed` (or `cancelled` at any non-completed stage).

Key fields: `user`, `technician`, `serviceType`, `deviceInfo`, `status`, `paymentStatus`, `isPaid`, `estimatedCost`, `finalCost`, `statusHistory[]`.

### `Earning`
Auto-generated on booking completion. Tracks `bookingAmount`, `commissionAmount`, `netEarning`, `bonus`, `deductions`, and payout `status` (`pending | approved | paid`).

### `Inventory`
Parts stock management. Fields: `name`, `sku`, `category`, `quantity`, `lowStockThreshold`, `unitPrice`, `compatibility[]`. Quantity is auto-decremented on booking completion.

### `Technician`
Extended profile linked to a `User`. Fields: `skills[]`, `verificationStatus`, `isOnline`, `averageRating`, `totalJobsCompleted`.

### `Payment`
Financial record for a booking payment. Tracks `gateway`, `amount`, `status`, and `refundedAmount`.

### `PricingRule`
Dynamic pricing configuration. Drives `estimatedCost` calculations based on service type, urgency multiplier, and base price.

---

## ⚡ Real-Time Events (Socket.IO)

Booking state changes emit named events via an internal `EventEmitter` bus:

| Event | Triggered By |
|-------|-------------|
| `BOOKING_CREATED` | New booking submitted |
| `BOOKING_ASSIGNED` | Admin assigns a technician |
| `BOOKING_STARTED` | Technician starts a job |
| `BOOKING_COMPLETED` | Technician completes a job |
| `BOOKING_CANCELLED` | User or admin cancels |

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/repairmate

JWT_SECRET=your_access_token_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173

PAYMENT_GATEWAY=manual

PLATFORM_COMMISSION_RATE=0.15
```

---

## 🚀 Getting Started

```bash
cd backend
npm install
cp .env.example .env   # Configure your env variables
npm run dev            # Start with nodemon (hot reload)
```

> Server runs at `http://localhost:5000`

To seed the initial admin user:

```bash
node seedRoles.js
```

---

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with nodemon (development) |
| `npm start` | Start with node (production) |

---

> Part of the [RepairMate](https://github.com/akshat111/RepairMate) project — Built with ❤️ by [Akshat](https://github.com/akshat111) and Antigravity
