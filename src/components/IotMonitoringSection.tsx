import React, { useState } from 'react';
import { 
  Radio, 
  Thermometer, 
  Gauge, 
  Battery, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  RefreshCw, 
  ChevronRight,
  Zap,
  Info,
  ArrowRight
} from 'lucide-react';
import { IoTSensorNode, SensorStatusLevel, AlertItem } from '../types';
import { evaluateSensorAnomalies, IOT_THRESHOLDS } from '../utils/iotConfig';

interface IotMonitoringSectionProps {
  sensors: IoTSensorNode[];
  alerts?: AlertItem[];
  setCurrentTab?: (tab: string) => void;
  onRefresh?: () => void;
  onTriggerScenario?: (sensorId: string, scenario: 'temperature' | 'humidity' | 'low_storage' | 'low_battery' | 'offline') => Promise<void>;
  onResetSimulation?: () => Promise<void>;
}

export const IotMonitoringSection: React.FC<IotMonitoringSectionProps> = ({
  sensors,
  alerts = [],
  setCurrentTab,
  onRefresh,
  onTriggerScenario,
  onResetSimulation
}) => {
  const [selectedSensorId, setSelectedSensorId] = useState<string>(sensors[0]?.id || '');
  const [activeViewMode, setActiveViewMode] = useState<'cards' | 'table'>('cards');
  const [simulating, setSimulating] = useState(false);

  // Compute status counts
  const normalSensors = sensors.filter(s => (s.status === 'NORMAL' || !s.status) && !s.hasAnomaly);
  const warningSensors = sensors.filter(s => s.status === 'WARNING' || (s.hasAnomaly && s.anomalySeverity === 'WARNING'));
  const criticalSensors = sensors.filter(s => s.status === 'CRITICAL' || (s.hasAnomaly && s.anomalySeverity === 'CRITICAL'));
  const offlineSensors = sensors.filter(s => s.status === 'OFFLINE');
  const totalAnomalies = sensors.filter(s => s.hasAnomaly).length;

  const selectedSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];
  const { status: evaluatedStatus, anomalies: evaluatedAnomalies } = selectedSensor 
    ? evaluateSensorAnomalies(selectedSensor) 
    : { status: 'NORMAL' as SensorStatusLevel, anomalies: [] };

  const getStatusBadge = (status: SensorStatusLevel) => {
    switch (status) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-500/50 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            WARNING
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700 dark:bg-slate-900 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            OFFLINE
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            NORMAL
          </span>
        );
    }
  };

  const handleSimulate = async (scenario: 'temperature' | 'humidity' | 'low_storage' | 'low_battery' | 'offline') => {
    if (!selectedSensor || !onTriggerScenario) return;
    setSimulating(true);
    try {
      await onTriggerScenario(selectedSensor.id, scenario);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="hud-panel p-5 rounded-xl border border-slate-200 dark:border-cyan-500/30 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/90 border border-cyan-200 dark:border-cyan-500/40 text-cyan-600 dark:text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold tracking-wide text-slate-900 dark:text-white">
                IoT INVENTORY TELEMETRY & REAL-TIME ANOMALY DETECTOR
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40">
                Rule-Based Anomaly Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Automated environmental & storage monitoring across cryo units, fuel bladders, ammunition silos & ration shelters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveViewMode('cards')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeViewMode === 'cards' ? 'bg-cyan-600 text-white font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cards View
            </button>
            <button
              onClick={() => setActiveViewMode('table')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeViewMode === 'table' ? 'bg-cyan-600 text-white font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Table View
            </button>
          </div>

          {onResetSimulation && (
            <button
              onClick={onResetSimulation}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-xs"
              title="Reset Simulated Anomalies to Nominal Baseline"
            >
              Reset Simulation
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all cursor-pointer shadow-xs"
              title="Refresh Sensor Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 6 IoT KPI Status Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase block">Total Sensors</span>
          <div className="text-xl font-heading font-bold text-slate-900 dark:text-white mt-0.5">{sensors.length}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Deployed nodes</span>
        </div>

        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-slate-950 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
          <span className="text-emerald-700 dark:text-emerald-400 text-[10px] uppercase block font-semibold">Online / Normal</span>
          <div className="text-xl font-heading font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{normalSensors.length}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Nominal telemetry</span>
        </div>

        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-slate-950 border border-amber-200 dark:border-amber-500/30 shadow-xs">
          <span className="text-amber-700 dark:text-amber-300 text-[10px] uppercase block font-semibold">Warning</span>
          <div className="text-xl font-heading font-bold text-amber-700 dark:text-amber-300 mt-0.5">{warningSensors.length}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Threshold drift</span>
        </div>

        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-slate-950 border border-rose-200 dark:border-rose-500/40 shadow-xs">
          <span className="text-rose-700 dark:text-rose-400 text-[10px] uppercase block font-semibold">Critical</span>
          <div className="text-xl font-heading font-bold text-rose-700 dark:text-rose-400 mt-0.5">{criticalSensors.length}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Immediate hazard</span>
        </div>

        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase block">Offline</span>
          <div className="text-xl font-heading font-bold text-slate-700 dark:text-slate-400 mt-0.5">{offlineSensors.length}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">No beacon signal</span>
        </div>

        <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-slate-950 border border-cyan-200 dark:border-cyan-500/30 shadow-xs">
          <span className="text-cyan-800 dark:text-cyan-300 text-[10px] uppercase block font-semibold">Active Anomalies</span>
          <div className="text-xl font-heading font-bold text-cyan-800 dark:text-cyan-300 mt-0.5">{totalAnomalies}</div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Requiring review</span>
        </div>
      </div>

      {/* Main Content Area */}
      {activeViewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sensor Selector & Mini Cards Grid (2 Columns) */}
          <div className="lg:col-span-2 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>Deployed Storage Nodes ({sensors.length})</span>
              <span className="text-[10px]">Select a node to inspect & simulate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {sensors.map(sensor => {
                const isSelected = sensor.id === selectedSensorId;
                const status = sensor.status || 'NORMAL';
                return (
                  <div
                    key={sensor.id}
                    onClick={() => setSelectedSensorId(sensor.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer shadow-xs ${
                      isSelected 
                        ? 'bg-cyan-50 dark:bg-slate-900 border-cyan-500 shadow-sm' 
                        : status === 'CRITICAL'
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/50 hover:bg-rose-100'
                        : status === 'WARNING'
                        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/40 hover:bg-amber-100'
                        : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 font-bold">{sensor.sensorId}</span>
                        <h4 className="font-heading text-xs font-bold text-slate-900 dark:text-white truncate max-w-[190px]">
                          {sensor.unitName}
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">{sensor.locationName}</span>
                      </div>
                      <div>{getStatusBadge(status)}</div>
                    </div>

                    <div className="grid grid-cols-4 gap-1 mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Temp</span>
                        <span className={`font-bold ${sensor.temperatureC < 0 ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          {sensor.temperatureC}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Fill</span>
                        <span className={`font-bold ${sensor.storageLevelPercent < 25 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {sensor.storageLevelPercent}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Hum</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{sensor.humidityPercent}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Batt</span>
                        <span className={`font-bold ${sensor.batteryLevel < 20 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {sensor.batteryLevel}%
                        </span>
                      </div>
                    </div>

                    {sensor.hasAnomaly && sensor.anomalyDescription && (
                      <div className="mt-2 p-1.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 text-[10px] font-mono text-rose-800 dark:text-rose-300 truncate">
                        {sensor.anomalyDescription}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Node Diagnostic & Simulation Controller Drawer (1 Column) */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs">
            {selectedSensor ? (
              <div className="space-y-3">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 font-bold">{selectedSensor.sensorId}</span>
                    {getStatusBadge(selectedSensor.status || 'NORMAL')}
                  </div>
                  <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedSensor.unitName}
                  </h3>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {selectedSensor.locationName} • {selectedSensor.targetCategory}
                  </div>
                </div>

                {/* Telemetry Gauge Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Temperature</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{selectedSensor.temperatureC}°C</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Storage Reserve</span>
                    <span className={`text-base font-bold ${selectedSensor.storageLevelPercent < 25 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {selectedSensor.storageLevelPercent}% ({selectedSensor.quantity} units)
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Relative Humidity</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-300">{selectedSensor.humidityPercent}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Device Battery</span>
                    <span className={`text-base font-bold ${selectedSensor.batteryLevel < 20 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-300'}`}>
                      {selectedSensor.batteryLevel}%
                    </span>
                  </div>
                </div>

                {/* Detected Anomalies List */}
                <div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    Explainable Anomaly Diagnostics
                  </span>
                  {evaluatedAnomalies.length > 0 ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {evaluatedAnomalies.map(anom => (
                        <div key={anom.id} className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-[10px] font-mono text-rose-800 dark:text-rose-300 space-y-0.5">
                          <div className="flex justify-between font-bold">
                            <span>{anom.parameter}: {anom.currentValue}</span>
                            <span className="text-rose-600 dark:text-rose-400">{anom.severity}</span>
                          </div>
                          <div>Expected: {anom.expectedThreshold}</div>
                          <div className="text-slate-600 dark:text-slate-300 text-[9px]">{anom.reason}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>All telemetry parameters within normal operational envelope</span>
                    </div>
                  )}
                </div>

                {/* Safe Demo Anomaly Simulation Controls */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-cyan-700 dark:text-cyan-300">Simulate Anomaly Scenario:</span>
                    <span className="text-[9px] text-slate-400">Prototype Testing</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                    <button
                      onClick={() => handleSimulate('temperature')}
                      disabled={simulating}
                      className="px-2 py-1.5 rounded bg-slate-100 hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-950/60 border border-slate-200 hover:border-rose-300 dark:border-slate-800 dark:hover:border-rose-500/40 text-slate-700 hover:text-rose-700 dark:text-slate-300 dark:hover:text-rose-300 transition-colors cursor-pointer text-left truncate"
                    >
                      🔥 Temp Spike
                    </button>
                    <button
                      onClick={() => handleSimulate('humidity')}
                      disabled={simulating}
                      className="px-2 py-1.5 rounded bg-slate-100 hover:bg-amber-50 dark:bg-slate-900 dark:hover:bg-amber-950/60 border border-slate-200 hover:border-amber-300 dark:border-slate-800 dark:hover:border-amber-500/40 text-slate-700 hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300 transition-colors cursor-pointer text-left truncate"
                    >
                      💧 High Humidity
                    </button>
                    <button
                      onClick={() => handleSimulate('low_storage')}
                      disabled={simulating}
                      className="px-2 py-1.5 rounded bg-slate-100 hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-950/60 border border-slate-200 hover:border-rose-300 dark:border-slate-800 dark:hover:border-rose-500/40 text-slate-700 hover:text-rose-700 dark:text-slate-300 dark:hover:text-rose-300 transition-colors cursor-pointer text-left truncate"
                    >
                      📦 Low Stock (11%)
                    </button>
                    <button
                      onClick={() => handleSimulate('low_battery')}
                      disabled={simulating}
                      className="px-2 py-1.5 rounded bg-slate-100 hover:bg-amber-50 dark:bg-slate-900 dark:hover:bg-amber-950/60 border border-slate-200 hover:border-amber-300 dark:border-slate-800 dark:hover:border-amber-500/40 text-slate-700 hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-300 transition-colors cursor-pointer text-left truncate"
                    >
                      🔋 Low Battery (8%)
                    </button>
                    <button
                      onClick={() => handleSimulate('offline')}
                      disabled={simulating}
                      className="col-span-2 px-2 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-400 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-center truncate"
                    >
                      📡 Signal Drop (Sensor OFFLINE)
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {setCurrentTab && (
              <button
                onClick={() => setCurrentTab('inventory')}
                className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-cyan-500/30 text-xs font-mono text-cyan-700 dark:text-cyan-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
              >
                <span>Inspect Corresponding Inventory Item</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">Sensor ID / Unit</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Target Supply</th>
                <th className="py-2.5 px-3 text-right">Temp</th>
                <th className="py-2.5 px-3 text-right">Fill Level</th>
                <th className="py-2.5 px-3 text-right">Humidity</th>
                <th className="py-2.5 px-3 text-right">Battery</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {sensors.map(sensor => {
                const status = sensor.status || 'NORMAL';
                return (
                  <tr key={sensor.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{sensor.unitName}</div>
                      <div className="text-[10px] text-cyan-700 dark:text-cyan-400">{sensor.sensorId}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{sensor.locationName}</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{sensor.targetCategory}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                      {sensor.temperatureC}°C
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span className={sensor.storageLevelPercent < 25 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {sensor.storageLevelPercent}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">{sensor.humidityPercent}%</td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">{sensor.batteryLevel}%</td>
                    <td className="py-2.5 px-3 text-center">{getStatusBadge(status)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedSensorId(sensor.id);
                          setActiveViewMode('cards');
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-cyan-700 dark:text-cyan-300 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Data Transparency Disclaimer */}
      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            SIMULATED / DEMO DATA: Telemetry readings and sensor states are synthetic for prototype demonstration. Not real defence IoT devices.
          </span>
        </div>
        <span className="text-slate-500 dark:text-slate-400 shrink-0">
          Last Beacon Cycle: <strong className="text-slate-700 dark:text-slate-300">Just Now</strong>
        </span>
      </div>
    </div>
  );
};
