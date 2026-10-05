import React, { useState } from 'react';
import { 
  RotateCcw, 
  TrendingUp, 
  PackageMinus, 
  CloudSnow, 
  Radio, 
  Info,
  Sliders
} from 'lucide-react';

interface DemoSimulationControlsProps {
  onSimulateScenario: (scenario: 'demand_surge' | 'inventory_reduction' | 'weather_deterioration' | 'sensor_anomaly') => Promise<void>;
  onResetDemo: () => Promise<void>;
  onRefresh: () => void;
}

export const DemoSimulationControls: React.FC<DemoSimulationControlsProps> = ({
  onSimulateScenario,
  onResetDemo,
}) => {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleSimulate = async (scenario: 'demand_surge' | 'inventory_reduction' | 'weather_deterioration' | 'sensor_anomaly') => {
    setSimulating(true);
    setActiveScenario(scenario);
    try {
      await onSimulateScenario(scenario);
      let desc = '';
      if (scenario === 'demand_surge') desc = '+35% operational demand surge injected across forward bases';
      if (scenario === 'inventory_reduction') desc = '-45% stock shock injected; critical inventory shortages created';
      if (scenario === 'weather_deterioration') desc = 'Extreme -24°C blizzard simulated; mountain pass road closed';
      if (scenario === 'sensor_anomaly') desc = 'Compound IoT sensor alarms injected on fuel and cryo vaults';
      
      setNotification(`Simulation active: ${desc}. Dashboard recalculating.`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleReset = async () => {
    setSimulating(true);
    try {
      await onResetDemo();
      setActiveScenario(null);
      setNotification('Demo dataset successfully restored to default baseline.');
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-purple-500/30 shadow-xs space-y-3">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-300">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                OPERATIONAL SCENARIO STRESS-TESTING
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40 font-semibold">
                Interactive Simulation
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Inject operational shocks to observe end-to-end recalculation across demand, risk, and replenishment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Restore all locations, inventory, weather, and sensors to baseline"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
            <span>Reset Demo Baseline</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/90 border border-cyan-200 dark:border-cyan-500/50 text-cyan-900 dark:text-cyan-200 text-xs font-mono flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-white cursor-pointer ml-2">
            ✕
          </button>
        </div>
      )}

      {/* 4 Interactive Simulation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        {/* Scenario 1: Demand Surge */}
        <button
          onClick={() => handleSimulate('demand_surge')}
          disabled={simulating}
          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
            activeScenario === 'demand_surge'
              ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-500 ring-1 ring-amber-500 text-amber-900 dark:text-amber-200'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-amber-400 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              Demand Surge
            </span>
            <span className="text-[10px] px-1 rounded bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold">+35%</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            Elevates consumption on fuel, rations, and ammo across forward nodes.
          </p>
        </button>

        {/* Scenario 2: Reduced Inventory */}
        <button
          onClick={() => handleSimulate('inventory_reduction')}
          disabled={simulating}
          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
            activeScenario === 'inventory_reduction'
              ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-500 ring-1 ring-rose-500 text-rose-900 dark:text-rose-200'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-rose-400 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
            <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
              <PackageMinus className="w-3.5 h-3.5 text-rose-500" />
              Stock Shock
            </span>
            <span className="text-[10px] px-1 rounded bg-rose-200 dark:bg-rose-950 text-rose-900 dark:text-rose-300 font-bold">-45%</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            Cuts stock at Forward Alpha & Foxtrot to trigger urgent stockout alerts.
          </p>
        </button>

        {/* Scenario 3: Weather Deterioration */}
        <button
          onClick={() => handleSimulate('weather_deterioration')}
          disabled={simulating}
          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
            activeScenario === 'weather_deterioration'
              ? 'bg-blue-100 dark:bg-blue-950/60 border-blue-500 ring-1 ring-blue-500 text-blue-900 dark:text-blue-200'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-blue-400 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
            <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
              <CloudSnow className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Severe Blizzard
            </span>
            <span className="text-[10px] px-1 rounded bg-blue-200 dark:bg-blue-950 text-blue-900 dark:text-cyan-300 font-bold">-24°C</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            Forces mountain pass closure and spikes transport risk to CRITICAL.
          </p>
        </button>

        {/* Scenario 4: Sensor Anomaly */}
        <button
          onClick={() => handleSimulate('sensor_anomaly')}
          disabled={simulating}
          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
            activeScenario === 'sensor_anomaly'
              ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-500 ring-1 ring-purple-500 text-purple-900 dark:text-purple-200'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-purple-400 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
            <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
              <Radio className="w-3.5 h-3.5 text-purple-500" />
              Sensor Breaches
            </span>
            <span className="text-[10px] px-1 rounded bg-purple-200 dark:bg-purple-950 text-purple-900 dark:text-purple-300 font-bold">IOT</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            Triggers thermal breach at Cryo Vault and pressure drop in fuel bladder.
          </p>
        </button>
      </div>
    </div>
  );
};
