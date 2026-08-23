import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Globe, 
  LogOut, 
  Menu, 
  X, 
  UserCheck, 
  Radio,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { languageNames, Language } from '../../translations';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
  onRefreshAll,
  isRefreshing,
}) => {
  const { admin, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-emerald-950 text-white border-b border-emerald-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 border border-emerald-700 flex items-center justify-center shadow-inner">
                <ShieldAlert className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-white font-display">
                    {t('appName')}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                    <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                    {t('liveMonitoring')}
                  </span>
                </div>
                <p className="hidden md:block text-xs text-emerald-300/80 line-clamp-1">
                  {t('appSubtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Right actions: Language Switcher, Admin info & Logout */}
          <div className="flex items-center gap-3">
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-emerald-100 text-xs font-semibold border border-emerald-800 transition-colors"
                title="Change language"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>{languageNames[language].native}</span>
                <ChevronDown className="w-3 h-3 text-emerald-300 opacity-70" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-slate-800 z-50">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                    Language / மொழி / भाषा
                  </div>
                  {(Object.keys(languageNames) as Language[]).map((langKey) => (
                    <button
                      key={langKey}
                      onClick={() => {
                        setLanguage(langKey);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                        language === langKey ? 'font-bold text-emerald-800 bg-emerald-50/60' : 'text-slate-700'
                      }`}
                    >
                      <span>{languageNames[langKey].native}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{langKey}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Info Badge */}
            {admin && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-800/80 text-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-emerald-100 flex items-center justify-center font-bold text-xs">
                  {admin.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white leading-tight">{admin.name}</div>
                  <div className="text-[10px] text-emerald-300 uppercase tracking-wider font-mono">
                    {admin.role}
                  </div>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-semibold border border-rose-800 transition-colors"
              title={t('navLogout')}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('navLogout')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
