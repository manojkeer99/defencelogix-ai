import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ForecastingView } from './components/ForecastingView';
import { InventoryView } from './components/InventoryView';
import { GisMapView } from './components/GisMapView';
import { LogisticsOptimizationView } from './components/LogisticsOptimizationView';
import { TransportView } from './components/TransportView';
import { IotSensorsView } from './components/IotSensorsView';
import { AlertsView } from './components/AlertsView';
import { AnalyticsView } from './components/AnalyticsView';
import { ReportsView } from './components/ReportsView';
import { AdminView } from './components/AdminView';
import { ArchitectureView } from './components/ArchitectureView';
import { ApiDocsAndTestsView } from './components/ApiDocsAndTestsView';
import { LandingPage } from './components/LandingPage';
import { LogiAiChat } from './components/LogiAiChat';
import { ResetDemoModal } from './components/ResetDemoModal';
import { 
  DashboardMetrics, 
  InventoryItem, 
  LogisticsLocation, 
  Vehicle, 
  LogisticsRoute, 
  AlertItem, 
  LogisticsRecommendation, 
  IoTSensorNode 
} from './types';

function MainApp() {
  const { user, token, authError, handleAuthError, requestDemoToken, clearAuthError } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('defencelogix_theme');
      if (saved === 'light') return false;
      if (saved === 'dark') return true;
    }
    return true;
  });
  const [logiAiOpen, setLogiAiOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Helper to reliably retrieve valid Authorization header
  const getAuthHeaders = (): Record<string, string> => {
    const activeToken = token || (typeof window !== 'undefined' ? sessionStorage.getItem('defencelogix_jwt_token') : null);
    return activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {};
  };

  // Core Data States
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<LogisticsLocation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<LogisticsRoute[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [recommendations, setRecommendations] = useState<LogisticsRecommendation[]>([]);
  const [sensors, setSensors] = useState<IoTSensorNode[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch all operational data from backend
  const fetchAllData = async () => {
    try {
      const [
        dashRes,
        invRes,
        locRes,
        vehRes,
        routeRes,
        alertRes,
        recRes,
        iotRes
      ] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/inventory'),
        fetch('/api/locations'),
        fetch('/api/vehicles'),
        fetch('/api/routes'),
        fetch('/api/alerts'),
        fetch('/api/recommendations'),
        fetch('/api/iot')
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        setMetrics(d.metrics);
      }
      if (invRes.ok) {
        const i = await invRes.json();
        setInventory(i.items);
      }
      if (locRes.ok) {
        const l = await locRes.json();
        setLocations(l.locations);
      }
      if (vehRes.ok) {
        const v = await vehRes.json();
        setVehicles(v.vehicles);
      }
      if (routeRes.ok) {
        const r = await routeRes.json();
        setRoutes(r.routes);
      }
      if (alertRes.ok) {
        const a = await alertRes.json();
        setAlerts(a.alerts);
      }
      if (recRes.ok) {
        const rec = await recRes.json();
        setRecommendations(rec.recommendations);
      }
      if (iotRes.ok) {
        const s = await iotRes.json();
        setSensors(s.sensors);
      }
    } catch (err) {
      console.error('Error fetching platform data:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        try {
          localStorage.setItem('defencelogix_theme', 'dark');
        } catch (e) {}
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        try {
          localStorage.setItem('defencelogix_theme', 'light');
        } catch (e) {}
      }
    }
  }, [darkMode]);

  // Mutator Actions
  const handleUpdateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updates)
      });
      if (res.status === 401) {
        handleAuthError('Authentication required to modify inventory items.');
        return;
      }
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to update inventory:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      if (res.status === 401) {
        handleAuthError('Authentication required to delete inventory items.');
        return;
      }
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to delete inventory item:', err);
    }
  };

  const handleApproveRecommendation = async (id: string) => {
    try {
      const res = await fetch(`/api/recommendations/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.status === 401) {
        handleAuthError('Authentication required to approve transfer recommendations.');
        return;
      }
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to approve recommendation:', err);
    }
  };

  const handleTriggerOptimization = async () => {
    try {
      const res = await fetch('/api/recommendations/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
      });
      if (res.status === 401) {
        handleAuthError('Authentication required to run optimization solver.');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations);
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to trigger optimization solver:', err);
    }
  };

  const handleUpdateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updates)
      });
      if (res.status === 401) {
        handleAuthError('Authentication required to update vehicle dispatch status.');
        return;
      }
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to update vehicle status:', err);
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}/acknowledge`, {
        method: 'PUT',
        headers: { ...getAuthHeaders() }
      });
      if (res.status === 401) {
        handleAuthError('Authentication required to acknowledge early warning alerts.');
        return;
      }
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}/resolve`, {
        method: 'PUT',
        headers: { ...getAuthHeaders() }
      });
      if (res.status === 401) {
        handleAuthError('Authentication required to resolve early warning alerts.');
        return;
      }
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const handleCreateAlert = async (newAlert: Omit<AlertItem, 'id' | 'timestamp' | 'status'>) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(newAlert)
      });
      if (res.status === 401) {
        handleAuthError('Authentication required to dispatch alert.');
        return;
      }
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to create alert:', err);
    }
  };

  const handleTriggerAnomaly = async (sensorId: string) => {
    try {
      const res = await fetch(`/api/iot/${sensorId}/anomaly`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });
      if (res.status === 401) {
        handleAuthError('Authentication required to simulate IoT anomaly.');
        return;
      }
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to simulate IoT anomaly:', err);
    }
  };

  const handleTriggerScenario = async (
    sensorId: string, 
    scenario: 'temperature' | 'humidity' | 'low_storage' | 'low_battery' | 'offline'
  ) => {
    try {
      const res = await fetch(`/api/iot/${sensorId}/scenario`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders() 
        },
        body: JSON.stringify({ scenario })
      });
      if (res.status === 401) {
        handleAuthError('Authentication required to trigger sensor scenario.');
        return;
      }
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to simulate IoT scenario:', err);
    }
  };

  const handleResetSensorSimulation = async () => {
    try {
      const res = await fetch('/api/iot/reset', {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });
      if (res.status === 401) {
        handleAuthError('Authentication required to reset IoT simulation.');
        return;
      }
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to reset IoT sensor simulation:', err);
    }
  };

  const handleSimulateScenario = async (
    scenario: 'demand_surge' | 'inventory_reduction' | 'weather_deterioration' | 'sensor_anomaly'
  ) => {
    try {
      const res = await fetch('/api/demo/simulate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders() 
        },
        body: JSON.stringify({ scenario })
      });
      if (res.status === 401) {
        handleAuthError('Authentication required to run demo scenario simulation.');
        return;
      }
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error('Failed to simulate scenario:', err);
    }
  };

  const handleResetDemoData = async () => {
    try {
      const res = await fetch('/api/demo/reset', {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });
      if (res.status === 401) {
        handleAuthError('Authentication required to reset demo data.');
        return;
      }
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error('Failed to reset demo dataset:', err);
    }
  };

  const criticalAlertsCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
  const criticalStockCount = inventory.filter(i => i.status === 'CRITICAL').length;

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-50 text-slate-900'} transition-colors duration-150`}>
      {/* Top Command Center Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        toggleLogiAi={() => setLogiAiOpen(!logiAiOpen)}
        openResetModal={() => setResetModalOpen(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        criticalAlertCount={criticalAlertsCount}
      />

      {/* Main Layout: Sidebar + View Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          criticalAlertsCount={criticalAlertsCount}
          criticalStockCount={criticalStockCount}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-tactical-grid">
          <div className="max-w-7xl mx-auto">
            {initialLoading ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-12 h-12 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="font-heading text-lg font-bold tracking-wide text-slate-800 dark:text-slate-200">
                  INITIALIZING DEFENCELOGIX DSS...
                </div>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Synchronizing inventory, GIS sectors, IoT nodes & time-series forecasting engine
                </p>
              </div>
            ) : (
              <>
            {authError && (
              <div className="mb-4 bg-amber-950/90 border border-amber-500/50 text-amber-200 px-4 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                    AUTH REQUIRED
                  </span>
                  <span className="text-xs text-amber-100">{authError}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => requestDemoToken(user?.role || 'logistics_officer')}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold font-mono tracking-wide cursor-pointer transition-colors shadow-sm"
                  >
                    Re-authenticate Demo Session
                  </button>
                  <button
                    onClick={clearAuthError}
                    className="p-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {currentTab === 'dashboard' && (
              <DashboardView
                metrics={metrics}
                inventory={inventory}
                locations={locations}
                vehicles={vehicles}
                alerts={alerts}
                sensors={sensors}
                routes={routes}
                setCurrentTab={setCurrentTab}
                onRefresh={fetchAllData}
                onTriggerScenario={handleTriggerScenario}
                onResetSimulation={handleResetSensorSimulation}
                onSimulateScenario={handleSimulateScenario}
                onResetDemo={handleResetDemoData}
              />
            )}

            {currentTab === 'forecast' && (
              <ForecastingView
                inventory={inventory}
                locations={locations}
              />
            )}

            {currentTab === 'inventory' && (
              <InventoryView
                inventory={inventory}
                locations={locations}
                onRefresh={fetchAllData}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
              />
            )}

            {currentTab === 'gis' && (
              <GisMapView
                locations={locations}
                routes={routes}
                inventory={inventory}
                vehicles={vehicles}
                sensors={sensors}
                alerts={alerts}
                setCurrentTab={setCurrentTab}
              />
            )}

            {currentTab === 'optimization' && (
              <LogisticsOptimizationView
                recommendations={recommendations}
                onApproveRecommendation={handleApproveRecommendation}
                onTriggerOptimization={handleTriggerOptimization}
              />
            )}

            {currentTab === 'transport' && (
              <TransportView
                vehicles={vehicles}
                locations={locations}
                routes={routes}
                onUpdateVehicle={handleUpdateVehicle}
                onRefresh={fetchAllData}
              />
            )}

            {currentTab === 'iot' && (
              <IotSensorsView
                sensors={sensors}
                alerts={alerts}
                inventory={inventory}
                locations={locations}
                onTriggerScenario={handleTriggerScenario}
                onTriggerAnomaly={handleTriggerAnomaly}
                onResetSimulation={handleResetSensorSimulation}
                onRefresh={fetchAllData}
                setCurrentTab={setCurrentTab}
              />
            )}

            {currentTab === 'alerts' && (
              <AlertsView
                alerts={alerts}
                locations={locations}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onResolveAlert={handleResolveAlert}
                onCreateAlert={handleCreateAlert}
                onRefresh={fetchAllData}
              />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsView
                locations={locations}
                inventory={inventory}
                vehicles={vehicles}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                inventory={inventory}
                locations={locations}
                vehicles={vehicles}
                alerts={alerts}
              />
            )}

            {currentTab === 'architecture' && (
              <ArchitectureView />
            )}

            {currentTab === 'admin' && (
              <AdminView
                locations={locations}
                onRefresh={fetchAllData}
              />
            )}

            {currentTab === 'tests' && (
              <ApiDocsAndTestsView />
            )}

            {currentTab === 'landing' && (
              <LandingPage setCurrentTab={setCurrentTab} />
            )}
            </>
            )}
          </div>
        </main>
      </div>

      {/* LogiAI Tactical Chatbot Drawer */}
      <LogiAiChat
        isOpen={logiAiOpen}
        onClose={() => setLogiAiOpen(false)}
        setCurrentTab={setCurrentTab}
      />

      {/* Reset Demo Data Modal */}
      <ResetDemoModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirmReset={handleResetDemoData}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
