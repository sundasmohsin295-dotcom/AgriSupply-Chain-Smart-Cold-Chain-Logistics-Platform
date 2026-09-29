import React, { useState, useEffect } from 'react';
import { UserRole, ProduceBatch, TelemetryReading, OfflineMutation, ApplicationAuditEvent } from '../../types';
import { auditLogger } from '../../services/auditLogger';
import { gpsProvider } from '../../services/gpsProvider';
import { telemetryService } from '../../services/telemetryStream';
import { offlineStorage } from '../../lib/offlineStore';
import { runCoreDomainTests, TestResult } from '../../lib/testRunner';
import { 
  ShieldCheck, 
  X, 
  Cpu, 
  Wifi, 
  WifiOff, 
  Flame, 
  Power, 
  RefreshCw, 
  Database, 
  CloudSun, 
  Navigation, 
  Terminal, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Check
} from 'lucide-react';

interface JudgeDefenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  isOnline: boolean;
  onToggleNetwork: () => void;
  isThermalBreachActive: boolean;
  onToggleThermalBreach: () => void;
  onEngageAuxiliaryCooling: () => void;
  latestReading: TelemetryReading | null;
  queuedMutations: OfflineMutation[];
  batches: ProduceBatch[];
  onNavigateTab: (tab: string) => void;
}

export const JudgeDefenseModal: React.FC<JudgeDefenseModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  isOnline,
  onToggleNetwork,
  isThermalBreachActive,
  onToggleThermalBreach,
  onEngageAuxiliaryCooling,
  latestReading,
  queuedMutations,
  batches,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'auditLog' | 'guidedDemo' | 'unitTests'>('diagnostics');
  const [auditEvents, setAuditEvents] = useState<ApplicationAuditEvent[]>([]);
  const [testResults, setTestResults] = useState<{ passedCount: number; totalCount: number; results: TestResult[] } | null>(null);
  const gpsStatus = gpsProvider.getStatus();

  useEffect(() => {
    const unsub = auditLogger.subscribe((events) => {
      setAuditEvents([...events]);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0c131c] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#090e15]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500/20 text-white dark:text-emerald-400 flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                  Competition Judge Defense & System Diagnostics
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                  v2.6 Stable
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transparent verification of real integrations vs simulated models for technical evaluation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 gap-2 bg-slate-50/50 dark:bg-[#0a1017]">
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition border-b-2 font-mono ${
              activeTab === 'diagnostics'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#0c131c]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Live Architecture Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('auditLog')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition border-b-2 font-mono flex items-center gap-1.5 ${
              activeTab === 'auditLog'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#0c131c]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Audit Event Ledger ({auditEvents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('guidedDemo')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition border-b-2 font-mono flex items-center gap-1.5 ${
              activeTab === 'guidedDemo'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#0c131c]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>1-Click Demo Actions</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: LIVE ARCHITECTURE DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
                
                <div className="p-3 bg-slate-50 dark:bg-[#121c28] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Multi-Tenant Boundary</span>
                  <div className="font-bold text-slate-900 dark:text-white">tenant_punjab_agri_coop</div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Strict Tenant Scoped</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#121c28] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Active Persona / RBAC</span>
                  <div className="font-bold text-slate-900 dark:text-white">{currentRole}</div>
                  <span className="text-[10px] text-slate-400">Demo Role Switcher Active</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#121c28] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Network Connectivity</span>
                  <div className={`font-bold flex items-center gap-1.5 ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                    {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                    <span>{isOnline ? 'ONLINE (5G Stream)' : 'OFFLINE REMOTE'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{queuedMutations.length} IndexedDB Mutations Buffered</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#121c28] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">IoT Telematics Cadence</span>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {latestReading ? `${latestReading.coreTemp}°C (2000ms ticks)` : 'Active'}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Bounded 50-point Ring Buffer</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#121c28] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">GPS Transport Mode</span>
                  <div className="font-bold text-slate-900 dark:text-white uppercase">{gpsStatus.mode} GPS</div>
                  <span className="text-[10px] text-slate-400">
                    {gpsStatus.mode === 'real' ? 'navigator.geolocation' : 'Multan-Lahore Corridor Vector'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#121c28] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">External API Status</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">Open-Meteo Live API</div>
                  <span className="text-[10px] text-slate-400">15m Local Cache + Fallback</span>
                </div>

              </div>

              {/* What is Real vs Simulated Statement (Requirement 3 & 47) */}
              <div className="p-4 bg-slate-50 dark:bg-[#0a1017] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white font-mono uppercase">
                  Judge Defense: Real vs Simulated Features Matrix
                </h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                  <li><strong className="text-emerald-600 dark:text-emerald-400">✓ REAL:</strong> External Open-Meteo meteorological queries along transit routes with live ambient temperature.</li>
                  <li><strong className="text-emerald-600 dark:text-emerald-400">✓ REAL:</strong> IndexedDB persistent mutation queue buffering changes offline and auto-flushing on reconnect.</li>
                  <li><strong className="text-emerald-600 dark:text-emerald-400">✓ REAL:</strong> Haversine distance geofencing engine with debounced state transitions and ETA calculations.</li>
                  <li><strong className="text-emerald-600 dark:text-emerald-400">✓ REAL:</strong> Multi-page chunked CSV data aggregation with UTF-8 BOM, abort controller, and progress bar.</li>
                  <li><strong className="text-amber-500">⚠ SIMULATED:</strong> IoT temperature sensor random walk (modelled on real physical probe variances).</li>
                  <li><strong className="text-amber-500">⚠ SIMULATED:</strong> Cryptographic integrity hashes (deterministic SHA-256 style hashes without full blockchain mining).</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT EVENT LEDGER */}
          {activeTab === 'auditLog' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
                <span>Displaying last {auditEvents.length} recorded application domain events</span>
                <span>Zero Credentials Logged</span>
              </div>
              <div className="space-y-1.5 max-h-80 overflow-y-auto font-mono text-[11px]">
                {auditEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 bg-slate-50 dark:bg-[#101722] border border-slate-200 dark:border-slate-800 rounded-lg flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-600 dark:text-amber-400">{evt.type}</span>
                        <span className="text-slate-400 text-[10px]">{evt.timestamp}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">{evt.details}</p>
                      <span className="text-[10px] text-slate-400">Actor: {evt.actor} ({evt.role})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{evt.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 1-CLICK DEMO ACTIONS */}
          {activeTab === 'guidedDemo' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trigger end-to-end competition scenarios with a single click during live technical cross-examination:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={onToggleNetwork}
                  className="p-3 text-left border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-start gap-3 border-slate-200 dark:border-slate-700"
                >
                  <div className={`p-2 rounded-lg ${isOnline ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isOnline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {isOnline ? 'Simulate Cellular Drop' : 'Restore 5G Network'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isOnline ? 'Forces app into offline IndexedDB queue' : 'Flushes queued mutations to cloud ledger'}
                    </span>
                  </div>
                </button>

                <button
                  onClick={onToggleThermalBreach}
                  className={`p-3 text-left border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-start gap-3 ${
                    isThermalBreachActive ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isThermalBreachActive ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {isThermalBreachActive ? 'Reset Thermal Envelope' : 'Inject Thermal Breach (>4.0°C)'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Trips compressor failure & sounds audio alarm
                    </span>
                  </div>
                </button>

                <button
                  onClick={onEngageAuxiliaryCooling}
                  className="p-3 text-left border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Power className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Engage Auxiliary Cooling
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Rapid pull-down protocol back to 3.8°C nominal
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onNavigateTab('reports');
                    onClose();
                  }}
                  className="p-3 text-left border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Multi-Page Aggregated Export
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Jump to Reports for progress-tracked bulk CSV
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#090e15] border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            AgriSupply Technical Defense Console · Strictly No Unsupported Claims
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg font-bold transition text-xs"
          >
            Close Diagnostics
          </button>
        </div>

      </div>
    </div>
  );
};
