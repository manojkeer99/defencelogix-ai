import React, { useState } from 'react';
import { 
  BellRing, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  MapPin, 
  Search, 
  Plus, 
  X,
  RefreshCw,
  Radio,
  Check,
  AlertCircle
} from 'lucide-react';
import { AlertItem, AlertSeverity, AlertType, LogisticsLocation } from '../types';
import { useAuth } from '../context/AuthContext';

interface AlertsViewProps {
  alerts: AlertItem[];
  locations: LogisticsLocation[];
  onAcknowledgeAlert: (id: string) => Promise<void>;
  onResolveAlert: (id: string) => Promise<void>;
  onCreateAlert: (alert: Omit<AlertItem, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  onRefresh: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  locations,
  onAcknowledgeAlert,
  onResolveAlert,
  onCreateAlert,
  onRefresh
}) => {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<Record<string, 'acknowledge' | 'resolve' | null>>({});
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New alert modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>('LOW STOCK');
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>('HIGH');
  const [locationId, setLocationId] = useState(locations[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [submittingModal, setSubmittingModal] = useState(false);

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING' || a.severity === 'HIGH').length;
  const infoCount = alerts.filter(a => a.severity === 'INFO').length;

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = 
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.type.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesSev = true;
    if (selectedSeverity === 'CRITICAL') matchesSev = a.severity === 'CRITICAL';
    else if (selectedSeverity === 'WARNING') matchesSev = a.severity === 'WARNING' || a.severity === 'HIGH';
    else if (selectedSeverity === 'INFO') matchesSev = a.severity === 'INFO';

    const matchesStat = selectedStatus === 'ALL' || a.status === selectedStatus;
    return matchesSearch && matchesSev && matchesStat;
  });

  const handleAcknowledge = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: 'acknowledge' }));
    setActionMessage(null);
    try {
      await onAcknowledgeAlert(id);
      setActionMessage({ type: 'success', text: `Alert ${id} acknowledged successfully.` });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || `Failed to acknowledge alert ${id}. Please retry.` });
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleResolve = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: 'resolve' }));
    setActionMessage(null);
    try {
      await onResolveAlert(id);
      setActionMessage({ type: 'success', text: `Alert ${id} marked as resolved.` });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || `Failed to resolve alert ${id}. Please retry.` });
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingModal(true);
    setActionMessage(null);
    try {
      await onCreateAlert({
        type: alertType,
        severity: alertSeverity,
        locationId,
        locationName: locations.find(l => l.id === locationId)?.name || 'Sector Command',
        title,
        description,
        recommendedAction
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setRecommendedAction('');
      setActionMessage({ type: 'success', text: 'Operational early warning broadcasted successfully.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to dispatch alert.' });
    } finally {
      setSubmittingModal(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-cyan-500/30 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-rose-500 animate-pulse" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-slate-900 dark:text-white">
              EARLY WARNING & ALERTS FEED
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Automated notifications for critical stockouts, severe pass weather, IoT sensor anomalies & convoy delays
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {hasPermission(['admin', 'logistics_officer']) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Broadcast Alert</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all cursor-pointer"
            title="Poll Alert Feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Action Feedback Banner */}
      {actionMessage && (
        <div className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between gap-2 shadow-xs transition-all ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-200' 
            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Severity Grouping Tabs (Critical / Warning / Informational) */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedSeverity('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
            selectedSeverity === 'ALL'
              ? 'bg-slate-800 dark:bg-slate-700 border-slate-700 text-white font-bold shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          ALL ({alerts.length})
        </button>

        <button
          onClick={() => setSelectedSeverity('CRITICAL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
            selectedSeverity === 'CRITICAL'
              ? 'bg-rose-600 border-rose-600 text-white font-bold shadow-xs'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1.5 animate-pulse" />
          CRITICAL ({criticalCount})
        </button>

        <button
          onClick={() => setSelectedSeverity('WARNING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
            selectedSeverity === 'WARNING'
              ? 'bg-amber-600 border-amber-600 text-white font-bold shadow-xs'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
          WARNING ({warningCount})
        </button>

        <button
          onClick={() => setSelectedSeverity('INFO')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
            selectedSeverity === 'INFO'
              ? 'bg-cyan-600 border-cyan-600 text-white font-bold shadow-xs'
              : 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100'
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-1.5" />
          INFORMATIONAL ({infoCount})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search alerts by ID, title, node, or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="ALL">All Statuses</option>
          <option value="NEW">NEW (Pending)</option>
          <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const isCrit = alert.severity === 'CRITICAL';
            const isHigh = alert.severity === 'HIGH';
            const isWarn = alert.severity === 'WARNING';
            const isResolved = alert.status === 'RESOLVED';
            const isAck = alert.status === 'ACKNOWLEDGED';
            const isAcknowledging = actionLoading[alert.id] === 'acknowledge';
            const isResolving = actionLoading[alert.id] === 'resolve';

            return (
              <div 
                key={alert.id}
                className={`hud-panel p-4 rounded-xl border-l-4 transition-all ${
                  isCrit ? 'border-l-rose-500 hud-panel-danger' : 
                  isHigh ? 'border-l-amber-500' : 
                  isWarn ? 'border-l-amber-400' : 'border-l-cyan-500'
                } ${isResolved ? 'opacity-70' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Alert ID */}
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                        {alert.id}
                      </span>

                      {/* Severity Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isCrit ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/50' :
                        isHigh || isWarn ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/50' :
                        'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/50'
                      }`}>
                        {alert.severity}
                      </span>

                      <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400 font-semibold">
                        [{alert.type}]
                      </span>

                      <span className="text-slate-300 dark:text-slate-600">•</span>

                      {/* Location */}
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {alert.locationName}
                      </span>

                      {alert.sensorId && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-[11px] text-amber-700 dark:text-amber-300 font-mono flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/40">
                            <Radio className="w-3 h-3 text-amber-500" />
                            Sensor: {alert.sensorId}
                          </span>
                        </>
                      )}

                      <span className="text-slate-300 dark:text-slate-600">•</span>

                      {/* Timestamp */}
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hrs
                      </span>
                    </div>

                    <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white pt-1">
                      {alert.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {alert.description}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold shrink-0 ${
                    alert.status === 'NEW' ? 'bg-rose-600 text-white shadow-xs' :
                    alert.status === 'ACKNOWLEDGED' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40' :
                    'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                  }`}>
                    {alert.status}
                  </span>
                </div>

                {/* Recommended Action & Acknowledgment Log */}
                <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1">
                  <div className="text-slate-600 dark:text-slate-400">
                    <strong className="text-cyan-700 dark:text-cyan-300">Recommended Action:</strong> {alert.recommendedAction}
                  </div>
                  {alert.acknowledgedBy && (
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-900">
                      Acknowledged by: <strong className="text-slate-700 dark:text-slate-300">{alert.acknowledgedBy}</strong> at {alert.acknowledgedAt ? new Date(alert.acknowledgedAt).toLocaleTimeString() : ''}
                    </div>
                  )}
                </div>

                {/* Clearly Distinguishable Action Buttons */}
                {!isResolved && (
                  <div className="mt-3 flex justify-end items-center gap-2.5 text-xs font-mono">
                    {alert.status === 'NEW' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={isAck || isAcknowledging || isResolving}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isAcknowledging && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isAcknowledging ? 'Acknowledging...' : 'Acknowledge'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={isResolving || isAcknowledging}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isResolving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Resolving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolve & Close</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="hud-panel p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-mono">
            No active alerts matching the selected criteria.
          </div>
        )}
      </div>

      {/* Broadcast Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateSubmit} className="hud-panel p-6 rounded-2xl max-w-lg w-full space-y-4 border-rose-500/40">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                Broadcast Early Warning Alert
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">Alert Type</label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="LOW STOCK">LOW STOCK</option>
                    <option value="STOCKOUT RISK">STOCKOUT RISK</option>
                    <option value="HIGH DEMAND">HIGH DEMAND</option>
                    <option value="TRANSPORT DELAY">TRANSPORT DELAY</option>
                    <option value="INVENTORY ANOMALY">INVENTORY ANOMALY</option>
                    <option value="CAPACITY SHORTAGE">CAPACITY SHORTAGE</option>
                    <option value="FORECAST ANOMALY">FORECAST ANOMALY</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">Severity</label>
                  <select
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="WARNING">WARNING</option>
                    <option value="INFO">INFO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Location Node</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Alert Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Winter Diesel Supply Critical Deficit"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Operational Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specific symptoms, current numbers vs safety threshold..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Recommended Action</label>
                <input
                  type="text"
                  required
                  value={recommendedAction}
                  onChange={(e) => setRecommendedAction(e.target.value)}
                  placeholder="e.g. Pre-position 40 kL fuel bowser convoy immediately"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none font-sans"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingModal}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
              >
                {submittingModal ? 'Dispatching...' : 'Broadcast Alert'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
