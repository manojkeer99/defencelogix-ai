import React, { useState } from 'react';
import { 
  Truck, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  MapPin, 
  Fuel, 
  ShieldAlert, 
  ArrowRight,
  Filter,
  RefreshCw,
  X
} from 'lucide-react';
import { Vehicle, LogisticsLocation, LogisticsRoute } from '../types';
import { useAuth } from '../context/AuthContext';
import { evaluateRoutesLogisticsStatus } from '../utils/unifiedLogisticsEngine';

interface TransportViewProps {
  vehicles: Vehicle[];
  locations: LogisticsLocation[];
  routes: LogisticsRoute[];
  onUpdateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  onRefresh: () => void;
}

export const TransportView: React.FC<TransportViewProps> = ({
  vehicles,
  locations,
  routes,
  onUpdateVehicle,
  onRefresh
}) => {
  const { hasPermission } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [targetDestId, setTargetDestId] = useState<string>(locations[0]?.id || '');
  const [newVehicleStatus, setNewVehicleStatus] = useState<Vehicle['status']>('AVAILABLE');

  const filteredVehicles = vehicles.filter(v => {
    if (filterStatus === 'ALL') return true;
    return v.status === filterStatus;
  });

  const availableCount = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const inTransitCount = vehicles.filter(v => v.status === 'IN_TRANSIT').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'MAINTENANCE').length;
  const assignedCount = vehicles.filter(v => v.status === 'ASSIGNED').length;

  const totalCapacity = vehicles.reduce((s, v) => s + v.capacityTons, 0);
  const activeLoad = vehicles.reduce((s, v) => s + v.currentLoadTons, 0);

  const handleDispatchOrUpdate = async () => {
    if (!selectedVehicle) return;
    await onUpdateVehicle(selectedVehicle.id, {
      status: newVehicleStatus,
      destinationLocationId: newVehicleStatus === 'IN_TRANSIT' ? targetDestId : undefined
    });
    setSelectedVehicle(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-white">
              STRATEGIC TRANSPORT & CONVOY FLEET COMMAND
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            20 Simulated Military Heavy Trucks, Medium Tactical 4x4s, Extreme Cold Snowcats & Logistics UAV Drones
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer self-start md:self-auto"
          title="Refresh Fleet Status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Transport Performance Metrics & Charts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Vehicle Utilization */}
        <div className="hud-panel p-4 rounded-xl">
          <span className="text-xs font-mono text-slate-400 uppercase">Fleet Utilization</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-cyan-300">
              {Math.round(((inTransitCount + assignedCount) / vehicles.length) * 100)}%
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ({inTransitCount + assignedCount}/{vehicles.length})
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-cyan-500 h-full" 
              style={{ width: `${Math.round(((inTransitCount + assignedCount) / vehicles.length) * 100)}%` }} 
            />
          </div>
        </div>

        {/* Metric 2: Capacity Utilization */}
        <div className="hud-panel p-4 rounded-xl">
          <span className="text-xs font-mono text-slate-400 uppercase">Capacity Utilization</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-white">
              {Math.round((activeLoad / totalCapacity) * 100)}%
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {activeLoad.toFixed(1)} / {totalCapacity} T
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-blue-500 h-full" 
              style={{ width: `${Math.round((activeLoad / totalCapacity) * 100)}%` }} 
            />
          </div>
        </div>

        {/* Metric 3: Delivery Completion Rate */}
        <div className="hud-panel hud-panel-success p-4 rounded-xl">
          <span className="text-xs font-mono text-emerald-300 uppercase">Delivery Completion</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-emerald-300">
              96.8%
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              On-Target Sorties
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full w-[96.8%]" />
          </div>
        </div>

        {/* Metric 4: Average Delivery Time */}
        <div className="hud-panel p-4 rounded-xl">
          <span className="text-xs font-mono text-slate-400 uppercase">Avg Delivery Time</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-amber-300">
              4.6 <span className="text-base font-normal text-slate-400">Hours</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Mountain/Desert
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-500 h-full w-[65%]" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono flex-wrap">
        {[
          { key: 'ALL', label: `All Vehicles (${vehicles.length})` },
          { key: 'AVAILABLE', label: `Available (${availableCount})` },
          { key: 'IN_TRANSIT', label: `In Transit (${inTransitCount})` },
          { key: 'ASSIGNED', label: `Assigned (${assignedCount})` },
          { key: 'MAINTENANCE', label: `Maintenance (${maintenanceCount})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === tab.key 
                ? 'bg-cyan-600 text-white font-bold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vehicles Fleet Table */}
      <div className="hud-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">Vehicle ID</th>
                <th className="py-3 px-3">Vehicle Type</th>
                <th className="py-3 px-3">Payload Capacity</th>
                <th className="py-3 px-3">Current Status</th>
                <th className="py-3 px-3">Station / Destination</th>
                <th className="py-3 px-3">Assigned Driver / Controller</th>
                <th className="py-3 px-3">Fuel Level</th>
                <th className="py-3 px-3">Maintenance</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVehicles.map(veh => {
                const isTransit = veh.status === 'IN_TRANSIT';
                const isAvail = veh.status === 'AVAILABLE';
                const isMaint = veh.status === 'MAINTENANCE';

                return (
                  <tr key={veh.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-white font-mono">
                      {veh.vehicleId}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {veh.type}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-cyan-300 font-bold">{veh.currentLoadTons}T</span> / {veh.capacityTons}T
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isAvail 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                          : isTransit
                          ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                          : isMaint
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}>
                        {veh.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-200">{veh.currentLocationName}</div>
                      {veh.destinationLocationName && (
                        <div className="text-[11px] text-cyan-400 flex items-center gap-1">
                          <span>→ {veh.destinationLocationName}</span>
                          <span className="text-slate-400">({veh.estimatedArrival})</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-sans">
                      {veh.driverName || 'Depot Fleet Pool'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-bold text-slate-200">{veh.fuelPercentage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[11px] font-bold ${
                        veh.maintenanceStatus === 'GOOD' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {veh.maintenanceStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {hasPermission(['admin', 'transport_manager', 'logistics_officer']) && (
                        <button
                          onClick={() => {
                            setSelectedVehicle(veh);
                            setNewVehicleStatus(veh.status);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                        >
                          Dispatch / Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulated Logistics Routes & Mountain Pass Corridors (Requirement 6) */}
      <div className="hud-panel p-5 rounded-xl border border-cyan-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <h2 className="font-heading text-lg font-bold text-white tracking-wide">
                SIMULATED CONVOY CORRIDORS & MOUNTAIN PASS ROUTES
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                SYNTHETIC / DEMO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Assessed via Origin/Destination Weather, Mountain Pass Surface Conditions, and Elevation Bottlenecks
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {routes.length} Active Simulated Corridors
          </span>
        </div>

        {/* Routes Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {evaluateRoutesLogisticsStatus(routes, locations).map((route) => {
            const isBlocked = route.routeStatus === 'PASS_BLOCKED';
            const isCrit = route.logisticsRisk === 'CRITICAL';
            const isHigh = route.logisticsRisk === 'HIGH';

            return (
              <div
                key={route.routeId}
                className={`p-4 rounded-xl border space-y-3 transition-all ${
                  isCrit ? 'bg-rose-950/20 border-rose-500/60' :
                  isHigh ? 'bg-amber-950/15 border-amber-500/50' :
                  'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Route Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">{route.routeCode}</span>
                    <h4 className="font-heading text-sm font-bold text-white leading-snug">
                      {route.originName.split('(')[0].trim()} → {route.destinationName.split('(')[0].trim()}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isCrit ? 'bg-rose-950 text-rose-300 border border-rose-500/60 animate-pulse' :
                    isHigh ? 'bg-amber-950 text-amber-300 border border-amber-500/50' :
                    route.logisticsRisk === 'MEDIUM' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' :
                    'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {route.logisticsRisk} RISK
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Distance</span>
                    <span className="font-bold text-slate-200">{route.distanceKm} km</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Transit Time</span>
                    <span className={`font-bold ${route.currentTravelHours > route.standardTravelHours ? 'text-amber-400' : 'text-slate-200'}`}>
                      {route.currentTravelHours}h <span className="text-[10px] font-normal text-slate-500">(std {route.standardTravelHours}h)</span>
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Status</span>
                    <span className={`font-bold ${isBlocked ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {route.routeStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Weather Impact</span>
                    <span className={`font-bold ${route.weatherImpact === 'HIGH' ? 'text-rose-400' : 'text-cyan-300'}`}>
                      {route.weatherImpact} IMPACT
                    </span>
                  </div>
                </div>

                {/* Accessibility */}
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[11px] font-mono">
                  <span className="text-slate-400 text-[10px] uppercase block">Accessibility & Terrain</span>
                  <span className="text-slate-200">{route.accessibility}</span>
                  <div className="text-[10px] text-slate-500 mt-0.5">{route.surfaceType}</div>
                </div>

                {/* Explainable Why Reason */}
                <div className="text-[11px] font-mono text-slate-400 flex items-start gap-1.5 pt-1 border-t border-slate-800/80">
                  <span className="text-cyan-400 shrink-0 font-bold">•</span>
                  <span>{route.whyReason}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dispatch / Status Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="hud-panel p-6 rounded-2xl max-w-md w-full space-y-4 border-cyan-500/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-heading text-lg font-bold text-white">
                Dispatch / Reassign Fleet Vehicle
              </h3>
              <button onClick={() => setSelectedVehicle(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs font-mono space-y-1">
              <div className="text-white font-bold">{selectedVehicle.vehicleId} ({selectedVehicle.type})</div>
              <div className="text-slate-400">Current Base: {selectedVehicle.currentLocationName}</div>
              <div className="text-slate-400">Payload Capacity: {selectedVehicle.capacityTons} Tons</div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Status:</label>
              <select
                value={newVehicleStatus}
                onChange={(e) => setNewVehicleStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
              >
                <option value="AVAILABLE">AVAILABLE (Standing by at Base)</option>
                <option value="ASSIGNED">ASSIGNED (Staged for Loading)</option>
                <option value="IN_TRANSIT">IN TRANSIT (Convoy Sortie En Route)</option>
                <option value="MAINTENANCE">MAINTENANCE (EME Workshop)</option>
              </select>
            </div>

            {newVehicleStatus === 'IN_TRANSIT' && (
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Destination Location:</label>
                <select
                  value={targetDestId}
                  onChange={(e) => setTargetDestId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 font-mono text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchOrUpdate}
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold rounded-lg cursor-pointer"
              >
                Apply Telemetry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
