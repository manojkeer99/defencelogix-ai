import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  Thermometer, 
  Gauge, 
  ShieldAlert, 
  CheckCircle2, 
  Battery, 
  RefreshCw, 
  Zap, 
  AlertTriangle,
  Server,
  Droplets,
  Clock,
  MapPin,
  Sliders,
  Filter,
  Search,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ExternalLink,
  Layers,
  AlertOctagon
} from 'lucide-react';
import { 
  IoTSensorNode, 
  SensorStatusLevel, 
  AlertItem, 
  InventoryItem, 
  LogisticsLocation,
  SensorAnomalyRecord 
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
  alerts = [],
  inventory = [],
  locations = [],
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

  // Network-wide anomaly evaluation (rule-based explainable engine)
  const networkEvaluation = useMemo(() => {
    return evaluateNetworkAnomalies(sensors);
  }, [sensors]);

  const { normal, warning, critical, offline } = networkEvaluation.sensorsByStatus;
  const activeAnomalies = networkEvaluation.allAnomalies;

  // Selected sensor for the simulation control console
  const activeSensor = sensors.find(s => s.id === selectedSensorId || s.sensorId === selectedSensorId) || sensors[0];

  // Filtering sensors
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

  // Handler for triggering scenarios
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

  // Handler for reset
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            WARNING
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            OFFLINE
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            NORMAL
          </span>
        );
    }
  };

  const formatLastPing = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now (live)';
      if (mins === 1) return '1 min ago';
      return `${mins} mins ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-white">
              IoT INVENTORY SENSORS & REAL-TIME ANOMALY DETECTOR
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Synthetic edge telemetry: cold cryo blood vaults, fuel bladders, ammunition silos & ration storage shelters
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowThresholdsPanel(!showThresholdsPanel)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-cyan-300 transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showThresholdsPanel ? 'Hide Thresholds' : 'Configurable Limits'}</span>
          </button>

          <button
            onClick={handleReset}
            disabled={triggeringScenario === 'reset'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-xs font-mono text-slate-300 hover:text-rose-300 transition-all cursor-pointer"
            title="Reset all sensor telemetry to nominal baseline"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${triggeringScenario === 'reset' ? 'animate-spin' : ''}`} />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
            title="Poll Sensors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="p-3 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 text-xs font-mono flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-cyan-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 6 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Sensors */}
        <div className="hud-panel p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total Nodes</div>
          <div className="text-2xl font-heading font-bold text-white mt-1">
            {sensors.length}
          </div>
          <div className="text-[10px] font-mono text-cyan-400 mt-0.5">Edge Monitored</div>
        </div>

        {/* Online / Normal */}
        <div className="hud-panel p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/10">
          <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Normal Nodes</div>
          <div className="text-2xl font-heading font-bold text-emerald-400 mt-1">
            {normal.length}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">Parameters in spec</div>
        </div>

        {/* Warning Sensors */}
        <div className="hud-panel p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/10">
          <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Warning Nodes</div>
          <div className="text-2xl font-heading font-bold text-amber-400 mt-1">
            {warning.length}
          </div>
          <div className="text-[10px] font-mono text-amber-300/80 mt-0.5">Threshold drift</div>
        </div>

        {/* Critical Sensors */}
        <div className="hud-panel p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/20">
          <div className="text-[10px] font-mono text-rose-300 uppercase tracking-wider">Critical Nodes</div>
          <div className="text-2xl font-heading font-bold text-rose-400 mt-1">
            {critical.length}
          </div>
          <div className="text-[10px] font-mono text-rose-400 mt-0.5 font-bold">Severe breach</div>
        </div>

        {/* Offline Sensors */}
        <div className="hud-panel p-3.5 rounded-xl border border-slate-700 bg-slate-900/60">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Offline Nodes</div>
          <div className="text-2xl font-heading font-bold text-slate-300 mt-1">
            {offline.length}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">&gt;15m no ping</div>
        </div>

        {/* Active Anomalies */}
        <div className="hud-panel p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/20">
          <div className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider">Active Anomalies</div>
          <div className="text-2xl font-heading font-bold text-cyan-200 mt-1">
            {activeAnomalies.length}
          </div>
          <div className="text-[10px] font-mono text-cyan-400 mt-0.5">Rule-evaluated</div>
        </div>
      </div>

      {/* Interactive Simulation Controls Console */}
      <div className="hud-panel p-4 lg:p-5 rounded-xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="font-heading text-sm font-bold text-white tracking-wide">
                INTERACTIVE SCENARIO SIMULATION CONSOLE
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Simulate operational edge failures to verify anomaly detection, alerts, and replenishment escalation
            </p>
          </div>

          {/* Node Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Target Node:</span>
            <select
              value={selectedSensorId}
              onChange={(e) => setSelectedSensorId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-cyan-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-400"
            >
              {sensors.map(s => (
                <option key={s.id} value={s.id}>
                  {s.sensorId} - {s.unitName} ({s.locationName.split('(')[0].trim()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5 Scenario Trigger Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          {/* Scenario 1: Temperature */}
          <button
            onClick={() => handleTrigger(activeSensor.id, 'temperature')}
            disabled={triggeringScenario !== null}
            className="p-3 rounded-lg bg-slate-900/80 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-heading font-bold text-slate-200 group-hover:text-rose-300 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-rose-400" />
                Thermal Spike
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                CRIT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
              Injects severe thermal out-of-bounds reading outside safe storage envelope.
            </p>
          </button>

          {/* Scenario 2: Humidity */}
          <button
            onClick={() => handleTrigger(activeSensor.id, 'humidity')}
            disabled={triggeringScenario !== null}
            className="p-3 rounded-lg bg-slate-900/80 hover:bg-amber-950/60 border border-slate-700 hover:border-amber-500/50 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-heading font-bold text-slate-200 group-hover:text-amber-300 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-amber-400" />
                Moisture Ingress
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                WARN
              </span>
            </div>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
              Raises humidity to 89%, simulating container seal failure & corrosion hazard.
            </p>
          </button>

          {/* Scenario 3: Low Storage Level (Linked to Replenishment!) */}
          <button
            onClick={() => handleTrigger(activeSensor.id, 'low_storage')}
            disabled={triggeringScenario !== null}
            className="p-3 rounded-lg bg-slate-900/80 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 transition-all text-left group cursor-pointer ring-1 ring-rose-500/20"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-heading font-bold text-slate-200 group-hover:text-rose-300 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-rose-400" />
                Stock Depletion
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                LINKED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
              Drops stock to 11%. Automatically triggers critical stockout risk & replenishment recommendation!
            </p>
          </button>

          {/* Scenario 4: Battery Drop */}
          <button
            onClick={() => handleTrigger(activeSensor.id, 'low_battery')}
            disabled={triggeringScenario !== null}
            className="p-3 rounded-lg bg-slate-900/80 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-heading font-bold text-slate-200 group-hover:text-rose-300 flex items-center gap-1.5">
                <Battery className="w-4 h-4 text-rose-400" />
                Battery Critical
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                8%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
              Drops battery to 8%, warning that telemetry node will cease reporting soon.
            </p>
          </button>

          {/* Scenario 5: Offline Sensor */}
          <button
            onClick={() => handleTrigger(activeSensor.id, 'offline')}
            disabled={triggeringScenario !== null}
            className="p-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-heading font-bold text-slate-200 group-hover:text-slate-100 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-slate-400" />
                Node Offline
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                TIMEOUT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
              Simulates gateway signal loss (&gt;30 mins since last heartbeat beacon).
            </p>
          </button>
        </div>
      </div>

      {/* End-to-End Data Pipeline Architecture Card */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
        <div className="text-[11px] text-slate-400 mb-2 uppercase tracking-wider font-bold flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Integrated IoT Telemetry to Supply Chain Escalation Pipeline:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
          <span className="px-2 py-1 rounded bg-slate-900 border border-cyan-500/30 text-cyan-300 font-bold">1. IoT Sensor</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200">2. Sensor Validation</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200">3. Inventory Condition</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 rounded bg-slate-900 border border-rose-500/40 text-rose-300 font-bold">4. Anomaly Detection</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 rounded bg-slate-900 border border-amber-500/40 text-amber-300">5. Risk Assessment</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 rounded bg-slate-900 border border-rose-500/50 text-rose-400 font-bold">6. Alert Engine</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 rounded bg-cyan-950 border border-cyan-500 text-cyan-200 font-bold">7. Replenishment Dispatch</span>
        </div>
      </div>

      {/* Configurable Thresholds Reference Drawer (Collapsible) */}
      {showThresholdsPanel && (
        <div className="hud-panel p-4 rounded-xl border border-cyan-500/40 bg-slate-950 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="font-heading text-sm font-bold text-white">
                CENTRALIZED THRESHOLD CONFIGURATION (RULE ENGINE ENVELOPE)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Source: <code className="text-cyan-400">src/utils/iotConfig.ts</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
            {Object.entries(IOT_THRESHOLDS.categories).map(([category, limits]) => (
              <div key={category} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="font-bold text-cyan-300 truncate mb-1">{category}</div>
                <div className="space-y-0.5 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Safe Temp Range:</span>
                    <span>{limits.tempMinC}°C to {limits.tempMaxC}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Critical Temp Limit:</span>
                    <span className="text-rose-400">&lt;{limits.tempCritMinC}°C or &gt;{limits.tempCritMaxC}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Humidity:</span>
                    <span>Warn: {limits.humidityWarnPct}% / Crit: {limits.humidityCritPct}%</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Universal Limits Card */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/30">
              <div className="font-bold text-emerald-300 truncate mb-1">Universal Network Limits</div>
              <div className="space-y-0.5 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Storage Buffer:</span>
                  <span>Warn &le; {IOT_THRESHOLDS.storage.warningFillPct}% / Crit &le; {IOT_THRESHOLDS.storage.criticalFillPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Battery Reserve:</span>
                  <span>Warn &le; {IOT_THRESHOLDS.battery.warningPct}% / Crit &le; {IOT_THRESHOLDS.battery.criticalPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Offline Timeout:</span>
                  <span>&gt; {IOT_THRESHOLDS.timeout.offlineMinutes} minutes without ping</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Anomalies Diagnostic Explainability Table */}
      {activeAnomalies.length > 0 && (
        <div className="hud-panel p-4 rounded-xl border border-rose-500/40 bg-rose-950/10 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
              <h3 className="font-heading text-sm font-bold text-rose-300">
                ACTIVE EXPLAINABLE ANOMALIES ({activeAnomalies.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Deterministic Rule Violations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-2 font-semibold">Sensor / Unit</th>
                  <th className="pb-2 font-semibold">Location</th>
                  <th className="pb-2 font-semibold">Parameter</th>
                  <th className="pb-2 font-semibold">Current Value</th>
                  <th className="pb-2 font-semibold">Expected Envelope</th>
                  <th className="pb-2 font-semibold">Severity</th>
                  <th className="pb-2 font-semibold">Explainable Reason</th>
                  <th className="pb-2 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeAnomalies.map((anom) => (
                  <tr key={anom.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 font-bold text-white">
                      <div>{anom.sensorId}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{anom.unitName}</div>
                    </td>
                    <td className="py-2.5 text-slate-300">{anom.locationName}</td>
                    <td className="py-2.5 text-cyan-300 font-semibold">{anom.parameter}</td>
                    <td className="py-2.5 font-bold text-rose-300">{anom.currentValue}</td>
                    <td className="py-2.5 text-slate-400">{anom.expectedThreshold}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        anom.severity === 'CRITICAL' 
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/50' 
                          : 'bg-amber-950 text-amber-300 border border-amber-500/50'
                      }`}>
                        {anom.severity}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-200 max-w-xs">{anom.reason}</td>
                    <td className="py-2.5 text-slate-400 text-[10px]">
                      {new Date(anom.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter and View Mode Controls */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search sensor ID, bunker, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE'] as const).map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                selectedStatusFilter === status
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              viewMode === 'cards' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Main View: Cards vs Table */}
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
                  effectiveStatus === 'CRITICAL' ? 'hud-panel-danger border-rose-500/60' :
                  effectiveStatus === 'WARNING' ? 'hud-panel-warning border-amber-500/50' :
                  effectiveStatus === 'OFFLINE' ? 'border-slate-700 opacity-80' : ''
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{sensor.sensorId}</span>
                      <span className="text-[10px] font-mono text-slate-500">•</span>
                      <span className="text-[10px] font-mono text-slate-400">{sensor.targetCategory}</span>
                    </div>
                    <h3 className="font-heading text-sm font-bold text-white leading-tight mt-0.5">
                      {sensor.unitName}
                    </h3>
                    <div className="text-[11px] text-slate-400 font-sans flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
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
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Temp:</span>
                    </div>
                    <span className={`font-bold ${
                      sensor.temperatureC < -10 || sensor.temperatureC > 35 ? 'text-rose-400' : 'text-slate-200'
                    }`}>
                      {sensor.temperatureC > 0 ? `+${sensor.temperatureC}` : sensor.temperatureC}°C
                    </span>
                  </div>

                  {/* Humidity */}
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Humidity:</span>
                    </div>
                    <span className={`font-bold ${sensor.humidityPercent > 75 ? 'text-amber-400' : 'text-slate-200'}`}>
                      {sensor.humidityPercent}%
                    </span>
                  </div>

                  {/* Storage Fill Level */}
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Server className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Reserve:</span>
                    </div>
                    <span className={`font-bold ${
                      sensor.storageLevelPercent <= 15 ? 'text-rose-400' :
                      sensor.storageLevelPercent <= 25 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {sensor.storageLevelPercent}% ({sensor.quantity})
                    </span>
                  </div>

                  {/* Pressure */}
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Pressure:</span>
                    </div>
                    <span className="font-bold text-slate-200">{sensor.containerPressurePsi} PSI</span>
                  </div>
                </div>

                {/* Storage Bar Indicator */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>Fill Level</span>
                    <span>{sensor.storageLevelPercent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
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
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Battery className={`w-3.5 h-3.5 ${sensor.batteryLevel <= 15 ? 'text-rose-400' : 'text-emerald-400'}`} />
                    <span>Battery: <strong className="text-white">{sensor.batteryLevel}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{formatLastPing(sensor.lastPing)}</span>
                  </div>
                </div>

                {/* Explainable Anomaly Box */}
                {isAnomaly && (
                  <div className="p-2.5 rounded bg-rose-950/40 border border-rose-500/40 text-[11px] font-mono text-rose-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Anomaly Diagnosis:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-200">
                      {sensor.anomalyDescription || (anomalies[0]?.reason) || 'Unusual telemetry readings detected'}
                    </p>
                  </div>
                )}

                {/* Connection to Inventory & Replenishment Callout */}
                {isCriticalStorage && (
                  <div className="p-2.5 rounded bg-amber-950/30 border border-amber-500/40 text-[11px] font-mono space-y-1.5">
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Supply Chain Connected
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-200">ESCALATED</span>
                    </div>
                    <p className="text-slate-300 text-[10px]">
                      Storage level &le;15% triggered emergency replenishment recommendation in demand forecasting engine.
                    </p>
                    {setCurrentTab && (
                      <button
                        onClick={() => setCurrentTab('optimization')}
                        className="w-full py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>View Transfer Optimization Plan</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Quick Interactive Testing Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-[10px] font-mono">
                  <span className="text-slate-500">Quick Test:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTrigger(sensor.id, 'temperature')}
                      disabled={triggeringScenario !== null}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 cursor-pointer"
                      title="Trigger temperature anomaly"
                    >
                      Temp
                    </button>
                    <button
                      onClick={() => handleTrigger(sensor.id, 'low_storage')}
                      disabled={triggeringScenario !== null}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 cursor-pointer"
                      title="Trigger low storage anomaly"
                    >
                      Deplete
                    </button>
                    <button
                      onClick={() => handleTrigger(sensor.id, 'offline')}
                      disabled={triggeringScenario !== null}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer"
                      title="Trigger offline status"
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
        <div className="hud-panel p-4 rounded-xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60">
              {filteredSensors.map((sensor) => {
                const { status: evaluatedStatus } = evaluateSensorAnomalies(sensor);
                const effectiveStatus = sensor.status === 'OFFLINE' ? 'OFFLINE' : (sensor.hasAnomaly ? sensor.status : evaluatedStatus);

                return (
                  <tr key={sensor.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 font-bold text-cyan-300">{sensor.sensorId}</td>
                    <td className="py-2.5">
                      <div className="font-bold text-white">{sensor.unitName}</div>
                      <div className="text-[10px] text-slate-400">{sensor.targetCategory}</div>
                    </td>
                    <td className="py-2.5 text-slate-300">{sensor.locationName}</td>
                    <td className="py-2.5">{getStatusBadge(effectiveStatus)}</td>
                    <td className="py-2.5 font-bold text-slate-200">
                      {sensor.temperatureC > 0 ? `+${sensor.temperatureC}` : sensor.temperatureC}°C
                    </td>
                    <td className="py-2.5 text-slate-300">{sensor.humidityPercent}%</td>
                    <td className="py-2.5">
                      <span className={`font-bold ${sensor.storageLevelPercent <= 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {sensor.storageLevelPercent}%
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">({sensor.quantity})</span>
                    </td>
                    <td className="py-2.5 text-slate-300">{sensor.containerPressurePsi} PSI</td>
                    <td className="py-2.5 font-bold text-slate-200">{sensor.batteryLevel}%</td>
                    <td className="py-2.5 text-[10px] text-slate-400">{formatLastPing(sensor.lastPing)}</td>
                    <td className="py-2.5">
                      <button
                        onClick={() => handleTrigger(sensor.id, 'low_storage')}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-rose-950 border border-slate-700 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer text-[10px]"
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
