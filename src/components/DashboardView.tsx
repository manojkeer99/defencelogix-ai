import React, { useState, useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Truck, 
  CheckCircle2, 
  ShieldAlert, 
  MapPin, 
  Activity, 
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { 
  DashboardMetrics, 
  InventoryItem, 
  LogisticsLocation, 
  Vehicle, 
  AlertItem, 
  IoTSensorNode,
  LogisticsRoute 
} from '../types';
import { PredictiveDemandSection } from './PredictiveDemandSection';
import { EnvironmentalConditionsSection } from './EnvironmentalConditionsSection';
import { IotMonitoringSection } from './IotMonitoringSection';
import { UnifiedCommandSummaryHeader } from './UnifiedCommandSummaryHeader';
import { LocationLogisticsStatusSection } from './LocationLogisticsStatusSection';
import { AnticipatedRequirementsPanel } from './AnticipatedRequirementsPanel';
import { DemoSimulationControls } from './DemoSimulationControls';
import { 
  calculateAllLocationsStatus, 
  computeAnticipatedRequirements, 
  computeUnifiedDashboardSummary 
} from '../utils/unifiedLogisticsEngine';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  inventory: InventoryItem[];
  locations: LogisticsLocation[];
  vehicles: Vehicle[];
  alerts: AlertItem[];
  sensors?: IoTSensorNode[];
  routes?: LogisticsRoute[];
  setCurrentTab: (tab: string) => void;
  onRefresh: () => void;
  onTriggerScenario?: (sensorId: string, scenario: 'temperature' | 'humidity' | 'low_storage' | 'low_battery' | 'offline') => Promise<void>;
  onResetSimulation?: () => Promise<void>;
  onSimulateScenario?: (scenario: 'demand_surge' | 'inventory_reduction' | 'weather_deterioration' | 'sensor_anomaly') => Promise<void>;
  onResetDemo?: () => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  inventory,
  locations,
  vehicles,
  alerts,
  sensors = [],
  routes = [],
  setCurrentTab,
  onRefresh,
  onTriggerScenario,
  onResetSimulation,
  onSimulateScenario,
  onResetDemo
}) => {
  const [selectedChartRange, setSelectedChartRange] = useState<'7d' | '14d' | '30d'>('14d');

  // Unified Predictive Logistics Data Calculations
  const locationStatuses = useMemo(() => {
    return calculateAllLocationsStatus(locations, inventory, sensors, routes, alerts);
  }, [locations, inventory, sensors, routes, alerts]);

  const anticipatedRequirements = useMemo(() => {
    return computeAnticipatedRequirements(inventory, locations, sensors);
  }, [inventory, locations, sensors]);

  const commandSummary = useMemo(() => {
    return computeUnifiedDashboardSummary(locations, inventory, sensors, alerts, anticipatedRequirements, locationStatuses);
  }, [locations, inventory, sensors, alerts, anticipatedRequirements, locationStatuses]);

  const highRiskLocations = useMemo(() => {
    return locationStatuses.filter(l => l.overallLogisticsRisk === 'HIGH' || l.overallLogisticsRisk === 'CRITICAL');
  }, [locationStatuses]);

  const criticalItems = inventory.filter(i => i.status === 'CRITICAL' || i.stockoutRiskScore >= 75);
  const activeAlerts = alerts.filter(a => a.status !== 'RESOLVED');

  const consumptionRates = [
    { category: 'POL (Fuel)', rate: 88, status: 'HIGH SURGE', color: 'from-amber-500 to-rose-500' },
    { category: 'Ammunition', rate: 74, status: 'ELEVATED', color: 'from-cyan-500 to-blue-500' },
    { category: 'MRE Rations', rate: 82, status: 'HIGH SURGE', color: 'from-emerald-500 to-teal-500' },
    { category: 'Cold Weather Gear', rate: 91, status: 'CRITICAL BURN', color: 'from-rose-500 to-purple-600' },
    { category: 'Medical Kits', rate: 68, status: 'MODERATE', color: 'from-indigo-500 to-cyan-500' },
    { category: 'Spare Parts', rate: 59, status: 'STEADY', color: 'from-blue-500 to-indigo-500' },
  ];

  const stockoutRiskDistribution = [
    { label: 'Critical Risk (>75%)', count: criticalItems.length, color: 'bg-rose-500' },
    { label: 'High Risk (50-75%)', count: inventory.filter(i => i.stockoutRiskScore >= 50 && i.stockoutRiskScore < 75).length, color: 'bg-amber-500' },
    { label: 'Medium Risk (25-50%)', count: inventory.filter(i => i.stockoutRiskScore >= 25 && i.stockoutRiskScore < 50).length, color: 'bg-cyan-500' },
    { label: 'Optimal / Safe (<25%)', count: inventory.filter(i => i.stockoutRiskScore < 25).length, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Top Section */}
      <div className="p-5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-cyan-500/30 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="font-heading text-xl lg:text-2xl font-bold tracking-wide text-slate-900 dark:text-white">
                DEFENCELOGIX AI
              </h1>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span className="font-heading text-sm lg:text-base font-medium text-cyan-600 dark:text-cyan-400">
                Predictive Logistics & Forward Supply Chain Decision Support
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/50">
                DEMO MODE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-4xl leading-relaxed">
              Forecast demand, monitor inventory, assess environmental conditions, detect anomalies and anticipate future logistics requirements.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setCurrentTab('gis')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-cyan-950/80 border border-slate-300 dark:border-cyan-500/40 text-slate-700 dark:text-cyan-300 hover:bg-slate-200 dark:hover:bg-cyan-900 text-xs font-mono font-semibold transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>GIS Map</span>
            </button>
            <button
              onClick={() => setCurrentTab('optimization')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Optimize Transfers</span>
            </button>
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Non-sensitive synthetic note */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span>Simulation Environment: Synthetic Logistics Data & Public Open-Meteo Weather</span>
          <span className="hidden sm:inline">MoD DSSC 26251 Decision Support Prototype</span>
        </div>
      </div>

      {/* 2. Simulation Scenario Controls */}
      <DemoSimulationControls
        onSimulateScenario={onSimulateScenario || (async () => {})}
        onResetDemo={onResetDemo || (async () => {})}
        onRefresh={onRefresh}
      />

      {/* 3. Compact System Status Area & Predictive Overview */}
      <UnifiedCommandSummaryHeader
        summary={commandSummary}
        topRequirements={anticipatedRequirements}
        highRiskLocations={highRiskLocations}
        setCurrentTab={setCurrentTab}
      />

      {/* 4. Eight Core KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {/* Card 1: Total Inventory Items */}
        <div 
          onClick={() => setCurrentTab('inventory')}
          className="hud-panel p-4 rounded-xl cursor-pointer hover:border-cyan-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Items</span>
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 dark:text-white tabular-nums">
              {metrics ? metrics.totalInventoryItems : inventory.length}
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              Active Ledger
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Across 10 Forward & Central Depots
          </p>
        </div>

        {/* Card 2: Critical Stock Items */}
        <div 
          onClick={() => setCurrentTab('inventory')}
          className="hud-panel hud-panel-danger p-4 rounded-xl cursor-pointer hover:border-rose-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-rose-600 dark:text-rose-300 uppercase tracking-wider font-semibold">Critical Stock</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-heading font-bold text-rose-600 dark:text-rose-300 tabular-nums">
              {metrics ? metrics.criticalStockItems : criticalItems.length}
            </span>
            <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-semibold">
              Immediate Reorder
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Sub-48h buffer at forward passes
          </p>
        </div>

        {/* Card 3: Predicted Demand (7d) */}
        <div 
          onClick={() => setCurrentTab('forecast')}
          className="hud-panel p-4 rounded-xl cursor-pointer hover:border-cyan-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Predicted Demand</span>
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 dark:text-white tabular-nums">
              {metrics ? (metrics.predictedDemandTotal).toLocaleString() : '8,420'}
            </span>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
              7d Horizon
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Operational demand trajectory
          </p>
        </div>

        {/* Card 4: Pending Replenishments */}
        <div 
          onClick={() => setCurrentTab('optimization')}
          className="hud-panel p-4 rounded-xl cursor-pointer hover:border-cyan-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Orders</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 dark:text-white tabular-nums">
              {metrics ? metrics.pendingSupplyRequests : '3'}
            </span>
            <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
              Solver Ready
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Auto-calculated routes & loads
          </p>
        </div>

        {/* Card 5: Active Deliveries */}
        <div 
          onClick={() => setCurrentTab('transport')}
          className="hud-panel p-4 rounded-xl cursor-pointer hover:border-cyan-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Deliveries</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-heading font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {metrics ? metrics.activeDeliveries : vehicles.filter(v => v.status === 'IN_TRANSIT').length}
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              En Route
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            High altitude & valley corridors
          </p>
        </div>

        {/* Card 6: Transport Capacity */}
        <div 
          onClick={() => setCurrentTab('transport')}
          className="hud-panel p-4 rounded-xl cursor-pointer hover:border-cyan-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fleet Payload</span>
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 dark:text-white tabular-nums">
              {metrics ? metrics.availableTransportCapacityTons : '68.5'} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Tons</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Available
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            12 of 20 vehicles standing by
          </p>
        </div>

        {/* Card 7: Low Stock Alerts */}
        <div 
          onClick={() => setCurrentTab('alerts')}
          className="hud-panel hud-panel-warning p-4 rounded-xl cursor-pointer hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-amber-600 dark:text-amber-300 uppercase tracking-wider font-semibold">Active Alerts</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-500/40 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-heading font-bold text-amber-600 dark:text-amber-300 tabular-nums">
              {metrics ? metrics.lowStockAlertsCount : activeAlerts.length}
            </span>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
              Action Required
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            POL fuel & cold weather clothing
          </p>
        </div>

        {/* Card 8: Forecast Accuracy */}
        <div 
          onClick={() => setCurrentTab('forecast')}
          className="hud-panel hud-panel-success p-4 rounded-xl cursor-pointer hover:border-emerald-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-300 uppercase tracking-wider font-semibold">Forecast Accuracy</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-heading font-bold text-emerald-600 dark:text-emerald-300 tabular-nums">
              94.2%
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              MAPE: 5.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Adaptive Multi-Model Engine
          </p>
        </div>
      </div>

      {/* 5. Location-Level Logistics Status & Multi-Factor Explainable Risk */}
      <LocationLogisticsStatusSection
        locationStatuses={locationStatuses}
        setCurrentTab={setCurrentTab}
        onRefresh={onRefresh}
      />

      {/* 6. Dedicated Anticipated Requirements Panel */}
      <AnticipatedRequirementsPanel
        requirements={anticipatedRequirements}
        setCurrentTab={setCurrentTab}
        onRefresh={onRefresh}
      />

      {/* 7. Predictive Demand & Analysis Section */}
      <PredictiveDemandSection
        inventory={inventory}
        locations={locations}
        setCurrentTab={setCurrentTab}
      />

      {/* 8. Environmental Conditions Section */}
      <EnvironmentalConditionsSection
        locations={locations}
        sensors={sensors}
        setCurrentTab={setCurrentTab}
      />

      {/* 9. IoT Inventory Monitoring & Anomaly Detection */}
      <IotMonitoringSection
        sensors={sensors}
        alerts={alerts}
        setCurrentTab={setCurrentTab}
        onRefresh={onRefresh}
        onTriggerScenario={onTriggerScenario}
        onResetSimulation={onResetSimulation}
      />

      {/* 10. Interactive Forecasting & Risk Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Historical Consumption vs Forecasted Demand */}
        <div className="lg:col-span-2 hud-panel p-5 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Historical Consumption vs Forecasted Demand
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Past verified daily consumption plotted against 7-day predicted trajectory with 95% confidence corridor
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
              {(['7d', '14d', '30d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedChartRange(range)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    selectedChartRange === range 
                      ? 'bg-cyan-600 text-white font-semibold shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Forecast Visualizer */}
          <div className="h-60 w-full relative pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="boundFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[40, 80, 120, 160].map(y => (
                <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
              ))}

              {/* Confidence Band Polygon */}
              <polygon
                points="
                  0,150 66,135 133,115 200,95 266,80 333,65 400,55 466,45 533,35 600,20
                  600,85 533,100 466,110 400,120 333,130 266,140 200,150 133,160 66,170 0,180
                "
                fill="url(#boundFill)"
              />

              {/* Predicted Demand Line */}
              <path
                d="M 0,165 Q 100,140 200,122 T 400,85 T 600,50"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3"
              />

              {/* Actual Demand Line */}
              <path
                d="M 0,168 L 66,150 L 133,126 L 200,120"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
              />

              {/* Key Data Points */}
              <circle cx="0" cy="168" r="4" fill="#10b981" />
              <circle cx="66" cy="150" r="4" fill="#10b981" />
              <circle cx="133" cy="126" r="4" fill="#10b981" />
              <circle cx="200" cy="120" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              <circle cx="400" cy="85" r="4" fill="#06b6d4" />
              <circle cx="600" cy="50" r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-2">
              <span>Day -3 (Historical)</span>
              <span>Day -1 (Historical)</span>
              <span>Today (Current)</span>
              <span>Day +3 (Projected)</span>
              <span>Day +7 (Target Horizon)</span>
            </div>
          </div>

          {/* Forecast Metric Legends */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-1.5 bg-emerald-500 rounded"></span>
              <span className="text-slate-700 dark:text-slate-300">Historical Consumption (Actuals)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1.5 bg-cyan-500 rounded"></span>
              <span className="text-slate-700 dark:text-slate-300">Forecasted Demand (Predicted)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-cyan-500/20 border border-cyan-400/50 rounded"></span>
              <span className="text-slate-700 dark:text-slate-300">95% Confidence Corridor</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Stockout Risk by Category */}
        <div className="hud-panel p-5 rounded-xl flex flex-col justify-between">
          <div>
            <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Stockout Risk Distribution
              </span>
              <span className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold">{criticalItems.length} Critical</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Assessed via Lead Time & Burn Velocity
            </p>

            <div className="space-y-3.5 mt-5">
              {stockoutRiskDistribution.map((item, idx) => {
                const total = inventory.length || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                      <span className="text-slate-900 dark:text-white font-bold tabular-nums">{item.count} items ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCurrentTab('inventory')}
              className="w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-cyan-700 dark:text-cyan-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Inspect All Critical Items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
