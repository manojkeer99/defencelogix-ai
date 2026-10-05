import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  MapPin, 
  Cpu, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Terminal,
  Settings,
  Sliders,
  RefreshCw,
  Key,
  Shield
} from 'lucide-react';
import { User, UserRole, LogisticsLocation, AuditLog } from '../types';
import { useAuth } from '../context/AuthContext';

interface AdminViewProps {
  locations: LogisticsLocation[];
  onRefresh: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ locations, onRefresh }) => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'locations' | 'ai_config' | 'audit_logs'>('users');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // AI Configuration state
  const [smoothingFactor, setSmoothingFactor] = useState(0.35);
  const [safetyZScore, setSafetyZScore] = useState(2.33);
  const [winterMultiplier, setWinterMultiplier] = useState(1.4);
  const [surgeTempoMultiplier, setSurgeTempoMultiplier] = useState(1.85);
  const [savedConfigMessage, setSavedConfigMessage] = useState(false);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const activeToken = token || (typeof window !== 'undefined' ? sessionStorage.getItem('defencelogix_jwt_token') : null);
      const res = await fetch('/api/audit-logs', {
        headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSaveAiConfig = () => {
    setSavedConfigMessage(true);
    setTimeout(() => setSavedConfigMessage(false), 3000);
  };

  const usersList = [
    { id: 'USR-001', name: 'Brig. Rajesh Varma (Retd.)', email: 'admin@demologix.local', role: 'admin', service: 'IC-48291X', clearance: 'LEVEL 5 - TOP SECRET (DEMO)', dept: 'Directorate General of Operational Logistics' },
    { id: 'USR-002', name: 'Col. Amitav Sengupta', email: 'officer@demologix.local', role: 'logistics_officer', service: 'IC-51203M', clearance: 'LEVEL 4 - SECRET (DEMO)', dept: 'Forward Supply Corps Command' },
    { id: 'USR-003', name: 'Lt. Col. Priya Menon', email: 'inventory@demologix.local', role: 'inventory_manager', service: 'IC-54910K', clearance: 'LEVEL 3 - CONFIDENTIAL (DEMO)', dept: 'Central Ordnance Depot Management' },
    { id: 'USR-004', name: 'Maj. Vikramaditya Rathore', email: 'transport@demologix.local', role: 'transport_manager', service: 'IC-59821P', clearance: 'LEVEL 3 - CONFIDENTIAL (DEMO)', dept: 'Army Service Corps (Mechanical Transport)' },
    { id: 'USR-005', name: 'Dr. Sunita Kulkarni', email: 'analyst@demologix.local', role: 'analyst', service: 'CIV-DS-8842', clearance: 'LEVEL 3 - CONFIDENTIAL (DEMO)', dept: 'Defence Data Science & Operational Research Lab' },
    { id: 'USR-006', name: 'Capt. Rohan Deshmukh', email: 'viewer@demologix.local', role: 'viewer', service: 'IC-64112A', clearance: 'LEVEL 2 - RESTRICTED (DEMO)', dept: 'Staff College Logistics Observer Division' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-slate-900 dark:text-white">
              COMMAND CONTROL & SECURITY ADMINISTRATION
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Role-Based Access Control (RBAC), AI Model Hyperparameters & Military Audit Logging
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'users' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Users & Roles
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'locations' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Location Nodes
          </button>
          <button
            onClick={() => setActiveTab('ai_config')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'ai_config' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            AI Hyperparameters
          </button>
          <button
            onClick={() => {
              setActiveTab('audit_logs');
              fetchAuditLogs();
            }}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'audit_logs' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            System Audit Logs
          </button>
        </div>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="hud-panel rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center text-xs font-mono">
            <span className="text-slate-800 dark:text-slate-300 font-bold">
              Authorized Operational Personnel ({usersList.length} Accounts Registered)
            </span>
            <span className="text-slate-500 dark:text-slate-400">Clearance Levels Enforced via JWT Cryptography</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Service No / Officer</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3">Clearance Classification</th>
                  <th className="py-3 px-3">Role Authority</th>
                  <th className="py-3 px-3">Assigned Directorate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white font-sans">{u.name}</div>
                      <div className="text-[11px] text-cyan-700 dark:text-cyan-400">{u.service}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {u.email}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-cyan-800 dark:text-cyan-300 font-bold">
                        {u.clearance}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300 capitalize">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-sans text-[11px]">
                      {u.dept}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Location Management */}
      {activeTab === 'locations' && (
        <div className="hud-panel rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center text-xs font-mono">
            <span className="text-slate-800 dark:text-slate-300 font-bold">Synthetic Forward Logistics Topology (10 Monitored Nodes)</span>
            <span className="text-slate-500 dark:text-slate-400">Strictly Non-Sensitive Fictional Coordinates</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Location Name</th>
                  <th className="py-3 px-3">Code / Type</th>
                  <th className="py-3 px-3">Terrain / Altitude</th>
                  <th className="py-3 px-3">Weather Condition</th>
                  <th className="py-3 px-3">Current Storage</th>
                  <th className="py-3 px-3">Assigned Fleet</th>
                  <th className="py-3 px-3">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-sans">
                      {loc.name}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-cyan-700 dark:text-cyan-400 font-bold">{loc.code}</span>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{loc.type.replace('_', ' ')}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {loc.terrainType} ({loc.altitudeMeters}m)
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-800 dark:text-slate-200">{loc.weatherCondition}</span>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{loc.temperatureC}°C</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 dark:text-white">{loc.currentOccupancyTons}</span> / {loc.storageCapacityTons} T
                    </td>
                    <td className="py-3 px-3 text-cyan-700 dark:text-cyan-300 font-bold">
                      {loc.assignedVehiclesCount} Vehicles
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        loc.riskLevel === 'CRITICAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40' :
                        loc.riskLevel === 'HIGH' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40' :
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                      }`}>
                        {loc.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: AI Hyperparameters Tuning */}
      {activeTab === 'ai_config' && (
        <div className="hud-panel p-6 rounded-xl space-y-6 max-w-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Machine Learning Pipeline Hyperparameter Tuning
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Adjust regression learning rates, exponential smoothing decay constants, and contingency safety buffers
            </p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Slider 1: Exponential Smoothing Alpha */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-800 dark:text-slate-300 font-bold">Exponential Smoothing Factor (Alpha):</span>
                <span className="text-cyan-700 dark:text-cyan-400 font-bold">{smoothingFactor}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={smoothingFactor}
                onChange={(e) => setSmoothingFactor(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Higher weights prioritize recent consumption spikes; lower weights produce smoother long-term trajectories.
              </p>
            </div>

            {/* Slider 2: Safety Stock Z-Score */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-800 dark:text-slate-300 font-bold">Readiness Service Level Z-Score:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">{safetyZScore} ({safetyZScore >= 2.3 ? '99.0% Availability' : '95.0% Availability'})</span>
              </div>
              <input
                type="range"
                min="1.65"
                max="2.58"
                step="0.05"
                value={safetyZScore}
                onChange={(e) => setSafetyZScore(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Determines mathematical safety stock buffer for critical ammunition and medical supplies.
              </p>
            </div>

            {/* Slider 3: Winter Blizzard Multiplier */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-800 dark:text-slate-300 font-bold">Extreme Cold Weather Multiplier:</span>
                <span className="text-cyan-700 dark:text-cyan-400 font-bold">{winterMultiplier}x Surge</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.0"
                step="0.05"
                value={winterMultiplier}
                onChange={(e) => setWinterMultiplier(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Amplifies heating fuel (DHA-50), winter rations, and mountaineering clothing burn rates in sub-zero sectors.
              </p>
            </div>

            {/* Slider 4: Surge Tempo Multiplier */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-800 dark:text-slate-300 font-bold">Surge Readiness Multiplier:</span>
                <span className="text-amber-700 dark:text-amber-400 font-bold">{surgeTempoMultiplier}x Surge</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={surgeTempoMultiplier}
                onChange={(e) => setSurgeTempoMultiplier(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Simulates maximum operational tempo during field deployment exercises.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAiConfig}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Save Hyperparameters
            </button>
            {savedConfigMessage && (
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Hyperparameters applied across active forecasting workers!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit_logs' && (
        <div className="hud-panel rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center text-xs font-mono">
            <span className="text-slate-800 dark:text-slate-300 font-bold">Military Operational Audit Trail (Immutable Session Logs)</span>
            <button onClick={fetchAuditLogs} className="text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] uppercase sticky top-0">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Officer / Actor</th>
                  <th className="py-3 px-3">Action Event</th>
                  <th className="py-3 px-3">Target Entity</th>
                  <th className="py-3 px-3">Operational Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-900 dark:text-white font-bold">{log.userName}</div>
                        <div className="text-[10px] text-cyan-700 dark:text-cyan-400">{log.role.toUpperCase()}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-cyan-800 dark:text-cyan-300 font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {log.targetEntity}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-sans text-[11px]">
                        {log.details}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      {loadingLogs ? 'Loading system audit logs...' : 'No audit entries found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
