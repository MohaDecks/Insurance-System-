# Insurance Management System (MERN)

Monorepo with an **Express + MongoDB** API and a **React (Vite) + Tailwind** admin UI. Features include JWT authentication, role-based permissions (including **sidebar menu visibility**), customers, insurance types, currencies, daily payments, reports with CSV export, and configurable notification/SMS hooks.

## Prerequisites

- Node.js 18+
- MongoDB 6+ (local URI or Atlas)

## Quick start

1. **Backend**

   ```bash
   cd server
   cp .env.example .env
   # edit MONGODB_URI and JWT_SECRET
   npm install
   npm run seed
   npm run dev
   ```

   API defaults to `http://localhost:5003`.

2. **Frontend**

   ```bash
   cd client
   cp .env.example .env
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`. The Vite dev server proxies `/api` to `VITE_DEV_API_PROXY` (see `client/.env.example`; default matches `PORT` in `server/.env`).

### Seed logins

- **Admin:** `admin@insurance.local` / `Admin123!`
- **Agent (limited permissions):** `agent@insurance.local` / `Agent123!`

## Production

```bash
cd client && npm run build
cd server && NODE_ENV=production npm start
```

Serve `client/dist` as static files from Express or a reverse proxy (nginx), and point `VITE_API_URL` / API host to your public API URL.

## Permissions & sidebar

Navigation is driven by `client/src/config/nav.js`. Each item has a `permission` string that must be present on the user’s role (returned as `permissionKeys` from `/api/auth/login` and `/api/auth/me`). This mirrors a typical **admin-defined roles → permissions → menu** pattern.

## Notifications / SMS

- Toggle **SMS** / **push** under **Settings** (stored in MongoDB).
- Server reads optional env: `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER_ID`. If unset, SMS calls are **stubbed** to the console.
- **Settings → Run unpaid reminders** calls `POST /api/notifications/remind-unpaid` (requires `notifications:send`).
- **Payments page:** `GET /api/payments/unpaid-daily?date=&search=&page=` lists customers with no payment for that UTC day; `POST /api/payments/remind` with `{ customerId, date, channel: "sms"|"push" }` sends one reminder (requires `notifications:send`).

## API overview

| Area            | Base path              |
|----------------|------------------------|
| Auth           | `/api/auth`            |
| Users          | `/api/users`           |
| Roles          | `/api/roles`           |
| Permissions    | `/api/permissions`     |
| Currencies     | `/api/currencies`      |
| Insurance types| `/api/insurance-types` |
| Customers      | `/api/customers`       |
| Payments       | `/api/payments`        |
| Reports        | `/api/reports`         |
| Settings       | `/api/settings`        |
| Notifications  | `/api/notifications`   |

All protected routes expect `Authorization: Bearer <token>`.

## Daily payment rule

Each **payment** is tied to a **UTC calendar day** (`forDate`). A customer is **PAID** for today if a payment exists for that customer and `forDate` (start of UTC day). Otherwise status is **UNPAID**. Status is refreshed when viewing a customer, recording payments, or running bulk sync (`GET /api/customers/sync-statuses`).
