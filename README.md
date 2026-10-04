# DefenceLogix AI

Predictive logistics and forward supply-chain decision-support prototype.

---

## Problem Statement

Predictive logistics and forward supply-chain decision-support prototype designed for forward-deployed military detachments and extreme operating terrain (high-altitude Himalayan passes, isolated valleys, and desert sectors).

In forward deployments, volatile weather conditions, pass closures, and storage vault temperature/pressure fluctuations can trigger sudden stockouts before traditional replenishment systems can react. Forward logistics decision-makers need a unified, explainable decision-support system that anticipates future demand, monitors multi-factor environmental and storage risks, and recommends timely, prioritized replenishments.

---

## Solution

DefenceLogix AI combines multi-source operational factors into a transparent, end-to-end decision-support pipeline:

- **Inventory**: Real-time stock-on-hand tracking across forward passes, intermodal hubs, and central strategic depots.
- **Historical Consumption**: Time-series consumption velocity tracking and burn rates across standard and surge operating conditions.
- **Demand Forecasting**: 7-day and 30-day forward demand projections incorporating operational tempo multipliers and seasonal coefficients.
- **Weather**: Live meteorological telemetry (ambient temperature, precipitation sum, wind speeds) along transit corridors and pass crossings.
- **GIS**: Tactical map overlay displaying node coordinates, road connections, altitude tiers, and active convoy vectors.
- **Terrain**: High-altitude pass accessibility assessments, slope classifications, and road transit risk multipliers.
- **IoT Simulation**: Edge telemetry for storage vaults, cryo bunkers, fuel bladder pressure, and sensor battery levels with simulated threshold alerts.
- **Risk Analysis**: Explainable composite risk scoring across 5 weighted operational dimensions (Inventory 35%, Weather 20%, Terrain 15%, IoT 15%, Route 15%).
- **Anticipated Requirements**: Deterministic requirement calculation:
  $$\text{Required Quantity} = \max(0, \text{Forecast Demand} + \text{Safety Stock} - \text{Projected Stock})$$
- **Alerts**: Multi-level early warning dispatch (`CRITICAL`, `HIGH`, `WARNING`, `INFO`) with actionable military command recommendations.

---

## Architecture

```text
Frontend
↓
API
↓
Forecasting / Risk Engine
↓
Data
↓
Dashboard
```

### Component Flow
1. **Frontend**: Interactive React 19 Single Page Application rendered via Vite with Tailwind CSS v4 and Leaflet tactical mapping.
2. **API**: Express REST Router running as a local dev server (`server.ts`) or serverless function on Vercel (`api/index.ts`).
3. **Forecasting / Risk Engine**: Explainable time-series demand models (Holt-Winters exponential smoothing, moving averages, tempo adjustments) and multi-factor risk evaluator.
4. **Data**: In-memory operational data store with live public weather telemetry from Open-Meteo REST API.
5. **Dashboard**: Consolidated command center displaying operational metrics, inventory ledgers, GIS nodes, transport dispatch, and IoT sensor streams.

---

## Technology Stack

Only technologies actually present and implemented in the project:

- **Frontend Core**: React 19 (`react`, `react-dom`), TypeScript, Vite
- **Styling & UI**: Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss`), Lucide React icons (`lucide-react`), Motion (`motion`)
- **Mapping & GIS**: Leaflet (`leaflet`, `@types/leaflet`) with OpenStreetMap and CartoDB Dark Matter tiles
- **Backend / Serverless**: Node.js, Express (`express`, `@types/express`), TypeScript Execution (`tsx`)
- **Serverless Adapter**: Vercel Serverless Function entry point (`api/index.ts`, `vercel.json`)
- **AI Integration (Optional)**: Google Gemini API via official TypeScript SDK (`@google/genai`)
- **Security & Utilities**: Built-in Node.js crypto (HMAC-SHA256 tokens), `dotenv` for environment management

---

## Data Sources

### PUBLIC DATA
- **Open-Meteo**: Live weather telemetry (ambient temperature, humidity, precipitation, wind speeds) via open REST endpoints.
- **OpenStreetMap / GIS**: Public cartographic tile layers and geographical coordinate references.

### SYNTHETIC DATA
- **Inventory**: Synthetic military logistics items (ammunition crates, cold-weather clothing, rations, medical kits, fuel).
- **Consumption**: Simulated historical daily burn rates and operational tempo logs.
- **Logistics**: Synthetic forward supply nodes, central depots, and intermodal transport hubs.
- **IoT**: Simulated telemetry feeds (bunker temperature, humidity, fuel bladder pressure, battery levels).
- **Demo Operational Scenarios**: Synthetic crisis scenarios (Blizzard Event, Sandstorm Warning, Fuel Anomaly, Demand Surge) for demonstration.

---

## Important Disclaimer

> "This is a technology demonstration prototype using synthetic logistics data and non-sensitive public data. It does not use or represent real Indian Army operational data."

---

## Local Setup

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### 2. Installation
```bash
npm install
```

### 3. Environment Variable Setup
Copy the environment template and configure secrets:
```bash
cp .env.example .env
```
Populate `.env` with a secure random string for JWT signing:
```env
JWT_SECRET=your-random-32-character-secret-key-here
PORT=3000
# Optional: GEMINI_API_KEY=your-gemini-api-key
```

### 4. Run Development Server
```bash
npm run dev
```
The application will start with full-stack capability (Express + Vite middlewares) at `http://localhost:3000`.

---

## Production Build

To compile the TypeScript code and generate optimized production static assets:
```bash
npm run build
```
This runs `vite build` and generates the production bundle in the `dist/` directory.

To check TypeScript types without emitting files:
```bash
npm run lint
```

---

## Vercel Deployment

This repository is ready for immediate deployment on Vercel without requiring a permanently running server process:

1. **Import Repository**:
   - Push your code to GitHub / GitLab / Bitbucket.
   - Import the project into your Vercel Dashboard.

2. **Build Settings**:
   - **Framework Preset**: Vite (automatically detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables**:
   In Vercel Project Settings > Environment Variables, add:
   - `JWT_SECRET`: A secure, random 32+ character string (Required).
   - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key if enabling LogiAI live tactical LLM chat.

4. **Architecture on Vercel**:
   - Static frontend assets from `dist/` are served globally by Vercel's Edge CDN.
   - Requests to `/api/*` are handled by `api/index.ts` through `vercel.json` rewrites.
   - SPA route navigation is preserved through client-side routing fallback in `vercel.json`.

---

## Known Limitations

- **Synthetic Data**: All military stock numbers, personnel names, depot coordinates, and vehicle IDs are entirely synthetic and for demonstration only.
- **Simulated IoT**: Storage bunker telemetry, bladder pressure, and sensor battery levels are generated in-memory; no physical hardware sensors or LoRaWAN gateways are connected.
- **Explainable Prototype Forecasting Engine**: The demand forecasting and stockout risk calculations use deterministic time-series statistical models (Holt-Winters, moving averages, tempo multipliers) with mathematical formula transparency rather than deep learning server-side weights.
- **Database Persistence**: State mutations (adding stock, approving recommendations, updating vehicle status) are held in memory during the serverless function lifecycle. Permanent multi-tenant database persistence is not implemented in this prototype.
