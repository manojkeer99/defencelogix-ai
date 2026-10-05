import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  Thermometer, 
  Gauge, 
  Battery, 
  RefreshCw, 
  Zap, 
  AlertTriangle, 
  Droplets, 
  Clock, 
  MapPin, 
  Sliders, 
  Search, 
  ArrowRight, 
  Info, 
  RotateCcw, 
  Layers, 
  AlertOctagon,
  Server
} from 'lucide-react';
import { 
  IoTSensorNode, 
  SensorStatusLevel, 
  AlertItem, 
  InventoryItem, 
  LogisticsLocation
} from '../types';
import { 
  IOT_THRESHOLDS, 
  evaluateSensorAnomalies, 
  evaluateNetworkAnomalies 
} from '../utils/iotConfig';

interface IotSensorsViewProps {
  sensors: IoTSensorNode[];
  alerts?: AlertItem[];
  inventory?: InventoryItem[];
  locations?: LogisticsLocation[];
  onTriggerScenario?: (sensorId: string, scenario: 'temperature' | 'humidity' | 'low_storage' | 'low_battery' | 'offline') => Promise<void>;
  onTriggerAnomaly?: (sensorId: string) => Promise<void>;
  onResetSimulation?: () => Promise<void>;
  onRefresh: () => void;
  setCurrentTab?: (tab: string) => void;
}

export const IotSensorsView: React.FC<IotSensorsViewProps> = ({
  sensors,
  onTriggerScenario,
  onTriggerAnomaly,
  onResetSimulation,
  onRefresh,
  setCurrentTab
}) => {
  const [selectedSensorId, setSelectedSensorId] = useState<string>(sensors[0]?.id || sensors[0]?.sensorId || '');
  const [triggeringScenario, setTriggeringScenario] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | SensorStatusLevel>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showThresholdsPanel, setShowThresholdsPanel] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const networkEvaluation = useMemo(() => {
    return evaluateNetworkAnomalies(sensors);
  }, [sensors]);

  const { normal, warning, critical, offline } = networkEvaluation.sensorsByStatus;
  const activeAnomalies = networkEvaluation.allAnomalies;
  const activeSensor = sensors.find(s => s.id === selectedSensorId || s.sensorId === selectedSensorId) || sensors[0];

  const filteredSensors = useMemo(() => {
    return sensors.filter(sensor => {
      const { status } = evaluateSensorAnomalies(sensor);
      const effectiveStatus = sensor.status === 'OFFLINE' ? 'OFFLINE' : (sensor.hasAnomaly ? sensor.status : status);

      const matchesStatus = selectedStatusFilter === 'ALL' || effectiveStatus === selectedStatusFilter;
      const matchesSearch = 
        sensor.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sensor.sensorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sensor.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sensor.targetCategory.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [sensors, selectedStatusFilter, searchTerm]);

  const handleTrigger = async (
    sensorId: string, 
    scenario: 'temperature' | 'humidity' | 'low_storage' | 'low_battery' | 'offline'
  ) => {
    setTriggeringScenario(`${sensorId}-${scenario}`);
    try {
      if (onTriggerScenario) {
        await onTriggerScenario(sensorId, scenario);
      } else if (onTriggerAnomaly) {
        await onTriggerAnomaly(sensorId);
      }
      setActionFeedback(`Simulated ${scenario.replace('_', ' ')} anomaly for ${sensorId}`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to trigger scenario:', err);
    } finally {
      setTriggeringScenario(null);
    }
  };

  const handleReset = async () => {
    setTriggeringScenario('reset');
    try {
      if (onResetSimulation) {
        await onResetSimulation();
      }
      setActionFeedback('All 12 IoT sensor nodes reset to nominal baseline');
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to reset simulation:', err);
    } finally {
      setTriggeringScenario(null);
    }
  };

  const getStatusBadge = (status: SensorStatusLevel) => {
    switch (status) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/50 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            WARNING
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            OFFLINE
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            NORMAL
          </span>
        );
    }
  };

  const formatLastPing = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Live ping';
      if (mins === 1) return '1m ago';
      return `${mins}m ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-cyan-500/30 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-slate-900 dark:text-white">
              IoT INVENTORY SENSORS & TELEMETRY
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Synthetic vault monitoring: cryo blood, POL fuel bladders, ammunition silos & ration depots
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowThresholdsPanel(!showThresholdsPanel)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-mono text-cyan-700 dark:text-cyan-300 transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showThresholdsPanel ? 'Hide Thresholds' : 'Limits Envelope'}</span>
          </button>

          <button
            onClick={handleReset}
            disabled={triggeringScenario === 'reset'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 transition-all cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${triggeringScenario === 'reset' ? 'animate-spin' : ''}`} />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all cursor-pointer"
            title="Poll Sensors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/50 text-cyan-800 dark:text-cyan-200 text-xs font-mono flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="hud-panel p-3.5 rounded-xl">
          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Nodes</div>
          <div className="text-2xl font-heading font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {sensors.length}
          </div>
          <div className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 mt-0.5">Active Telemetry</div>
        </div>

        <div className="hud-panel p-3.5 rounded-xl border-emerald-300/40 dark:border-emerald-500/30">
          <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Normal Nodes</div>
          <div className="text-2xl font-heading font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {normal.length}
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">In storage envelope</div>
        </div>

        <div className="hud-panel p-3.5 rounded-xl border-amber-300/40 dark:border-amber-500/30">
          <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase tracking-wider">Warning Nodes</div>
          <div className="text-2xl font-heading font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {warning.length}
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">Parameter drift</div>
        </div>

        <div className="hud-panel p-3.5 rounded-xl border-rose-300/40 dark:border-rose-500/30">
          <div className="text-[10px] font-mono text-rose-700 dark:text-rose-400 uppercase tracking-wider">Critical Nodes</div>
          <div className="text-2xl font-heading font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            {critical.length + offline.length}
          </div>
          <div className="text-[10px] font-mono text-rose-600 dark:text-rose-400 mt-0.5">Requires triage</div>
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="p-3 rounded-xl border bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search sensor ID, node, or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE'] as const).map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer border ${
                selectedStatusFilter === status
                  ? 'bg-cyan-600 border-cyan-600 text-white font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              viewMode === 'cards' ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Main Content: Cards vs Table */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSensors.map((sensor) => {
            const { status: evaluatedStatus, anomalies } = evaluateSensorAnomalies(sensor);
            const effectiveStatus = sensor.status === 'OFFLINE' ? 'OFFLINE' : (sensor.hasAnomaly ? sensor.status : evaluatedStatus);
            const isAnomaly = sensor.hasAnomaly || anomalies.length > 0;
            const isCriticalStorage = sensor.storageLevelPercent <= 15;

            return (
              <div 
                key={sensor.id}
                className={`hud-panel p-5 rounded-xl space-y-3.5 transition-all ${
                  effectiveStatus === 'CRITICAL' ? 'hud-panel-danger border-rose-400/60' :
                  effectiveStatus === 'WARNING' ? 'hud-panel-warning border-amber-400/50' :
                  effectiveStatus === 'OFFLINE' ? 'border-slate-400/40 opacity-80' : ''
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 font-bold">{sensor.sensorId}</span>
                      <span className="text-[10px] font-mono text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{sensor.targetCategory}</span>
                    </div>
                    <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                      {sensor.unitName}
                    </h3>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{sensor.locationName}</span>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(effectiveStatus)}
                  </div>
                </div>

                {/* 4 Telemetry Readings Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {/* Temperature */}
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Thermometer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Temp:</span>
                    </div>
                    <span className={`font-bold tabular-nums ${
                      sensor.temperatureC < -10 || sensor.temperatureC > 35 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {sensor.temperatureC > 0 ? `+${sensor.temperatureC}` : sensor.temperatureC}°C
                    </span>
                  </div>

                  {/* Humidity */}
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Droplets className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Humidity:</span>
                    </div>
                    <span className={`font-bold tabular-nums ${sensor.humidityPercent > 75 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {sensor.humidityPercent}%
                    </span>
                  </div>

                  {/* Storage Fill Level */}
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Server className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Reserve:</span>
                    </div>
                    <span className={`font-bold tabular-nums ${
                      sensor.storageLevelPercent <= 15 ? 'text-rose-600 dark:text-rose-400' :
                      sensor.storageLevelPercent <= 25 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {sensor.storageLevelPercent}%
                    </span>
                  </div>

                  {/* Pressure */}
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Gauge className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Pressure:</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">{sensor.containerPressurePsi} PSI</span>
                  </div>
                </div>

                {/* Storage Bar Indicator */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                    <span>Fill Level</span>
                    <span>{sensor.storageLevelPercent}% ({sensor.quantity} units)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        sensor.storageLevelPercent <= 15 ? 'bg-rose-500' :
                        sensor.storageLevelPercent <= 25 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${sensor.storageLevelPercent}%` }}
                    />
                  </div>
                </div>

                {/* Battery & Ping Metadata */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Battery className={`w-3.5 h-3.5 ${sensor.batteryLevel <= 15 ? 'text-rose-500' : 'text-emerald-500'}`} />
                    <span>Battery: <strong className="text-slate-800 dark:text-white tabular-nums">{sensor.batteryLevel}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatLastPing(sensor.lastPing)}</span>
                  </div>
                </div>

                {/* Anomaly Diagnosis Box */}
                {isAnomaly && (
                  <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-[11px] font-mono text-rose-800 dark:text-rose-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Anomaly Diagnosis:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-200">
                      {sensor.anomalyDescription || (anomalies[0]?.reason) || 'Telemetry threshold exceeded'}
                    </p>
                  </div>
                )}

                {/* Quick Test Actions */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-[10px] font-mono">
                  <span className="text-slate-500">Test Node:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTrigger(sensor.id, 'temperature')}
                      disabled={triggeringScenario !== null}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 border border-slate-300 dark:border-slate-700 cursor-pointer"
                    >
                      Heat/Freeze
                    </button>
                    <button
                      onClick={() => handleTrigger(sensor.id, 'low_storage')}
                      disabled={triggeringScenario !== null}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 border border-slate-300 dark:border-slate-700 cursor-pointer"
                    >
                      Deplete
                    </button>
                    <button
                      onClick={() => handleTrigger(sensor.id, 'offline')}
                      disabled={triggeringScenario !== null}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700 cursor-pointer"
                    >
                      Offline
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="hud-panel p-4 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="pb-3 font-semibold">Node ID</th>
                <th className="pb-3 font-semibold">Unit & Category</th>
                <th className="pb-3 font-semibold">Location</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Temp</th>
                <th className="pb-3 font-semibold">Humidity</th>
                <th className="pb-3 font-semibold">Storage</th>
                <th className="pb-3 font-semibold">Pressure</th>
                <th className="pb-3 font-semibold">Battery</th>
                <th className="pb-3 font-semibold">Last Ping</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredSensors.map((sensor) => {
                const { status: evaluatedStatus } = evaluateSensorAnomalies(sensor);
                const effectiveStatus = sensor.status === 'OFFLINE' ? 'OFFLINE' : (sensor.hasAnomaly ? sensor.status : evaluatedStatus);

                return (
                  <tr key={sensor.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 font-bold text-cyan-700 dark:text-cyan-300">{sensor.sensorId}</td>
                    <td className="py-2.5">
                      <div className="font-bold text-slate-900 dark:text-white font-sans">{sensor.unitName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{sensor.targetCategory}</div>
                    </td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">{sensor.locationName}</td>
                    <td className="py-2.5">{getStatusBadge(effectiveStatus)}</td>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {sensor.temperatureC > 0 ? `+${sensor.temperatureC}` : sensor.temperatureC}°C
                    </td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300 tabular-nums">{sensor.humidityPercent}%</td>
                    <td className="py-2.5">
                      <span className={`font-bold tabular-nums ${sensor.storageLevelPercent <= 15 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {sensor.storageLevelPercent}%
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300 tabular-nums">{sensor.containerPressurePsi} PSI</td>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200 tabular-nums">{sensor.batteryLevel}%</td>
                    <td className="py-2.5 text-[10px] text-slate-500 dark:text-slate-400">{formatLastPing(sensor.lastPing)}</td>
                    <td className="py-2.5">
                      <button
                        onClick={() => handleTrigger(sensor.id, 'low_storage')}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 transition-colors cursor-pointer text-[10px]"
                      >
                        Deplete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
