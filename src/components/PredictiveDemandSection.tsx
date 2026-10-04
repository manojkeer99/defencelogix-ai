import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Package, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  HelpCircle, 
  Cpu, 
  MapPin, 
  Filter, 
  Info,
  Calendar,
  Zap,
  ArrowUpRight,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { InventoryItem, LogisticsLocation } from '../types';
import { 
  analyzePredictiveRequirement, 
  PredictiveRequirementAnalysis, 
  RiskLevelStatus 
} from '../utils/demandForecastingEngine';

interface PredictiveDemandSectionProps {
  inventory: InventoryItem[];
  locations: LogisticsLocation[];
  setCurrentTab?: (tab: string) => void;
}

export const PredictiveDemandSection: React.FC<PredictiveDemandSectionProps> = ({
  inventory,
  locations,
  setCurrentTab
}) => {
  // Filter States
  const [selectedLocationId, setSelectedLocationId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'item_analysis' | 'anticipated_requirements'>('item_analysis');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach(i => set.add(i.category));
    return Array.from(set);
  }, [inventory]);

  // Filtered Inventory List
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchLoc = selectedLocationId === 'ALL' || item.locationId === selectedLocationId;
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchQuery = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.itemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.locationName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLoc && matchCat && matchQuery;
    });
  }, [inventory, selectedLocationId, selectedCategory, searchQuery]);

  // Ensure an item is always selected
  useEffect(() => {
    if (filteredInventory.length > 0) {
      const exists = filteredInventory.some(i => i.id === selectedItemId);
      if (!exists) {
        // Prioritize critical/high risk items first for compelling demo presentation
        const criticalItem = filteredInventory.find(i => i.status === 'CRITICAL' || i.stockoutRiskScore >= 75);
        setSelectedItemId(criticalItem ? criticalItem.id : filteredInventory[0].id);
      }
    }
  }, [filteredInventory, selectedItemId]);

  const currentSelectedItem = useMemo(() => {
    return inventory.find(i => i.id === selectedItemId) || filteredInventory[0] || inventory[0];
  }, [inventory, selectedItemId, filteredInventory]);

  // Execute the Predictive Demand & Requirement Analysis
  const analysis: PredictiveRequirementAnalysis | null = useMemo(() => {
    if (!currentSelectedItem) return null;
    const loc = locations.find(l => l.id === currentSelectedItem.locationId);
    return analyzePredictiveRequirement(currentSelectedItem, undefined, loc?.weatherData);
  }, [currentSelectedItem, locations]);

  // Compute all items needing replenishment for "Anticipated Requirements" panel
  const allAnticipatedRequirements = useMemo(() => {
    return inventory.map(item => {
      const loc = locations.find(l => l.id === item.locationId);
      return analyzePredictiveRequirement(item, undefined, loc?.weatherData);
    }).filter(a => a.isReplenishmentRequired || a.riskLevel === 'CRITICAL' || a.riskLevel === 'HIGH RISK')
      .sort((a, b) => b.stockoutRiskScore - a.stockoutRiskScore);
  }, [inventory, locations]);

  if (!analysis) {
    return null;
  }

  // Helpers for badge colors
  const getRiskBadge = (level: RiskLevelStatus) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.25)]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'HIGH RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            HIGH RISK
          </span>
        );
      case 'MEDIUM RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            MEDIUM RISK
          </span>
        );
      case 'LOW RISK':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            LOW RISK
          </span>
        );
    }
  };

  // SVG Chart Dimensions
  const chartWidth = 720;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const points = analysis.timelinePoints;
  const maxVal = Math.max(...points.map(p => p.value), analysis.dailyConsumption * 1.5, 10);
  const minVal = 0;

  const getX = (index: number) => paddingX + (index / (points.length - 1)) * usableWidth;
  const getY = (val: number) => chartHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * usableHeight;

  // Split into Historical and Forecast paths
  const todayIndex = points.findIndex(p => p.isToday);
  const histPoints = points.slice(0, todayIndex + 1);
  const forecastPoints = points.slice(todayIndex);

  const histPathD = histPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.value)}`).join(' ');
  const forecastPathD = forecastPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(todayIndex + idx)} ${getY(p.value)}`).join(' ');

  return (
    <div className="hud-panel p-5 rounded-xl border border-cyan-500/30 space-y-5 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg lg:text-xl font-bold tracking-wide text-white">
                  PREDICTIVE DEMAND & REQUIREMENT ANALYSIS
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  Forecasting Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Supply chain requirement anticipation workflow based on historical consumption, current stock, safety buffer, and lead time
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('item_analysis')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'item_analysis'
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>SKU Deep Dive</span>
            </button>
            <button
              onClick={() => setActiveTab('anticipated_requirements')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'anticipated_requirements'
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Anticipated Requirements ({allAnticipatedRequirements.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logical Flow Stepper (Visualizes the exact user workflow requested) */}
      <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <Activity className="w-3.5 h-3.5" />
            Requirement Anticipation Logical Pipeline
          </span>
          <span className="text-[10px] text-slate-400">Synthetic Prototype Simulation</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px]">Step 1</span>
            <span className="text-slate-200 font-semibold mt-0.5">Historical Data</span>
            <span className="text-[10px] text-cyan-300 font-bold mt-1">7d: {analysis.historical7dTotal} {analysis.unit}</span>
          </div>

          <div className="p-2 rounded bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px]">Step 2</span>
            <span className="text-slate-200 font-semibold mt-0.5">Current Stock</span>
            <span className="text-[10px] text-emerald-400 font-bold mt-1">{analysis.currentStock} {analysis.unit}</span>
          </div>

          <div className="p-2 rounded bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px]">Step 3</span>
            <span className="text-slate-200 font-semibold mt-0.5">Daily & Safety</span>
            <span className="text-[10px] text-amber-300 font-bold mt-1">{analysis.dailyConsumption}/d | SS: {analysis.safetyStock}</span>
          </div>

          <div className="p-2 rounded bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px]">Step 4</span>
            <span className="text-slate-200 font-semibold mt-0.5">Demand Forecast</span>
            <span className="text-[10px] text-cyan-400 font-bold mt-1">7d: {analysis.forecastedDemand7d} {analysis.unit}</span>
          </div>

          <div className="p-2 rounded bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px]">Step 5</span>
            <span className="text-slate-200 font-semibold mt-0.5">Projected Stock</span>
            <span className={`text-[10px] font-bold mt-1 ${analysis.projectedRemainingStock <= 0 ? 'text-rose-400' : analysis.projectedRemainingStock < analysis.safetyStock ? 'text-amber-400' : 'text-emerald-400'}`}>
              {analysis.projectedRemainingStock} {analysis.unit}
            </span>
          </div>

          <div className="p-2 rounded bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px]">Step 6</span>
            <span className="text-slate-200 font-semibold mt-0.5">Stockout Risk</span>
            <span className="mt-1">{getRiskBadge(analysis.riskLevel)}</span>
          </div>

          <div className="p-2 rounded bg-cyan-950/80 border border-cyan-500/40 flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-cyan-300 text-[10px] font-bold">Step 7: Requirement</span>
            <span className="text-white font-bold text-xs mt-0.5">
              {analysis.anticipatedReplenishmentQty > 0 ? `+${analysis.anticipatedReplenishmentQty} ${analysis.unit}` : 'Zero Deficit'}
            </span>
            <span className="text-[9px] text-cyan-200 font-semibold mt-1">
              {analysis.urgencyBadge}
            </span>
          </div>
        </div>
      </div>

      {activeTab === 'item_analysis' ? (
        <>
          {/* Selector Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
            {/* Location Filter */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Filter by Location
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="ALL">All Logistics Nodes ({locations.length})</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="ALL">All Categories ({categories.length})</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Item Selector */}
            <div className="md:col-span-2">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
                <span>Select Supply SKU ({filteredInventory.length} Available)</span>
                {analysis && (
                  <span className="text-cyan-300 font-normal">
                    Lead Time: {analysis.leadTimeDays}d
                  </span>
                )}
              </label>
              <select
                value={currentSelectedItem.id}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-cyan-400"
              >
                {filteredInventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} — [{item.locationName}] — Stock: {item.currentStock} {item.unit} ({item.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Core 12 Requirement Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Current Stock */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Current Stock</span>
                <Package className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl lg:text-2xl font-heading font-bold text-white">
                  {analysis.currentStock.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{analysis.unit}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                On-hand physical buffer
              </p>
            </div>

            {/* 2. Minimum Stock */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Minimum Stock</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl lg:text-2xl font-heading font-bold text-slate-300">
                  {analysis.minStock.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{analysis.unit}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                Prescribed baseline threshold
              </p>
            </div>

            {/* 3. Daily Consumption */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Daily Burn</span>
                <Activity className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl lg:text-2xl font-heading font-bold text-amber-300">
                  {analysis.dailyConsumption}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{analysis.unit}/day</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                Avg: {analysis.historicalConsumptionAverage} {analysis.unit} (historical)
              </p>
            </div>

            {/* 4. Lead Time */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Lead Time</span>
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl lg:text-2xl font-heading font-bold text-cyan-300">
                  {analysis.leadTimeDays}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Days</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                Transit from source depot
              </p>
            </div>

            {/* 5. Safety Stock */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Safety Stock</span>
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl lg:text-2xl font-heading font-bold text-purple-300">
                  {analysis.safetyStock.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{analysis.unit}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                Z=2.33 / 1.65 variability reserve
              </p>
            </div>

            {/* 6. Stockout Risk */}
            <div className={`p-3.5 rounded-xl bg-slate-950/80 border ${
              analysis.riskLevel === 'CRITICAL' ? 'border-rose-500/50 bg-rose-950/20' :
              analysis.riskLevel === 'HIGH RISK' ? 'border-amber-500/50 bg-amber-950/20' :
              analysis.riskLevel === 'MEDIUM RISK' ? 'border-cyan-500/50 bg-cyan-950/20' :
              'border-emerald-500/50 bg-emerald-950/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-300 uppercase font-semibold">Stockout Risk</span>
                <span className="text-xs font-mono font-bold">{analysis.stockoutRiskScore}%</span>
              </div>
              <div className="mt-1.5">
                {getRiskBadge(analysis.riskLevel)}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                {analysis.daysUntilStockout} days of supply remaining
              </p>
            </div>
          </div>

          {/* Demand & Forecast Output Metrics (Row 2 of parameters) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 7. Historical Consumption (7d Total) */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Historical Consumption (Past 7d)
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-heading font-bold text-emerald-400">
                  {analysis.historical7dTotal.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-mono">{analysis.unit}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Recorded baseline burn (Avg: {analysis.historicalConsumptionAverage} {analysis.unit}/day)
              </p>
            </div>

            {/* 8. Total Forecasted Demand (Next 7d) */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Total Forecasted Demand (Next 7d)
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-heading font-bold text-cyan-400">
                  {analysis.forecastedDemand7d.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-mono">{analysis.unit}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Forecasted consumption for next 7 days
              </p>
            </div>

            {/* 9. Projected Remaining Stock */}
            <div className={`p-3.5 rounded-xl bg-slate-950 border ${
              analysis.projectedRemainingStock <= 0 ? 'border-rose-500/50 bg-rose-950/10' :
              analysis.projectedRemainingStock < analysis.safetyStock ? 'border-amber-500/50 bg-amber-950/10' :
              'border-slate-800'
            }`}>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Projected Remaining Stock (D+7)
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className={`text-2xl font-heading font-bold ${
                  analysis.projectedRemainingStock <= 0 ? 'text-rose-400' :
                  analysis.projectedRemainingStock < analysis.safetyStock ? 'text-amber-300' :
                  'text-emerald-400'
                }`}>
                  {analysis.projectedRemainingStock.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-mono">{analysis.unit}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {analysis.projectedRemainingStock <= 0
                  ? 'Exhaustion projected within forecast horizon'
                  : analysis.projectedRemainingStock < analysis.safetyStock
                  ? 'Below safety buffer threshold'
                  : 'Safe operational buffer maintained'}
              </p>
            </div>

            {/* 10. Anticipated Replenishment Quantity */}
            <div className={`p-3.5 rounded-xl bg-slate-950 border ${
              analysis.anticipatedReplenishmentQty > 0 ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-800'
            }`}>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Anticipated Replenishment Qty
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className={`text-2xl font-heading font-bold ${
                  analysis.anticipatedReplenishmentQty > 0 ? 'text-amber-300' : 'text-emerald-400'
                }`}>
                  {analysis.anticipatedReplenishmentQty > 0 ? `+${analysis.anticipatedReplenishmentQty.toLocaleString()}` : '0'}
                </span>
                <span className="text-xs text-slate-400 font-mono">{analysis.unit}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {analysis.anticipatedReplenishmentQty > 0
                  ? `Required to cover 7d demand + safety buffer`
                  : 'No replenishment needed currently'}
              </p>
            </div>
          </div>

          {/* Visual Chart: Historical Consumption → Forecasted Consumption */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-heading font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Historical Consumption → Forecasted Consumption Trajectory
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  14-Day Trajectory: 7 days historical actuals transitioning into 7 days predictive demand forecast
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">Historical Consumption</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-slate-300">Forecasted Demand</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 border-t border-amber-400 border-dashed" />
                  <span className="text-amber-300">Daily Average ({analysis.dailyConsumption})</span>
                </div>
              </div>
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="w-full relative pt-2">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-44 sm:h-52 overflow-visible select-none"
              >
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                {[0.25, 0.5, 0.75, 1.0].map((pct, idx) => {
                  const yPos = chartHeight - paddingY - pct * usableHeight;
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingX}
                        y1={yPos}
                        x2={chartWidth - paddingX}
                        y2={yPos}
                        stroke="#1e293b"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={paddingX - 6}
                        y={yPos + 3}
                        fill="#64748b"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {Math.round(minVal + pct * (maxVal - minVal))}
                      </text>
                    </g>
                  );
                })}

                {/* Daily baseline reference line */}
                <line
                  x1={paddingX}
                  y1={getY(analysis.dailyConsumption)}
                  x2={chartWidth - paddingX}
                  y2={getY(analysis.dailyConsumption)}
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />

                {/* Vertical Separator for TODAY */}
                <line
                  x1={getX(todayIndex)}
                  y1={paddingY}
                  x2={getX(todayIndex)}
                  y2={chartHeight - paddingY}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <rect
                  x={getX(todayIndex) - 24}
                  y={paddingY - 14}
                  width="48"
                  height="16"
                  rx="3"
                  fill="#0c4a6e"
                  stroke="#0284c7"
                  strokeWidth="1"
                />
                <text
                  x={getX(todayIndex)}
                  y={paddingY - 3}
                  fill="#7dd3fc"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  TODAY
                </text>

                {/* Historical Area fill */}
                <path
                  d={`${histPathD} L ${getX(todayIndex)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z`}
                  fill="url(#histGrad)"
                />

                {/* Forecast Area fill */}
                <path
                  d={`${forecastPathD} L ${getX(points.length - 1)} ${chartHeight - paddingY} L ${getX(todayIndex)} ${chartHeight - paddingY} Z`}
                  fill="url(#forecastGrad)"
                />

                {/* Historical Line */}
                <path
                  d={histPathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />

                {/* Forecast Line */}
                <path
                  d={forecastPathD}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                />

                {/* Data Points */}
                {points.map((p, idx) => {
                  const cx = getX(idx);
                  const cy = getY(p.value);
                  const isHist = p.type === 'HISTORICAL';
                  const isHovered = hoveredPointIndex === idx;

                  return (
                    <g 
                      key={idx} 
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 6 : p.isToday ? 5 : 3.5}
                        fill={p.isToday ? '#ffffff' : isHist ? '#10b981' : '#06b6d4'}
                        stroke={isHist ? '#065f46' : '#0e7490'}
                        strokeWidth="2"
                      />
                      {/* Label under point */}
                      <text
                        x={cx}
                        y={chartHeight - paddingY + 14}
                        fill={p.isToday ? '#38bdf8' : isHist ? '#94a3b8' : '#7dd3fc'}
                        fontSize="9"
                        fontWeight={p.isToday || isHovered ? 'bold' : 'normal'}
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {p.dayLabel}
                      </text>
                    </g>
                  );
                })}

                {/* Tooltip on hover */}
                {hoveredPointIndex !== null && (
                  <g transform={`translate(${getX(hoveredPointIndex)}, ${getY(points[hoveredPointIndex].value) - 30})`}>
                    <rect
                      x="-55"
                      y="-12"
                      width="110"
                      height="24"
                      rx="4"
                      fill="#020617"
                      stroke="#38bdf8"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="4"
                      fill="#f8fafc"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {points[hoveredPointIndex].value} {analysis.unit} ({points[hoveredPointIndex].dayLabel})
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Daily Forecast Breakdown Strip (Day-by-Day sequence) */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                Day-by-Day Forecasted Consumption (D+1 to D+7)
              </span>
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-mono">
                {analysis.forecastedDemandDaily.map((val, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Day +{idx + 1}</span>
                    <span className="text-cyan-300 font-bold text-sm block mt-0.5">{val}</span>
                    <span className="text-[9px] text-slate-400">{analysis.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Explainable Prediction & Decision Logic Box (User Requirements 5 & 10) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-heading font-semibold text-white">
                  Explainable Predictive Requirement Diagnostics
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                Formula-Driven Verification
              </span>
            </div>

            {/* Formal Explanation Text (Requirement 10) */}
            <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs text-slate-200 font-mono">
              <p className="font-semibold text-cyan-300 mb-1">
                SYSTEM DIAGNOSIS:
              </p>
              <p>
                {analysis.explanationSummary}
              </p>
            </div>

            {/* Mathematical Transparency Breakdown (Requirement 5) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-slate-400 uppercase tracking-wider block font-semibold text-[11px]">
                  Step-by-Step Calculation Flow
                </span>

                <div className="space-y-1.5 divide-y divide-slate-800/80">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Current Stock:</span>
                    <span className="font-bold text-white">{analysis.currentStock} {analysis.unit}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Forecasted 7-Day Demand:</span>
                    <span className="font-bold text-cyan-400">{analysis.forecastedDemand7d} {analysis.unit}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Safety Stock Buffer:</span>
                    <span className="font-bold text-purple-300">{analysis.safetyStock} {analysis.unit}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Lead Time (Transit Buffer):</span>
                    <span className="font-bold text-slate-300">{analysis.leadTimeDays} Days</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Projected Remaining Stock (D+7):</span>
                    <span className={`font-bold ${analysis.projectedRemainingStock <= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {analysis.projectedRemainingStock} {analysis.unit}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 font-bold">
                    <span className="text-amber-300">Anticipated Requirement:</span>
                    <span className="text-amber-300 text-sm">
                      {analysis.anticipatedReplenishmentQty > 0 ? `+${analysis.anticipatedReplenishmentQty} ${analysis.unit}` : '0 Units (Safe Buffer)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Decision Explanation Reasoning Points */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block font-semibold text-[11px] mb-2">
                    Decision Logic & Recommended Action
                  </span>

                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {analysis.explanationDetails.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-0.5">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Recommended Timing:</span>
                  <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                    analysis.urgencyBadge === 'IMMEDIATE' ? 'bg-rose-950 text-rose-300 border border-rose-500/50' :
                    analysis.urgencyBadge === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-500/50' :
                    'bg-slate-800 text-slate-200'
                  }`}>
                    {analysis.recommendedReplenishmentTiming}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Anticipated Requirements Panel (User Requirement 9) */
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <h3 className="font-heading text-sm font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Anticipated Requirements Network Rollup
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Items across the logistics network projected to require replenishment within the next 7 days
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold px-2 py-1 rounded bg-amber-950/80 border border-amber-500/30">
              {allAnticipatedRequirements.length} Items Require Action
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3">Item / SKU</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3 text-right">Current Stock</th>
                  <th className="py-2.5 px-3 text-right">Safety Stock</th>
                  <th className="py-2.5 px-3 text-right">Forecast 7d</th>
                  <th className="py-2.5 px-3 text-center">Stockout Risk</th>
                  <th className="py-2.5 px-3 text-right">Anticipated Req.</th>
                  <th className="py-2.5 px-3">Recommended Timing</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allAnticipatedRequirements.map((req) => (
                  <tr key={`${req.itemId}-${req.locationId}`} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{req.itemName}</div>
                      <div className="text-[10px] text-slate-400">{req.category}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{req.locationName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200">
                      <span className="font-bold">{req.currentStock}</span> {req.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right text-purple-300 font-semibold">
                      {req.safetyStock} {req.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">
                      {req.forecastedDemand7d} {req.unit}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {getRiskBadge(req.riskLevel)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-bold text-amber-300">+{req.anticipatedReplenishmentQty}</span> {req.unit}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] text-slate-300">
                        {req.recommendedReplenishmentTiming}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          const item = inventory.find(i => i.itemId === req.itemId && i.locationId === req.locationId);
                          if (item) {
                            setSelectedItemId(item.id);
                            setActiveTab('item_analysis');
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Disclaimer & Source Attributions (Requirement 4 & 6) */}
      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            Prototype Demonstration: Powered by Historical Consumption Forecast and Predictive Demand Analysis algorithms using synthetic logistics telemetry. Not real military data.
          </span>
        </div>

        {setCurrentTab && (
          <button
            onClick={() => setCurrentTab('optimization')}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer shrink-0"
          >
            <span>Launch Route Optimization Solver</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
