import React, { useState } from 'react';
import { ProduceBatch } from '../../types';
import { generateCompliancePDF } from '../../lib/reportGenerator';
import { 
  X, 
  Truck, 
  MapPin, 
  Thermometer, 
  Droplets, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Warehouse, 
  QrCode, 
  ArrowRight,
  Hash,
  Copy,
  Check,
  Cpu,
  Power,
  Navigation,
  UserCheck,
  Scale
} from 'lucide-react';

interface ShipmentDetailDrawerProps {
  batch: ProduceBatch | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReplay?: (batchId: string) => void;
  onNavigateToTracking?: (batchId: string, reeferId?: string) => void;
  onOpenDiagnostics?: (batch: ProduceBatch) => void;
  onOpenInspection?: (batch: ProduceBatch) => void;
  onEngageCooling?: (batchId: string) => void;
}

export const ShipmentDetailDrawer: React.FC<ShipmentDetailDrawerProps> = ({
  batch,
  isOpen,
  onClose,
  onOpenReplay,
  onNavigateToTracking,
  onOpenDiagnostics,
  onOpenInspection,
  onEngageCooling
}) => {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen || !batch) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(batch.blockchainSealHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const isBreached = batch.coldChainStatus === 'CRITICAL_BREACH';

  const getStatusBadge = () => {
    switch (batch.coldChainStatus) {
      case 'OPTIMAL':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>NORMAL (NOMINAL)</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>APPROACHING LIMIT</span>
          </span>
        );
      case 'CRITICAL_BREACH':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 animate-pulse">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>EXCURSION (AT RISK)</span>
          </span>
        );
      case 'RECOVERING':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>RECOVERING ENVELOPE</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300">
            {batch.coldChainStatus}
          </span>
        );
    }
  };

  // Operational Timeline Events
  const timelineEvents = [
    {
      time: '06:30 AM',
      title: 'Harvest & Hydro-Cooling Verification',
      desc: `Harvested at ${batch.farmLocation}. Pulp pre-cooled to initial setpoint ${batch.currentTemp.toFixed(1)}°C.`,
      status: 'DONE'
    },
    {
      time: '08:15 AM',
      title: 'Quality Intake Inspection Certified',
      desc: `Inspector: ${batch.inspectedBy || 'Farooq Ahmed'}. Certified: ${batch.qualityGrade.replace(/_/g, ' ')}. Freshness: ${batch.freshnessScorePercent}%.`,
      status: 'DONE'
    },
    {
      time: '10:00 AM',
      title: 'Reefer Dispatch & Digital Lock Engaged',
      desc: `Assigned Vehicle: ${batch.assignedReeferId || 'TRK-024'} · Merkle seal: ${batch.blockchainSealHash.slice(0, 14)}...`,
      status: batch.stage === 'IN_TRANSIT' || batch.stage === 'AT_WAREHOUSE' || batch.stage === 'DELIVERED' ? 'DONE' : 'PENDING'
    },
    {
      time: '12:30 PM',
      title: 'N-5 Corridor Highway Transit',
      desc: isBreached 
        ? `⚠️ Thermal excursion detected! Core temp escalated to ${batch.currentTemp.toFixed(1)}°C (Ceiling: ${batch.targetTempMax}°C).`
        : `GPS telemetry nominal. Core pulp temperature stable at ${batch.currentTemp.toFixed(1)}°C.`,
      status: isBreached ? 'ALERT' : batch.stage === 'IN_TRANSIT' ? 'ACTIVE' : batch.stage === 'AT_WAREHOUSE' || batch.stage === 'DELIVERED' ? 'DONE' : 'PENDING'
    },
    {
      time: batch.stage === 'DELIVERED' ? '03:15 PM' : 'ETA ' + batch.estimatedTransitTime,
      title: 'Cold Storage Terminal Receiving',
      desc: `Receiving Hub: ${batch.destinationHub}. Dock bay quarantine inspection.`,
      status: batch.stage === 'AT_WAREHOUSE' || batch.stage === 'DELIVERED' ? 'DONE' : 'PENDING'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0f1722] w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header (Level 2 Operational Workspace) */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0c131c] sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">{batch.id}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{batch.variety}</span>
              <span className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                {batch.commodity}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              {getStatusBadge()}
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                Stage: {batch.stage.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Close Workspace"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 flex-1 overflow-y-auto text-xs">
          
          {/* Action Ribbon */}
          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToTracking && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToTracking(batch.id, batch.assignedReeferId);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                <span>Live Fleet Tracking</span>
              </button>
            )}

            {onOpenDiagnostics && (
              <button
                onClick={() => onOpenDiagnostics(batch)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition"
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Sensor Diagnostics</span>
              </button>
            )}

            {onOpenInspection && (
              <button
                onClick={() => onOpenInspection(batch)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition"
              >
                <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Quality Inspection</span>
              </button>
            )}

            {isBreached && onEngageCooling && (
              <button
                onClick={() => onEngageCooling(batch.id)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs animate-breach-pulse"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Engage Aux Cooling</span>
              </button>
            )}

            <button
              onClick={() => generateCompliancePDF(batch)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Certified PDF</span>
            </button>
          </div>

          {/* Operational Transit Status (Level 2 Detail) */}
          <div className="p-4 bg-slate-50 dark:bg-[#121c28] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Operational Logistics Parameters
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">Origin Farm Hub</span>
                  <span className="font-bold text-slate-900 dark:text-white">{batch.farmerName}</span>
                  <span className="text-[11px] text-slate-500 block">{batch.farmLocation}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">Destination Terminal</span>
                  <span className="font-bold text-slate-900 dark:text-white">{batch.destinationHub}</span>
                  <span className="text-[11px] text-slate-500 block">ETA: {batch.estimatedTransitTime}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">Assigned Transport Reefer</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {batch.assignedReeferId || 'TRK-024 (Reefer Inverter)'}
                  </span>
                  <span className="text-[11px] text-slate-500 block">Operator: Assigned Logistics Lead</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Scale className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">Cargo Mass & Value</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {batch.quantityKg.toLocaleString()} kg net mass
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono block">
                    Estimated Lot: ${(batch.quantityKg * 2.85).toLocaleString()} USD
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Telemetry & Cold Chain Envelope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className={`p-4 rounded-xl border transition ${
              isBreached 
                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-700' 
                : 'bg-slate-50 dark:bg-[#121c28] border border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Core Pulp Temperature</span>
                <Thermometer className={`w-4 h-4 ${isBreached ? 'text-rose-600 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`} />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black font-mono ${isBreached ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  {batch.currentTemp.toFixed(1)}°C
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  (Target: {batch.targetTempMin}°C – {batch.targetTempMax}°C)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                {isBreached ? '⚠️ EXCEEDED MAXIMUM SAFE THRESHOLD' : '✓ Within certified cold-chain envelope'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-[#121c28] rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Chamber Relative Humidity</span>
                <Droplets className="w-4 h-4 text-sky-600" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {batch.currentHumidity}%
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  (Target: {batch.targetHumidityMin}% – {batch.targetHumidityMax}%)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                Capacitive RH Transducer calibrated
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-[#121c28] rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Quality Grade & Freshness</span>
              <div className="mt-1">
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  {batch.qualityGrade.replace(/_/g, ' ')}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold text-[11px]">
                  {batch.freshnessScorePercent}% Freshness Score · {batch.brixSugarScore ? `Brix ${batch.brixSugarScore}° Bx` : 'Visual certified'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-[#121c28] rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Inspection Attestation</span>
              <div className="mt-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  {batch.inspectedBy || 'Quality Control Lead'}
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Stage: {batch.stage} · {batch.stageEnteredAt}
                </span>
              </div>
            </div>
          </div>

          {/* SHA-256 Merkle Provenance Seal */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                <span>SHA-256 Ledger Provenance Seal</span>
              </span>
              <button
                onClick={handleCopyHash}
                className="text-emerald-400 hover:text-emerald-300 font-mono text-[11px] flex items-center gap-1 transition"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-emerald-300 break-all select-all leading-relaxed">
              {batch.blockchainSealHash}
            </p>
            <span className="text-[10px] text-slate-400 font-mono block">
              Cryptographically generated state hash · FIPS 180-4 Standard
            </span>
          </div>

          {/* Chronological Operational Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
              Chronological Operational Event Log
            </h4>

            <div className="space-y-2.5 border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-2">
              {timelineEvents.map((evt, idx) => (
                <div key={idx} className="relative space-y-0.5">
                  <div className={`w-2.5 h-2.5 rounded-full absolute -left-[21px] top-1 ${
                    evt.status === 'DONE'
                      ? 'bg-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-900'
                      : evt.status === 'ALERT'
                      ? 'bg-rose-600 ring-2 ring-rose-200 dark:ring-rose-900 animate-pulse'
                      : evt.status === 'ACTIVE'
                      ? 'bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`} />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">{evt.time}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{evt.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{evt.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
