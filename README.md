# 🌐 NetPulse — Network Monitoring Dashboard

<div align="center">

![NetPulse Banner](https://img.shields.io/badge/NetPulse-Network%20Monitor-2563eb?style=for-the-badge\&logo=wifi\&logoColor=white)

[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=flat-square\&logo=laravel\&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square\&logo=react\&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square\&logo=vite\&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?style=flat-square\&logo=tailwind-css\&logoColor=white)](https://tailwindcss.com)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square\&logo=mysql\&logoColor=white)](https://www.mysql.com)

**A full-stack network monitoring dashboard built with Laravel + React.**
Monitor routers, switches, servers, and firewalls in real time with live ping, charts, alerts, and logs.

</div>

---

## ✨ Features

* 🔐 Authentication with role-based access (Admin / Viewer)
* 📡 Device management (routers, switches, servers, firewalls, APs)
* 🏓 Live ping monitoring with latency tracking
* 📊 Charts for latency and uptime
* ⚡ Real-time updates (WebSocket support)
* 🚨 Alerts for offline devices and high latency
* 📋 Log history with filters and pagination
* 📥 CSV export for monitoring logs
* 🌙 Dark mode with system detection

---

## 🛠 Tech Stack

### Backend

* Laravel 11 (PHP 8.2+)
* Laravel Sanctum (Authentication)
* MySQL
* Laravel Scheduler
* Pusher (optional)

### Frontend

* React 18 + Vite
* TailwindCSS
* Recharts
* Axios
* React Router

---

## 🚀 Quick Start

### Backend

```bash
cd netpulse-api
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend

```bash
cd netpulse-ui
npm install
npm run dev
```
---

<div align="center">

Built with ☕ & powered by Laravel and React

</div>
