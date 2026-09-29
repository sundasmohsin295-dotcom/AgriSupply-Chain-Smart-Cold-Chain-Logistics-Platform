import React, { useState } from 'react';
import { UserRole, LanguageCode } from '../../types';
import { ROLE_DEFINITIONS } from '../../lib/jwtAuth';
import { LANGUAGE_OPTIONS, TRANSLATIONS, isRTL } from '../../lib/translations';
import { 
  Wifi, 
  WifiOff, 
  Users, 
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
  onOpenJWTModal?: () => void;
  onOpenJudgePanel?: () => void;
  isOnline: boolean;
  onToggleNetwork: () => void;
  queuedCount: number;
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
  onOpenJudgePanel,
  isOnline,
  onToggleNetwork,
  queuedCount,
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
    { id: 'auditor', label: 'Audit' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand */}
        <button
          onClick={() => onSelectTab('overview')}
          className="text-left flex items-center gap-2.5 shrink-0 hover:opacity-75 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white border border-emerald-600 flex items-center justify-center">
            <Leaf className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-base tracking-tight">
                {t.brand}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold block leading-none tracking-wide">
              {t.brandTagline}
            </span>
          </div>
        </button>

        {/* Zone 2: Primary Navigation */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-emerald-800 bg-emerald-50 border border-emerald-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Secondary Actions */}
        <div className="flex items-center gap-2">
          
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
              title="Select Language"
            >
              <span>{currentLangObj.flag}</span>
              <span className="hidden sm:inline font-mono text-xs">{currentLangObj.code.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => {
                      onSelectLanguage(opt.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                      language === opt.code
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{opt.flag}</span>
                      <span>{opt.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Thermal Breach Indicator */}
          {isThermalBreachActive && (
            <button
              onClick={onToggleThermalBreach}
              title="Thermal breach active"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 hover:bg-rose-200 transition-colors"
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">BREACH</span>
            </button>
          )}

          {/* Network Status */}
          <button
            onClick={onToggleNetwork}
            title={isOnline ? 'Online' : 'Offline Mode'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isOnline
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                : 'bg-amber-100 border-amber-300 text-amber-700 font-bold'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Offline</span>
                {queuedCount > 0 && (
                  <span className="bg-amber-600 text-white text-[10px] px-1.5 rounded-full font-mono font-bold">
                    {queuedCount}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Judge/Demo Controls */}
          {onOpenJudgePanel && (
            <button
              onClick={onOpenJudgePanel}
              title="Demo & Diagnostics"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-emerald-700 border border-slate-300 transition-colors"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="hidden lg:inline font-mono">Demo</span>
            </button>
          )}

          {/* Role Indicator */}
          <button
            onClick={onOpenRoleModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">{roleInfo.title.split(' ')[0]}:</span>
            <span>{roleInfo.name.split(' ')[0]}</span>
          </button>

        </div>

      </div>

      {/* Mobile Navigation */}
      <div className="xl:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-200 bg-slate-50 gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              currentTab === item.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
