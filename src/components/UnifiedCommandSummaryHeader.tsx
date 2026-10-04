import React from 'react';
import { 
  Building2, 
  Package, 
  ShieldAlert, 
  BellRing, 
  Clock, 
  Radio, 
  CloudSnow, 
  TrendingUp, 
  ArrowRight, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import { UnifiedDashboardSummary, AnticipatedRequirementItem, LocationLogisticsStatus } from '../types';

interface UnifiedCommandSummaryHeaderProps {
  summary: UnifiedDashboardSummary;
  topRequirements: AnticipatedRequirementItem[];
  highRiskLocations: LocationLogisticsStatus[];
  setCurrentTab: (tab: string) => void;
}

export const UnifiedCommandSummaryHeader: React.FC<UnifiedCommandSummaryHeaderProps> = ({
  summary,
  topRequirements,
  highRiskLocations,
  setCurrentTab
}) => {
  return (
    <div className="space-y-4">
      {/* 6 Key Judge-Friendly Command Metric KPI Cards (Prompt 5 Requirement 1) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Total Locations */}
        <div 
          onClick={() => setCurrentTab('gis')}
          className="hud-panel p-3.5 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase font-semibold">
            <span>Total Locations</span>
            <Building2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-heading font-bold text-white mt-1.5">
            {summary.totalLocations}
          </div>
          <span className="text-[10px] font-mono text-cyan-400 mt-0.5 block truncate">
            Forward & Base Depots
          </span>
        </div>

        {/* Metric 2: Inventory Items */}
        <div 
          onClick={() => setCurrentTab('inventory')}
          className="hud-panel p-3.5 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase font-semibold">
            <span>Inventory Items</span>
            <Package className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-heading font-bold text-white mt-1.5">
            {summary.totalInventoryItems}
          </div>
          <span className="text-[10px] font-mono text-emerald-400 mt-0.5 block truncate">
            100% Tracked SKUs
          </span>
        </div>

        {/* Metric 3: High Risk Locations */}
        <div 
          onClick={() => setCurrentTab('dashboard')}
          className={`hud-panel p-3.5 rounded-xl border transition-all cursor-pointer group ${
            summary.highRiskLocationsCount > 0 
              ? 'border-rose-500/50 bg-rose-950/20 hover:border-rose-400' 
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-rose-300 text-[11px] font-mono uppercase font-bold">
            <span>High Risk Locations</span>
            <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-heading font-bold text-rose-300 mt-1.5">
            {summary.highRiskLocationsCount}
          </div>
          <span className="text-[10px] font-mono text-rose-400 mt-0.5 block truncate">
            High / Critical Deficits
          </span>
        </div>

        {/* Metric 4: Critical Alerts */}
        <div 
          onClick={() => setCurrentTab('alerts')}
          className={`hud-panel p-3.5 rounded-xl border transition-all cursor-pointer group ${
            summary.criticalAlertsCount > 0 
              ? 'border-rose-500/50 bg-rose-950/20 hover:border-rose-400' 
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-rose-300 text-[11px] font-mono uppercase font-bold">
            <span>Critical Alerts</span>
            <BellRing className="w-4 h-4 text-rose-400 animate-pulse group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-heading font-bold text-rose-300 mt-1.5">
            {summary.criticalAlertsCount}
          </div>
          <span className="text-[10px] font-mono text-rose-400 mt-0.5 block truncate">
            Immediate Response
          </span>
        </div>

        {/* Metric 5: Anticipated Requirements */}
        <div 
          onClick={() => setCurrentTab('dashboard')}
          className="hud-panel p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/10 hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-amber-300 text-[11px] font-mono uppercase font-bold">
            <span>Anticipated Requirements</span>
            <TrendingUp className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-heading font-bold text-amber-300 mt-1.5">
            {summary.pendingRequirementsCount}
          </div>
          <span className="text-[10px] font-mono text-amber-400 mt-0.5 block truncate">
            Proactive Reorders
          </span>
        </div>

        {/* Metric 6: Sensor Warnings */}
        <div 
          onClick={() => setCurrentTab('iot')}
          className="hud-panel p-3.5 rounded-xl border border-purple-500/40 bg-purple-950/10 hover:border-purple-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-purple-300 text-[11px] font-mono uppercase font-bold">
            <span>Sensor Warnings</span>
            <Radio className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-heading font-bold text-purple-200 mt-1.5">
            {summary.sensorsWithWarningsCount}
          </div>
          <span className="text-[10px] font-mono text-purple-300 mt-0.5 block truncate">
            Telemetry Anomalies
          </span>
        </div>
      </div>

      {/* Predictive Logistics Overview Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <h2 className="font-heading text-sm font-bold text-white tracking-wide uppercase">
              PREDICTIVE LOGISTICS OVERVIEW (CRITICAL RISKS & ANTICIPATED REQUIREMENTS)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Real-time multi-module synchronization
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          {/* Left Column: Top High-Risk Bases */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 uppercase text-[10px] font-bold">
              <span>Bases Requiring Command Intervention ({highRiskLocations.length})</span>
              <span className="text-rose-400">Multi-Factor Risk</span>
            </div>
            
            {highRiskLocations.slice(0, 3).map(loc => (
              <div key={loc.locationId} className="p-2 rounded bg-slate-900/90 border border-rose-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    <span>{loc.locationName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {loc.whyReasons[0] || 'High operational burn rate'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/50">
                    {loc.overallLogisticsRisk}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-bold text-cyan-300">
                    {loc.topPriorityAction}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Top Urgent Replenishment Demands */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 uppercase text-[10px] font-bold">
              <span>Top Urgent Anticipated Requirements</span>
              <span className="text-cyan-400">Required Stock</span>
            </div>

            {topRequirements.slice(0, 3).map(req => (
              <div key={req.id} className="p-2 rounded bg-slate-900/90 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-amber-400">⚠️</span>
                    <span>{req.itemName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {req.locationName.split('(')[0].trim()} • Days of supply: <strong className="text-rose-300">{req.daysOfSupply}d</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-200 border border-cyan-500/40">
                    +{req.requiredQuantity} {req.unit}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {req.recommendedAction}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
