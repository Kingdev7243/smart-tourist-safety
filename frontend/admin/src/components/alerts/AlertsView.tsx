import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Check, 
  XCircle, 
  CheckCircle2, 
  Flame, 
  ShieldAlert, 
  Clock,
  X
} from 'lucide-react';
import { Alert, AlertStatus, AlertPriority } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AlertsViewProps {
  alerts: Alert[];
  isLoading: boolean;
  onUpdateAlertStatus: (alertId: number, status: AlertStatus) => Promise<void>;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  isLoading,
  onUpdateAlertStatus,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [busyId, setBusyId] = useState<number | null>(null);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.alert_id.toString().includes(searchQuery) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.alert_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || alert.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || alert.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAction = async (alertId: number, status: AlertStatus) => {
    setBusyId(alertId);
    try {
      await onUpdateAlertStatus(alertId, status);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-slate-900 font-display">
              {t('alertsTitle')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('alertsSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
            New Alerts: <span className="font-bold text-rose-900">{alerts.filter((a) => a.status === 'NEW').length}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
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
          <span className="text-xs text-slate-400 font-semibold uppercase">{t('alertStatus')}:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">{t('all')}</option>
            <option value="NEW">{t('statusNew')}</option>
            <option value="ACKNOWLEDGED">{t('statusAcknowledged')}</option>
            <option value="CLOSED">{t('statusClosed')}</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">{t('priority')}:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
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

      {/* Alerts Feed */}
      {isLoading ? (
        <LoadingSpinner label="Loading alert stream..." />
      ) : filteredAlerts.length === 0 ? (
        <EmptyState message={t('noAlertsFound')} />
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isBusy = busyId === alert.alert_id;
            const isNew = alert.status === 'NEW';

            return (
              <div
                key={alert.alert_id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isNew ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-extrabold text-sm text-slate-900">
                      Alert #{alert.alert_id}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 px-2 py-0.5 rounded bg-slate-100">
                      {alert.alert_type}
                    </span>
                    <StatusBadge type="alert_status" value={alert.status} size="sm" />
                    <StatusBadge type="alert_priority" value={alert.priority} size="sm" />
                    {alert.incident_id && (
                      <span className="text-[11px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Incident #{alert.incident_id}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-medium text-slate-800 leading-relaxed max-w-3xl">
                    {alert.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                    {alert.acknowledged_at && (
                      <span className="text-blue-700">
                        Ack: {new Date(alert.acknowledged_at).toLocaleTimeString()}
                      </span>
                    )}
                    {alert.closed_at && (
                      <span className="text-slate-500">
                        Closed: {new Date(alert.closed_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Alert Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {alert.status === 'NEW' && (
                    <button
                      disabled={isBusy}
                      onClick={() => handleAction(alert.alert_id, 'ACKNOWLEDGED')}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 border border-blue-300 transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5 text-blue-700" />
                      <span>{t('acknowledgeAlert')}</span>
                    </button>
                  )}

                  {alert.status !== 'CLOSED' && (
                    <button
                      disabled={isBusy}
                      onClick={() => handleAction(alert.alert_id, 'CLOSED')}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('closeAlert')}</span>
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
