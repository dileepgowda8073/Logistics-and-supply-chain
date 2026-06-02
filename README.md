# SupplyWatch AI 🚢📦

> **Real-time supply chain disruption prediction & automated replan recommendations — powered by machine learning.**

SupplyWatch AI monitors your global shipment network, predicts delays before they happen, scores each disruption risk, and surfaces actionable replan suggestions to keep operations running smoothly.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Quick Start — Docker](#quick-start--docker)
5. [Manual Dev Setup](#manual-dev-setup)
6. [Environment Variables](#environment-variables)
7. [API Reference](#api-reference)
8. [Folder Structure](#folder-structure)
9. [Contributing](#contributing)
10. [License](#license)

---

## Project Overview

| Capability | Description |
|---|---|
| 🔍 **Shipment Tracking** | Real-time GPS positions, status updates, and event timelines |
| 🤖 **Delay Prediction** | ML model scores weather, customs risk, port congestion, and carrier reliability |
| 📊 **Inventory Intelligence** | Safety-stock monitoring with automatic reorder-point calculations |
| 🔔 **Smart Alerts** | Severity-ranked alerts pushed via WebSocket to all connected dashboards |
| 🗺️ **Live Map** | Mapbox-powered map showing all in-transit shipments with risk overlays |
| 📋 **Replan Recommendations** | AI-generated suggestions (expedite, re-route, safety-stock buffer) with approval workflow |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│   React 18 + Vite  ·  Mapbox GL  ·  TanStack Query             │
│   Port 5173                                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND  (Node / Express)                    │
│   REST API  ·  JWT Auth  ·  Socket.IO  ·  Bull queues           │
│   Port 3001                                                     │
│                                                                 │
│   ┌───────────┐   ┌─────────────┐   ┌──────────────────────┐  │
│   │  Routes   │   │  Services   │   │  Scheduled Jobs       │  │
│   │  /auth    │   │  shipments  │   │  prediction runner    │  │
│   │  /ship.   │   │  inventory  │   │  alert evaluator      │  │
│   │  /invent. │   │  alerts     │   │  ETA updater          │  │
│   │  /alerts  │   │  replan     │   └──────────────────────┘  │
│   │  /replan  │   └─────────────┘                             │
│   └───────────┘                                               │
└───────┬────────────────────────────┬────────────────────────────┘
        │ SQL (pg)                   │ Redis cache / queues
        ▼                            ▼
┌───────────────┐          ┌─────────────────┐
│  PostgreSQL   │          │     Redis 7      │
│  Port 5432    │          │   Port 6379      │
│               │◄─────────┤  (Bull queues,  │
│  - users      │  NOTIFY  │   session cache) │
│  - shipments  │          └─────────────────┘
│  - inventory  │
│  - alerts     │          ┌─────────────────────────────────────┐
│  - predictions│◄─────────│   ML SERVICE  (Python / FastAPI)    │
│  - replan_recs│  read/   │   Port 8000                         │
└───────────────┘  write   │                                     │
                           │   - /predict   (XGBoost model)      │
                           │   - /batch     (bulk predictions)   │
                           │   - /health                         │
                           └─────────────────────────────────────┘
```

---

## Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Docker Desktop | 24.x | https://docs.docker.com/get-docker/ |
| Docker Compose | 2.x (bundled) | bundled with Docker Desktop |
| Node.js | 18.x LTS | https://nodejs.org/ |
| npm | 9.x | bundled with Node.js |
| Python | 3.10+ | https://python.org/ (for manual ML dev) |
| Git | 2.x | https://git-scm.com/ |

---

## Quick Start — Docker

> The fastest way to run the entire stack.

```bash
# 1. Clone
git clone https://github.com/your-org/supply-watch-ai.git
cd supply-watch-ai

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET and MAPBOX_ACCESS_TOKEN

# 3. Build & start all services
npm run docker:up
# or: docker-compose up --build

# 4. Open the app
#   Frontend  →  http://localhost:5173
#   API       →  http://localhost:3001/api
#   ML Docs   →  http://localhost:8000/docs

# 5. Default admin credentials
#   Email:    admin@supplywatch.ai
#   Password: password123
```

To stop all services:
```bash
npm run docker:down
```

To wipe volumes and start fresh:
```bash
npm run docker:down:volumes
```

---

## Manual Dev Setup

Run each service locally without Docker (useful for rapid iteration).

### 1. Start infrastructure (Postgres + Redis only via Docker)

```bash
docker-compose up -d postgres redis
```

### 2. Backend

```bash
cd backend
npm install
cp ../.env.example .env   # adjust DB_HOST=localhost
npm run dev               # nodemon, port 3001
```

### 3. ML Service

```bash
cd ml-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
cp ../.env.example .env   # set VITE_API_URL=http://localhost:3001
npm run dev               # Vite, port 5173
```

### 5. Run everything concurrently (from root)

```bash
# From repo root
npm install               # installs concurrently
npm run dev:all           # starts backend + ml + frontend
```

---

## Environment Variables

Copy `.env.example` to `.env`. Key variables:

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment |
| `DATABASE_URL` | `postgresql://...` | Full Postgres connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `JWT_SECRET` | *(must set)* | Secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | `24h` | Token lifetime |
| `ML_SERVICE_URL` | `http://localhost:8000` | URL of the Python ML service |
| `MAPBOX_ACCESS_TOKEN` | *(must set)* | Mapbox public token for maps |
| `PREDICTION_INTERVAL_MS` | `900000` | How often to run predictions (15 min) |
| `DELAY_THRESHOLD_MINS` | `120` | Minutes over ETA to flag as delayed |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

---

## API Reference

### Authentication
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login, returns JWT |
| `POST` | `/api/auth/register` | Register new user |
| `GET` | `/api/auth/me` | Current user info |

### Shipments
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/shipments` | List shipments (filterable by status, carrier) |
| `GET` | `/api/shipments/:id` | Shipment detail + events |
| `POST` | `/api/shipments` | Create shipment |
| `PATCH` | `/api/shipments/:id` | Update shipment |
| `GET` | `/api/shipments/:id/predictions` | Latest ML predictions |

### Inventory
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/inventory` | All inventory items |
| `GET` | `/api/inventory/:skuId` | Single SKU across warehouses |
| `PATCH` | `/api/inventory/:id` | Update quantity/safety stock |

### Alerts
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/alerts` | List alerts (filter by acked, severity) |
| `PATCH` | `/api/alerts/:id/ack` | Acknowledge alert |
| `DELETE` | `/api/alerts/:id` | Delete alert (admin only) |

### Replan Recommendations
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/replan` | List recommendations |
| `PATCH` | `/api/replan/:id/approve` | Approve recommendation |
| `PATCH` | `/api/replan/:id/reject` | Reject recommendation |

### ML Service
| Method | Path | Description |
|---|---|---|
| `POST` | `/predict` | Single shipment prediction |
| `POST` | `/batch` | Batch predictions |
| `GET` | `/health` | Health check + model version |

---

## Folder Structure

```
supply-watch-ai/
├── docker-compose.yml          # Orchestrates all services
├── .env.example                # Template — copy to .env
├── package.json                # Root scripts (concurrently, docker helpers)
├── README.md                   # You are here
│
├── backend/                    # Node.js / Express API
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.ts            # Entry point
│       ├── config/             # env, db, redis, socket
│       ├── routes/             # auth, shipments, inventory, alerts, replan
│       ├── services/           # Business logic
│       ├── middleware/         # auth guard, error handler, logger
│       ├── jobs/               # Bull queue workers
│       └── db/
│           ├── migrations/
│           │   └── 001_schema.sql   # Full DDL
│           └── seeds/
│               └── seed.sql         # Dev seed data
│
├── frontend/                   # React 18 + Vite + TypeScript
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/         # Reusable UI components
│       ├── pages/              # Route-level pages
│       ├── hooks/              # Custom React hooks
│       ├── services/           # API client (axios)
│       └── store/              # Zustand global state
│
└── ml-service/                 # Python FastAPI + XGBoost
    ├── Dockerfile
    ├── requirements.txt
    └── app/
        ├── main.py             # FastAPI entry point
        ├── models/             # Trained model artifacts
        ├── features/           # Feature engineering
        └── routers/            # /predict, /batch, /health
```

---

## Contributing

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a **Pull Request**

### Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — no functionality change
- `test:` — adding/updating tests
- `chore:` — tooling, CI, dependencies

### Code Style
- Backend: ESLint + Prettier (`.eslintrc.js` in `/backend`)
- Frontend: ESLint + Prettier (`.eslintrc.js` in `/frontend`)
- Python: `black` + `ruff` (configured in `pyproject.toml`)

---

## License

MIT © SupplyWatch AI Team
