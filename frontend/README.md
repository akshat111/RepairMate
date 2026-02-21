# RepairMate — Frontend

The React + Vite frontend for the RepairMate device repair management platform. Provides dedicated portals for **Customers**, **Technicians**, and **Admins**.

---

## 🛠 Tech Stack

| Package | Purpose |
|---------|---------|
| `react` v19 | UI framework |
| `react-router-dom` v7 | Client-side routing with nested layouts |
| `axios` | HTTP client (with token refresh interceptors) |
| `tailwindcss` | Utility-first CSS |
| `vite` | Dev server & build tool |

---

## 📁 Project Structure

```
frontend/src/
├── App.jsx                 # Root component
├── main.jsx                # React entry point
├── routes/index.jsx        # All routes with role-based guards
├── context/
│   └── AuthContext.jsx     # Global auth state (user, token, logout)
├── services/               # Axios API call modules
│   ├── api.js              # Base Axios instance + refresh interceptor
│   ├── adminService.js     # Admin-specific API calls
│   ├── bookingService.js   # Customer booking API calls
│   ├── inventoryService.js # Inventory CRUD API calls
│   └── technicianService.js# Technician job/earnings API calls
├── components/
│   ├── AdminLayout/        # Admin sidebar + header shell
│   └── TechnicianLayout/   # Technician sidebar + header shell
├── pages/
│   ├── admin/              # Admin section pages
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminBookings.jsx
│   │   ├── AdminTechnicians.jsx
│   │   ├── AdminInventory.jsx
│   │   ├── AdminRevenue.jsx
│   │   └── AdminSettings.jsx
│   ├── technician/         # Technician section pages
│   │   ├── TechnicianJobs.jsx
│   │   ├── TechnicianHistory.jsx
│   │   ├── TechnicianInventory.jsx
│   │   └── TechnicianEarnings.jsx
│   └── TechnicianDashboard.jsx
└── utils/
    └── formatters.js       # Currency / date helpers
```

---

## 🔐 Routing & Role Guards

Routes are protected by role-based `ProtectedRoute` wrappers:

- **`/`** — Customer-facing (authenticated users)
- **`/admin/*`** — Admin portal, wrapped in `AdminLayout`
- **`/technician/*`** — Technician portal, wrapped in `TechnicianLayout`

Unauthenticated users are redirected to `/login`.

---

## 🚀 Getting Started

```bash
cd frontend
npm install
npm run dev
```

> Runs at `http://localhost:5173` by default.

### Environment Variable

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 🔑 Authentication Flow

- On login, the backend issues an **access token** (short-lived) and a **refresh token** (stored in cookie).
- The `api.js` Axios instance automatically attaches the access token to every request header.
- On a `401 Unauthorized` response, the interceptor silently calls `/auth/refresh-token` and retries the original request.

---

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |

---

> Part of the [RepairMate](https://github.com/akshat111/RepairMate) project — Built with ❤️ by [Akshat](https://github.com/akshat111) and Antigravity
