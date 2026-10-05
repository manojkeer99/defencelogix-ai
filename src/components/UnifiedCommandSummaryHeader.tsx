import React from 'react';
import { 
  Building2, 
  Package, 
  ShieldAlert, 
  BellRing, 
  TrendingUp, 
  Radio, 
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  AlertCircle
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
      {/* 5 Core System Status Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Overall Logistics Status */}
        <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Logistics Status
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-xl font-heading font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            OPTIMAL READINESS
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            10 of 10 nodes responding
          </p>
        </div>

        {/* Supply Risk */}
        <div 
          onClick={() => setCurrentTab('inventory')}
          className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-950/60 shadow-xs cursor-pointer hover:border-rose-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-semibold">
              Supply Risk
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-heading font-bold text-rose-600 dark:text-rose-400 mt-1">
            {highRiskLocations.length > 0 ? `${highRiskLocations.length} Critical Sectors` : 'Low Risk'}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Sub-48h buffer at forward passes
          </p>
        </div>

        {/* Active Alerts */}
        <div 
          onClick={() => setCurrentTab('alerts')}
          className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-950/60 shadow-xs cursor-pointer hover:border-amber-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
              Active Alerts
            </span>
            <BellRing className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-heading font-bold text-amber-600 dark:text-amber-400 mt-1">
            {summary.criticalAlertsCount} Critical Alert{summary.criticalAlertsCount !== 1 ? 's' : ''}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Requires command triage
          </p>
        </div>

        {/* Forecast Confidence */}
        <div 
          onClick={() => setCurrentTab('forecast')}
          className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-cyan-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Forecast Confidence
            </span>
            <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-xl font-heading font-bold text-cyan-600 dark:text-cyan-400 mt-1">
            94.2% High
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            MAPE 5.4% (Adaptive Engine)
          </p>
        </div>

        {/* Environmental Risk */}
        <div 
          onClick={() => setCurrentTab('gis')}
          className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-cyan-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Environmental Risk
            </span>
            <Radio className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-heading font-bold text-purple-600 dark:text-purple-400 mt-1">
            Moderate
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            High altitude blizzard watch
          </p>
        </div>
      </div>

      {/* Predictive Logistics Overview (Demand Forecast, Inventory Risk, Anticipated Requirement, Upcoming Risk) */}
      <div className="p-4 rounded-xl border bg-white dark:bg-slate-900/90 border-slate-200 dark:border-cyan-500/30 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-heading text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Predictive Overview & Anticipated Requirements
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Proactive demand projection linked with lead times and inventory depletion risk
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('optimization')}
            className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Run Replenishment Solver</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          {/* Left Column: Multi-Factor Risk Nodes */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
              <span>Forward Passes & Depots at Risk ({highRiskLocations.length})</span>
              <span className="text-rose-600 dark:text-rose-400">Intervention Target</span>
            </div>
            
            {highRiskLocations.slice(0, 3).map(loc => (
              <div key={loc.locationId} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>{loc.locationName}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {loc.whyReasons[0] || 'Elevated daily burn rate'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/50">
                    {loc.overallLogisticsRisk}
                  </span>
                  <div className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-300 mt-0.5">
                    {loc.topPriorityAction}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Top Urgent Anticipated Requirements */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
              <span>Top Anticipated SKU Replenishments</span>
              <span className="text-cyan-700 dark:text-cyan-400">Required Quantity</span>
            </div>

            {topRequirements.slice(0, 3).map(req => (
              <div key={req.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>{req.itemName}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {req.locationName.split('(')[0].trim()} • Reserve: <strong className="text-rose-600 dark:text-rose-400">{req.daysOfSupply}d left</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-500/40">
                    +{req.requiredQuantity} {req.unit}
                  </span>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
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
