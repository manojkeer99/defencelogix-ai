import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Cpu, 
  Layers, 
  Compass, 
  CloudSun, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Sliders,
  Calendar,
  ShieldAlert,
  Package,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { InventoryItem, LogisticsLocation, ForecastResult } from '../types';

interface ForecastingViewProps {
  inventory: InventoryItem[];
  locations: LogisticsLocation[];
}

export const ForecastingView: React.FC<ForecastingViewProps> = ({ inventory, locations }) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(inventory[0] || null);
  const [modelType, setModelType] = useState<'Moving Average' | 'Exponential Smoothing' | 'Random Forest' | 'Gradient Boosting' | 'LSTM'>('Random Forest');
  const [horizonDays, setHorizonDays] = useState<7 | 14 | 30>(14);
  const [operationalTempo, setOperationalTempo] = useState<'Routine' | 'Heightened Readiness' | 'Field Exercise' | 'Surge Ops'>('Heightened Readiness');
  const [weatherCategory, setWeatherCategory] = useState<'Clear' | 'Extreme Cold / Blizzard' | 'Sandstorm' | 'Monsoon Rain' | 'Dense Fog'>('Extreme Cold / Blizzard');

  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; predicted: number; actual?: number } | null>(null);

  const runForecast = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      const res = await fetch('/api/forecast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.itemId,
          locationId: selectedItem.locationId,
          modelType,
          horizonDays,
          operationalTempo,
          weatherFactor: weatherCategory
        })
      });
      if (res.ok) {
        const data = await res.json();
        setForecast(data.forecast);
      }
    } catch (err) {
      console.error('Forecast generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      runForecast();
    }
  }, [selectedItem, modelType, horizonDays, operationalTempo, weatherCategory]);

  // Derived decision pipeline values
  const dailyDemand = selectedItem ? selectedItem.dailyConsumption : 25;
  const currentStock = selectedItem ? selectedItem.currentStock : 200;
  const predictedTotal = forecast ? forecast.predictedDemandTotal : dailyDemand * horizonDays;
  const projectedInventory = Math.max(0, currentStock - predictedTotal);
  const stockoutRisk = selectedItem ? selectedItem.stockoutRiskScore : 45;
  const anticipatedReq = forecast ? forecast.recommendedReplenishment : Math.max(0, predictedTotal - currentStock);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-cyan-500/30 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-slate-900 dark:text-white">
              PREDICTIVE DEMAND FORECASTING
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Explainable time-series demand estimation accounting for terrain factors, severe weather multipliers & operational tempo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runForecast}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Calculating...' : 'Recalculate'}</span>
          </button>
        </div>
      </div>

      {/* 6-Stage End-to-End Decision Support Pipeline (Requirement 8) */}
      <div className="p-4 rounded-xl border bg-white dark:bg-slate-900/90 border-slate-200 dark:border-cyan-500/30 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Predictive Decision Support Workflow
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            Explainable 6-Stage Pipeline
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Stage 1: Historical Demand */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              1. Historical Demand
            </span>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono mt-1 tabular-nums">
              {dailyDemand} {selectedItem?.unit}/d
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              30-day baseline avg
            </span>
          </div>

          {/* Stage 2: Demand Forecast */}
          <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/40 text-center">
            <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-300 uppercase font-semibold block">
              2. Demand Forecast
            </span>
            <div className="text-base font-bold text-cyan-700 dark:text-cyan-300 font-mono mt-1 tabular-nums">
              {predictedTotal} {selectedItem?.unit}
            </div>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 block mt-0.5">
              {horizonDays}d forecast target
            </span>
          </div>

          {/* Stage 3: Projected Inventory */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              3. Projected Inventory
            </span>
            <div className={`text-base font-bold font-mono mt-1 tabular-nums ${
              projectedInventory < (selectedItem?.minStock || 50) ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
            }`}>
              {projectedInventory} {selectedItem?.unit}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Buffer at day +{horizonDays}
            </span>
          </div>

          {/* Stage 4: Stockout Risk */}
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/40 text-center">
            <span className="text-[10px] font-mono text-rose-700 dark:text-rose-300 uppercase font-semibold block">
              4. Stockout Risk
            </span>
            <div className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono mt-1 tabular-nums">
              {stockoutRisk}%
            </div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block mt-0.5">
              {selectedItem?.stockoutRiskCategory || 'High'} Probability
            </span>
          </div>

          {/* Stage 5: Anticipated Requirement */}
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/40 text-center">
            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 uppercase font-semibold block">
              5. Anticipated Requirement
            </span>
            <div className="text-base font-bold text-amber-600 dark:text-amber-300 font-mono mt-1 tabular-nums">
              +{anticipatedReq} {selectedItem?.unit}
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5">
              Reorder volume
            </span>
          </div>

          {/* Stage 6: Recommendation */}
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-center">
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 uppercase font-semibold block">
              6. Recommendation
            </span>
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-sans mt-1 truncate">
              {anticipatedReq > 0 ? 'Pre-Position' : 'Nominal Hold'}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
              Automated Solver
            </span>
          </div>
        </div>
      </div>

      {/* Model & Input Configuration Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Param 1: Target Inventory Item */}
        <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
            Supply SKU Target
          </label>
          <select
            value={selectedItem?.id || ''}
            onChange={(e) => {
              const item = inventory.find(i => i.id === e.target.value);
              if (item) setSelectedItem(item);
            }}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {inventory.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.locationName})
              </option>
            ))}
          </select>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between font-mono">
            <span>Current: {selectedItem?.currentStock} {selectedItem?.unit}</span>
            <span>Min: {selectedItem?.minStock}</span>
          </div>
        </div>

        {/* Param 2: Forecasting Engine Algorithm */}
        <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
            Forecasting Model
          </label>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value as any)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="Random Forest">Adaptive Ensemble Trees</option>
            <option value="Gradient Boosting">Gradient-Boosted Step Estimation</option>
            <option value="Exponential Smoothing">Exponential Smoothing (Holt-Winters)</option>
            <option value="Moving Average">Sliding Consumption Window</option>
            <option value="LSTM">Sequential Recurrent Filter</option>
          </select>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
            <span>Method:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Heuristic / Explainable</span>
          </div>
        </div>

        {/* Param 3: Operational Tempo */}
        <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
            Operational Tempo
          </label>
          <select
            value={operationalTempo}
            onChange={(e) => setOperationalTempo(e.target.value as any)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="Routine">Routine Garrison (1.0x)</option>
            <option value="Heightened Readiness">Heightened Readiness (1.25x)</option>
            <option value="Field Exercise">Field Exercise (1.50x)</option>
            <option value="Surge Ops">Surge Operational Readiness (1.85x)</option>
          </select>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
            <span>Tempo Multiplier:</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              {operationalTempo === 'Routine' ? '1.0x' : operationalTempo === 'Heightened Readiness' ? '1.25x' : operationalTempo === 'Field Exercise' ? '1.50x' : '1.85x'}
            </span>
          </div>
        </div>

        {/* Param 4: Weather & Forecast Window */}
        <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
            Weather & Horizon
          </label>
          <div className="flex gap-2">
            <select
              value={weatherCategory}
              onChange={(e) => setWeatherCategory(e.target.value as any)}
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="Clear">Clear Weather</option>
              <option value="Extreme Cold / Blizzard">Extreme Cold (-14°C)</option>
              <option value="Sandstorm">Sandstorm</option>
              <option value="Monsoon Rain">Monsoon Rain</option>
              <option value="Dense Fog">Dense Mountain Fog</option>
            </select>
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value) as any)}
              className="w-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value={7}>7d</option>
              <option value={14}>14d</option>
              <option value={30}>30d</option>
            </select>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
            <span>Forecast Window:</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">{horizonDays} Days Ahead</span>
          </div>
        </div>
      </div>

      {/* Forecast Output KPIs */}
      {forecast && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="hud-panel p-4 rounded-xl">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Projected Total Demand ({horizonDays}d)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-heading font-bold text-slate-900 dark:text-white tabular-nums">
                {forecast.predictedDemandTotal.toLocaleString()}
              </span>
              <span className="text-xs text-cyan-600 dark:text-cyan-400 font-mono">{selectedItem?.unit}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Estimated consumption over target horizon
            </p>
          </div>

          <div className="hud-panel p-4 rounded-xl">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Forecast Confidence
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-heading font-bold ${
                forecast.confidenceLevel === 'High' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {forecast.confidenceLevel}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">(MAPE: {forecast.metrics.mape}%)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Historical cross-validation variance
            </p>
          </div>

          <div className="hud-panel hud-panel-danger p-4 rounded-xl">
            <span className="text-xs font-mono text-rose-600 dark:text-rose-300 uppercase tracking-wider font-semibold">
              Expected Shortage
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-heading font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {forecast.expectedShortage.toLocaleString()}
              </span>
              <span className="text-xs text-rose-600 dark:text-rose-300 font-mono">{selectedItem?.unit}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {forecast.expectedShortage > 0 ? 'Deficit below projected consumption' : 'Zero shortage expected'}
            </p>
          </div>

          <div className="hud-panel hud-panel-warning p-4 rounded-xl">
            <span className="text-xs font-mono text-amber-600 dark:text-amber-300 uppercase tracking-wider font-semibold">
              Recommended Replenishment
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-heading font-bold text-amber-600 dark:text-amber-300 tabular-nums">
                {forecast.recommendedReplenishment.toLocaleString()}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-300 font-mono">{selectedItem?.unit}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Includes safety buffer (Z = 2.33 / 99% SL)
            </p>
          </div>
        </div>
      )}

      {/* Interactive Charts & Forecast Series */}
      {forecast && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visualizer */}
          <div className="lg:col-span-2 hud-panel p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white">
                  Demand Forecasting Trajectory & Model Corridor
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  SKU: {forecast.itemName} | Node: {forecast.locationName} | Model: {forecast.modelUsed}
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-cyan-700 dark:text-cyan-300">
                Lead Time: {selectedItem?.leadTimeDays} Days
              </span>
            </div>

            {/* Visual Bar Comparison */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                  <span className="text-cyan-700 dark:text-cyan-400 font-semibold">Predicted Demand:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{forecast.predictedDemandTotal} {selectedItem?.unit}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-900 h-3 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full w-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Current Available Stock:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedItem?.currentStock} {selectedItem?.unit}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-900 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round(((selectedItem?.currentStock || 1) / Math.max(1, forecast.predictedDemandTotal)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Daily Predictions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-2.5">Horizon Date</th>
                    <th className="py-2.5">Benchmark Ref</th>
                    <th className="py-2.5">Demand Forecast</th>
                    <th className="py-2.5">Lower Corridor</th>
                    <th className="py-2.5">Upper Corridor</th>
                    <th className="py-2.5 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {forecast.dailySeries.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="py-2 text-slate-700 dark:text-slate-300">{d.date}</td>
                      <td className="py-2 text-emerald-600 dark:text-emerald-400 font-semibold">{d.actual ? `${d.actual} ${selectedItem?.unit}` : '— (Future)'}</td>
                      <td className="py-2 text-cyan-600 dark:text-cyan-400 font-bold">{d.predicted} {selectedItem?.unit}</td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">{d.lowerBound}</td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">{d.upperBound}</td>
                      <td className="py-2 text-right text-slate-500 dark:text-slate-400 tabular-nums">
                        ±{Math.round((d.upperBound - d.lowerBound) / 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Accuracy Metrics (MAE, RMSE, MAPE) */}
          <div className="hud-panel p-5 rounded-xl space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Model Accuracy Metrics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluation across backtested partition
              </p>

              <div className="space-y-3 mt-5">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-400">Mean Absolute Error (MAE):</span>
                    <span className="text-base font-bold text-cyan-700 dark:text-cyan-300 tabular-nums">{forecast.metrics.mae}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Average absolute prediction deviation in unit scale</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-400">Root Mean Squared Error:</span>
                    <span className="text-base font-bold text-cyan-700 dark:text-cyan-300 tabular-nums">{forecast.metrics.rmse}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Penalizes large outlier forecast errors</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-400">Mean Absolute % Error (MAPE):</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{forecast.metrics.mape}%</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Relative percentage precision (Industry standard &lt;10%)</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/30 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold text-cyan-800 dark:text-cyan-300 block mb-1">Tactical Logistics Advice:</span>
              Pre-position <strong>{forecast.recommendedReplenishment} {selectedItem?.unit}</strong> at {forecast.locationName} prior to lead-time window expiration to prevent stockout.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
