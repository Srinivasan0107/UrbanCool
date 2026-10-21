# UrbanCool — Urban Heat Island Monitoring & Cooling Advisory Platform

A full-stack MERN (MongoDB, Express, React, Node.js) application that monitors urban heat islands across Tamil Nadu and provides actionable cooling interventions.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/Srinivasan0107/UrbanCool.git
   cd UrbanCool
   ```

2. **Install all dependencies** (root, server, and client)
   ```bash
   npm install
   npm install --workspace=server
   npm install --workspace=client
   ```

3. **Configure environment variables**
   ```bash
   # Server
   cp server/.env.example server/.env
   # Edit server/.env with your MongoDB URI and JWT secret

   # Client
   cp client/.env.example client/.env
   # Edit client/.env with your API URL
   ```

4. **Seed the database** (populates Tamil Nadu hotspots, sensors, weather stations)
   ```bash
   npm run seed --workspace=server
   ```

5. **Run both servers**

   Terminal 1 — Backend (port 5000):
   ```bash
   cd server && npm run dev
   ```

   Terminal 2 — Frontend (port 5173):
   ```bash
   cd client && npm run dev
   ```

6. **Open the app**
   - URL: http://localhost:5173
   - Demo login: `planner@urbancool.dev` / `planner123`
   - Citizen login: `citizen@urbancool.dev` / `citizen123`

## 🗺️ Features

- **Live GIS Heatmap** — ESRI basemap with accurate Tamil Nadu landmark thermal markings (no rectangular boxes)
- **Radiant Thermal Halos** — Concentric dissipation rings around 16 real urban hotspots
- **Organic Plume Contours** — 28-point smooth thermal boundary contours
- **Dark / Light Mode** — Full adaptive theme support
- **Incident Command Panel** — Real-time alert feed for planners
- **Cooling Corridors Tracker** — Monitor tree planting, cool roofs, water bodies
- **NDVI Canopy Layer** — Green cover satellite overlay
- **Notification Alerts** — Critical heat advisories with recommended actions
- **Profile Manager** — User profile with department and notification preferences

## 🏙️ Tamil Nadu Datasets

Real-world landmark hotspots across:
- **Ward-1 (Chennai Central):** Puratchi Thalaivar Concourse, George Town Harbor, Broadway Bus Terminus
- **Ward-2 (T. Nagar):** Ranganathan Street, Pondy Bazaar, Kodambakkam Overbridge
- **Ward-3 (Guindy):** SIDCO Industrial Estate, Kathipara Junction, Ekkatuthangal Foundry Belt
- **Ward-4 (Sholinganallur / OMR):** IT Corridor Tech Boulevard, SIPCOT Cyber Park, Perungudi Expressway
- **Ward-5 (Coimbatore):** Gandhipuram Terminal, Peelamedu Avinashi Road, Ukkadam Market

## 🏗️ Architecture

```
UrbanCool/
├── client/          # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/   # HeatMap, AlertPanel, Navbar, Sidebar
│   │   ├── context/      # AuthContext, ThemeContext
│   │   ├── pages/        # PlannerDashboard, CoolingTracker, CitizenView
│   │   └── api/          # Axios client with JWT interceptor
├── server/          # Express + Mongoose API
│   ├── src/
│   │   ├── models/       # User, SensorReading, HeatHotspot, Alert, etc.
│   │   ├── routes/       # auth, hotspots, sensors, alerts, cooling
│   │   └── middleware/   # auth, validate, errorHandler
│   └── seed.js           # Seed script with real Tamil Nadu data
└── package.json     # Monorepo workspace config
```

## 🧪 Tests

```bash
# Frontend (Vitest)
npm test --workspace=client

# Backend (Jest + Supertest)
npm test --workspace=server
```

## 📄 License

MIT
