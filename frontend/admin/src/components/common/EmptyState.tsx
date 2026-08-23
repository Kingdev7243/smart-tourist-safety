import React from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface EmptyStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs my-4">
      <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
        {icon || <Shield className="w-7 h-7" />}
      </div>
      {title && <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>}
      <p className="text-sm text-slate-500 max-w-md">{message}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {actionLabel || t('refresh')}
        </button>
      )}
    </div>
  );
};
