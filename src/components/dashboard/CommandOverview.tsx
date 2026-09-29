import React from 'react';
import { UserRole, ProduceBatch } from '../../types';
import { IoTTelemetryDeck } from '../telemetry/IoTTelemetryDeck';
import { MetricsDeck } from '../analytics/MetricsDeck';
import { 
  Tractor, 
  Truck, 
  Warehouse, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Activity, 
  MapPin, 
  FileText,
  Boxes,
  Lock,
  WifiOff
} from 'lucide-react';

interface CommandOverviewProps {
  onNavigateTab: (tab: string) => void;
  batches: ProduceBatch[];
  currentRole: UserRole;
  isOnline: boolean;
  onToggleNetwork: () => void;
}

export const CommandOverview: React.FC<CommandOverviewProps> = ({
  onNavigateTab,
  batches,
  currentRole,
  isOnline,
  onToggleNetwork
}) => {
  const totalKg = batches.reduce((sum, b) => sum + b.quantityKg, 0);
  const inTransitCount = batches.filter((b) => b.stage === 'IN_TRANSIT_REEFER').length;
  const optimalCount = batches.filter((b) => b.coldChainStatus === 'OPTIMAL').length;

  return (
    <div className="space-y-8">

      {/* Hero Industrial Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#0c141f] shadow-2xl">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/hero_coldchain_fleet_1790684154978.jpg"
            alt="Cold-Chain Logistics Highway"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-20 filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1017] via-[#0a1017]/90 to-transparent"></div>
        </div>

        <div className="relative p-6 sm:p-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-telemetry-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Autonomous Cold-Chain Command · Central California Corridor
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            AgriSupply Chain & Smart Cold-Chain Logistics Platform
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Unified farm-to-distribution monitoring platform orchestrating real-time wireless IoT reefer telematics, 
            geofenced fleet tracking, multi-tenant RBAC with cryptographic JWT claims, and offline-first IndexedDB resilience for remote agricultural nodes.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('farmer')}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            >
              <Tractor className="w-4 h-4" />
              <span>Log Harvest Batch</span>
            </button>

            <button
              onClick={() => onNavigateTab('transporter')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition border border-slate-700"
            >
              <Truck className="w-4 h-4 text-sky-400" />
              <span>Live Fleet Geofence</span>
            </button>

            <button
              onClick={() => onNavigateTab('pipeline')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition border border-slate-700"
            >
              <Boxes className="w-4 h-4 text-amber-400" />
              <span>Interactive Pipeline</span>
            </button>

            {!isOnline && (
              <span className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-mono">
                <WifiOff className="w-3.5 h-3.5" />
                IndexedDB Caching Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4 High-Density Operational Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 bg-[#0f1722] border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase tracking-wider text-[10px]">Active Harvest Lots</span>
            <Boxes className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white mb-1">{batches.length}</div>
          <span className="text-[11px] text-slate-400 font-mono">
            {totalKg.toLocaleString()} kg Total Biomass
          </span>
        </div>

        <div className="p-4 bg-[#0f1722] border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase tracking-wider text-[10px]">In-Transit Reefer Units</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black font-mono text-sky-400 mb-1">{inTransitCount}</div>
          <span className="text-[11px] text-slate-400 font-mono">
            GPS Live Geofenced
          </span>
        </div>

        <div className="p-4 bg-[#0f1722] border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase tracking-wider text-[10px]">Cold Envelope Compliance</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 mb-1">
            {batches.length > 0 ? ((optimalCount / batches.length) * 100).toFixed(1) : '100'}%
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold">
            0% Spoilage Breach
          </span>
        </div>

        <div className="p-4 bg-[#0f1722] border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono uppercase tracking-wider text-[10px]">Blockchain Seals</span>
            <Lock className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white mb-1">{batches.length}</div>
          <span className="text-[11px] text-slate-400 font-mono">
            100% Immutable Verified
          </span>
        </div>

      </div>

      {/* Module 5: Real-Time IoT Telemetry Stream Component */}
      <IoTTelemetryDeck />

      {/* 4 Role Persona Gateway Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">4 Multi-Tenant Persona Portals</h2>
            <p className="text-xs text-slate-400">Strict role-based access control, cryptographic JWT claims, and dedicated workflows</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <button
            onClick={() => onNavigateTab('farmer')}
            className="p-5 bg-[#0f1722] hover:bg-[#131c28] border border-slate-800 hover:border-amber-400/40 rounded-2xl text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-3 text-amber-400 group-hover:scale-110 transition-transform">
                <Tractor className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">1. Farmer Portal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Field harvest intake, Brix & firmness checks, offline IndexedDB transaction caching.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-amber-400">
              <span>Open Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('transporter')}
            className="p-5 bg-[#0f1722] hover:bg-[#131c28] border border-slate-800 hover:border-sky-400/40 rounded-2xl text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center mb-3 text-sky-400 group-hover:scale-110 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">2. Transporter Portal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live GPS geofencing, route deviation alerts, reefer compressor telematics & arrival triggers.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-sky-400">
              <span>Open Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('warehouse')}
            className="p-5 bg-[#0f1722] hover:bg-[#131c28] border border-slate-800 hover:border-emerald-400/40 rounded-2xl text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 text-emerald-400 group-hover:scale-110 transition-transform">
                <Warehouse className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">3. Warehouse Admin</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-performance CRUD inventory grid, multi-column sorting, cold bay quarantine & release.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <span>Open Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('auditor')}
            className="p-5 bg-[#0f1722] hover:bg-[#131c28] border border-slate-800 hover:border-violet-400/40 rounded-2xl text-left transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3 text-violet-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">4. Compliance Auditor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cryptographic blockchain hash validation (0x7f8a...), USDA-AMS certs, client-side PDF exports.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-violet-400">
              <span>Open Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

        </div>
      </div>

      {/* Analytics & Metrics Deck */}
      <MetricsDeck />

    </div>
  );
};
