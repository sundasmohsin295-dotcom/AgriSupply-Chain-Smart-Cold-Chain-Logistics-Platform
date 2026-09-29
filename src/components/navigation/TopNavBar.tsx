import React from 'react';
import { UserRole } from '../../types';
import { ROLE_DEFINITIONS } from '../../lib/jwtAuth';
import { Wifi, WifiOff, Users, Key } from 'lucide-react';

interface TopNavBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentRole: UserRole;
  onOpenRoleModal: () => void;
  onOpenJWTModal: () => void;
  isOnline: boolean;
  onToggleNetwork: () => void;
  queuedCount: number;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentTab,
  onSelectTab,
  currentRole,
  onOpenRoleModal,
  onOpenJWTModal,
  isOnline,
  onToggleNetwork,
  queuedCount
}) => {
  const roleInfo = ROLE_DEFINITIONS[currentRole];

  const navItems = [
    { id: 'overview', label: 'Command Deck' },
    { id: 'farmer', label: 'Farmer QA' },
    { id: 'transporter', label: 'Fleet Telematics' },
    { id: 'warehouse', label: 'Cold Inventory' },
    { id: 'pipeline', label: 'Supply Pipeline' },
    { id: 'auditor', label: 'Audit & Hash' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a1017]/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand title, single line text element wordmark */}
        <button
          onClick={() => onSelectTab('overview')}
          className="text-left font-black tracking-tight text-white hover:text-amber-400 transition-colors shrink-0 text-base sm:text-lg flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_10px_#10b981]"></span>
          <span>AgriSupply Command</span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links (1-2 word labels) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-amber-400 bg-amber-400/10 border border-amber-400/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions (Network Sync Toggle & Role/JWT Switcher) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Offline/Online Network Resilience Trigger */}
          <button
            onClick={onToggleNetwork}
            title={isOnline ? 'Network Connected (Click to simulate remote cell drop)' : 'Offline Mode (Click to restore network & sync queue)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isOnline
                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300 animate-pulse'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Online 5G</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">Offline</span>
                {queuedCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                    {queuedCount}
                  </span>
                )}
              </>
            )}
          </button>

          {/* JWT Token Inspector button */}
          <button
            onClick={onOpenJWTModal}
            title="Inspect Current JWT Authentication Token & Claims"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white transition"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px]">JWT</span>
          </button>

          {/* Role Switcher Action */}
          <button
            onClick={onOpenRoleModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{roleInfo.title}:</span>
            <span className="text-white font-bold">{roleInfo.name.split(' ')[0]}</span>
          </button>
        </div>

      </div>

      {/* Mobile Navigation Sub-bar */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-800/60 bg-[#0d141e] gap-1 no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap transition-colors ${
              currentTab === item.id
                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
