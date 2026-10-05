import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Bell, 
  RefreshCw, 
  Sun, 
  Moon, 
  UserCheck, 
  Bot, 
  Clock, 
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  toggleLogiAi: () => void;
  openResetModal: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  criticalAlertCount: number;
}

const TAB_METADATA: Record<string, { title: string; desc: string }> = {
  dashboard: { title: 'Operational Command', desc: 'Predictive logistics & forward supply chain overview' },
  forecast: { title: 'Demand Forecasting', desc: 'Multi-model time-series predictions with weather factors' },
  inventory: { title: 'Inventory Intelligence', desc: 'SKU ledger, consumption velocity & reorder points' },
  gis: { title: 'GIS Logistics Map', desc: 'Geospatial terrain, forward passes & supply corridors' },
  optimization: { title: 'Replenishment Solver', desc: 'Auto-balanced cross-depot transfer recommendations' },
  transport: { title: 'Transport & Fleet', desc: 'All-terrain convoys, aerial drones & asset tracking' },
  iot: { title: 'IoT Sensor Monitoring', desc: 'Cold-chain storage vaults & environmental telemetry' },
  alerts: { title: 'Early Warning Alerts', desc: 'Threshold breaches, stockout alarms & incident triage' },
  analytics: { title: 'Operations Analytics', desc: 'Comparative burn velocity & logistics efficiency metrics' },
  reports: { title: 'Mission Reports', desc: 'Audit exports, readiness briefs & compliance summaries' },
  architecture: { title: 'Solution Architecture', desc: 'Multi-layer system pipeline & technology stack' },
  admin: { title: 'System Administration', desc: 'Role-based access control & nodal node settings' },
  tests: { title: 'API & Verification', desc: 'Endpoint diagnostics, swagger documentation & tests' },
  landing: { title: 'Platform Brief', desc: 'Operational capabilities & executive summary' },
};

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  toggleLogiAi,
  openResetModal,
  darkMode,
  setDarkMode,
  criticalAlertCount
}) => {
  const { user, switchRole } = useAuth();
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setTimeUtc(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'admin', label: 'Administrator', desc: 'Full system control & user roles' },
    { role: 'logistics_officer', label: 'Logistics Officer', desc: 'Forecasts, replenishment & routes' },
    { role: 'inventory_manager', label: 'Inventory Manager', desc: 'Stock levels, min/max thresholds' },
    { role: 'transport_manager', label: 'Transport Manager', desc: 'Fleet allocation & dispatch' },
    { role: 'analyst', label: 'Analyst', desc: 'Time-series models & analytics' },
    { role: 'viewer', label: 'Observer (Viewer)', desc: 'Read-only operational view' },
  ];

  const currentMeta = TAB_METADATA[currentTab] || { title: 'Command Console', desc: 'Predictive logistics decision support' };

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md px-3 lg:px-6 py-2 flex items-center justify-between transition-colors ${
      darkMode 
        ? 'border-slate-800 bg-slate-950/90 text-slate-100' 
        : 'border-slate-200 bg-white/95 text-slate-900 shadow-xs'
    }`}>
      {/* Brand & Contextual Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button 
          onClick={() => setCurrentTab('landing')}
          className="flex items-center gap-2.5 text-left group shrink-0 cursor-pointer"
          title="Return to Platform Overview"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-900 border border-cyan-400/40 shadow-xs">
            <Shield className="w-4 h-4 text-cyan-200" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm tracking-wider text-cyan-600 dark:text-cyan-400">
                DEFENCELOGIX <span className="text-slate-900 dark:text-white">AI</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-tight hidden sm:block">
              Decision Support
            </p>
          </div>
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-slate-300 dark:bg-slate-800 mx-1 hidden sm:block shrink-0" />

        {/* Current Active Section Context */}
        <div className="min-w-0 hidden md:block">
          <h2 className="font-heading text-xs lg:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {currentMeta.title}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm lg:max-w-md">
            {currentMeta.desc}
          </p>
        </div>

        {/* Live Status Tag */}
        <div className="hidden xl:flex items-center gap-2 pl-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">STATUS: NOMINAL</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span>{timeUtc}</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* LogiAI Quick Assist Button */}
        <button
          onClick={toggleLogiAi}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-300 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-all font-mono text-xs cursor-pointer"
          title="Open LogiAI Tactical Assistant"
        >
          <Bot className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="hidden sm:inline font-semibold">LogiAI</span>
        </button>

        {/* Alerts Center Trigger */}
        <button
          onClick={() => setCurrentTab('alerts')}
          className={`relative p-1.5 rounded-lg border transition-all cursor-pointer ${
            criticalAlertCount > 0 
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100' 
              : 'bg-slate-100 dark:bg-slate-900/70 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Early Warning Alerts"
        >
          <Bell className="w-4 h-4" />
          {criticalAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold shadow-xs">
              {criticalAlertCount}
            </span>
          )}
        </button>

        {/* Demo Data Reset Button */}
        <button
          onClick={openResetModal}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all font-mono text-xs cursor-pointer"
          title="Reset Synthetic Demo Dataset"
        >
          <RefreshCw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span className="font-medium">Reset Demo</span>
        </button>

        {/* Role Quick Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-cyan-500/30 text-left hover:border-cyan-500/50 transition-all cursor-pointer"
            title="Switch User Role & Permissions"
          >
            <div className="w-6 h-6 rounded bg-cyan-100 dark:bg-cyan-900/60 border border-cyan-300 dark:border-cyan-400/40 flex items-center justify-center text-cyan-700 dark:text-cyan-300">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 capitalize leading-tight">
                {user?.role.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/40 shadow-xl p-2 z-50 text-slate-800 dark:text-slate-200">
              <div className="px-2 py-1.5 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Select User Role</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{user?.role}</span>
              </div>
              <div className="mt-1 space-y-1">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRole(r.role);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg transition-colors flex flex-col cursor-pointer ${
                      user?.role === r.role 
                        ? 'bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs">{r.label}</span>
                      {user?.role === r.role && (
                        <span className="text-[9px] font-mono bg-cyan-200 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 px-1.5 py-0.2 rounded font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {r.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all cursor-pointer"
          title={darkMode ? 'Switch to Clean Light Mode' : 'Switch to Dark Night-Vision Mode'}
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
