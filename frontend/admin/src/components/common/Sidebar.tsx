import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  AlertTriangle, 
  Bell, 
  ShieldAlert, 
  Map as MapIcon, 
  X,
  Compass
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export type ActiveTab = 'dashboard' | 'incidents' | 'alerts' | 'zones' | 'map' | 'tourists';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  openIncidentsCount: number;
  newAlertsCount: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  openIncidentsCount,
  newAlertsCount,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { t } = useLanguage();

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: t('navDashboard'),
      icon: LayoutDashboard,
    },
    {
      id: 'incidents',
      label: t('navIncidents'),
      icon: AlertTriangle,
      badge: openIncidentsCount,
      badgeColor: 'bg-rose-100 text-rose-800 border border-rose-200',
    },
    {
      id: 'alerts',
      label: t('navAlerts'),
      icon: Bell,
      badge: newAlertsCount,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-200',
    },
    {
      id: 'zones',
      label: t('navZones'),
      icon: ShieldAlert,
    },
    {
      id: 'map',
      label: t('navMap'),
      icon: MapIcon,
    },
    {
      id: 'tourists',
      label: t('navTourists'),
      icon: Users,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-emerald-950 text-white">
        <span className="font-bold text-sm tracking-wide">{t('appName')}</span>
        <button
          onClick={onCloseMobile}
          className="p-1 rounded-md text-emerald-200 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b border-slate-100">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {t('adminPortal')}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold leading-none ${
                    isActive ? 'bg-white text-emerald-950' : item.badgeColor || 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Safety Notice footer */}
      <div className="p-4 border-t border-slate-100 bg-emerald-50/40 text-slate-500 text-[11px]">
        <div className="flex items-center gap-2 text-emerald-900 font-semibold mb-1">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-700" />
          <span>Surveillance Engine</span>
        </div>
        <p className="leading-tight text-slate-500">
          Continuous GPS geofence boundary & emergency triage active.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
