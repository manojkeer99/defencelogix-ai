import React from 'react';
import { 
  Shield, 
  ArrowRight, 
  TrendingUp, 
  Map, 
  Package, 
  Cpu, 
  Truck, 
  Radio, 
  CheckCircle2, 
  Layers, 
  Terminal,
  Server,
  Zap,
  ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  setCurrentTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setCurrentTab }) => {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 border border-slate-200 dark:border-cyan-500/30 p-8 lg:p-14 text-center shadow-sm">
        {/* Glow background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>Operational Decision Support • Forward Supply Chain Network</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Predictive Logistics <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500">Intelligence</span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto font-sans leading-relaxed">
            AI-powered demand forecasting, inventory intelligence, GIS-based logistics planning and real-time supply-chain visibility across geographically distributed forward logistics locations.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-sm font-bold shadow-md shadow-cyan-950/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentTab('gis')}
              className="px-6 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-300 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-mono text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Map className="w-4 h-4" />
              <span>Interactive GIS Map</span>
            </button>

            <button
              onClick={() => setCurrentTab('architecture')}
              className="px-6 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Layers className="w-4 h-4" />
              <span>System Architecture</span>
            </button>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-slate-200 dark:border-slate-800/80 max-w-3xl mx-auto text-left font-mono">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Forecast Precision</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">94.2% Fit</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">MAPE 5.4%</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Forward Nodes</span>
              <span className="text-xl font-bold text-cyan-700 dark:text-cyan-400">10 Locations</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">High Altitude & Desert</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Transport Fleet</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">20 Vehicles</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Heavy 6x6 & UAVs</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Service Level</span>
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">99.0% ROP</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Z-Score 2.33 Buffer</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Statement */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="hud-panel p-6 rounded-2xl space-y-3 border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-slate-950 shadow-xs">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>Operational Logistics Challenge</span>
          </div>
          <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
            The Forward Supply Chain Dilemma
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
            Forward defence outposts, isolated high-altitude passes, and remote border logistics nodes face severe weather extremes, unpredictable consumption surges, road closures, and prolonged supply replenishment lead times. Traditional static spreadsheets fail to anticipate dynamic burn rates or optimize transport fleet deployment.
          </p>
        </div>

        <div className="hud-panel p-6 rounded-2xl space-y-3 border border-cyan-200 dark:border-cyan-500/30 bg-white dark:bg-slate-950 shadow-xs">
          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>The DefenceLogix Solution</span>
          </div>
          <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
            Predictive Decision Support Platform
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
            DefenceLogix AI fuses multi-algorithm time-series forecasting (Random Forest, Gradient Boosting, Holt-Winters, LSTM), GIS route topological awareness, simulated IoT sensor telemetry, and multi-objective linear replenishment solvers into an integrated military command center dashboard.
          </p>
        </div>
      </section>

      {/* Key Feature Pillars */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white tracking-wide">
            Core Intelligence Capabilities
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Modular decision-support subsystems designed for defence logistics officers and commanders
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="hud-panel p-5 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
            <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 w-fit">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
              AI Demand Forecasting
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
              7, 14, and 30-day projection horizons incorporating historical burn rates, weather categories (extreme cold, sandstorms), and operational tempo multipliers with confidence intervals.
            </p>
            <button
              onClick={() => setCurrentTab('forecast')}
              className="text-xs font-mono text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
            >
              <span>Explore Forecasting Suite</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hud-panel p-5 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 w-fit">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
              Predictive Inventory Management
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
              Dynamic Reorder Point (ROP = d × L + Safety Stock) and 0-100% stockout risk scores across Ammunition, POL Fuel, Rations, and Extreme Cold mountaineering gear.
            </p>
            <button
              onClick={() => setCurrentTab('inventory')}
              className="text-xs font-mono text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
            >
              <span>View Inventory Ledgers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hud-panel p-5 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 w-fit">
              <Map className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
              GIS Sector Logistics Grid
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
              Leaflet-powered tactical map with Dark Matter tiles, 10 synthetic logistics nodes, delivery corridors, pass weather alerts, and interactive node drawers.
            </p>
            <button
              onClick={() => setCurrentTab('gis')}
              className="text-xs font-mono text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
            >
              <span>Open GIS Operations Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Technology Stack Grid */}
      <section className="hud-panel p-6 rounded-2xl space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
        <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          Technical Stack & Security Architecture
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase">Frontend</span>
            <div className="text-sm font-bold text-cyan-700 dark:text-cyan-300 mt-1">React 19 + TypeScript</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Tailwind CSS + Command HUD</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase">Backend Server</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">Node.js + Express</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">REST APIs + HMAC-SHA256 JWT</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase">AI / ML Engine</span>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">Time-Series & Gemini</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Random Forest, SES, Gemini 3.8</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase">GIS Mapping</span>
            <div className="text-sm font-bold text-cyan-700 dark:text-cyan-300 mt-1">Leaflet GIS Engine</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Vector Layers & Polylines</p>
          </div>
        </div>
      </section>

      {/* Call to action footer */}
      <section className="text-center p-8 rounded-2xl bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-cyan-950/40 dark:to-slate-900 border border-slate-200 dark:border-cyan-500/30 space-y-4 shadow-xs">
        <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
          Ready to Inspect Operational Readiness?
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono max-w-lg mx-auto">
          Demo credentials loaded for all 6 roles (Administrator, Officer, Inventory, Transport, Analyst, Viewer).
        </p>
        <button
          onClick={() => setCurrentTab('dashboard')}
          className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          Launch Command Center
        </button>
      </section>
    </div>
  );
};
