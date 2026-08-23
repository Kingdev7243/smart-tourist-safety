import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Flame, 
  HelpCircle, 
  Activity,
  BellRing,
  Check
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface StatusBadgeProps {
  type: 'incident_status' | 'incident_severity' | 'zone_type' | 'risk_level' | 'trip_status' | 'alert_status' | 'alert_priority' | 'user_status';
  value: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = 'md' }) => {
  const { t } = useLanguage();
  const v = (value || '').toUpperCase();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  // 1. Incident Status: OPEN, INVESTIGATING, RESOLVED
  if (type === 'incident_status') {
    if (v === 'OPEN') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          {t('statusOpen')}
        </span>
      );
    }
    if (v === 'INVESTIGATING') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-amber-600" />
          {t('statusInvestigating')}
        </span>
      );
    }
    if (v === 'RESOLVED') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {t('statusResolved')}
        </span>
      );
    }
  }

  // 2. Incident Severity / Alert Priority: LOW, MEDIUM, HIGH, CRITICAL
  if (type === 'incident_severity' || type === 'alert_priority') {
    if (v === 'CRITICAL') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-900 border border-red-300 font-bold ${sizeClasses}`}>
          <Flame className="w-3 h-3 text-red-600" />
          {t('severityCritical')}
        </span>
      );
    }
    if (v === 'HIGH') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 ${sizeClasses}`}>
          <AlertTriangle className="w-3 h-3 text-orange-600" />
          {t('severityHigh')}
        </span>
      );
    }
    if (v === 'MEDIUM') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <Activity className="w-3 h-3 text-amber-600" />
          {t('severityMedium')}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
        <ShieldCheck className="w-3 h-3 text-slate-500" />
        {t('severityLow')}
      </span>
    );
  }

  // 3. Zone Type: SAFE, RESTRICTED, DANGER
  if (type === 'zone_type') {
    if (v === 'SAFE') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          {t('zoneSafe')}
        </span>
      );
    }
    if (v === 'RESTRICTED') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <ShieldAlert className="w-3 h-3 text-amber-600" />
          {t('zoneRestricted')}
        </span>
      );
    }
    if (v === 'DANGER') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 ${sizeClasses}`}>
          <Flame className="w-3 h-3 text-rose-600" />
          {t('zoneDanger')}
        </span>
      );
    }
  }

  // 4. Alert Status: NEW, ACKNOWLEDGED, CLOSED
  if (type === 'alert_status') {
    if (v === 'NEW') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-bold ${sizeClasses}`}>
          <BellRing className="w-3 h-3 text-rose-600 animate-bounce" />
          {t('statusNew')}
        </span>
      );
    }
    if (v === 'ACKNOWLEDGED') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses}`}>
          <Check className="w-3 h-3 text-blue-600" />
          {t('statusAcknowledged')}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
        <CheckCircle2 className="w-3 h-3 text-slate-500" />
        {t('statusClosed')}
      </span>
    );
  }

  // 5. Trip Status: PLANNED, ACTIVE, COMPLETED, CANCELLED
  if (type === 'trip_status') {
    if (v === 'ACTIVE') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          {t('tripActive')}
        </span>
      );
    }
    if (v === 'PLANNED') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-slate-500" />
          {t('tripPlanned')}
        </span>
      );
    }
    if (v === 'COMPLETED') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 text-teal-600" />
          {t('tripCompleted')}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 ${sizeClasses}`}>
        {t('tripCancelled')}
      </span>
    );
  }

  // 6. User Status / Active status
  if (v === 'ACTIVE') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        {t('userStatusActive')}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
      <HelpCircle className="w-3 h-3 text-slate-400" />
      {v}
    </span>
  );
};
