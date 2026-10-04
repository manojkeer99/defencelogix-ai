import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Terminal, 
  Bell, 
  RefreshCw, 
  Sun, 
  Moon, 
  UserCheck, 
  Bot, 
  Clock, 
  Layers, 
  AlertTriangle 
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
  const [timeLocal, setTimeLocal] = useState<string>('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setTimeUtc(now.toISOString().substring(11, 19) + ' Z');
      setTimeLocal(now.toLocaleTimeString('en-US', { hour12: false }) + ' L');
    };
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'admin', label: 'Administrator', desc: 'Full System Control, User Management & Config' },
    { role: 'logistics_officer', label: 'Logistics Officer', desc: 'Forecasts, Supply Requests & Route Planning' },
    { role: 'inventory_manager', label: 'Inventory Manager', desc: 'Stock Tracking, Shortages & Reorders' },
    { role: 'transport_manager', label: 'Transport Manager', desc: 'Fleet Resources, Routes & Scheduling' },
    { role: 'analyst', label: 'Analyst', desc: 'Historical Models, Comparative Predictions & Reports' },
    { role: 'viewer', label: 'Viewer', desc: 'Read-only Dashboard & GIS View' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-slate-950/90 backdrop-blur-md px-3 lg:px-6 py-2.5 flex items-center justify-between text-slate-100">
      {/* Brand & Sector Identity */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setCurrentTab('landing')}
          className="flex items-center gap-2.5 text-left group"
          title="Return to Platform Overview"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-900 border border-cyan-400/40 shadow-lg shadow-cyan-950/50 group-hover:border-cyan-300 transition-all">
            <Shield className="w-5 h-5 text-cyan-200" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-lg tracking-wider text-cyan-400 group-hover:text-cyan-300 transition-colors">
                DEFENCELOGIX <span className="text-white">AI</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                DEMO MODE
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                MoD DSSC 26251
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden md:block">
              Predictive Logistics & Forward Supply Chain Management
            </p>
          </div>
        </button>

        {/* DEFCON / Readiness Status */}
        <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-800">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/80 border border-emerald-500/30 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-semibold">READINESS: OPTIMAL</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeUtc}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">{timeLocal}</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Role Switcher, Alerts, LogiAI, Reset Demo, Dark/Light Mode */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* LogiAI Quick Button */}
        <button
          onClick={toggleLogiAi}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 transition-all font-mono text-xs shadow-sm cursor-pointer"
          title="Open LogiAI Tactical Assistant"
        >
          <Bot className="w-4 h-4 text-cyan-400 animate-bounce" />
          <span className="hidden sm:inline font-semibold">LogiAI</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
        </button>

        {/* Alerts Center Trigger */}
        <button
          onClick={() => setCurrentTab('alerts')}
          className={`relative p-2 rounded-lg border transition-all cursor-pointer ${
            criticalAlertCount > 0 
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 hover:bg-rose-900/50' 
              : 'bg-slate-900/70 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title="Early Warning Alerts"
        >
          <Bell className="w-4 h-4" />
          {criticalAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold shadow-md">
              {criticalAlertCount}
            </span>
          )}
        </button>

        {/* Demo Data Reset Button */}
        <button
          onClick={openResetModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 hover:bg-amber-900/40 hover:border-amber-400 transition-all font-mono text-xs cursor-pointer"
          title="Reset Synthetic Demo Dataset"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline font-medium">Reset Demo</span>
        </button>

        {/* Role Quick Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-cyan-500/30 text-left hover:border-cyan-400 transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded bg-cyan-900/60 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[11px] font-semibold text-slate-200 capitalize leading-tight">
                {user?.role.replace('_', ' ')}
              </p>
              <p className="text-[9px] font-mono text-cyan-400 leading-tight">
                {user?.serviceNumber}
              </p>
            </div>
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg bg-slate-900 border border-cyan-500/40 shadow-2xl p-2 z-50 text-slate-200">
              <div className="px-2 py-1.5 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Select User Role</span>
                <span className="text-cyan-400 font-semibold">{user?.role}</span>
              </div>
              <div className="mt-1 space-y-1">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRole(r.role);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-md transition-colors flex flex-col cursor-pointer ${
                      user?.role === r.role 
                        ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300' 
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs">{r.label}</span>
                      {user?.role === r.role && (
                        <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 leading-snug">
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
          className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all cursor-pointer"
          title={darkMode ? 'Switch to Tactical Light Mode' : 'Switch to Dark Night-Vision Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
        </button>
      </div>
    </header>
  );
};
