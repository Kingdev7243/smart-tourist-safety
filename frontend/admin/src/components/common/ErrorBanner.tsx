import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry, onDismiss }) => {
  const { t } = useLanguage();

  if (!message) return null;

  return (
    <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-xs">
      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm font-medium">
        <p>{message}</p>
      </div>
      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-rose-100 hover:bg-rose-200 text-rose-900 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('retry')}
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-rose-500 hover:text-rose-800 rounded transition-colors"
            title={t('close')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
