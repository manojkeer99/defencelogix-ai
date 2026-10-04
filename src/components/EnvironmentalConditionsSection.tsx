import React, { useState } from 'react';
import { 
  CloudSun, 
  Wind, 
  Droplets, 
  Thermometer, 
  Mountain, 
  MapPin, 
  ShieldAlert, 
  Compass, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Radio,
  ExternalLink,
  ChevronRight,
  Battery,
  Gauge
} from 'lucide-react';
import { LogisticsLocation, WeatherData, WeatherImpactLevel, IoTSensorNode } from '../types';

interface EnvironmentalConditionsSectionProps {
  locations: LogisticsLocation[];
  sensors?: IoTSensorNode[];
  onSelectLocation?: (loc: LogisticsLocation) => void;
  setCurrentTab?: (tab: string) => void;
}

export const EnvironmentalConditionsSection: React.FC<EnvironmentalConditionsSectionProps> = ({
  locations,
  sensors = [],
  onSelectLocation,
  setCurrentTab
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || '');
  const [refreshing, setRefreshing] = useState(false);

  const selectedLoc = locations.find(l => l.id === selectedLocationId) || locations[0];

  const weather: WeatherData | undefined = selectedLoc?.weatherData;

  const tempDisplay = weather ? weather.temperatureC : selectedLoc?.temperatureC ?? 16;
  const precipDisplay = weather ? weather.precipitationMm : (selectedLoc?.weatherCondition.includes('Rain') ? 12 : selectedLoc?.weatherCondition.includes('Snow') ? 8 : 0);
  const windDisplay = weather ? weather.windSpeedKmH : 18;
  const conditionDisplay = weather ? weather.weatherCondition : selectedLoc?.weatherCondition ?? 'Clear';
  const impactDisplay: WeatherImpactLevel = weather?.weatherImpact || (tempDisplay < -10 || precipDisplay > 5 ? 'HIGH' : tempDisplay < 0 ? 'MEDIUM' : 'LOW');
  const reasonsDisplay = weather?.impactReasoning || [
    tempDisplay < -10 
      ? `Sub-zero cold (${tempDisplay}°C) mandates Winter Diesel (DHA-50) & wheel traction chain deployment`
      : 'Favorable operational weather conditions along route'
  ];
  const isRealPublicApi = weather?.source === 'OPEN_METEO_API';

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/weather');
    } catch {
      // ignore
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const getImpactBadge = (level: WeatherImpactLevel) => {
    switch (level) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            HIGH WEATHER IMPACT
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            MEDIUM WEATHER IMPACT
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            LOW WEATHER IMPACT
          </span>
        );
    }
  };

  const getLogisticsRiskBadge = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-500/50">
            CRITICAL DEFICIT
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-500/50">
            HIGH LOGISTICS RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/50">
            MEDIUM RISK
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50">
            OPTIMAL READINESS
          </span>
        );
    }
  };

  return (
    <div className="hud-panel p-5 rounded-xl border border-cyan-500/30 space-y-4 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-blue-950/40">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-cyan-400">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold tracking-wide text-white">
                ENVIRONMENTAL CONDITIONS & SECTOR TERRAIN INTELLIGENCE
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                Live Open-Meteo Integration
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Public weather telemetry + GIS terrain classification integrated for predictive route readiness
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sector Selector */}
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.type.replace('_', ' ')})
              </option>
            ))}
          </select>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer"
            title="Refresh Live Public Weather Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3 Environmental Columns (Weather, GIS / Terrain, Logistics Risk) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Live Public Weather Telemetry */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <CloudSun className="w-4 h-4" />
              1. Weather Telemetry
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isRealPublicApi 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
            }`}>
              {isRealPublicApi ? 'REAL PUBLIC DATA: Open-Meteo' : 'SYNTHETIC FALLBACK'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* Temperature */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>Temperature</span>
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className={`text-xl font-heading font-bold mt-1 ${
                tempDisplay <= -10 ? 'text-cyan-300' : tempDisplay >= 38 ? 'text-amber-400' : 'text-white'
              }`}>
                {tempDisplay}°C
              </div>
              <span className="text-[10px] text-slate-400">
                {tempDisplay <= 0 ? 'Freezing conditions' : 'Ambient ground'}
              </span>
            </div>

            {/* Precipitation */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>Precipitation</span>
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-heading font-bold mt-1 text-blue-300">
                {precipDisplay} <span className="text-xs font-normal text-slate-400">mm</span>
              </div>
              <span className="text-[10px] text-slate-400 truncate block">
                {precipDisplay > 5 ? 'Heavy moisture' : precipDisplay > 0 ? 'Light moisture' : 'Zero precipitation'}
              </span>
            </div>

            {/* Wind Speed */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>Wind Speed</span>
                <Wind className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div className="text-xl font-heading font-bold mt-1 text-slate-200">
                {windDisplay} <span className="text-xs font-normal text-slate-400">km/h</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {windDisplay > 40 ? 'Gale / UAV restricted' : 'Normal convoy limits'}
              </span>
            </div>

            {/* Weather Status */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Weather Status</div>
              <div className="text-sm font-semibold text-white mt-1 truncate" title={conditionDisplay}>
                {conditionDisplay}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {weather?.humidityPercent || 50}% rel. humidity
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: GIS & Terrain Attributes */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <Mountain className="w-4 h-4" />
              2. GIS & Terrain Attributes
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
              DEMO TERRAIN ATTRIBUTES
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {/* Location & Code */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Target Node:
                </span>
                <span className="text-cyan-300 font-bold">{selectedLoc?.code}</span>
              </div>
              <div className="text-white font-semibold mt-0.5 truncate">
                {selectedLoc?.name}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Coordinates: {selectedLoc?.coordinates.lat.toFixed(4)}°N, {selectedLoc?.coordinates.lng.toFixed(4)}°E
              </div>
            </div>

            {/* Terrain Type & Elevation */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Terrain Classification:</span>
                <div className="text-slate-200 font-bold text-xs mt-0.5 truncate">
                  {selectedLoc?.terrainType}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px]">Elevation / Altitude:</span>
                <div className="text-cyan-300 font-bold text-xs mt-0.5">
                  {selectedLoc?.altitudeMeters.toLocaleString()} m ASL
                </div>
              </div>
            </div>

            {/* Accessibility Indicator */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px]">Accessibility Indicator:</span>
              <div className="text-slate-300 text-[11px] mt-0.5 font-semibold">
                {selectedLoc?.accessibilityIndicator || 'All-Weather Heavy Highway Corridor'}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: IoT Sensor Telemetry & Logistics Risk Assessment */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                <Radio className="w-4 h-4" />
                3. IoT Sensor & Risk Telemetry
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                EDGE SENSORS
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {/* IoT Sensors at this location */}
              {(() => {
                const nodeSensors = sensors.filter(s => s.locationId === selectedLoc?.id);
                const primarySensor = nodeSensors[0];

                if (!primarySensor) {
                  return (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                      No IoT sensor node stationed at this location.
                    </div>
                  );
                }

                const isCrit = primarySensor.status === 'CRITICAL';
                const isWarn = primarySensor.status === 'WARNING';
                const isOffline = primarySensor.status === 'OFFLINE';

                return (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold truncate max-w-[140px]" title={primarySensor.unitName}>
                        {primarySensor.unitName}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isCrit ? 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse' :
                        isWarn ? 'bg-amber-950 text-amber-300 border border-amber-500/50' :
                        isOffline ? 'bg-slate-800 text-slate-400' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {primarySensor.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <div>
                        <span>Fill: </span>
                        <strong className={primarySensor.storageLevelPercent < 25 ? 'text-rose-400' : 'text-slate-200'}>
                          {primarySensor.storageLevelPercent}%
                        </strong>
                      </div>
                      <div>
                        <span>Vault: </span>
                        <strong className="text-slate-200">{primarySensor.temperatureC}°C</strong>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Battery className="w-2.5 h-2.5" />
                        <strong className={primarySensor.batteryLevel < 20 ? 'text-rose-400' : 'text-slate-200'}>
                          {primarySensor.batteryLevel}%
                        </strong>
                      </div>
                    </div>

                    {primarySensor.hasAnomaly && (
                      <div className="text-[10px] text-rose-300 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="truncate">{primarySensor.anomalyDescription || 'Active threshold anomaly'}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Weather Impact */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 font-mono">Weather Impact:</span>
                  {getImpactBadge(impactDisplay)}
                </div>
                <ul className="mt-1 space-y-1 text-[11px] font-mono text-slate-300">
                  {reasonsDisplay.slice(0, 1).map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span className="truncate">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Logistics Risk */}
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-mono text-[11px]">Logistics Risk:</span>
                {getLogisticsRiskBadge(selectedLoc?.riskLevel || 'LOW')}
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {setCurrentTab && (
              <>
                <button
                  onClick={() => setCurrentTab('gis')}
                  className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3 h-3" />
                  <span>GIS Map</span>
                </button>
                <button
                  onClick={() => setCurrentTab('iot')}
                  className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Radio className="w-3 h-3" />
                  <span>IoT Telemetry</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Network Sector Weather Ticker */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
          <span>All Sectors Telemetry Quick-Scan (Click node to switch view):</span>
          <span className="text-slate-400">
            Source: <strong className="text-emerald-400">Open-Meteo Public API</strong> & OpenStreetMap
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
          {locations.slice(0, 5).map(loc => {
            const locWeather = loc.weatherData;
            const temp = locWeather ? locWeather.temperatureC : loc.temperatureC;
            const isSelected = loc.id === selectedLocationId;
            return (
              <div
                key={loc.id}
                onClick={() => setSelectedLocationId(loc.id)}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-sm' 
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 truncate">{loc.code}</span>
                  <span className={`font-bold ${temp < 0 ? 'text-cyan-300' : 'text-slate-300'}`}>
                    {temp}°C
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {locWeather?.weatherCondition || loc.weatherCondition}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
