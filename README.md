# SupplyWatch AI 🚢📦

> **Real-time supply chain disruption prediction & automated replan recommendations.**

SupplyWatch AI monitors your global shipment network, predicts delays before they happen, scores each disruption risk, and surfaces actionable replan suggestions to keep operations running smoothly.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Environment Variables](#environment-variables)
6. [Folder Structure](#folder-structure)

---

## Project Overview

| Capability | Description |
|---|---|
| 🔍 **Shipment Tracking** | Real-time GPS positions, status updates, and event timelines |
| 🤖 **Delay Prediction** | Mock ML model scores weather, customs risk, port congestion, and carrier reliability |
| 💰 **Trip Cost** | Regional cost calculation based on origin/destination distance and status surcharges |
| 🔔 **Smart Alerts** | Severity-ranked alerts pushed via WebSocket to all connected dashboards |
| 🗺️ **Live Map** | Mapbox-powered map showing all in-transit shipments with risk overlays |
| 📋 **Replan Recommendations** | AI-generated suggestions (expedite, re-route) with approval workflow |

---

## Architecture

This project has been simplified to run entirely on Node.js without the need for Docker, Python, or external databases.

```text
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│   React 18 + Vite  ·  Mapbox GL  ·  Zustand                     │
│   Port 5173                                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 MOCK BACKEND  (Node.js / Express)               │
│   REST API  ·  Socket.IO  ·  In-Memory Data                     │
│   Port 3001                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Node.js | 18.x LTS | https://nodejs.org/ |
| npm | 9.x | bundled with Node.js |
| Git | 2.x | https://git-scm.com/ |

---

## Quick Start

> The fastest way to run the stack locally.

### 1. Clone & Setup
```bash
git clone https://github.com/your-org/supply-watch-ai.git
cd supply-watch-ai
```

### 2. Start the Backend
```bash
cd mock-backend
npm install
node server.js
```
*Backend will run on `http://localhost:3001`*

### 3. Start the Frontend (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```
*Frontend will run on `http://localhost:5173`*

### 4. Default Login
- **Email:** `admin@supplywatch.ai` (or `customer@supplywatch.ai`)
- **Password:** `password123`

---

## Environment Variables

### Frontend (`frontend/.env`)
Ensure you have a `.env` file in the `frontend` folder with your Mapbox token:

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL of the mock backend (e.g., `http://localhost:3001`) |
| `VITE_MAPBOX_TOKEN` | Mapbox public token for rendering the live map |

---

## Folder Structure

```text
supply-watch-ai/
├── README.md                   # You are here
│
├── mock-backend/               # Node.js / Express API
│   ├── package.json
│   ├── server.js               # Main API and WebSocket server
│   └── custom_routes.json      # Saved dynamic routes
│
└── frontend/                   # React 18 + Vite + TypeScript
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── components/         # Reusable UI components
        ├── pages/              # Route-level pages
        ├── hooks/              # Custom React hooks
        └── store/              # Zustand global state
```
