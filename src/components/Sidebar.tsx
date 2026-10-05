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
  ChevronRight
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

interface NavGroup {
  groupName: string;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number | null;
    badgeColor?: string;
    roles: string[];
  }[];
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

  const navGroups: NavGroup[] = [
    {
      groupName: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'logistics_officer', 'inventory_manager', 'transport_manager', 'analyst', 'viewer'] },
        { id: 'landing', label: 'Platform Brief', icon: Compass, roles: ['admin', 'logistics_officer', 'inventory_manager', 'transport_manager', 'analyst', 'viewer'] }
      ]
    },
    {
      groupName: 'LOGISTICS',
      items: [
        { id: 'inventory', label: 'Inventory', icon: Package, badge: criticalStockCount > 0 ? criticalStockCount : null, badgeColor: 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-400/40', roles: ['admin', 'logistics_officer', 'inventory_manager', 'analyst', 'viewer'] },
        { id: 'forecast', label: 'Demand Forecasting', icon: TrendingUp, badge: 'Adaptive', roles: ['admin', 'logistics_officer', 'analyst', 'viewer'] },
        { id: 'transport', label: 'Vehicles & Convoys', icon: Truck, roles: ['admin', 'logistics_officer', 'transport_manager', 'viewer'] }
      ]
    },
    {
      groupName: 'MONITORING',
      items: [
        { id: 'alerts', label: 'Alerts & Warnings', icon: BellRing, badge: criticalAlertsCount > 0 ? criticalAlertsCount : null, badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-400/40', roles: ['admin', 'logistics_officer', 'inventory_manager', 'transport_manager', 'analyst', 'viewer'] },
        { id: 'iot', label: 'IoT Sensor Monitor', icon: Radio, roles: ['admin', 'inventory_manager', 'logistics_officer', 'viewer'] },
        { id: 'gis', label: 'GIS / Terrain Map', icon: Map, badge: 'Live', roles: ['admin', 'logistics_officer', 'transport_manager', 'analyst', 'viewer'] },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'logistics_officer', 'analyst', 'viewer'] }
      ]
    },
    {
      groupName: 'DECISION SUPPORT',
      items: [
        { id: 'optimization', label: 'Recommendations', icon: Route, badge: 'Solver', roles: ['admin', 'logistics_officer', 'analyst'] },
        { id: 'reports', label: 'Mission Reports', icon: FileText, roles: ['admin', 'logistics_officer', 'analyst', 'viewer'] }
      ]
    },
    {
      groupName: 'SYSTEM',
      items: [
        { id: 'admin', label: 'Settings & RBAC', icon: ShieldAlert, badge: 'Admin', roles: ['admin'] },
        { id: 'architecture', label: 'Architecture', icon: Network, roles: ['admin', 'logistics_officer', 'inventory_manager', 'transport_manager', 'analyst', 'viewer'] },
        { id: 'tests', label: 'API & Verification', icon: Code2, roles: ['admin', 'analyst'] }
      ]
    }
  ];

  return (
    <aside 
      className={`relative z-30 transition-all duration-300 ease-in-out border-r shrink-0 flex flex-col justify-between ${
        collapsed ? 'w-16' : 'w-60'
      } bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800`}
    >
      {/* Scrollable Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {/* Toggle Collapse Bar */}
        <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          {!collapsed && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
              Navigation
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 mx-auto transition-colors cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Groups */}
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                {group.groupName}
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isAuthorized = user ? (user.role === 'admin' || item.roles.includes(user.role)) : true;

                return (
                  <button
                    key={item.id}
                    onClick={() => isAuthorized && setCurrentTab(item.id)}
                    disabled={!isAuthorized}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group relative cursor-pointer ${
                      !isAuthorized 
                        ? 'opacity-35 cursor-not-allowed text-slate-400 dark:text-slate-600'
                        : isActive 
                        ? 'bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/50 text-cyan-800 dark:text-cyan-300 font-semibold shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/80 border border-transparent'
                    }`}
                    title={collapsed ? `${item.label}${!isAuthorized ? ' (Restricted)' : ''}` : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-300'}`} />
                    
                    {!collapsed && (
                      <span className="truncate tracking-tight text-left flex-1">
                        {item.label}
                      </span>
                    )}

                    {!collapsed && item.badge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        item.badgeColor || 'bg-slate-100 dark:bg-cyan-950/80 border-slate-200 dark:border-cyan-500/30 text-slate-600 dark:text-cyan-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip on collapsed state */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                        {item.label}
                        {!isAuthorized && <span className="text-rose-400 ml-1 text-[10px]">(Locked)</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
        {!collapsed ? (
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>DefenceLogix</span>
            </span>
            <span>v1.0</span>
          </div>
        ) : (
          <div className="flex justify-center text-cyan-600 dark:text-cyan-400 text-xs font-mono">
            ●
          </div>
        )}
      </div>
    </aside>
  );
};
