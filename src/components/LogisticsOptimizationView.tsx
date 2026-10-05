import React, { useState } from 'react';
import { 
  Route, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ArrowRight, 
  Sliders, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { LogisticsRecommendation } from '../types';
import { useAuth } from '../context/AuthContext';

interface LogisticsOptimizationViewProps {
  recommendations: LogisticsRecommendation[];
  onApproveRecommendation: (id: string) => Promise<void>;
  onTriggerOptimization: () => Promise<void>;
}

export const LogisticsOptimizationView: React.FC<LogisticsOptimizationViewProps> = ({
  recommendations,
  onApproveRecommendation,
  onTriggerOptimization
}) => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);

  const handleRunOptimizer = async () => {
    setLoading(true);
    await onTriggerOptimization();
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    await onApproveRecommendation(id);
    setApprovedIds(prev => [...prev, id]);
  };

  return (
    <div className="space-y-6">
      {/* Header and Solver Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-slate-900 dark:text-white">
              AI LOGISTICS OPTIMIZATION & MULTI-OBJECTIVE SOLVER
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Dynamic replenishment scheduler minimizing stockout risk and vehicle empty returns across forward sectors
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission(['admin', 'logistics_officer']) && (
            <button
              onClick={handleRunOptimizer}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold shadow-md shadow-cyan-950/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Solving Linear Optimization...' : 'Re-Run Optimization Solver'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 Core Optimization Objectives Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="hud-panel p-3 rounded-lg text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-xs">
          <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 uppercase font-bold">Objective 1</span>
          <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">Reduce Unnecessary Transport</div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Consolidates partial loads to 85%+ vehicle fill factor</p>
        </div>

        <div className="hud-panel p-3 rounded-lg text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-xs">
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 uppercase font-bold">Objective 2</span>
          <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">Eliminate Stockout Risk</div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Maintains 99% critical service level buffer</p>
        </div>

        <div className="hud-panel p-3 rounded-lg text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-xs">
          <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 uppercase font-bold">Objective 3</span>
          <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">Delivery Scheduling</div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Prioritizes convoy timing around weather passes</p>
        </div>

        <div className="hud-panel p-3 rounded-lg text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-xs">
          <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase font-bold">Objective 4</span>
          <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">Vehicle Utilization</div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Matches terrain with heavy 6x6, snowcat or drone</p>
        </div>

        <div className="hud-panel p-3 rounded-lg text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-xs">
          <span className="text-[10px] font-mono text-purple-700 dark:text-purple-400 uppercase font-bold">Objective 5</span>
          <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">Inter-Node Rebalance</div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Transfers surplus from central bases to nodes</p>
        </div>
      </div>

      {/* Recommended Logistics Plan Table */}
      <div className="hud-panel rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Active Optimization Recommendations ({recommendations.length} Pending)
            </span>
          </div>
          <span className="text-slate-500 dark:text-slate-400">
            Each transfer incorporates mathematical inventory balancing & route ETA
          </span>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
          {recommendations.map((rec) => {
            const isApproved = rec.status === 'APPROVED' || approvedIds.includes(rec.id);

            return (
              <div key={rec.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors space-y-3">
                {/* Header row: Source -> Destination, Priority, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      rec.priority === 'URGENT' 
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-500/50' 
                        : rec.priority === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-500/50'
                        : 'bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-500/50'
                    }`}>
                      {rec.priority} PRIORITY
                    </span>

                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      <span className="text-slate-600 dark:text-slate-300">{rec.sourceName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-slate-900 dark:text-white">{rec.destinationName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      Est. Time: <strong className="text-slate-800 dark:text-white">~{rec.estimatedTimeHours} hrs</strong>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      Transport: <strong className="text-cyan-700 dark:text-cyan-300">{rec.transportType}</strong>
                    </span>
                  </div>
                </div>

                {/* SKU & Quantity */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Cargo: </span>
                    <strong className="text-slate-900 dark:text-white font-sans text-sm">{rec.itemName}</strong>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">({rec.category})</span>
                  </div>
                  <div className="text-cyan-700 dark:text-cyan-400 font-bold text-sm">
                    Supply Quantity: +{rec.supplyQuantity.toLocaleString()} Units
                  </div>
                </div>

                {/* Transparent AI Explanation */}
                <div className="p-3 rounded-lg bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/20 text-xs font-mono text-slate-700 dark:text-slate-300">
                  <span className="text-cyan-800 dark:text-cyan-400 font-bold block mb-1">
                    Transparent Optimization Rationale:
                  </span>
                  <p className="leading-relaxed">
                    “{rec.reasoning}”
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-1">
                  {isApproved ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500/40 text-xs font-mono font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Approved & Convoy Movement Logged
                    </span>
                  ) : (
                    hasPermission(['admin', 'logistics_officer']) && (
                      <button
                        onClick={() => handleApprove(rec.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Authorize Supply Transfer</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
