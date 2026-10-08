import React, { useState } from 'react';
import { UserRole, LanguageCode } from '../../types';
import { ROLE_DEFINITIONS } from '../../lib/jwtAuth';
import { TRANSLATIONS, LANGUAGE_OPTIONS } from '../../lib/translations';
import { 
  Leaf, 
  Cpu, 
  Globe, 
  ChevronDown, 
  Users, 
  Check, 
  Radio, 
  Flame, 
  Activity,
  Layers
} from 'lucide-react';

interface TopNavBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentRole: UserRole;
  onOpenRoleModal: () => void;
  onOpenAuthModal?: () => void;
  isFirebaseAuthenticated?: boolean;
  userEmail?: string;
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
  onOpenAuthModal,
  isFirebaseAuthenticated = false,
  userEmail,
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
    { id: 'auditor', label: 'Audit' },
    { id: 'faq', label: 'FAQ & Trust' }
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
              title="Select Interface Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{currentLangObj.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onSelectLanguage(lang.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      language === lang.code
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span>{lang.nativeName}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">{lang.name}</span>
                    </div>
                    {language === lang.code && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Thermal Breach Simulator Trigger */}
          {onToggleThermalBreach && (
            <button
              onClick={onToggleThermalBreach}
              title={isThermalBreachActive ? 'Resolve Thermal Breach' : 'Simulate N-5 Highway Reefer Thermal Breach'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isThermalBreachActive
                  ? 'bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${isThermalBreachActive ? 'animate-pulse text-white' : 'text-slate-500'}`} />
              <span className="hidden lg:inline">
                {isThermalBreachActive ? 'Breach Active' : 'Simulate Breach'}
              </span>
            </button>
          )}

          {/* Offline / Online Network Toggle */}
          <button
            onClick={onToggleNetwork}
            title={isOnline ? 'Switch to Offline Mode (IndexedDB Queue)' : 'Reconnect Network (Sync Ledger)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-600' : 'text-amber-700'}`} />
            <span className="hidden sm:inline font-mono">
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {queuedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-900 text-[10px] font-bold flex items-center justify-center font-mono">
                {queuedCount}
              </span>
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

          {/* Role & Firebase Auth Indicator */}
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors min-h-[44px] ${
              isFirebaseAuthenticated
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
            }`}
            title={isFirebaseAuthenticated ? `Authenticated via Firebase: ${userEmail}` : 'Open Production Operator Sign-In'}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">
              {isFirebaseAuthenticated ? 'Verified:' : 'Operator'}
            </span>
            <span>{isFirebaseAuthenticated && userEmail ? userEmail.split('@')[0] : 'Sign In'}</span>
          </button>

        </div>

      </div>

      {/* Mobile Navigation */}
      <div className="xl:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-200 bg-slate-50 gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              currentTab === item.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
