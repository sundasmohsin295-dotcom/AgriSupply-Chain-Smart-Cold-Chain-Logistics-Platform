import React, { useState } from 'react';
import { TelemetryReading, ProduceBatch } from '../../types';
import { 
  Cpu, 
  X, 
  Activity, 
  Radio, 
  HardDrive, 
  Zap, 
  Copy, 
  Check, 
  RefreshCw, 
  Wifi, 
  Gauge, 
  Layers,
  Thermometer,
  ShieldCheck
} from 'lucide-react';

interface SensorDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch?: ProduceBatch | null;
  latestReading?: TelemetryReading | null;
}

export const SensorDiagnosticsModal: React.FC<SensorDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  batch,
  latestReading
}) => {
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!isOpen) return null;

  const currentTemp = latestReading?.coreTemp ?? batch?.currentTemp ?? 3.2;
  const currentHumidity = latestReading?.humidity ?? batch?.currentHumidity ?? 88.5;
  const compressorDuty = latestReading?.compressorDuty ?? 72;
  const batterySoc = latestReading?.batterySoc ?? 96.4;

  const rawPayload = {
    protocol: 'MQTT/CoAP-v2.1',
    nodeId: 'SENSOR-IOT-TRK024',
    timestamp: latestReading?.timestamp || new Date().toISOString(),
    batchBinding: batch?.id || '#ASG-001',
    coreTempC: currentTemp,
    ambientTempC: latestReading?.ambientTemp || 28.4,
    humidityRhPct: currentHumidity,
    compressorInverterRpm: Math.round(compressorDuty * 26.5),
    compressorDutyPct: compressorDuty,
    batterySocPct: batterySoc,
    bleRssiDbm: -64,
    packetJitterMs: 14,
    firmwareVersion: 'v4.1.8-LTS',
    sha256Seal: batch?.blockchainSealHash || '0x7f8a92e104b9c51a7e2830f3c8d91b40285a3b21'
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(rawPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0c131c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center font-mono">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Level 3 Sensor Telematics Diagnostics
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                  ESTABLISHED
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Probe SN-REEFER-9024 · Dual-channel PT1000 Core & Ambient Probes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Engineering Diagnostic Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-[#131c28] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] uppercase font-mono">Stream Heartbeat</span>
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white">2,000 ms</div>
              <div className="text-[10px] text-slate-400 font-mono">Jitter ±14ms</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#131c28] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] uppercase font-mono">RTT Latency</span>
                <Activity className="w-3.5 h-3.5 text-sky-500" />
              </div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white">42 ms</div>
              <div className="text-[10px] text-emerald-600 font-mono">Nominal link</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#131c28] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] uppercase font-mono">Compressor Duty</span>
                <Gauge className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white">{compressorDuty}%</div>
              <div className="text-[10px] text-slate-400 font-mono">{Math.round(compressorDuty * 26.5)} RPM</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#131c28] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[10px] uppercase font-mono">Battery SOH</span>
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white">{batterySoc.toFixed(1)}%</div>
              <div className="text-[10px] text-slate-400 font-mono">3.84V LiFePO4</div>
            </div>
          </div>

          {/* Hardware & Calibration Status */}
          <div className="p-4 bg-slate-50 dark:bg-[#0a1017] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Sensor Probe Specifications & Calibration
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500">Transducer Type:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">Class A Platinum RTD (DIN EN 60751)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500">Measurement Range:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">-30.0°C to +50.0°C (±0.05°C accuracy)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500">Relative Humidity:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">Capacitive Polymer (±1.5% RH)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500">Last NIST Recalibration:</span>
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">2026-08-15 (Valid through 2027-08)</span>
              </div>
            </div>
          </div>

          {/* Raw JSON Ingest Payload */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2 border border-slate-800 font-mono">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ingest Payload Buffer (248 Bytes)</span>
              </span>
              <button
                onClick={handleCopyPayload}
                className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center gap-1 transition"
              >
                {copiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPayload ? 'Copied JSON' : 'Copy Payload'}</span>
              </button>
            </div>
            <pre className="text-[11px] leading-relaxed text-emerald-300 overflow-x-auto max-h-44 p-2 bg-black/40 rounded">
              {JSON.stringify(rawPayload, null, 2)}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#0c131c] border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Mode: High-Fidelity ColdGuard Simulator
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl transition"
          >
            Close Diagnostics
          </button>
        </div>

      </div>
    </div>
  );
};
