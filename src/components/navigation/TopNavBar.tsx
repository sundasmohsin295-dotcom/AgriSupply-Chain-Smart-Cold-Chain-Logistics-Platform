import React, { useState } from 'react';
import { UserRole, LanguageCode, ThemeMode } from '../../types';
import { ROLE_DEFINITIONS } from '../../lib/jwtAuth';
import { LANGUAGE_OPTIONS, TRANSLATIONS, isRTL } from '../../lib/translations';
import { 
  Wifi, 
  WifiOff, 
  Users, 
  Key, 
  Sun, 
  Moon, 
  Globe, 
  Leaf, 
  ChevronDown,
  Flame,
  Cpu
} from 'lucide-react';

interface TopNavBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentRole: UserRole;
  onOpenRoleModal: () => void;
  onOpenJWTModal: () => void;
  onOpenJudgePanel?: () => void;
  isOnline: boolean;
  onToggleNetwork: () => void;
  queuedCount: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
  language: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  isThermalBreachActive?: boolean;
  onToggleThermalBreach?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentTab,
  onSelectTab,
  currentRole,
  onOpenRoleModal,
  onOpenJWTModal,
  onOpenJudgePanel,
  isOnline,
  onToggleNetwork,
  queuedCount,
  theme,
  onToggleTheme,
  language,
  onSelectLanguage,
  isThermalBreachActive = false,
  onToggleThermalBreach
}) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const roleInfo = ROLE_DEFINITIONS[currentRole];
  const t = TRANSLATIONS[language];
  const currentLangObj = LANGUAGE_OPTIONS.find((l) => l.code === language) || LANGUAGE_OPTIONS[0]!;

  const navItems = [
    { id: 'overview', label: t.navDashboard },
    { id: 'farmer', label: t.navInspection },
    { id: 'transporter', label: t.navTracking },
    { id: 'warehouse', label: t.navInventory },
    { id: 'pipeline', label: t.navPipeline },
    { id: 'reports', label: t.navReports },
    { id: 'auditor', label: 'Blockchain Audit' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0a1017]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand title & logo (Matching Reference Image) */}
        <button
          onClick={() => onSelectTab('overview')}
          className="text-left flex items-center gap-2.5 shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500/20 text-white dark:text-emerald-400 border border-emerald-600 dark:border-emerald-500/30 flex items-center justify-center shadow-sm">
            <Leaf className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                {t.brand}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block leading-none tracking-wide">
              {t.brandTagline}
            </span>
          </div>
        </button>

        {/* Zone 2: 4-7 Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-emerald-800 dark:text-amber-400 bg-emerald-50 dark:bg-amber-400/10 border border-emerald-300 dark:border-amber-400/20 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions (Theme Toggle, Language Picker, Network Resilience, Role Switcher) */}
        <div className="flex items-center gap-2">
          
          {/* Animated Light/Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            title={t.themeToggle}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-amber-400 hover:scale-105 transition-all"
            aria-label="Toggle light and dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 transition-transform rotate-0 dark:rotate-180" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* 10-Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-emerald-500 transition"
              title="Select Language (10 Available)"
            >
              <span>{currentLangObj.flag}</span>
              <span className="hidden sm:inline font-mono">{currentLangObj.code.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => {
                      onSelectLanguage(opt.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      language === opt.code
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{opt.flag}</span>
                      <span>{opt.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{opt.nativeName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Visual Thermal Breach Pill Indicator */}
          {isThermalBreachActive && (
            <button
              onClick={onToggleThermalBreach}
              title="Active Thermal Breach detected (>4.0°C). Click to resolve."
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 animate-breach-pulse shadow-sm"
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">BREACH &gt;4.0°C</span>
              <span className="sm:hidden">BREACH</span>
            </button>
          )}

          {/* Offline/Online Network Resilience Trigger */}
          <button
            onClick={onToggleNetwork}
            title={isOnline ? 'Online 5G (Click to simulate remote cell drop)' : 'Offline Mode (Click to restore network & sync queue)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              isOnline
                ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                : 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 dark:border-amber-500/50 text-amber-800 dark:text-amber-300 animate-pulse font-bold'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Offline</span>
                {queuedCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                    {queuedCount}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Judge Defense & System Diagnostics Action */}
          {onOpenJudgePanel && (
            <button
              onClick={onOpenJudgePanel}
              title="Open Technical Judge Defense & System Diagnostics Panel"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-300 dark:border-slate-700/80 transition shadow-xs whitespace-nowrap active:scale-95"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden lg:inline font-mono">Judge Defense</span>
            </button>
          )}

          {/* Role Switcher Action */}
          <button
            onClick={onOpenRoleModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:border dark:border-emerald-500/30 dark:hover:bg-emerald-500/20 transition-all shadow-xs whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{roleInfo.title.split(' ')[0]}:</span>
            <span>{roleInfo.name.split(' ')[0]}</span>
          </button>

        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="xl:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-[#0d141e] gap-1 no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              currentTab === item.id
                ? 'bg-emerald-600 text-white dark:bg-amber-400/10 dark:text-amber-400 dark:border dark:border-amber-400/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
