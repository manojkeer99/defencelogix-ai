import React, { useState } from 'react';
import { 
  MapPin, 
  ShieldAlert, 
  TrendingUp, 
  Package, 
  Radio, 
  CloudSnow, 
  HelpCircle, 
  X, 
  ChevronRight, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Mountain,
  Truck,
  Activity,
  Droplets,
  Thermometer,
  Layers
} from 'lucide-react';
import { LocationLogisticsStatus, LogisticsLocation } from '../types';

interface LocationLogisticsStatusSectionProps {
  locationStatuses: LocationLogisticsStatus[];
  setCurrentTab?: (tab: string) => void;
  onRefresh?: () => void;
}

export const LocationLogisticsStatusSection: React.FC<LocationLogisticsStatusSectionProps> = ({
  locationStatuses,
  setCurrentTab,
  onRefresh
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locationStatuses[0]?.locationId || '');
  const [selectedForWhy, setSelectedForWhy] = useState<LocationLogisticsStatus | null>(null);
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const criticalCount = locationStatuses.filter(l => l.overallLogisticsRisk === 'CRITICAL').length;
  const highCount = locationStatuses.filter(l => l.overallLogisticsRisk === 'HIGH').length;
  const mediumCount = locationStatuses.filter(l => l.overallLogisticsRisk === 'MEDIUM').length;
  const lowCount = locationStatuses.filter(l => l.overallLogisticsRisk === 'LOW').length;

  const filteredLocations = riskFilter === 'ALL' 
    ? locationStatuses 
    : locationStatuses.filter(l => l.overallLogisticsRisk === riskFilter);

  const selectedLoc = locationStatuses.find(l => l.locationId === selectedLocationId) || locationStatuses[0];

  const getRiskBadge = (risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    switch (risk) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/60 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            CRITICAL RISK
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            HIGH RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            MEDIUM RISK
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            LOW RISK
          </span>
        );
    }
  };

  const getWeatherImpactBadge = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (level) {
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/40">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40">MED</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/30">LOW</span>;
    }
  };

  return (
    <div className="hud-panel p-5 rounded-xl border border-cyan-500/30 space-y-4 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-cyan-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold tracking-wide text-white">
                LOCATION-LEVEL LOGISTICS STATUS & MULTI-FACTOR RISK ENGINE
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                Explainable Scoring
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Synthesis of Inventory Deficits + Live Weather + Mountain Terrain + IoT Telemetry + Route Connectivity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {setCurrentTab && (
            <button
              onClick={() => setCurrentTab('gis')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-mono text-xs font-semibold transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Open in GIS Map</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Risk Category Filter Bar (Prompt 5 Requirement 4) */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-xs font-mono text-slate-400 uppercase font-bold mr-1">Filter by Risk:</span>
        <button
          onClick={() => setRiskFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
            riskFilter === 'ALL'
              ? 'bg-slate-700 border-slate-500 text-white font-bold'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          ALL BASES ({locationStatuses.length})
        </button>
        <button
          onClick={() => setRiskFilter('CRITICAL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
            riskFilter === 'CRITICAL'
              ? 'bg-rose-600 border-rose-400 text-white font-bold shadow-md shadow-rose-950/60'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300 hover:bg-rose-950/50'
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-rose-400 mr-1.5 animate-pulse" />
          CRITICAL RISK ({criticalCount})
        </button>
        <button
          onClick={() => setRiskFilter('HIGH')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
            riskFilter === 'HIGH'
              ? 'bg-amber-600 border-amber-400 text-white font-bold shadow-md shadow-amber-950/60'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-950/50'
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5" />
          HIGH RISK ({highCount})
        </button>
        <button
          onClick={() => setRiskFilter('MEDIUM')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
            riskFilter === 'MEDIUM'
              ? 'bg-cyan-600 border-cyan-400 text-white font-bold shadow-md'
              : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50'
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 mr-1.5" />
          MEDIUM RISK ({mediumCount})
        </button>
        <button
          onClick={() => setRiskFilter('LOW')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
            riskFilter === 'LOW'
              ? 'bg-emerald-600 border-emerald-400 text-white font-bold shadow-md'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/50'
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
          LOW RISK ({lowCount})
        </button>
      </div>

      {/* Predictive Logistics Overview Table (Prompt 5 Requirement 2) */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Predictive Logistics Overview ({filteredLocations.length} Facilities)
          </span>
          <span className="text-[11px] text-slate-400">
            Click any row to inspect tactical telemetry
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Location</th>
                <th className="p-3">Current Stock</th>
                <th className="p-3">7d Demand</th>
                <th className="p-3">Projected Stock</th>
                <th className="p-3">Stockout Risk</th>
                <th className="p-3">Anticipated Reorder</th>
                <th className="p-3">Overall Risk</th>
                <th className="p-3 text-right">Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLocations.map(loc => {
                const isSelected = loc.locationId === selectedLocationId;
                return (
                  <tr 
                    key={loc.locationId}
                    onClick={() => setSelectedLocationId(loc.locationId)}
                    className={`hover:bg-slate-900/70 transition-colors cursor-pointer ${
                      isSelected ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-bold text-white">{loc.locationName.split('(')[0].trim()}</div>
                      <div className="text-[10px] text-cyan-400 mt-0.5">{loc.locationCode} • {loc.altitudeMeters}m</div>
                    </td>
                    <td className="p-3 text-slate-200 font-semibold">
                      {loc.totalCurrentStock.toLocaleString()}
                    </td>
                    <td className="p-3 text-cyan-300 font-semibold">
                      {loc.totalForecastDemand7d.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={loc.totalProjectedInventory7d < loc.totalSafetyStock ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {loc.totalProjectedInventory7d.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        loc.averageStockoutRisk >= 75 ? 'bg-rose-950 text-rose-300 border border-rose-500/50' :
                        loc.averageStockoutRisk >= 50 ? 'bg-amber-950 text-amber-300 border border-amber-500/50' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {loc.averageStockoutRisk}%
                      </span>
                    </td>
                    <td className="p-3">
                      {loc.totalRequiredQuantity > 0 ? (
                        <div>
                          <span className="text-cyan-300 font-bold">+{loc.totalRequiredQuantity.toLocaleString()}</span>
                          <span className="block text-[10px] text-amber-400">{loc.topPriorityAction}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Optimal (0)</span>
                      )}
                    </td>
                    <td className="p-3">
                      {getRiskBadge(loc.overallLogisticsRisk)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLocationId(loc.locationId);
                          setSelectedForWhy(loc);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <HelpCircle className="w-3 h-3 text-cyan-400" />
                        <span>Why?</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Location Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-thin">
        {filteredLocations.map(loc => {
          const isSelected = loc.locationId === selectedLocationId;
          const isCrit = loc.overallLogisticsRisk === 'CRITICAL';
          const isHigh = loc.overallLogisticsRisk === 'HIGH';

          return (
            <button
              key={loc.locationId}
              onClick={() => setSelectedLocationId(loc.locationId)}
              className={`px-3 py-2 rounded-lg text-left whitespace-nowrap transition-all cursor-pointer border ${
                isSelected 
                  ? 'bg-cyan-950 border-cyan-500 text-white font-bold shadow-sm' 
                  : isCrit 
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-300 hover:bg-rose-950/50' 
                    : isHigh 
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-300 hover:bg-amber-950/40' 
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  isCrit ? 'bg-rose-400 animate-ping' :
                  isHigh ? 'bg-amber-400' :
                  loc.overallLogisticsRisk === 'MEDIUM' ? 'bg-cyan-400' : 'bg-emerald-400'
                }`} />
                <span className="truncate max-w-[130px]">{loc.locationName.split('(')[0].trim()}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-normal">
                {loc.overallLogisticsRisk} RISK
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Location Comprehensive Tactical HUD */}
      {selectedLoc && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          {/* Top Banner of Selected Node */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 font-bold">[{selectedLoc.locationCode}]</span>
                <h3 className="font-heading text-base font-bold text-white">
                  {selectedLoc.locationName}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Mountain className="w-3.5 h-3.5 text-slate-500" />
                  {selectedLoc.altitudeMeters}m ({selectedLoc.terrainType})
                </span>
                <span>•</span>
                <span>Access: <strong className="text-slate-200">{selectedLoc.accessibilityStatus}</strong></span>
                <span>•</span>
                <span>Weather: <strong className="text-slate-200">{selectedLoc.weatherCondition} ({selectedLoc.temperatureC}°C)</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Overall Risk Level</span>
                <div className="mt-0.5">{getRiskBadge(selectedLoc.overallLogisticsRisk)}</div>
              </div>
              <button
                onClick={() => setSelectedForWhy(selectedLoc)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="View Full Risk Scoring Analysis"
              >
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>Why this Risk?</span>
              </button>
            </div>
          </div>

          {/* 10 Operational Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs font-mono">
            {/* 1. Current Inventory */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Current Inventory</span>
              <div className="text-lg font-heading font-bold text-white mt-1">
                {selectedLoc.totalCurrentStock.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">{selectedLoc.totalItemsCount} Tracked Items</span>
            </div>

            {/* 2. Daily Consumption */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Daily Consumption</span>
              <div className="text-lg font-heading font-bold text-slate-200 mt-1">
                {selectedLoc.totalDailyConsumption.toLocaleString()}/day
              </div>
              <span className="text-[10px] text-slate-400">Burn velocity</span>
            </div>

            {/* 3. 7-Day Forecast Demand */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-cyan-500/30">
              <span className="text-[10px] text-cyan-400 uppercase block">7d Forecast Demand</span>
              <div className="text-lg font-heading font-bold text-cyan-300 mt-1">
                {selectedLoc.totalForecastDemand7d.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">Demand trajectory</span>
            </div>

            {/* 4. Projected 7d Inventory */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Projected 7d Stock</span>
              <div className={`text-lg font-heading font-bold mt-1 ${
                selectedLoc.totalProjectedInventory7d < selectedLoc.totalSafetyStock ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {selectedLoc.totalProjectedInventory7d.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">After 7-day burn</span>
            </div>

            {/* 5. Safety Stock Reserve */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Safety Stock Reserve</span>
              <div className="text-lg font-heading font-bold text-slate-200 mt-1">
                {selectedLoc.totalSafetyStock.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">Required buffer</span>
            </div>

            {/* 6. Stockout Risk Score */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Stockout Risk</span>
              <div className={`text-lg font-heading font-bold mt-1 ${
                selectedLoc.averageStockoutRisk >= 75 ? 'text-rose-400' :
                selectedLoc.averageStockoutRisk >= 50 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {selectedLoc.averageStockoutRisk}%
              </div>
              <span className="text-[10px] text-slate-400">Average line risk</span>
            </div>

            {/* 7. Anticipated Requirement */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-cyan-500/40 bg-cyan-950/20">
              <span className="text-[10px] text-cyan-300 uppercase block">Anticipated Reorder</span>
              <div className="text-lg font-heading font-bold text-cyan-200 mt-1">
                {selectedLoc.totalRequiredQuantity > 0 ? `+${selectedLoc.totalRequiredQuantity.toLocaleString()}` : '0'}
              </div>
              <span className="text-[10px] text-cyan-400 font-bold">{selectedLoc.topPriorityAction}</span>
            </div>

            {/* 8. Weather Impact */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Weather Impact</span>
              <div className="flex items-center gap-2 mt-1">
                <CloudSnow className={`w-4 h-4 ${selectedLoc.weatherImpact === 'HIGH' ? 'text-rose-400' : 'text-cyan-400'}`} />
                <span className="text-sm font-bold text-white">{selectedLoc.weatherCondition}</span>
              </div>
              <div className="mt-0.5">{getWeatherImpactBadge(selectedLoc.weatherImpact)}</div>
            </div>

            {/* 9. Terrain & Accessibility */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Terrain & Access</span>
              <div className="text-sm font-bold text-slate-200 mt-1 truncate">
                {selectedLoc.terrainType}
              </div>
              <span className={`text-[10px] font-bold ${selectedLoc.accessibilityRisk === 'HIGH' ? 'text-rose-400' : 'text-slate-400'}`}>
                {selectedLoc.accessibilityRisk} Risk Corridors
              </span>
            </div>

            {/* 10. IoT Sensor Status */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">IoT Edge Health</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Radio className={`w-3.5 h-3.5 ${selectedLoc.hasActiveAnomalies ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
                <span className="text-xs font-bold text-white truncate">{selectedLoc.iotStatusSummary}</span>
              </div>
              <span className="text-[10px] text-slate-400">{selectedLoc.sensorsTotal} Sensors Monitored</span>
            </div>
          </div>

          {/* Quick Explainable Summary Bullets */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
              Automated Decision-Support Assessment:
            </span>
            <ul className="space-y-1 text-slate-300">
              {selectedLoc.whyReasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 font-bold">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* High & Critical Risk Locations Focus Cards (Prompt 5 Requirement 4) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="font-bold text-white uppercase tracking-wider">
              High & Critical Risk Locations Focus ({locationStatuses.filter(l => l.overallLogisticsRisk === 'CRITICAL' || l.overallLogisticsRisk === 'HIGH').length})
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Prioritized operational intervention roster
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {locationStatuses
            .filter(l => l.overallLogisticsRisk === 'CRITICAL' || l.overallLogisticsRisk === 'HIGH')
            .map(loc => {
              const isCrit = loc.overallLogisticsRisk === 'CRITICAL';
              return (
                <div 
                  key={loc.locationId}
                  onClick={() => setSelectedLocationId(loc.locationId)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 bg-slate-950/90 ${
                    isCrit 
                      ? 'border-rose-500/50 hover:border-rose-400 shadow-lg shadow-rose-950/20' 
                      : 'border-amber-500/40 hover:border-amber-400 shadow-md shadow-amber-950/10'
                  }`}
                >
                  {/* Card Header: Location & Risk Level */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">[{loc.locationCode}]</span>
                        <h4 className="font-heading text-sm font-bold text-white">{loc.locationName}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                        {loc.altitudeMeters}m ASL • {loc.terrainType} • Composite Score: {loc.compositeRiskScore}/100
                      </span>
                    </div>
                    {/* 1. Risk Level */}
                    <div>{getRiskBadge(loc.overallLogisticsRisk)}</div>
                  </div>

                  {/* 2. Main Reason */}
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Main Risk Driver:</span>
                    <p className={`mt-0.5 leading-snug font-medium ${isCrit ? 'text-rose-300' : 'text-amber-300'}`}>
                      {loc.whyReasons[0] || 'Severe inventory deficit compounded by pass environmental hazards'}
                    </p>
                  </div>

                  {/* 3, 4, 5, 6 Parameters Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    {/* 3. Current Inventory */}
                    <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase block">Current Stock</span>
                      <span className="text-sm font-bold text-white mt-0.5 block">
                        {loc.totalCurrentStock.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-500">{loc.totalItemsCount} items</span>
                    </div>

                    {/* 4. Forecast Demand */}
                    <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
                      <span className="text-[9px] text-cyan-400 uppercase block">7d Forecast</span>
                      <span className="text-sm font-bold text-cyan-300 mt-0.5 block">
                        {loc.totalForecastDemand7d.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-500">Proj: {loc.totalProjectedInventory7d.toLocaleString()}</span>
                    </div>

                    {/* 5. Environmental Impact */}
                    <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase block">Environment</span>
                      <span className="text-xs font-bold text-slate-200 mt-0.5 block truncate">
                        {loc.weatherCondition}
                      </span>
                      <span className="text-[9px] text-slate-400">{loc.temperatureC}°C ({loc.weatherImpact} Imp.)</span>
                    </div>

                    {/* 6. Sensor Status */}
                    <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase block">Sensor Status</span>
                      <span className={`text-xs font-bold mt-0.5 block truncate ${
                        loc.hasActiveAnomalies ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {loc.iotStatusSummary}
                      </span>
                      <span className="text-[9px] text-slate-500">{loc.sensorsTotal} Edge Nodes</span>
                    </div>
                  </div>

                  {/* 7. Recommended Action & Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">Recommended Action:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                        {loc.topPriorityAction}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLocationId(loc.locationId);
                        setSelectedForWhy(loc);
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspect Breakdown</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Explainable Risk Modal */}
      {selectedForWhy && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-xl p-5 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
                  Explainable Multi-Factor Risk Assessment Engine
                </span>
                <h3 className="font-heading text-base font-bold text-white mt-0.5">
                  {selectedForWhy.locationName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedForWhy(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Assigned Risk Level</span>
                <div className="mt-1">{getRiskBadge(selectedForWhy.overallLogisticsRisk)}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] uppercase block">Composite Score</span>
                <span className="text-xl font-heading font-bold text-cyan-300">{selectedForWhy.compositeRiskScore} / 100</span>
              </div>
            </div>

            {/* 5 Risk Factors Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Factor Weighting & Rule Evaluations:
              </span>

              <div className="space-y-2 text-xs font-mono">
                {/* 1. Inventory Risk */}
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Package className="w-3.5 h-3.5 text-cyan-400" />
                      <span>1. Inventory Risk (Weight: 35%)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedForWhy.riskFactorBreakdown.inventoryRisk.reason}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    selectedForWhy.riskFactorBreakdown.inventoryRisk.level === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-500/50' :
                    selectedForWhy.riskFactorBreakdown.inventoryRisk.level === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-500/50' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  }`}>
                    {selectedForWhy.riskFactorBreakdown.inventoryRisk.level}
                  </span>
                </div>

                {/* 2. Weather Risk */}
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <CloudSnow className="w-3.5 h-3.5 text-cyan-400" />
                      <span>2. Weather Risk (Weight: 20%)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedForWhy.riskFactorBreakdown.weatherRisk.reason}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    selectedForWhy.riskFactorBreakdown.weatherRisk.level === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-500/50' :
                    selectedForWhy.riskFactorBreakdown.weatherRisk.level === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-500/50' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  }`}>
                    {selectedForWhy.riskFactorBreakdown.weatherRisk.level}
                  </span>
                </div>

                {/* 3. Terrain Risk */}
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                      <span>3. Terrain & Accessibility (Weight: 15%)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedForWhy.riskFactorBreakdown.terrainRisk.reason}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    selectedForWhy.riskFactorBreakdown.terrainRisk.level === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-500/50' :
                    selectedForWhy.riskFactorBreakdown.terrainRisk.level === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-500/50' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  }`}>
                    {selectedForWhy.riskFactorBreakdown.terrainRisk.level}
                  </span>
                </div>

                {/* 4. IoT Sensor Risk */}
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      <span>4. IoT Storage Telemetry (Weight: 15%)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedForWhy.riskFactorBreakdown.iotRisk.reason}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    selectedForWhy.riskFactorBreakdown.iotRisk.level === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-500/50' :
                    selectedForWhy.riskFactorBreakdown.iotRisk.level === 'HIGH' || selectedForWhy.riskFactorBreakdown.iotRisk.level === 'WARNING' as any ? 'bg-amber-950 text-amber-300 border border-amber-500/50' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  }`}>
                    {selectedForWhy.riskFactorBreakdown.iotRisk.level}
                  </span>
                </div>

                {/* 5. Route Risk */}
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Truck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>5. Transport Route Connectivity (Weight: 15%)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedForWhy.riskFactorBreakdown.routeRisk.reason}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    selectedForWhy.riskFactorBreakdown.routeRisk.level === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-500/50' :
                    selectedForWhy.riskFactorBreakdown.routeRisk.level === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border border-amber-500/50' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  }`}>
                    {selectedForWhy.riskFactorBreakdown.routeRisk.level}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-500">Transparent Rule Engine</span>
              <button
                onClick={() => setSelectedForWhy(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
