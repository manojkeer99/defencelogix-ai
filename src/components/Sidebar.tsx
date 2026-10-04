import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Package, 
  Map, 
  Route, 
  Truck, 
  Radio, 
  BellRing, 
  BarChart3, 
  FileText, 
  ShieldAlert, 
  Network, 
  Code2, 
  Compass,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  criticalAlertsCount: number;
  criticalStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
  criticalAlertsCount,
  criticalStockCount
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null, roles: ['admin', 'logistics_officer', 'inventory_manager', 'transport_manager', 'analyst', 'viewer'] },
    { id: 'forecast', label: 'Demand Forecast', icon: TrendingUp, badge: 'AI/ML', roles: ['admin', 'logistics_officer', 'analyst', 'viewer'] },
    { id: 'inventory', label: 'Inventory', icon: Package, badge: criticalStockCount > 0 ? `${criticalStockCount}` : null, badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30', roles: ['admin', 'logistics_officer', 'inventory_manager', 'analyst', 'viewer'] },
    { id: 'gis', label: 'GIS Logistics Map', icon: Map, badge: 'Live', roles: ['admin', 'logistics_officer', 'transport_manager', 'analyst', 'viewer'] },
    { id: 'optimization', label: 'Logistics Optimization', icon: Route, badge: 'Solver', roles: ['admin', 'logistics_officer', 'analyst'] },
    { id: 'transport', label: 'Transport Management', icon: Truck, badge: null, roles: ['admin', 'logistics_officer', 'transport_manager', 'viewer'] },
    { id: 'iot', label: 'IoT Sensor Monitor', icon: Radio, badge: 'Sensors', roles: ['admin', 'inventory_manager', 'logistics_officer', 'viewer'] },
    { id: 'alerts', label: 'Alerts & Warnings', icon: BellRing, badge: criticalAlertsCount > 0 ? `${criticalAlertsCount}` : null, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30', roles: ['admin', 'logistics_officer', 'inventory_manager', 'transport_manager', 'analyst', 'viewer'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: null, roles: ['admin', 'logistics_officer', 'analyst', 'viewer'] },
    { id: 'reports', label: 'Mission Reports', icon: FileText, badge: 'PDF/CSV', roles: ['admin', 'logistics_officer', 'analyst', 'viewer'] },
    { id: 'architecture', label: 'Solution & Architecture', icon: Network, badge: 'Brief', roles: ['admin', 'logistics_officer', 'inventory_manager', 'transport_manager', 'analyst', 'viewer'] },
    { id: 'admin', label: 'Admin Panel', icon: ShieldAlert, badge: 'RBAC', roles: ['admin'] },
    { id: 'tests', label: 'API & Test Runner', icon: Code2, badge: 'Suite', roles: ['admin', 'analyst'] },
    { id: 'landing', label: 'Platform Brief', icon: Compass, badge: null, roles: ['admin', 'logistics_officer', 'inventory_manager', 'transport_manager', 'analyst', 'viewer'] }
  ];

  return (
    <aside 
      className={`relative z-30 transition-all duration-300 ease-in-out border-r border-cyan-500/20 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Header / Collapse Toggle */}
      <div>
        <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800/80">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                TACTICAL MODULES
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 mx-auto transition-colors cursor-pointer"
            title={collapsed ? 'Expand Navigation' : 'Collapse Navigation'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isAuthorized = user ? (user.role === 'admin' || item.roles.includes(user.role)) : true;

            return (
              <button
                key={item.id}
                onClick={() => isAuthorized && setCurrentTab(item.id)}
                disabled={!isAuthorized}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative cursor-pointer ${
                  !isAuthorized 
                    ? 'opacity-40 cursor-not-allowed text-slate-600'
                    : isActive 
                    ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/50 border border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-950/40 font-semibold' 
                    : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900/80'
                }`}
                title={collapsed ? `${item.label}${!isAuthorized ? ' (Role Restricted)' : ''}` : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`} />
                
                {!collapsed && (
                  <span className="truncate tracking-wide text-left flex-1">
                    {item.label}
                  </span>
                )}

                {!collapsed && item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    item.badgeColor || 'bg-cyan-950/80 border-cyan-500/30 text-cyan-300'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 border border-cyan-500/30 text-slate-100 text-xs rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {item.label}
                    {!isAuthorized && <span className="text-rose-400 ml-1 text-[10px]">(Locked)</span>}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between text-slate-300 font-mono">
                <span>SIMULATION MODE</span>
                <span className="text-emerald-400">ONLINE</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Non-sensitive synthetic test environment for MoD evaluation.
              </p>
            </div>
            <div className="text-[10px] text-slate-400 font-mono text-center">
              DSSC DSS v1.0 • SIH 26251
            </div>
          </div>
        ) : (
          <div className="flex justify-center text-cyan-400 text-xs font-mono">
            v1.0
          </div>
        )}
      </div>
    </aside>
  );
};
