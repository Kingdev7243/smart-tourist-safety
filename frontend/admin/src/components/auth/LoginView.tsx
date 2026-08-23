import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Mail, 
  ArrowRight, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  Radio,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { languageNames, Language } from '../../translations';

export const LoginView: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [email, setEmail] = useState('admin@safety.com');
  const [password, setPassword] = useState('admin123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(email, password);
  };

  const handleFillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    clearError();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden font-sans text-slate-100 selection:bg-emerald-500 selection:text-emerald-950">
      {/* Background visual elements: subtle forest gradient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Language bar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/80 border border-emerald-700/80 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wider uppercase text-white font-display">
              {t('appName')}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-mono">
              <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
              <span>{t('adminPortal')}</span>
            </div>
          </div>
        </div>

        {/* Language selector buttons */}
        <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-800">
          <Globe className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
          {(Object.keys(languageNames) as Language[]).map((langKey) => (
            <button
              key={langKey}
              onClick={() => setLanguage(langKey)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                language === langKey
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {languageNames[langKey].native}
            </button>
          ))}
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center shadow-inner mb-2">
              <Lock className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight font-display">
              {t('loginTitle')}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              {t('loginSubtitle')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                {t('emailLabel')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                {t('passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-emerald-900/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span>{t('signingIn')}</span>
              ) : (
                <>
                  <span>{t('signInButton')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Quick Admin Accounts (Seeded Backend)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillCredentials('admin@safety.com', 'admin123')}
                className="p-2 rounded-lg bg-slate-950/70 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-700 text-left transition-colors text-[10px]"
              >
                <div className="font-bold text-emerald-400">Super Admin</div>
                <div className="text-slate-400 truncate">admin@safety.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillCredentials('ravi@safety.com', 'operator123')}
                className="p-2 rounded-lg bg-slate-950/70 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-700 text-left transition-colors text-[10px]"
              >
                <div className="font-bold text-emerald-400">Operator</div>
                <div className="text-slate-400 truncate">ravi@safety.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillCredentials('inspector@safety.com', 'inspector123')}
                className="p-2 rounded-lg bg-slate-950/70 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-700 text-left transition-colors text-[10px]"
              >
                <div className="font-bold text-emerald-400">Inspector</div>
                <div className="text-slate-400 truncate">inspector@safety.com</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-4 text-center text-xs text-slate-400 border-t border-slate-900">
        <p>National Tourist Safety Command Center &copy; 2026. Real-time geofence surveillance active.</p>
      </footer>
    </div>
  );
};
