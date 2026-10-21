# UrbanCool — Agent Rules

## Project
UrbanCool is a centralized Urban Heat Monitoring & Cooling Advisory Platform.
It fuses IoT sensor readings, satellite land-surface-temperature (LST) and
NDVI green-cover data, and municipal weather stations into one dashboard for
city planners, with predictive heat-hotspot alerts and citizen-facing advisories.

This repo is a prototype/demo build for an academic project — favor working,
demo-able features over production hardening, but keep the code clean enough
to extend.

## Tech stack (do not deviate without asking)
- Backend: Node.js + Express, MongoDB via Mongoose
- Frontend: React (Vite), Tailwind CSS, react-leaflet for the hotspot map,
  Recharts for time-series/trend charts
- Auth: JWT, two roles — `planner` and `citizen`
- Monorepo layout: `/server` (API) and `/client` (React app), root-level
  `package.json` with workspaces; do not scaffold with CRA

## Figma → code workflow
- Design lives in Figma; before building any screen, pull its frame
  (via the Figma link or exported PNG/JSON I give you) and read off exact
  spacing, type scale, and color values — don't eyeball them.
- Translate Figma color/text/spacing styles into `tailwind.config.js` theme
  tokens once, up front, and reuse those tokens — never hardcode hex values
  or px sizes inside components after that.
- Match layout structure (grid/flex, breakpoints) from the frame; if a frame
  has no responsive spec, default to a sensible mobile-first breakpoint set
  and say so rather than guessing silently.
- If a Figma frame and this file disagree on a data field or flow, stop and
  ask — don't invent product behavior to reconcile them.

## Data model (seed these, don't wait for real hardware)
- `SensorReading` — sensorId, ward, lat/lng, temperature, humidity, timestamp
- `WeatherStation` — stationId, location, temperature, humidity, windSpeed, timestamp
- `HeatHotspot` — geometry (GeoJSON polygon/point), intensity, wardId, detectedAt, status
- `GreenCoverZone` — wardId, geometry, ndviValue, changeFromBaseline, recordedAt
- `CoolingInitiative` — type (tree plantation / cool roof / reflective pavement / water body),
  location, startDate, beforeTemp, afterTemp, status
- `Alert` — hotspotId, severity, recommendedAction, targetRole, createdAt
- `User` — name, email, passwordHash, role (`planner` | `citizen`), ward

There is no real sensor/satellite feed for this prototype — write a seed
script (`server/seed.js`) that generates realistic mock data across a handful
of wards, and an optional cron-like interval that appends new readings so the
dashboard feels live in a demo.

## API conventions
- REST under `/api/v1/...`, resource-based routes (`/api/v1/hotspots`,
  `/api/v1/cooling-initiatives`, etc.)
- Centralized error-handling middleware; every route wrapped so errors reach
  it (no unhandled promise rejections)
- Validate request bodies (e.g. with `zod` or `express-validator`) before
  they touch Mongoose
- Return consistent JSON shape: `{ success, data, error }`

## Code style
- Functional React components + hooks only, no class components
- Async/await everywhere, no raw `.then()` chains
- ESLint + Prettier, run before considering a task done
- Small, single-purpose components; put map/chart logic in dedicated
  components (`HeatMap.jsx`, `TrendChart.jsx`), not inline in pages

## Testing
- Backend: Jest + Supertest, at least one test per route (happy path + one
  failure case)
- Frontend: React Testing Library for components with real logic (skip
  trivial presentational ones)

## Safety / guardrails
- Never commit `.env` or real API keys; use `.env.example` with placeholder
  values
- Don't run destructive Mongo operations (`dropDatabase`, bulk deletes)
  without asking first
- Ask before adding a new major dependency not listed above

## Git
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- One feature per branch/PR; keep PRs scoped to a single screen or endpoint
  group where possible

## Working style
- Before writing code for a new screen or endpoint group, post a short plan
  (files you'll touch, data flow) and proceed — no need to wait for approval
  on routine steps, but flag anything that deviates from this file.

## Delegation
- New/changed Figma spec → delegate to `figma-sync` first
- API/model/route work → delegate to `backend-builder`
- Screen/component work → delegate to `frontend-builder`, after tokens exist
- After backend-builder or frontend-builder finishes → delegate to `qa-tester`
