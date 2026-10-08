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
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Warehouse, 
  QrCode, 
  ArrowRight,
  Hash,
  Calendar,
  Layers,
  Copy,
  Check
} from 'lucide-react';

interface ShipmentDetailDrawerProps {
  batch: ProduceBatch | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReplay?: (batchId: string) => void;
}

export const ShipmentDetailDrawer: React.FC<ShipmentDetailDrawerProps> = ({
  batch,
  isOpen,
  onClose,
  onOpenReplay
}) => {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen || !batch) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(batch.blockchainSealHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getStatusBadge = () => {
    switch (batch.coldChainStatus) {
      case 'OPTIMAL':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>NOMINAL COLD-CHAIN</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>THERMAL WARNING</span>
          </span>
        );
      case 'CRITICAL_BREACH':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1.5 animate-pulse">
            <Flame className="w-3.5 h-3.5 text-red-600" />
            <span>CRITICAL BREACH</span>
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
      time: '08:30 AM',
      title: 'Harvest & Pre-Cooling Complete',
      desc: `Harvested at ${batch.farmerName} origin. Pulp pre-cooled to ${batch.currentTemp.toFixed(1)}°C.`,
      status: 'DONE'
    },
    {
      time: '09:45 AM',
      title: 'Digital Quality Inspection Certified',
      desc: `Inspection Grade: ${batch.qualityGrade.replace(/_/g, ' ')}. Visual score: ${batch.freshnessScorePercent}%.`,
      status: 'DONE'
    },
    {
      time: '10:30 AM',
      title: 'Dispatch into Monitored Reefer Convoy',
      desc: `Loaded into TRK-024. Sealed with SHA-256 Merkle block. Destination: ${batch.destinationHub}.`,
      status: batch.stage === 'IN_TRANSIT' || batch.stage === 'AT_WAREHOUSE' || batch.stage === 'DELIVERED' ? 'DONE' : 'PENDING'
    },
    {
      time: '01:15 PM',
      title: 'Corridor Transit & Telematics Heartbeat',
      desc: `GPS logged at N-5 Highway. Temperature maintain envelope at ${batch.currentTemp.toFixed(1)}°C.`,
      status: batch.stage === 'IN_TRANSIT' ? 'ACTIVE' : batch.stage === 'AT_WAREHOUSE' || batch.stage === 'DELIVERED' ? 'DONE' : 'PENDING'
    },
    {
      time: '03:30 PM',
      title: 'Cold Storage Terminal Receiving',
      desc: `Final arrival check-in at ${batch.destinationHub} cold room docking bay.`,
      status: batch.stage === 'AT_WAREHOUSE' || batch.stage === 'DELIVERED' ? 'DONE' : 'PENDING'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">{batch.id}</span>
              <span className="text-slate-300">•</span>
              <span className="text-sm font-bold text-slate-900">{batch.variety} ({batch.commodity.toUpperCase()})</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge()}
              <span className="text-xs font-mono text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                Stage: {batch.stage}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* Quick Action Strip */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenReplay && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReplay(batch.id);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <span>Replay Cold-Chain Journey</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => generateCompliancePDF(batch)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Compliance Certificate</span>
            </button>
          </div>

          {/* 4-Step Visual Journey Bar */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase block">
              Farm-to-Fork Supply Chain Journey
            </span>

            <div className="flex items-center justify-between gap-1 text-xs font-mono">
              <div className="text-center flex-1">
                <div className="w-8 h-8 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-1">
                  1
                </div>
                <span className="font-bold text-slate-800 block text-[11px]">Farm Harvest</span>
                <span className="text-[10px] text-slate-400">{batch.farmerName.split(' ')[0]}</span>
              </div>

              <div className="h-0.5 flex-1 bg-emerald-500"></div>

              <div className="text-center flex-1">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                  batch.stage === 'IN_TRANSIT' || batch.stage === 'AT_WAREHOUSE' || batch.stage === 'DELIVERED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  2
                </div>
                <span className="font-bold text-slate-800 block text-[11px]">Cold Transit</span>
                <span className="text-[10px] text-slate-400">TRK-024</span>
              </div>

              <div className={`h-0.5 flex-1 ${batch.stage === 'AT_WAREHOUSE' || batch.stage === 'DELIVERED' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

              <div className="text-center flex-1">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                  batch.stage === 'AT_WAREHOUSE' || batch.stage === 'DELIVERED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  3
                </div>
                <span className="font-bold text-slate-800 block text-[11px]">Cold Depot</span>
                <span className="text-[10px] text-slate-400">Bay #02</span>
              </div>

              <div className={`h-0.5 flex-1 ${batch.stage === 'DELIVERED' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

              <div className="text-center flex-1">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                  batch.stage === 'DELIVERED' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  4
                </div>
                <span className="font-bold text-slate-800 block text-[11px]">Retail Hub</span>
                <span className="text-[10px] text-slate-400">Final Store</span>
              </div>
            </div>
          </div>

          {/* Real-time Telemetry & Thermal Envelope Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Pulp Temp</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {batch.currentTemp.toFixed(1)}°C
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  (Target: {batch.targetTempMin}°C – {batch.targetTempMax}°C)
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Cargo Weight & Units</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {batch.quantityKg.toLocaleString()}
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  kg net weight
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Quality Grade & Freshness</span>
              <div className="mt-1">
                <span className="font-bold text-slate-800 block">{batch.qualityGrade.replace(/_/g, ' ')}</span>
                <span className="text-emerald-700 font-mono font-semibold text-[11px]">
                  {batch.freshnessScorePercent}% Freshness Score
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Destination Terminal</span>
              <div className="mt-1 flex items-center gap-1.5 font-bold text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>{batch.destinationHub}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Ledger Seal Box */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                <span>SHA-256 Merkle Provenance Seal</span>
              </span>
              <button
                onClick={handleCopyHash}
                className="text-emerald-400 hover:text-emerald-300 font-mono text-[11px] flex items-center gap-1"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHash ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-emerald-300 break-all select-all leading-relaxed">
              {batch.blockchainSealHash}
            </p>
            <span className="text-[10px] text-slate-400 font-mono block">
              Certified under FIPS 180-4 standard · Zero tamper detected
            </span>
          </div>

          {/* Chronological Operational Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
              Chronological Operational Event Log
            </h4>

            <div className="space-y-2.5 border-l-2 border-slate-200 pl-4 ml-2">
              {timelineEvents.map((evt, idx) => (
                <div key={idx} className="relative space-y-0.5">
                  <div className={`w-2.5 h-2.5 rounded-full absolute -left-[21px] top-1 ${
                    evt.status === 'DONE'
                      ? 'bg-emerald-600 ring-2 ring-emerald-200'
                      : evt.status === 'ACTIVE'
                      ? 'bg-amber-500 ring-2 ring-amber-200 animate-ping'
                      : 'bg-slate-300'
                  }`} />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">{evt.time}</span>
                    <span className="text-xs font-bold text-slate-800">{evt.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">{evt.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
