import React, { useState } from 'react';
import { 
  Network, 
  Database, 
  Cpu, 
  Map, 
  ShieldCheck, 
  Layers, 
  Radio, 
  Truck, 
  TrendingUp, 
  Workflow, 
  ArrowDown, 
  ArrowRight, 
  CheckCircle2, 
  Server, 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  Code2, 
  Lock, 
  CloudSnow, 
  Activity, 
  Zap, 
  HelpCircle, 
  FileText 
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'brief' | 'tiers' | 'flow'>('brief');
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);

  const tiers = [
    {
      id: 1,
      title: 'Tier 1: Multi-Modal Data Sources',
      icon: Database,
      badge: 'Input Streams',
      color: 'border-cyan-200 dark:border-cyan-500/40 bg-white dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400',
      description: 'Gathers operational telemetry from across the defence logistics spectrum:',
      components: [
        'Historical Demand Logs (90-day time-series burn rates)',
        'Sector Inventory Ledgers (50+ Ammunition, Fuel, Rations SKUs)',
        'Simulated IoT Telemetry (Cryo temps, fuel bladder pressure, vibration)',
        'Transport Fleet Telemetry (20 Heavy Tatra trucks, Snowcats, UAVs)',
        'Terrain & Meteorological Indices (Blizzards, high passes, sandstorms)'
      ]
    },
    {
      id: 2,
      title: 'Tier 2: Tactical Data Integration Layer',
      icon: Network,
      badge: 'Ingestion & ETL',
      color: 'border-blue-200 dark:border-blue-500/40 bg-white dark:bg-blue-950/20 text-blue-700 dark:text-blue-400',
      description: 'Normalizes, sanitizes, and authenticates high-frequency inputs:',
      components: [
        'Cryptographic Token Verifier (HMAC-SHA256 JWT security)',
        'Schema Validation & Anomaly Filters (Z-score bounds checking)',
        'Time-series Alignment & Resampling (Daily/hourly rolling bins)',
        'Role-Based Authorization Gateway (6 Discrete clearance roles)'
      ]
    },
    {
      id: 3,
      title: 'Tier 3: Stream & Batch Data Processing',
      icon: Server,
      badge: 'Data Processing',
      color: 'border-indigo-200 dark:border-indigo-500/40 bg-white dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400',
      description: 'Transforms raw operational measurements into ML-ready feature matrices:',
      components: [
        'Rolling Lag Statistics (MA-7, MA-14, Exponential Moving Variance)',
        'Terrain & Altitude Elasticity Coefficients (2,200m to 4,800m ASL)',
        'Operational Readiness Multipliers (Routine 1.0x to Surge 1.85x)',
        'Lead Time Volatility Standard Deviations (σ_d)'
      ]
    },
    {
      id: 4,
      title: 'Tier 4: Forecasting & Demand Estimation Engine',
      icon: Cpu,
      badge: 'Analytical Modeling',
      color: 'border-purple-200 dark:border-purple-500/40 bg-white dark:bg-purple-950/20 text-purple-700 dark:text-purple-400',
      description: 'Deterministic and statistical demand projection horizon:',
      components: [
        '7-Day Forward Horizon Trajectory Modeling',
        'Holt-Winters Triple Exponential Smoothing (Level, trend & seasonality)',
        'Moving Average Baseline with Lead-Time Volatility Variance',
        'Weather Impact Multipliers (+15% sub-zero and pass blockage buffer)',
        '95% Confidence Interval Band Corridor calculation (±1.96 standard deviation)'
      ]
    },
    {
      id: 5,
      title: 'Tier 5: Predictive Inventory & Optimization Solver',
      icon: Workflow,
      badge: 'Decision Algorithms',
      color: 'border-amber-200 dark:border-amber-500/40 bg-white dark:bg-amber-950/20 text-amber-700 dark:text-amber-400',
      description: 'Calculates actionable supply interventions and convoy routes:',
      components: [
        'Deterministic Safety Stock: Safety Stock = Z × σ_d × √L',
        'Anticipated Requirement: max(0, Forecast Demand + Safety Stock - Projected Stock)',
        'Explainable Multi-Factor Risk Scoring (35% Inv + 20% Weather + 15% Terrain + 15% IoT + 15% Route)',
        'Action Classifier: REPLENISH NOW, REPLENISH SOON, MONITOR, NO ACTION',
        'Natural Language Rationale Formulator (Transparent reasoning generation)'
      ]
    },
    {
      id: 6,
      title: 'Tier 6: GIS Topology & Operational Dashboard',
      icon: Map,
      badge: 'Visualization UI',
      color: 'border-emerald-200 dark:border-emerald-500/40 bg-white dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400',
      description: 'Military operations center (MOC) tactical interface:',
      components: [
        'Interactive Leaflet GIS Map (CartoDB Dark Matter tiles & OpenStreetMap)',
        'Route Corridors with 8 Key Parameters (Distance, Time, Status, Accessibility, Weather, Risk)',
        'Location-Level Tactical Telemetry (Current stock, forecast, safety stock, IoT health)',
        'Early Warning Alert Center (Multi-severity broadcast with acknowledgment)'
      ]
    },
    {
      id: 7,
      title: 'Tier 7: Command Decision Support & LogiAI',
      icon: ShieldCheck,
      badge: 'Command Action',
      color: 'border-cyan-300 dark:border-cyan-400 bg-white dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300',
      description: 'Final mission execution and intelligence synthesis:',
      components: [
        'LogiAI Tactical Assistant (Powered by server-side Gemini via @google/genai)',
        'Single-Click Convoy Movement Logging (Transaction audit record)',
        'Automated Mission Logistics Reports (JSON/PDF/CSV formatted exports)',
        'Complete Audit Trail (Immutable operational activity records)'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-slate-900 dark:text-white">
              SOLUTION ARCHITECTURE & TECHNICAL BLUEPRINT
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Predictive Decision Support Architecture for Forward Defense Supply Chains
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('brief')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'brief' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Executive Solution Brief
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'tiers' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            7-Tier Architecture
          </button>
          <button
            onClick={() => setActiveTab('flow')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'flow' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            End-To-End Decision Flow
          </button>
        </div>
      </div>

      {/* Tab 1: Executive Solution Brief */}
      {activeTab === 'brief' && (
        <div className="space-y-5">
          {/* Section 1: Problem & Solution Hero Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* The Problem */}
            <div className="hud-panel p-5 rounded-xl border border-rose-200 dark:border-rose-500/30 space-y-3 bg-white dark:bg-gradient-to-b dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-950 shadow-xs">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h2 className="font-heading text-base font-bold uppercase tracking-wider">
                  The Operational Problem
                </h2>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
                Forward military deployments in extreme northern mountain passes and isolated sectors face compounded logistical risks:
              </p>
              <ul className="space-y-2 text-xs font-mono text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0">•</span>
                  <span><strong>Harsh Environmental Hazards:</strong> Sub-zero blizzards (-24°C) cause seasonal mountain pass road closures and ground convoy immobilization.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0">•</span>
                  <span><strong>Sub-Zero Storage Deterioration:</strong> Thermal and pressure anomalies in forward fuel bladders and ammunition bunkers go undetected until critical failure.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0">•</span>
                  <span><strong>Siloed Intelligence:</strong> Inventory systems, weather stations, and transport convoys operate on disconnected platforms, creating surprise stockouts.</span>
                </li>
              </ul>
            </div>

            {/* The Solution */}
            <div className="hud-panel p-5 rounded-xl border border-cyan-200 dark:border-cyan-500/30 space-y-3 bg-white dark:bg-gradient-to-b dark:from-cyan-950/20 dark:via-slate-900 dark:to-slate-950 shadow-xs">
              <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
                <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h2 className="font-heading text-base font-bold uppercase tracking-wider">
                  The DefenceLogix Solution
                </h2>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
                An integrated, explainable predictive decision-support system connecting real-time conditions with automated supply chain forecasting:
              </p>
              <ul className="space-y-2 text-xs font-mono text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold shrink-0">•</span>
                  <span><strong>Unified Data Flow:</strong> Merges historical consumption, live public Open-Meteo weather, GIS terrain elevation, and IoT storage sensors into one pipeline.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold shrink-0">•</span>
                  <span><strong>Explainable AI/Optimization:</strong> Transparent multi-factor risk scoring (0-100) and non-negative anticipated requirement math with explicit "Why?" breakdowns.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold shrink-0">•</span>
                  <span><strong>Actionable Replenishment:</strong> Automatic generation of proactive recommendations (REPLENISH NOW, REPLENISH SOON, MONITOR) before stockouts occur.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: How It Works & Technologies Used */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* How It Works */}
            <div className="hud-panel p-5 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Workflow className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
                  How It Works (System Workflow)
                </h3>
              </div>
              <div className="space-y-2 text-xs font-mono text-slate-700 dark:text-slate-300">
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <strong className="text-cyan-700 dark:text-cyan-400 block mb-0.5">1. Multi-Modal Ingestion:</strong>
                  Continuous telemetry feeds from forward depots, live weather APIs, and storage edge sensors.
                </div>
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <strong className="text-cyan-700 dark:text-cyan-400 block mb-0.5">2. Demand Forecasting:</strong>
                  Applies historical burn rates and environmental tempo modifiers to project 7-day future consumption.
                </div>
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <strong className="text-cyan-700 dark:text-cyan-400 block mb-0.5">3. Multi-Factor Risk Scoring:</strong>
                  Weighs Inventory (35%), Weather (20%), Terrain (15%), IoT (15%), and Route Status (15%) into a composite score.
                </div>
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <strong className="text-cyan-700 dark:text-cyan-400 block mb-0.5">4. Anticipated Requirement & Recommendation:</strong>
                  Calculates exact replenishment volumes and generates command-level action directives.
                </div>
              </div>
            </div>

            {/* Strictly Truthful Technology Stack */}
            <div className="hud-panel p-5 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Code2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
                  Implemented Technology Stack
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Only technologies strictly and truthfully implemented in this codebase:
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-800 dark:text-slate-300 font-bold">React 19 & TypeScript</span>
                  <span className="text-cyan-700 dark:text-cyan-400 text-[10px]">Frontend Architecture</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-800 dark:text-slate-300 font-bold">Node.js & Express (TypeScript)</span>
                  <span className="text-cyan-700 dark:text-cyan-400 text-[10px]">Backend Proxy & State Engine</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-800 dark:text-slate-300 font-bold">Deterministic Forecasting Engine</span>
                  <span className="text-cyan-700 dark:text-cyan-400 text-[10px]">Time-Series & Safety Stock Math</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-800 dark:text-slate-300 font-bold">Leaflet & CartoDB / OpenStreetMap</span>
                  <span className="text-cyan-700 dark:text-cyan-400 text-[10px]">Tactical GIS Map & Polyline Topology</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-800 dark:text-slate-300 font-bold">Open-Meteo REST API</span>
                  <span className="text-cyan-700 dark:text-cyan-400 text-[10px]">Real-Time Public Weather Telemetry</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-800 dark:text-slate-300 font-bold">IoT Sensor Edge Simulator</span>
                  <span className="text-cyan-700 dark:text-cyan-400 text-[10px]">Synthetic Storage Vault Anomaly Engine</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-800 dark:text-slate-300 font-bold">Google Gemini AI (@google/genai)</span>
                  <span className="text-cyan-700 dark:text-cyan-400 text-[10px]">LogiAI Tactical Query Assistant</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Data Sources, Benefits & Limitations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Data Sources Breakdown */}
            <div className="hud-panel p-4 rounded-xl space-y-2 text-xs font-mono border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
              <span className="text-cyan-700 dark:text-cyan-400 font-bold uppercase block text-[11px]">
                Data Sources & Transparency
              </span>
              <div className="space-y-2">
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30">
                  <strong className="text-emerald-700 dark:text-emerald-400 text-[10px] uppercase block font-bold">Public Real-Time Data:</strong>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                    • Open-Meteo Weather API (Live ambient temperature, precipitation, wind speed, weather conditions)
                    <br />• OpenStreetMap & CartoDB Dark Tiles (Basemap tiles)
                  </p>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-cyan-200 dark:border-cyan-500/30">
                  <strong className="text-cyan-800 dark:text-cyan-400 text-[10px] uppercase block font-bold">Synthetic Demonstration Data:</strong>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                    • 10 Demo forward bases & supply depots
                    <br />• 50+ Synthetic inventory items & consumption logs
                    <br />• Demo road corridors & simulated IoT vault sensors
                  </p>
                </div>
              </div>
            </div>

            {/* Key Benefits */}
            <div className="hud-panel p-4 rounded-xl space-y-2 text-xs font-mono border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase block text-[11px]">
                Operational Benefits
              </span>
              <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Unexpected Stockouts:</strong> Lead-time aware dynamic safety stock guarantees 99% critical service level buffer.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Early Weather Warning:</strong> Identifies high-risk pass closures up to 7 days before convoy departure.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Edge Storage Protection:</strong> Immediate alarm triggers on sub-zero fuel freeze or cryo bunker pressure drops.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Full Explainability:</strong> No black-box claims; commanders see exact formula calculations.</span>
                </li>
              </ul>
            </div>

            {/* Prototype Limitations */}
            <div className="hud-panel p-4 rounded-xl space-y-2 text-xs font-mono border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
              <span className="text-amber-700 dark:text-amber-400 font-bold uppercase block text-[11px]">
                Prototype Limitations
              </span>
              <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Synthetic Demonstration Prototype:</strong> Built strictly for decision support evaluation and demonstration.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Not Connected to Military Networks:</strong> Does not interface with real operational, classified, or tactical networks.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Simulated Routes:</strong> Demo transit lines represent synthetic evaluation vectors, not real military movement routes.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 7-Tier Architecture */}
      {activeTab === 'tiers' && (
        <div className="space-y-3">
          {tiers.map((tier, idx) => {
            const Icon = tier.icon;
            const isSelected = selectedLayer === tier.id;

            return (
              <React.Fragment key={tier.id}>
                <div 
                  onClick={() => setSelectedLayer(isSelected ? null : tier.id)}
                  className={`hud-panel p-4 rounded-xl cursor-pointer transition-all border ${tier.color} shadow-xs hover:shadow-sm`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                            {tier.title}
                          </h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            {tier.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                          {tier.description}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono text-cyan-700 dark:text-cyan-400 shrink-0 self-end sm:self-center font-bold">
                      {isSelected ? 'Collapse [-]' : 'Expand Details [+]'}
                    </span>
                  </div>

                  {/* Expanded Components Details */}
                  {isSelected && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                      <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block">
                        Architectural Sub-Components & Algorithms:
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                        {tier.components.map((comp, cIdx) => (
                          <div key={cIdx} className="flex items-start gap-2 p-2 rounded bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                            <span className="text-slate-800 dark:text-slate-200">{comp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Connecting Down Arrow between tiers */}
                {idx < tiers.length - 1 && (
                  <div className="flex justify-center -my-1 text-slate-400 dark:text-slate-600">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Tab 3: End-To-End Decision Flow Diagram */}
      {activeTab === 'flow' && (
        <div className="hud-panel p-6 rounded-xl border border-slate-200 dark:border-cyan-500/30 space-y-5 bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Workflow className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                End-To-End Predictive Logistics Decision Pipeline
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Logical data transformation and decision synthesis workflow (from raw telemetry to command dispatch)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40">
              9-Stage Pipeline
            </span>
          </div>

          {/* Stepper Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 relative shadow-xs">
              <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-bold uppercase">Stage 01</span>
              <h4 className="text-slate-900 dark:text-white font-bold text-sm">Multi-Modal Input Data</h4>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Historical consumption logs, inventory ledgers, lead time standards, live Open-Meteo weather, and IoT edge sensors.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 relative shadow-xs">
              <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-bold uppercase">Stage 02</span>
              <h4 className="text-slate-900 dark:text-white font-bold text-sm">Inventory & Consumption</h4>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Daily burn velocities, stock-on-hand, lead-time standard deviation, and dynamic safety stock buffer calculation.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-cyan-50/60 dark:bg-slate-950 border border-cyan-200 dark:border-cyan-500/30 dark:bg-cyan-950/20 space-y-1.5 relative shadow-xs">
              <span className="text-[10px] text-cyan-800 dark:text-cyan-300 font-bold uppercase">Stage 03</span>
              <h4 className="text-slate-900 dark:text-white font-bold text-sm">Demand Forecast Engine</h4>
              <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                7-day horizon trajectory factoring historical trends, seasonal indices, and operational readiness tempos.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 relative shadow-xs">
              <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-bold uppercase">Stage 04</span>
              <h4 className="text-slate-900 dark:text-white font-bold text-sm">Projected Inventory</h4>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Deducts 7-day forecast from stock-on-hand to simulate exhaustion date and zero-stock crossover.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 relative shadow-xs">
              <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-bold uppercase">Stage 05</span>
              <h4 className="text-slate-900 dark:text-white font-bold text-sm">Stockout Risk Scoring</h4>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Assesses days-of-supply against supplier lead times to categorize risk into Low, Medium, High, or Critical.
              </p>
            </div>

            {/* Step 6 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 relative shadow-xs">
              <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-bold uppercase">Stage 06</span>
              <h4 className="text-slate-900 dark:text-white font-bold text-sm">Weather + Terrain + IoT</h4>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Live pass weather, mountain pass closures, altitude challenges, and storage vault sensor alarms.
              </p>
            </div>

            {/* Step 7 */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-slate-950 border border-amber-200 dark:border-amber-500/30 dark:bg-amber-950/20 space-y-1.5 relative shadow-xs">
              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase">Stage 07</span>
              <h4 className="text-slate-900 dark:text-white font-bold text-sm">Anticipated Requirements</h4>
              <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                Exact formula: max(0, Forecast Demand + Safety Stock - Projected Stock) for non-negative reorder demand.
              </p>
            </div>

            {/* Step 8 */}
            <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-slate-950 border border-rose-200 dark:border-rose-500/30 dark:bg-rose-950/20 space-y-1.5 relative shadow-xs">
              <span className="text-[10px] text-rose-800 dark:text-rose-300 font-bold uppercase">Stage 08</span>
              <h4 className="text-slate-900 dark:text-white font-bold text-sm">Replenishment Directive</h4>
              <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                Translates requirement into actionable commands: REPLENISH NOW, REPLENISH SOON, MONITOR, or NO ACTION.
              </p>
            </div>

            {/* Step 9 */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-slate-950 border border-emerald-200 dark:border-emerald-500/40 dark:bg-emerald-950/20 space-y-1.5 relative shadow-xs">
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase">Stage 09</span>
              <h4 className="text-slate-900 dark:text-white font-bold text-sm">Command Dashboard & Alerts</h4>
              <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                Real-time operational dashboard, multi-level alert broadcasts, single-click convoy dispatch, and LogiAI guidance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
