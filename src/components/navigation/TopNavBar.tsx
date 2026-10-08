import React, { useState, useRef, useEffect } from 'react';
import { UserRole, LanguageCode, ProduceBatch } from '../../types';
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
  Search,
  X,
  RotateCcw,
  Truck,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Package
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
  batches?: ProduceBatch[];
  onSelectBatch?: (batch: ProduceBatch) => void;
  onResetDemo?: () => void;
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
  onToggleThermalBreach,
  batches = [],
  onSelectBatch,
  onResetDemo
}) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const roleInfo = ROLE_DEFINITIONS[currentRole];
  const t = TRANSLATIONS[language];
  const currentLangObj = LANGUAGE_OPTIONS.find((l) => l.code === language) || LANGUAGE_OPTIONS[0]!;

  // Close search popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim().length > 1
    ? batches.filter((b) => {
        const q = searchQuery.toLowerCase();
        return (
          b.id.toLowerCase().includes(q) ||
          b.commodity.toLowerCase().includes(q) ||
          b.variety.toLowerCase().includes(q) ||
          b.farmerName.toLowerCase().includes(q) ||
          b.destinationHub.toLowerCase().includes(q) ||
          (b.assignedReeferId && b.assignedReeferId.toLowerCase().includes(q))
        );
      })
    : [];

  const navItems = [
    { id: 'overview', label: t.navDashboard },
    { id: 'farmer', label: 'Farm Intake' },
    { id: 'transporter', label: t.navTracking },
    { id: 'warehouse', label: t.navInventory },
    { id: 'pipeline', label: t.navPipeline },
    { id: 'reports', label: t.navReports },
    { id: 'auditor', label: 'Ledger Audit' },
    { id: 'faq', label: 'FAQ & Trust' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        
        {/* Zone 1: Brand */}
        <button
          onClick={() => onSelectTab('overview')}
          className="text-left flex items-center gap-2.5 shrink-0 hover:opacity-85 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Leaf className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-base tracking-tight">
                AgriSupply
              </span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                Cold-Chain
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold block leading-none tracking-wide">
              Farm to Future
            </span>
          </div>
        </button>

        {/* Zone 2: Global Search Bar */}
        <div ref={searchRef} className="relative hidden md:block max-w-xs w-full">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search batch #ASG, crop, truck, hub..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && searchQuery.trim().length > 1 && (
            <div className="absolute left-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs">
              <div className="px-3 py-1 text-[10px] font-mono text-slate-400 uppercase border-b border-slate-100">
                Matching Operational Records ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="px-3 py-3 text-slate-500 text-center">
                  No matching batch, crop, or reefer found.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((batch) => (
                    <button
                      key={batch.id}
                      onClick={() => {
                        if (onSelectBatch) onSelectBatch(batch);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between gap-2 transition"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">{batch.id}</span>
                          <span className="text-slate-700 font-semibold">{batch.variety}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {batch.farmerName.split(' ')[0]} → {batch.destinationHub}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-emerald-700 block">
                          {batch.currentTemp.toFixed(1)}°C
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {batch.stage.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Zone 3: Primary Navigation */}
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

        {/* Zone 4: Secondary Actions */}
        <div className="flex items-center gap-2">
          
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
              title="Select Interface Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{currentLangObj.code.toUpperCase()}</span>
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

          {/* Reset Demo Button */}
          {onResetDemo && (
            <button
              onClick={onResetDemo}
              title="Reset competition demo to clean starting baseline"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          )}

          {/* Offline / Online Network Indicator & Toggle */}
          <button
            onClick={onToggleNetwork}
            title={isOnline ? 'Simulate Offline Mode (IndexedDB Queue Active)' : 'Reconnect Network (Sync Queued Mutations)'}
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

          {/* Role Switcher */}
          <button
            onClick={onOpenRoleModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
            title="Switch Persona / Workspace"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="font-mono font-semibold hidden md:inline">{currentRole.replace(/_/g, ' ')}</span>
          </button>

          {/* Firebase Authentication Sign-In */}
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              isFirebaseAuthenticated
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
            }`}
            title={isFirebaseAuthenticated ? `Authenticated: ${userEmail}` : 'Open Production Operator Sign-In'}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
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
