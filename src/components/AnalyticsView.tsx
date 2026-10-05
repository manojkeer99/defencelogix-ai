import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  MapPin, 
  ArrowUpRight, 
  Activity, 
  ShieldAlert, 
  Calendar,
  Scale
} from 'lucide-react';
import { LogisticsLocation, InventoryItem, Vehicle } from '../types';

interface AnalyticsViewProps {
  locations: LogisticsLocation[];
  inventory: InventoryItem[];
  vehicles: Vehicle[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ locations, inventory, vehicles }) => {
  const [dateRange, setDateRange] = useState<'Today' | '7 Days' | '30 Days' | '90 Days'>('30 Days');
  const [compareNodeA, setCompareNodeA] = useState<string>(locations[4]?.id || locations[0]?.id || '');
  const [compareNodeB, setCompareNodeB] = useState<string>(locations[5]?.id || locations[1]?.id || '');

  const locA = locations.find(l => l.id === compareNodeA);
  const locB = locations.find(l => l.id === compareNodeB);

  const itemsA = inventory.filter(i => i.locationId === compareNodeA);
  const itemsB = inventory.filter(i => i.locationId === compareNodeB);

  const criticalA = itemsA.filter(i => i.status === 'CRITICAL').length;
  const criticalB = itemsB.filter(i => i.status === 'CRITICAL').length;

  const totalDemandA = itemsA.reduce((s, i) => s + i.predictedDemand7d, 0);
  const totalDemandB = itemsB.reduce((s, i) => s + i.predictedDemand7d, 0);

  const totalStockA = itemsA.reduce((s, i) => s + i.currentStock, 0);
  const totalStockB = itemsB.reduce((s, i) => s + i.currentStock, 0);

  return (
    <div className="space-y-6">
      {/* Header and Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-slate-900 dark:text-white">
              STRATEGIC LOGISTICS ANALYTICS & SUPPLY-DEMAND EQUILIBRIUM
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Cross-sector comparative telemetry, forecast precision indices and transport utilization analytics
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono">
          {(['Today', '7 Days', '30 Days', '90 Days'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                dateRange === range 
                  ? 'bg-cyan-600 text-white font-bold shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Comparative Multi-Node Analyzer */}
      <div className="hud-panel p-5 rounded-xl space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white">
              Side-by-Side Node Readiness Comparison
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={compareNodeA}
              onChange={(e) => setCompareNodeA(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-cyan-500/40 rounded-lg px-2.5 py-1 text-xs text-cyan-700 dark:text-cyan-300 font-mono focus:outline-none shadow-xs"
            >
              {locations.map(l => (
                <option key={l.id} value={l.id}>Node 1: {l.name}</option>
              ))}
            </select>
            <span className="text-slate-400 font-mono font-bold">VS</span>
            <select
              value={compareNodeB}
              onChange={(e) => setCompareNodeB(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300 font-mono focus:outline-none shadow-xs"
            >
              {locations.map(l => (
                <option key={l.id} value={l.id}>Node 2: {l.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Node A Column */}
          {locA && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-cyan-200 dark:border-cyan-500/30 space-y-3 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-bold text-slate-900 dark:text-white text-sm">{locA.name}</h3>
                  <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400">{locA.terrainType} • {locA.altitudeMeters}m ASL</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  locA.riskLevel === 'CRITICAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40' : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                }`}>
                  {locA.riskLevel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Critical Items:</span>
                  <div className="text-rose-600 dark:text-rose-400 font-bold text-base">{criticalA}</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Storage Occupancy:</span>
                  <div className="text-slate-900 dark:text-white font-bold text-base">{locA.currentOccupancyTons} / {locA.storageCapacityTons} T</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">7-Day Projected Demand:</span>
                  <div className="text-cyan-700 dark:text-cyan-300 font-bold text-base">{totalDemandA.toLocaleString()}</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Weather / Temp:</span>
                  <div className="text-slate-900 dark:text-white font-bold text-base">{locA.temperatureC}°C ({locA.weatherCondition.split(' ')[0]})</div>
                </div>
              </div>
            </div>
          )}

          {/* Node B Column */}
          {locB && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-amber-200 dark:border-amber-500/30 space-y-3 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-bold text-slate-900 dark:text-white text-sm">{locB.name}</h3>
                  <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">{locB.terrainType} • {locB.altitudeMeters}m ASL</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  locB.riskLevel === 'CRITICAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {locB.riskLevel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Critical Items:</span>
                  <div className="text-rose-600 dark:text-rose-400 font-bold text-base">{criticalB}</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Storage Occupancy:</span>
                  <div className="text-slate-900 dark:text-white font-bold text-base">{locB.currentOccupancyTons} / {locB.storageCapacityTons} T</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">7-Day Projected Demand:</span>
                  <div className="text-amber-700 dark:text-amber-300 font-bold text-base">{totalDemandB.toLocaleString()}</div>
                </div>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Weather / Temp:</span>
                  <div className="text-slate-900 dark:text-white font-bold text-base">{locB.temperatureC}°C ({locB.weatherCondition.split(' ')[0]})</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supply vs Demand Gap Chart */}
        <div className="hud-panel p-5 rounded-xl space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-xs">
          <div>
            <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Supply Availability vs Demand Gap by Commodity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Inventory on-hand versus 7-day projected burn</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {[
              { name: 'Ammunition & Ordnance', stock: 85, demand: 70, gap: '+15% Buffer' },
              { name: 'POL (Fuel)', stock: 54, demand: 88, gap: '-34% DEFICIT' },
              { name: 'Rations & MRE', stock: 88, demand: 80, gap: '+8% Buffer' },
              { name: 'Cold Weather Mountaineering', stock: 45, demand: 90, gap: '-45% DEFICIT' },
              { name: 'Medical & Trauma', stock: 65, demand: 68, gap: '-3% Buffer' },
            ].map((row, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{row.name}</span>
                  <span className={`font-bold ${row.gap.includes('DEFICIT') ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {row.gap}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Available Stock:</span>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${row.stock}%` }} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Projected Demand:</span>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${row.demand}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transport Efficiency & Reliability */}
        <div className="hud-panel p-5 rounded-xl space-y-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-xs">
          <div>
            <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Transport Reliability & Route Efficiency Index
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Assessed across 7 synthetic sector transit corridors</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {[
              { route: 'NH-ALPHA-EXPRESS (Highway)', efficiency: 98, status: 'CLEAR', travel: '4.8h' },
              { route: 'VALLEY-LINK-BRAVO (Mountain)', efficiency: 82, status: 'FOG / DEGRADED', travel: '4.0h' },
              { route: 'PASS-ROHTANG-HIGHWAY (High Pass)', efficiency: 58, status: 'BLIZZARD ADVISORY', travel: '8.2h' },
              { route: 'AERIAL-SUPPLY-GLACIER (UAV)', efficiency: 91, status: 'AERIAL CLEAR', travel: '2.5h' },
              { route: 'DESERT-CORRIDOR-SOUTH (Plains)', efficiency: 79, status: 'SANDSTORM WARNING', travel: '6.5h' },
            ].map((r, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{r.route}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Est. Transit: {r.travel}</div>
                </div>
                <div className="text-right">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    r.efficiency > 90 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    r.efficiency > 70 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {r.efficiency}% Efficiency
                  </span>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{r.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
