import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Flame, 
  MapPin, 
  Plus, 
  X,
  UserCheck,
  ShieldAlert,
  Compass
} from 'lucide-react';
import { Incident, IncidentStatus, SeverityLevel } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface IncidentsViewProps {
  incidents: Incident[];
  isLoading: boolean;
  onUpdateStatus: (incidentId: number, newStatus: IncidentStatus) => Promise<void>;
  onCreateIncident?: (data: any) => Promise<void>;
  onSelectOnMap?: (incident: Incident) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  isLoading,
  onUpdateStatus,
  onCreateIncident,
  onSelectOnMap,
}) => {
  const { t } = useLanguage();
  const { admin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Filtered incidents
  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.incident_id.toString().includes(searchQuery) ||
      incident.incident_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || incident.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || incident.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const handleStatusChange = async (incidentId: number, nextStatus: IncidentStatus) => {
    setProcessingId(incidentId);
    try {
      await onUpdateStatus(incidentId, nextStatus);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            <h2 className="text-xl font-bold text-slate-900 font-display">
              {t('incidentsTitle')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('incidentsSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
            Total: <span className="font-bold text-slate-900">{incidents.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
            Open: <span className="font-bold text-rose-900">{incidents.filter((i) => i.status !== 'RESOLVED').length}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search')}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">{t('incidentStatus')}:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">{t('all')}</option>
            <option value="OPEN">{t('statusOpen')}</option>
            <option value="INVESTIGATING">{t('statusInvestigating')}</option>
            <option value="RESOLVED">{t('statusResolved')}</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">{t('severity')}:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">{t('all')}</option>
            <option value="CRITICAL">{t('severityCritical')}</option>
            <option value="HIGH">{t('severityHigh')}</option>
            <option value="MEDIUM">{t('severityMedium')}</option>
            <option value="LOW">{t('severityLow')}</option>
          </select>
        </div>
      </div>

      {/* Incidents List */}
      {isLoading ? (
        <LoadingSpinner label="Fetching incidents from server..." />
      ) : filteredIncidents.length === 0 ? (
        <EmptyState message={t('noIncidentsFound')} />
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => {
            const isBusy = processingId === incident.incident_id;

            return (
              <div
                key={incident.incident_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 font-mono">
                      #{incident.incident_id}
                    </span>
                    <span className="font-bold text-sm text-slate-800">
                      {incident.incident_type}
                    </span>
                    <StatusBadge type="incident_status" value={incident.status} size="sm" />
                    <StatusBadge type="incident_severity" value={incident.severity} size="sm" />
                    {incident.zone_id && (
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Zone #{incident.zone_id}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {incident.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Compass className="w-3 h-3 text-slate-400" />
                      Trip ID: <span className="text-slate-600 font-semibold">#{incident.trip_id}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(incident.created_at).toLocaleString()}
                    </span>
                    {incident.resolved_at && (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Resolved at {new Date(incident.resolved_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {onSelectOnMap && (
                    <button
                      onClick={() => onSelectOnMap(incident)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('viewOnMap')}</span>
                    </button>
                  )}

                  {incident.status === 'OPEN' && (
                    <button
                      disabled={isBusy}
                      onClick={() => handleStatusChange(incident.incident_id, 'INVESTIGATING')}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>{t('assignPatrol')}</span>
                    </button>
                  )}

                  {incident.status !== 'RESOLVED' && (
                    <button
                      disabled={isBusy}
                      onClick={() => handleStatusChange(incident.incident_id, 'RESOLVED')}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span>{t('markResolved')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
