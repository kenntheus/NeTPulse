# NeTPulse — Network Monitoring Dashboard

<div align="center">

![NeTPulse](https://img.shields.io/badge/NeTPulse-Network%20Monitor-2563eb?style=for-the-badge&logo=wifi&logoColor=white)

[![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=flat-square&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com)

**A full-stack network monitoring dashboard built with Laravel + React.**  
Monitor routers, switches, servers, and more in real time — with AI-powered insights and a chat assistant.

[Live Demo](https://ne-t-pulse.vercel.app) · [API](https://netpulse-1.onrender.com)

</div>

---

## Features

**Monitoring**
- Real-time device ping with latency tracking
- Latency and uptime charts
- Live alerts for offline devices and latency spikes
- Log history with filters, pagination, and CSV export
- WebSocket-based real-time status updates via Pusher

**Device Management**
- Add/edit/delete devices (router, switch, server, firewall, AP, phone, laptop, and more)
- ARP network scan to auto-discover devices on the local network
- Remote agent for continuous ARP scanning from any machine

**AI Features**
- **Anomaly Detection** — Z-score based latency spike and ARP spoofing detection
- **Device Fingerprinting** — Behavioral classification (infrastructure, server, personal, smart home)
- **Alert Grouping** — Detects cascading failures and reduces alert noise
- **AI Chat Assistant** — Powered by Groq (Llama 3.3 70B) with real-time network context

**Auth & Access**
- Email verification on registration
- Role-based access: Admin / Viewer
- Sanctum token authentication (7-day expiry)
- Long-lived agent tokens (1-year expiry)

**UI**
- Multiple color themes
- Dark mode with system detection
- Fully responsive layout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12, PHP 8.2+, Laravel Sanctum |
| Frontend | React 19, Vite, TailwindCSS, Recharts, React Router |
| Agent | Node.js |
| Database | MySQL 8 |
| Real-time | Pusher |
| Mail | Resend |
| AI | Groq API (llama-3.3-70b-versatile) |
| Deployment | Render (API, Docker), Vercel (UI) |

---

## Project Structure

```
NeTPulse/
├── netpulse-api/     # Laravel 12 REST API
├── netpulse-ui/      # React 19 frontend
└── netpulse-agent/   # Node.js ARP scanning agent
```

---

## Quick Start

### Backend

```bash
cd netpulse-api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend

```bash
cd netpulse-ui
npm install
npm run dev
```

### Agent

```bash
cd netpulse-agent
npm install
cp .env.example .env   # fill in API_URL and API_TOKEN
node agent.js
```

---

## Running the Agent with PM2

```bash
npm install -g pm2
pm2 start agent.js --name netpulse-agent
pm2 startup    # auto-start on reboot
pm2 save
```

---

## Deployment

The API is deployed on **Render** using Docker. The frontend is deployed on **Vercel**.

---

<div align="center">
Built with Laravel and React
</div>
