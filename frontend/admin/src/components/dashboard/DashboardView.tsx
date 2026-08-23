import React from 'react';
import { 
  Users, 
  Compass, 
  AlertTriangle, 
  Bell, 
  ShieldCheck, 
  Flame, 
  ArrowUpRight, 
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles
} from 'lucide-react';
import { User, Trip, Zone, Incident, Alert } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../common/StatusBadge';
import { SafetyMap } from '../map/SafetyMap';
import { EmptyState } from '../common/EmptyState';

interface DashboardViewProps {
  users: User[];
  trips: Trip[];
  zones: Zone[];
  incidents: Incident[];
  alerts: Alert[];
  onNavigate: (tab: any) => void;
  onAcknowledgeAlert?: (alertId: number) => void;
  onResolveIncident?: (incidentId: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  users,
  trips,
  zones,
  incidents,
  alerts,
  onNavigate,
  onAcknowledgeAlert,
  onResolveIncident,
}) => {
  const { t } = useLanguage();

  // Compute stats strictly from real backend arrays
  const totalTourists = users.length;
  const activeTrips = trips.filter((t) => t.status === 'ACTIVE').length;
  const openIncidents = incidents.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
  const criticalIncidents = incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const newAlerts = alerts.filter((a) => a.status === 'NEW').length;
  const totalZones = zones.length;
  const activeZones = zones.filter((z) => z.status === 'ACTIVE').length;

  const recentIncidents = incidents.slice(0, 4);
  const recentAlerts = alerts.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Critical Emergency Banner if any critical incidents/alerts are open */}
      {criticalIncidents > 0 && (
        <div className="p-4 rounded-2xl bg-red-600 text-white shadow-lg flex flex-wrap items-center justify-between gap-4 border border-red-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-800 flex items-center justify-center">
              <Flame className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-wide uppercase">
                {t('criticalAttention')}: {criticalIncidents} Critical Emergencies Active
              </h4>
              <p className="text-xs text-red-100">
                Immediate response required for high-risk geofence breaches or SOS panic triggers.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('incidents')}
            className="px-4 py-2 bg-white text-red-900 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors shadow-sm"
          >
            {t('viewAll')}
          </button>
        </div>
      )}

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Open Incidents */}
        <div 
          onClick={() => onNavigate('incidents')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('openIncidents')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:bg-rose-700 group-hover:text-white transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display">
            {openIncidents}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <span className={openIncidents > 0 ? 'text-rose-600 font-semibold' : ''}>
              {openIncidents > 0 ? `${openIncidents} active dispatches` : 'All clear'}
            </span>
          </div>
        </div>

        {/* Metric 2: Critical & New Alerts */}
        <div 
          onClick={() => onNavigate('alerts')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('criticalAlerts')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-700 group-hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display">
            {newAlerts}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <span className={newAlerts > 0 ? 'text-amber-600 font-semibold' : ''}>
              {newAlerts > 0 ? `${newAlerts} unacknowledged` : 'Stream normal'}
            </span>
          </div>
        </div>

        {/* Metric 3: Safety Zones */}
        <div 
          onClick={() => onNavigate('zones')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('safetyZones')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-800 group-hover:text-white transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display">
            {activeZones}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <span>{totalZones} total configured</span>
          </div>
        </div>

        {/* Metric 4: Total Monitored Tourists */}
        <div 
          onClick={() => onNavigate('tourists')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('totalTourists')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display">
            {totalTourists}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <span>{t('touristsSub')}</span>
          </div>
        </div>
      </div>

      {/* Embedded Tactical Map Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              {t('mapTitle')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('mapSubtitle')}
            </p>
          </div>
          <button
            onClick={() => onNavigate('map')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
          >
            <span>Full Map View</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <SafetyMap zones={zones} incidents={incidents} height="420px" />
      </div>

      {/* Two Column Grid: Recent Incidents Triage & Emergency Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {t('recentIncidents')}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('incidents')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 hover:underline flex items-center gap-1"
            >
              <span>{t('viewAll')}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {recentIncidents.length === 0 ? (
            <EmptyState message={t('noIncidentsFound')} />
          ) : (
            <div className="space-y-3 flex-1">
              {recentIncidents.map((incident) => (
                <div
                  key={incident.incident_id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">#{incident.incident_id}</span>
                      <span className="font-semibold text-slate-700">{incident.incident_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge type="incident_status" value={incident.status} size="sm" />
                      <StatusBadge type="incident_severity" value={incident.severity} size="sm" />
                    </div>
                  </div>
                  <p className="text-slate-600 line-clamp-2 mb-2">{incident.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Trip #{incident.trip_id}</span>
                    <span>{new Date(incident.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Alerts Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {t('recentAlerts')}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 hover:underline flex items-center gap-1"
            >
              <span>{t('viewAll')}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {recentAlerts.length === 0 ? (
            <EmptyState message={t('noAlertsFound')} />
          ) : (
            <div className="space-y-3 flex-1">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Alert #{alert.alert_id}</span>
                      <StatusBadge type="alert_priority" value={alert.priority} size="sm" />
                    </div>
                    <StatusBadge type="alert_status" value={alert.status} size="sm" />
                  </div>
                  <p className="text-slate-700 font-medium line-clamp-2 mb-2">{alert.message}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Type: {alert.alert_type}</span>
                    <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
