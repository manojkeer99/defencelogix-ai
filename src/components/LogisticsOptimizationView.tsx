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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-cyan-400" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-white">
              AI LOGISTICS OPTIMIZATION & MULTI-OBJECTIVE SOLVER
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Dynamic replenishment scheduler minimizing stockout risk and vehicle empty returns across forward sectors
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission(['admin', 'logistics_officer']) && (
            <button
              onClick={handleRunOptimizer}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold shadow-lg shadow-cyan-950/50 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Solving Linear Optimization...' : 'Re-Run Optimization Solver'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 Core Optimization Objectives Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="hud-panel p-3 rounded-lg text-center">
          <span className="text-[10px] font-mono text-cyan-400 uppercase">Objective 1</span>
          <div className="text-xs font-bold text-white mt-1">Reduce Unnecessary Transport</div>
          <p className="text-[10px] text-slate-400 mt-1">Consolidates partial loads to 85%+ vehicle fill factor</p>
        </div>

        <div className="hud-panel p-3 rounded-lg text-center">
          <span className="text-[10px] font-mono text-emerald-400 uppercase">Objective 2</span>
          <div className="text-xs font-bold text-white mt-1">Eliminate Stockout Risk</div>
          <p className="text-[10px] text-slate-400 mt-1">Maintains 99% critical service level buffer</p>
        </div>

        <div className="hud-panel p-3 rounded-lg text-center">
          <span className="text-[10px] font-mono text-cyan-400 uppercase">Objective 3</span>
          <div className="text-xs font-bold text-white mt-1">Delivery Scheduling</div>
          <p className="text-[10px] text-slate-400 mt-1">Prioritizes convoy timing around weather passes</p>
        </div>

        <div className="hud-panel p-3 rounded-lg text-center">
          <span className="text-[10px] font-mono text-amber-400 uppercase">Objective 4</span>
          <div className="text-xs font-bold text-white mt-1">Vehicle Utilization</div>
          <p className="text-[10px] text-slate-400 mt-1">Matches terrain with heavy 6x6, snowcat or drone</p>
        </div>

        <div className="hud-panel p-3 rounded-lg text-center">
          <span className="text-[10px] font-mono text-purple-400 uppercase">Objective 5</span>
          <div className="text-xs font-bold text-white mt-1">Inter-Node Rebalance</div>
          <p className="text-[10px] text-slate-400 mt-1">Transfers surplus from central bases to nodes</p>
        </div>
      </div>

      {/* Recommended Logistics Plan Table */}
      <div className="hud-panel rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200">
              Active Optimization Recommendations ({recommendations.length} Pending)
            </span>
          </div>
          <span className="text-slate-400">
            Each transfer incorporates mathematical inventory balancing & route ETA
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {recommendations.map((rec) => {
            const isApproved = rec.status === 'APPROVED' || approvedIds.includes(rec.id);

            return (
              <div key={rec.id} className="p-4 hover:bg-slate-900/50 transition-colors space-y-3">
                {/* Header row: Source -> Destination, Priority, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      rec.priority === 'URGENT' 
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/50' 
                        : rec.priority === 'HIGH'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                    }`}>
                      {rec.priority} PRIORITY
                    </span>

                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
                      <span className="text-slate-300">{rec.sourceName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-white">{rec.destinationName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Est. Time: <strong className="text-white">~{rec.estimatedTimeHours} hrs</strong>
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-cyan-400" />
                      Transport: <strong className="text-cyan-300">{rec.transportType}</strong>
                    </span>
                  </div>
                </div>

                {/* SKU & Quantity */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-slate-400">Cargo: </span>
                    <strong className="text-white font-sans text-sm">{rec.itemName}</strong>
                    <span className="text-slate-400 ml-2">({rec.category})</span>
                  </div>
                  <div className="text-cyan-400 font-bold text-sm">
                    Supply Quantity: +{rec.supplyQuantity.toLocaleString()} Units
                  </div>
                </div>

                {/* Transparent AI Explanation (User requirement) */}
                <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-xs font-mono text-slate-300">
                  <span className="text-cyan-400 font-bold block mb-1">
                    Transparent Optimization Rationale:
                  </span>
                  <p className="leading-relaxed">
                    “{rec.reasoning}”
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-1">
                  {isApproved ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
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
