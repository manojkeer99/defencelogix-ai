import React, { useState, useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  HelpCircle, 
  Search, 
  Filter, 
  ArrowRight, 
  ChevronRight, 
  Info, 
  MapPin, 
  Sliders, 
  TrendingUp, 
  Zap, 
  X,
  Radio,
  CloudSnow
} from 'lucide-react';
import { AnticipatedRequirementItem, ReplenishmentAction } from '../types';

interface AnticipatedRequirementsPanelProps {
  requirements: AnticipatedRequirementItem[];
  setCurrentTab?: (tab: string) => void;
  onRefresh?: () => void;
}

export const AnticipatedRequirementsPanel: React.FC<AnticipatedRequirementsPanelProps> = ({
  requirements,
  setCurrentTab,
  onRefresh
}) => {
  const [selectedActionFilter, setSelectedActionFilter] = useState<'ALL' | ReplenishmentAction>('ALL');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemForWhy, setSelectedItemForWhy] = useState<AnticipatedRequirementItem | null>(null);

  // Distinct locations
  const locationsList = useMemo(() => {
    const set = new Set<string>();
    requirements.forEach(r => set.add(r.locationName));
    return Array.from(set).sort();
  }, [requirements]);

  // Filtered requirements
  const filteredRequirements = useMemo(() => {
    return requirements.filter(req => {
      const matchesAction = selectedActionFilter === 'ALL' || req.recommendedAction === selectedActionFilter;
      const matchesLocation = selectedLocationFilter === 'ALL' || req.locationName === selectedLocationFilter;
      const matchesSearch = 
        req.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.itemId.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesAction && matchesLocation && matchesSearch;
    });
  }, [requirements, selectedActionFilter, selectedLocationFilter, searchTerm]);

  // Counts by action
  const replenishNowCount = requirements.filter(r => r.recommendedAction === 'REPLENISH NOW').length;
  const replenishSoonCount = requirements.filter(r => r.recommendedAction === 'REPLENISH SOON').length;
  const monitorCount = requirements.filter(r => r.recommendedAction === 'MONITOR').length;
  const noActionCount = requirements.filter(r => r.recommendedAction === 'NO ACTION').length;

  const getActionBadge = (action: ReplenishmentAction) => {
    switch (action) {
      case 'REPLENISH NOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-500/60 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            REPLENISH NOW
          </span>
        );
      case 'REPLENISH SOON':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            REPLENISH SOON
          </span>
        );
      case 'MONITOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            MONITOR
          </span>
        );
      case 'NO ACTION':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            ADEQUATE STOCK
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'ROUTINE') => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-500/50">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-500/50">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-500/50">MEDIUM</span>;
      case 'ROUTINE':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">ROUTINE</span>;
    }
  };

  return (
    <div className="hud-panel p-5 rounded-xl border border-slate-200 dark:border-cyan-500/30 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/90 border border-cyan-200 dark:border-cyan-500/40 text-cyan-600 dark:text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold tracking-wide text-slate-900 dark:text-white">
                ANTICIPATED REQUIREMENTS & REPLENISHMENT ADVISOR
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                Decision Support
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Calculated via: <span className="text-slate-700 dark:text-slate-300 font-semibold">Required Qty = max(0, Forecast Demand + Safety Stock - Projected Stock)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {setCurrentTab && (
            <button
              onClick={() => setCurrentTab('optimization')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono text-xs font-semibold shadow-sm hover:from-cyan-500 hover:to-blue-500 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Solve Transfer Routes</span>
            </button>
          )}
        </div>
      </div>

      {/* Synthetic Data Disclaimer Banner */}
      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>
            <strong className="text-cyan-700 dark:text-cyan-300">SYNTHETIC PROTOTYPE:</strong> Requirements & recommendations are algorithmically calculated decision-support outputs using synthetic logistics parameters. Not real operational defence orders.
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700 shrink-0 hidden sm:inline-block">
          Non-Blackbox Logic
        </span>
      </div>

      {/* 4 Action Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <button
          onClick={() => setSelectedActionFilter(selectedActionFilter === 'REPLENISH NOW' ? 'ALL' : 'REPLENISH NOW')}
          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
            selectedActionFilter === 'REPLENISH NOW' 
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-1 ring-rose-500' 
              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-rose-400'
          }`}
        >
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">Replenish Now</div>
          <div className="text-xl font-heading font-bold text-rose-700 dark:text-rose-300 mt-0.5">{replenishNowCount} items</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Exceeds lead time</div>
        </button>

        <button
          onClick={() => setSelectedActionFilter(selectedActionFilter === 'REPLENISH SOON' ? 'ALL' : 'REPLENISH SOON')}
          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
            selectedActionFilter === 'REPLENISH SOON' 
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500' 
              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Replenish Soon</div>
          <div className="text-xl font-heading font-bold text-amber-700 dark:text-amber-300 mt-0.5">{replenishSoonCount} items</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Safety stock deficit</div>
        </button>

        <button
          onClick={() => setSelectedActionFilter(selectedActionFilter === 'MONITOR' ? 'ALL' : 'MONITOR')}
          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
            selectedActionFilter === 'MONITOR' 
              ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500' 
              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-cyan-400'
          }`}
        >
          <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase">Monitor</div>
          <div className="text-xl font-heading font-bold text-cyan-700 dark:text-cyan-300 mt-0.5">{monitorCount} items</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">7-14 days supply</div>
        </button>

        <button
          onClick={() => setSelectedActionFilter(selectedActionFilter === 'NO ACTION' ? 'ALL' : 'NO ACTION')}
          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
            selectedActionFilter === 'NO ACTION' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500' 
              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Adequate Stock</div>
          <div className="text-xl font-heading font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{noActionCount} items</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Full buffer maintained</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search items, ammo, fuel, base..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 font-mono shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-slate-500 dark:text-slate-400 shrink-0">Filter Base:</span>
          <select
            value={selectedLocationFilter}
            onChange={(e) => setSelectedLocationFilter(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500 w-full md:w-56 shadow-sm"
          >
            <option value="ALL">All Synthetic Locations ({locationsList.length || 10})</option>
            {locationsList.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Requirements Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-sm">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
              <th className="py-3 px-3 font-semibold">Item & Category</th>
              <th className="py-3 px-2 font-semibold">Location</th>
              <th className="py-3 px-2 text-right font-semibold">Current Stock</th>
              <th className="py-3 px-2 text-right font-semibold">7d Forecast</th>
              <th className="py-3 px-2 text-right font-semibold">Safety Stock</th>
              <th className="py-3 px-2 text-right font-semibold">Projected 7d</th>
              <th className="py-3 px-2 text-right font-semibold text-cyan-600 dark:text-cyan-300">Required Qty</th>
              <th className="py-3 px-2 font-semibold">Priority</th>
              <th className="py-3 px-2 font-semibold">Recommended Action</th>
              <th className="py-3 px-2 text-center font-semibold">Explainability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {filteredRequirements.slice(0, 15).map((req) => {
              const isUrgent = req.recommendedAction === 'REPLENISH NOW';
              const isWarn = req.recommendedAction === 'REPLENISH SOON';

              return (
                <tr 
                  key={req.id} 
                  className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${
                    isUrgent ? 'bg-rose-50/60 dark:bg-rose-950/20' : isWarn ? 'bg-amber-50/60 dark:bg-amber-950/10' : ''
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-white leading-snug">{req.itemName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">{req.category} • {req.itemId}</div>
                  </td>
                  <td className="py-3 px-2 text-slate-700 dark:text-slate-300">
                    <div className="truncate max-w-[180px]">{req.locationName}</div>
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-slate-900 dark:text-slate-100">
                    {req.currentStock.toLocaleString()}
                    <span className="text-[10px] text-slate-500 ml-1 block">{req.unit}</span>
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-cyan-700 dark:text-cyan-300">
                    {req.forecastDemand7d.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-600 dark:text-slate-400">
                    {req.safetyStock.toLocaleString()}
                  </td>
                  <td className={`py-3 px-2 text-right font-bold ${
                    req.projectedStock7d === 0 ? 'text-rose-600 dark:text-rose-400' :
                    req.projectedStock7d < req.safetyStock ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {req.projectedStock7d.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {req.requiredQuantity > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-500/50 text-cyan-800 dark:text-cyan-200 font-bold text-xs inline-block">
                        +{req.requiredQuantity.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    {getPriorityBadge(req.priority)}
                  </td>
                  <td className="py-3 px-2">
                    {getActionBadge(req.recommendedAction)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => setSelectedItemForWhy(req)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-cyan-500 text-xs text-cyan-700 dark:text-cyan-300 flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                      title="Inspect Explainable Factors & Math"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Why?</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredRequirements.length > 15 && (
        <div className="text-center text-xs font-mono text-slate-500">
          Showing top 15 of {filteredRequirements.length} anticipated requirement calculations. Use filters or search to narrow down.
        </div>
      )}

      {/* Explainable "Why?" Modal / Diagnostic Drawer */}
      {selectedItemForWhy && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-cyan-500/50 rounded-xl p-5 max-w-xl w-full space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 uppercase font-bold tracking-wider">
                  Decision Support Diagnostic Explainability
                </span>
                <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedItemForWhy.itemName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Location: {selectedItemForWhy.locationName}
                </p>
              </div>
              <button
                onClick={() => setSelectedItemForWhy(null)}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Recommendation Banner */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">Recommended Action</span>
                <div className="mt-1">{getActionBadge(selectedItemForWhy.recommendedAction)}</div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">Anticipated Replenishment</span>
                <span className="text-lg font-heading font-bold text-cyan-700 dark:text-cyan-300">
                  {selectedItemForWhy.requiredQuantity > 0 ? `+${selectedItemForWhy.requiredQuantity} ${selectedItemForWhy.unit}` : '0 (Buffer intact)'}
                </span>
              </div>
            </div>

            {/* Mathematical Breakdown Grid */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Calculated Input Factors:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Current Stock</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedItemForWhy.currentStock}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Daily Burn</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItemForWhy.dailyConsumption}/day</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Lead Time</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItemForWhy.leadTimeDays} days</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Days of Supply</span>
                  <span className={`font-bold ${selectedItemForWhy.daysOfSupply <= selectedItemForWhy.leadTimeDays ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {selectedItemForWhy.daysOfSupply} days
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Forecast 7d</span>
                  <span className="font-bold text-cyan-700 dark:text-cyan-300">{selectedItemForWhy.forecastDemand7d}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Safety Stock</span>
                  <span className="font-bold text-slate-800 dark:text-slate-300">{selectedItemForWhy.safetyStock}</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Projected 7d Stock</span>
                  <span className={`font-bold ${selectedItemForWhy.projectedStock7d < selectedItemForWhy.safetyStock ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {selectedItemForWhy.projectedStock7d}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Environmental Mod</span>
                  <span className="font-bold text-slate-800 dark:text-slate-300 text-[10px] truncate block">
                    {selectedItemForWhy.whyExplanation.weatherModifier}
                  </span>
                </div>
              </div>
            </div>

            {/* Formula Step-by-Step Box */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-cyan-500/30 text-xs font-mono space-y-1.5">
              <span className="text-cyan-700 dark:text-cyan-400 font-bold block">Logical Formula Execution:</span>
              <div className="text-slate-800 dark:text-slate-300 font-mono text-[11px] p-2 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                Required Quantity = max(0, Forecast Demand + Safety Stock - Projected Stock)
              </div>
              <div className="text-slate-700 dark:text-slate-300 text-[11px] pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  = max(0, {selectedItemForWhy.forecastDemand7d} + {selectedItemForWhy.safetyStock} - {selectedItemForWhy.projectedStock7d})
                </span>
                <span className="text-cyan-700 dark:text-cyan-400 font-bold">
                  = {selectedItemForWhy.requiredQuantity} {selectedItemForWhy.unit}
                </span>
              </div>
            </div>

            {/* Explainable Reasons */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Why this recommendation?
              </span>
              <ul className="space-y-1 text-xs font-mono text-slate-700 dark:text-slate-300">
                {selectedItemForWhy.whyExplanation.bulletReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-950/60 p-2 rounded border border-slate-200 dark:border-slate-800/80">
                    <span className="text-cyan-600 dark:text-cyan-400 shrink-0 font-bold">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-500">Prototype Decision Support</span>
              {setCurrentTab && (
                <button
                  onClick={() => {
                    setSelectedItemForWhy(null);
                    setCurrentTab('optimization');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Create Replenishment Dispatch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
