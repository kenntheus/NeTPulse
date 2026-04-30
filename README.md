# 🌐 NetPulse — Network Monitoring Dashboard

<div align="center">

![NetPulse Banner](https://img.shields.io/badge/NetPulse-Network%20Monitor-2563eb?style=for-the-badge&logo=wifi&logoColor=white)

[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=flat-square&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**A production-ready, full-stack network monitoring dashboard built with Laravel + React.**  
Monitor routers, switches, servers, and firewalls in real time with live ping, latency charts, alert notifications, and CSV export.

[Live Demo](#) · [Report Bug](#) · [Request Feature](#)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#1-database-setup-mysql)
  - [Backend Setup](#2-backend-setup-laravel)
  - [Frontend Setup](#3-frontend-setup-react--vite)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Demo Accounts](#-demo-accounts)
- [Contributing](#-contributing)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | JWT-style auth via Laravel Sanctum with role-based access (Admin / Viewer) |
| 📡 **Device Management** | Full CRUD for routers, switches, servers, firewalls, APs |
| 🏓 **Live Ping Monitoring** | Automated ICMP ping every 30 seconds with real latency extraction |
| 📊 **Charts & Analytics** | Latency area chart (24h) and uptime bar chart (7 days) via Recharts |
| ⚡ **Real-time Updates** | WebSocket push via Laravel Echo + Pusher — no page refresh needed |
| 🚨 **Alerts** | Auto-alert on device offline/recovery/high-latency with badge counter |
| 📋 **Log History** | Per-device log viewer with date range filter and pagination |
| 📥 **CSV Export** | Download filtered monitoring logs as CSV |
| 🌙 **Dark Mode** | System-aware dark mode with manual toggle, persisted to localStorage |
| 👥 **Role-Based Access** | Admins: full CRUD. Viewers: read-only. Enforced via Laravel Policies |

---

## 🛠 Tech Stack

### Backend (`netpulse-api/`)
- **Framework:** Laravel 11 (PHP 8.2+)
- **Auth:** Laravel Sanctum (Bearer token)
- **Database:** MySQL 8
- **Broadcasting:** Laravel Echo + Pusher
- **Scheduler:** Laravel Task Scheduling (every 30s)
- **Architecture:** Controller → Service → Model (clean separation)

### Frontend (`netpulse-ui/`)
- **Framework:** React 18 + Vite 5 (SWC)
- **Styling:** TailwindCSS 3 + Dark mode
- **Charts:** Recharts
- **HTTP:** Axios with interceptors
- **Routing:** React Router v6
- **Real-time:** Laravel Echo + Pusher-js
- **State:** React Context (Auth) + custom hooks

---

## 📸 Screenshots

> Add screenshots here after running the app locally.

| Dashboard | Devices |
|---|---|
| *(screenshot)* | *(screenshot)* |

| Logs | Alerts |
|---|---|
| *(screenshot)* | *(screenshot)* |

---

## 📁 Project Structure

```
NetPulse/
├── netpulse-api/               ← Laravel backend
│   ├── app/
│   │   ├── Events/
│   │   │   └── DeviceStatusUpdated.php   # WebSocket broadcast event
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── AuthController.php    # register, login, logout, me
│   │   │   │   ├── DeviceController.php  # CRUD + manual ping
│   │   │   │   ├── DashboardController.php
│   │   │   │   ├── MonitoringLogController.php
│   │   │   │   └── AlertController.php
│   │   │   ├── Middleware/
│   │   │   │   └── RoleMiddleware.php    # admin/viewer guard
│   │   │   └── Requests/
│   │   │       ├── StoreDeviceRequest.php
│   │   │       └── UpdateDeviceRequest.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Device.php
│   │   │   ├── MonitoringLog.php
│   │   │   └── Alert.php
│   │   ├── Policies/
│   │   │   └── DevicePolicy.php         # Admin can write, Viewer reads only
│   │   ├── Providers/
│   │   │   └── AppServiceProvider.php
│   │   └── Services/
│   │       └── MonitoringService.php    # Core ping engine + alerting
│   ├── bootstrap/
│   │   ├── app.php                      # Laravel 11 application bootstrap
│   │   └── providers.php
│   ├── config/
│   │   ├── app.php
│   │   ├── auth.php
│   │   ├── broadcasting.php
│   │   ├── cors.php
│   │   ├── database.php
│   │   └── sanctum.php
│   ├── database/
│   │   ├── factories/
│   │   │   ├── UserFactory.php
│   │   │   └── DeviceFactory.php
│   │   ├── migrations/
│   │   │   ├── ..._create_devices_table.php
│   │   │   ├── ..._create_monitoring_logs_table.php
│   │   │   ├── ..._create_alerts_table.php
│   │   │   └── ..._add_role_to_users_table.php
│   │   └── seeders/
│   │       └── DatabaseSeeder.php       # 12 demo devices, 7 days of logs
│   ├── routes/
│   │   ├── api.php
│   │   ├── console.php                  # Scheduler: ping every 30s
│   │   └── web.php
│   ├── .env.example
│   ├── composer.json
│   └── railway.json                     # Railway deployment config
│
└── netpulse-ui/                ← React frontend
    ├── src/
    │   ├── components/
    │   │   ├── alerts/
    │   │   │   ├── AlertBadge.jsx        # Bell icon with unread count
    │   │   │   └── AlertList.jsx         # Reusable alert list
    │   │   ├── devices/
    │   │   │   ├── DeviceCard.jsx        # Card with ping/edit/delete
    │   │   │   └── DeviceForm.jsx        # Add/edit form with validation
    │   │   ├── layout/
    │   │   │   ├── AppLayout.jsx         # Sidebar + TopBar wrapper
    │   │   │   ├── Sidebar.jsx           # Navigation sidebar
    │   │   │   ├── ThemeToggle.jsx       # Dark/light mode button
    │   │   │   └── TopBar.jsx            # Top bar with user info & alerts
    │   │   └── ui/
    │   │       └── index.jsx             # Button, Badge, Modal, Input, Toast, etc.
    │   ├── hooks/
    │   │   ├── useAuth.js                # Auth context shortcut
    │   │   ├── useDarkMode.js            # Dark mode with localStorage
    │   │   ├── useDevices.js             # Device CRUD + real-time updates
    │   │   └── useEcho.js                # Laravel Echo WebSocket hook
    │   ├── lib/
    │   │   └── api.js                    # Axios instance with interceptors
    │   ├── pages/
    │   │   ├── Dashboard.jsx             # Summary cards + charts + device table
    │   │   ├── Devices.jsx               # Device grid with CRUD
    │   │   ├── Alerts.jsx                # Alert list with mark read / delete
    │   │   ├── Logs.jsx                  # Log viewer with filters + CSV export
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── NotFound.jsx
    │   │   └── index.jsx                 # Barrel exports
    │   ├── store/
    │   │   └── AuthContext.jsx           # Global auth state
    │   ├── App.jsx                       # Routes + auth guards
    │   ├── App.css                       # Global overrides
    │   ├── index.css                     # Tailwind base
    │   └── main.jsx                      # React entry point
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vercel.json
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| PHP | 8.2+ | [php.net](https://php.net) |
| Composer | Latest | [getcomposer.org](https://getcomposer.org) |
| MySQL | 8.0+ | [mysql.com](https://mysql.com) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Included with Node |

---

### 1. Database Setup (MySQL)

```bash
# Log into MySQL
mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE netpulse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (recommended)
CREATE USER 'netpulse_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON netpulse.* TO 'netpulse_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

---

### 2. Backend Setup (Laravel)

```bash
# Clone repo / navigate to backend
cd netpulse-api

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate app key
php artisan key:generate
```

**Edit `.env` with your database credentials:**

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=netpulse
DB_USERNAME=netpulse_user
DB_PASSWORD=your_strong_password

FRONTEND_URL=http://localhost:5173
```

```bash
# Run migrations (creates all tables)
php artisan migrate

# Seed demo data (12 devices, 2 users, 7 days of logs)
php artisan db:seed

# Start the development server
php artisan serve
# → API running at http://localhost:8000
```

**Start the scheduler** (pings all devices every 30 seconds):

```bash
# Linux/Mac — run in a second terminal
while true; do php artisan schedule:run; sleep 30; done

# Or on Windows, run once manually:
php artisan schedule:run
```

---

### 3. Frontend Setup (React + Vite)

```bash
# Navigate to frontend
cd netpulse-ui

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

**Edit `.env`:**

```ini
VITE_API_URL=http://localhost:8000
VITE_PUSHER_KEY=your_pusher_key       # optional — leave as-is to skip WebSockets
VITE_PUSHER_CLUSTER=mt1
```

```bash
# Start the development server
npm run dev
# → App running at http://localhost:5173
```

Open **http://localhost:5173** and log in with the demo accounts below.

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@netpulse.dev | `password` |
| **Viewer** | viewer@netpulse.dev | `password` |

> Admins can add, edit, and delete devices. Viewers have read-only access.

---

## 🔧 Environment Variables

### Backend (`netpulse-api/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_KEY` | Laravel encryption key | Generated by `artisan key:generate` |
| `DB_HOST` | MySQL host | `127.0.0.1` |
| `DB_DATABASE` | Database name | `netpulse` |
| `DB_USERNAME` | Database user | `netpulse_user` |
| `DB_PASSWORD` | Database password | `your_password` |
| `BROADCAST_DRIVER` | Broadcasting driver | `pusher` or `log` |
| `PUSHER_APP_ID` | Pusher App ID | From pusher.com |
| `PUSHER_APP_KEY` | Pusher App Key | From pusher.com |
| `PUSHER_APP_SECRET` | Pusher Secret | From pusher.com |
| `PUSHER_APP_CLUSTER` | Pusher cluster | `mt1` |
| `FRONTEND_URL` | CORS allow-origin | `http://localhost:5173` |

### Frontend (`netpulse-ui/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |
| `VITE_PUSHER_KEY` | Pusher App Key | From pusher.com |
| `VITE_PUSHER_CLUSTER` | Pusher cluster | `mt1` |

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer {token}
```

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, returns token |
| `POST` | `/api/auth/logout` | Invalidate token |
| `GET`  | `/api/auth/me` | Get current user |

### Devices
| Method | Endpoint | Description | Admin only |
|--------|----------|-------------|-----------|
| `GET`  | `/api/devices` | List all devices | — |
| `POST` | `/api/devices` | Create device | ✅ |
| `GET`  | `/api/devices/{id}` | Get single device | — |
| `PUT`  | `/api/devices/{id}` | Update device | ✅ |
| `DELETE` | `/api/devices/{id}` | Delete device | ✅ |
| `POST` | `/api/devices/{id}/ping` | Manual ping | — |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/dashboard/summary` | Counts: total, online, offline, alerts |
| `GET`  | `/api/dashboard/latency-chart` | Avg latency per minute (24h) |
| `GET`  | `/api/dashboard/uptime-chart` | Daily uptime % (7 days) |

### Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/devices/{id}/logs` | Paginated logs (filter: from, to, status) |
| `GET`  | `/api/logs/export` | Download CSV |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/alerts` | List alerts (filter: unread=1) |
| `PATCH` | `/api/alerts/{id}/read` | Mark as read |
| `POST` | `/api/alerts/read-all` | Mark all as read |
| `DELETE` | `/api/alerts/{id}` | Delete alert |

---

## 🚢 Deployment

### Backend → Railway

1. Push `netpulse-api/` to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **MySQL** service in Railway
4. Set environment variables in Railway dashboard (see above)
5. Railway auto-detects `railway.json` and runs migrations on deploy

### Frontend → Vercel

```bash
cd netpulse-ui
npm run build      # creates dist/

# Deploy via Vercel CLI
npx vercel --prod
```

Or connect your GitHub repo to Vercel — it auto-builds on push.

Set these environment variables in Vercel:
```
VITE_API_URL=https://your-api.railway.app
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=mt1
```

---

## 🔴 WebSockets (Optional — Pusher)

For real-time push updates without polling:

1. Create a free account at [pusher.com](https://pusher.com)
2. Create a new **Channels** app
3. Copy your App ID, Key, Secret, and Cluster
4. Update `.env` in both backend and frontend

Without Pusher, the dashboard still auto-refreshes every 30 seconds via polling.

---

## 🛠 Common Commands

```bash
# ── Backend ──────────────────────────────────────────────────
php artisan serve                      # Start API server
php artisan migrate                    # Run pending migrations
php artisan migrate:fresh --seed       # Reset DB and re-seed ⚠️ destructive
php artisan db:seed                    # Seed without resetting
php artisan schedule:run               # Run scheduler once
php artisan route:list                 # List all routes
php artisan config:clear               # Clear config cache
composer dump-autoload                 # Fix class not found errors

# ── Frontend ─────────────────────────────────────────────────
npm run dev                            # Start dev server
npm run build                          # Build for production
npm run preview                        # Preview production build
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| **CORS error** | Make sure `FRONTEND_URL=http://localhost:5173` in backend `.env`, then `php artisan config:clear` |
| **Access denied (MySQL)** | Re-check `.env` DB credentials match your MySQL user |
| **Class not found** | Run `composer dump-autoload` |
| **No data in charts** | Run `php artisan schedule:run` at least once to generate logs |
| **Login fails (401)** | Make sure `php artisan serve` is running and Sanctum is published |
| **Vite can't find modules** | Run `npm install` again |
| **Seeder fails** | Run `php artisan migrate:fresh --seed` to reset completely |

---

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first to discuss.

```bash
git checkout -b feature/my-feature
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ for learning

**Tech:** Laravel · React · MySQL · TailwindCSS · Recharts · Pusher

</div>