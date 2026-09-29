import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserRole, 
  ProduceBatch, 
  ColdChainStatus, 
  PipelineStage, 
  OfflineMutation, 
  ThemeMode, 
  LanguageCode, 
  TelemetryReading,
  TemperatureBreachRecord
} from './types';
import { INITIAL_BATCHES } from './lib/constants';
import { getStoredSession, createSessionForRole } from './lib/jwtAuth';
import { offlineStorage } from './lib/offlineStore';
import { audioAlert } from './lib/audioAlert';
import { isRTL } from './lib/translations';
import { telemetryService } from './services/telemetryStream';
import { TopNavBar } from './components/navigation/TopNavBar';
import { RoleSwitcherModal } from './components/auth/RoleSwitcherModal';
import { OfflineSyncIndicator } from './components/offline/OfflineSyncIndicator';
import { CommandOverview } from './components/dashboard/CommandOverview';
import { FarmerModule } from './components/farmer/FarmerModule';
import { TransporterModule } from './components/transporter/TransporterModule';
import { WarehouseModule } from './components/warehouse/WarehouseModule';
import { KanbanPipeline } from './components/pipeline/KanbanPipeline';
import { ReportsModule } from './components/reports/ReportsModule';
import { AuditorModule } from './components/auditor/AuditorModule';
import { AIAssistantWidget } from './components/assistant/AIAssistantWidget';
import { 
  Flame, 
  Power, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  ArrowRight, 
  Thermometer 
} from 'lucide-react';

export default function App() {
  // Theme & Language State
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [language, setLanguage] = useState<LanguageCode>('en');

  // Session & RBAC State
  const [session, setSession] = useState(() => getStoredSession());
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Network & Offline-First State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queuedMutations, setQueuedMutations] = useState<OfflineMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  // Central Inventory / Batches State
  const [batches, setBatches] = useState<ProduceBatch[]>(INITIAL_BATCHES);

  // Live IoT Telemetry Stream & Thermal Breach State
  const [latestReading, setLatestReading] = useState<TelemetryReading | null>(() => telemetryService.getLatestReading());
  const [isThermalBreachActive, setIsThermalBreachActive] = useState<boolean>(() => telemetryService.isThermalBreachActive());
  const [isAlarmMuted, setIsAlarmMuted] = useState<boolean>(() => audioAlert.getMuted());

  // Synchronize HTML element class for theme and dir for RTL
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    if (isRTL(language)) {
      root.setAttribute('dir', 'rtl');
    } else {
      root.setAttribute('dir', 'ltr');
    }
  }, [theme, language]);

  // Subscribe to Offline Storage Engine
  useEffect(() => {
    const unsubscribe = offlineStorage.subscribe((muts, online) => {
      setQueuedMutations([...muts]);
      setIsOnline(online);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to Live IoT Telemetry WebSocket Stream (Task 1: every 2000ms tick updates UI)
  useEffect(() => {
    const unsubscribe = telemetryService.subscribe((reading, _hist, breach) => {
      setLatestReading(reading);
      setIsThermalBreachActive(breach);

      // Reflect live sensor readings directly onto the targeted reefer batch in application state
      setBatches((prevBatches) => {
        return prevBatches.map((b) => {
          if (b.id === '#ASG-001') {
            if (breach) {
              const excursionDelta = parseFloat(Math.max(0.1, reading.coreTemp - b.targetTempMax).toFixed(2));
              const existingBreach = b.breachRecords.find((r) => r.quarantineTriggered);

              let updatedBreachRecords = b.breachRecords;
              if (existingBreach) {
                updatedBreachRecords = b.breachRecords.map((r) =>
                  r.id === existingBreach.id
                    ? { ...r, peakTemperatureC: Math.max(r.peakTemperatureC, reading.coreTemp) }
                    : r
                );
              } else {
                const newRecord: TemperatureBreachRecord = {
                  id: `BRC-LIVE-${Date.now().toString().slice(-4)}`,
                  batchId: b.id,
                  timestamp: reading.timestamp,
                  durationMinutes: 6,
                  peakTemperatureC: reading.coreTemp,
                  thresholdLimitC: b.targetTempMax,
                  excursionDeltaC: excursionDelta,
                  locationAtBreach: 'Salinas Valley Reefer Transit #SN-04',
                  rootCause: 'Inverter Compressor Thermal Cutout / Auxiliary Failure',
                  remedialAction: 'Auxiliary cooling intervention required. Re-routing to Gilroy Cold Depot.',
                  qualityImpactAssessment: 'SHELF_LIFE_REDUCED_10%',
                  quarantineTriggered: true,
                  auditorAck: false,
                  blockchainHash: `0x7f8a${Date.now().toString(16).slice(-8)}3b21`
                };
                updatedBreachRecords = [newRecord, ...b.breachRecords];
              }

              return {
                ...b,
                currentTemp: reading.coreTemp,
                currentHumidity: reading.humidity,
                coldChainStatus: 'CRITICAL_BREACH',
                breachRecords: updatedBreachRecords
              };
            } else {
              // Recovery to safe nominal range
              if (b.coldChainStatus === 'CRITICAL_BREACH') {
                return {
                  ...b,
                  currentTemp: reading.coreTemp,
                  currentHumidity: reading.humidity,
                  coldChainStatus: 'OPTIMAL'
                };
              }
              return {
                ...b,
                currentTemp: reading.coreTemp,
                currentHumidity: reading.humidity
              };
            }
          }
          return b;
        });
      });
    });

    // Cleanup subscription to prevent memory leaks on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Theme Toggle with smooth transition
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Handle Role Switching
  const handleSelectRole = (newRole: UserRole) => {
    const newSession = createSessionForRole(newRole);
    setSession(newSession);

    // Auto-navigate to persona-specific tab
    if (newRole === 'FARMER') setActiveTab('farmer');
    else if (newRole === 'TRANSPORTER') setActiveTab('transporter');
    else if (newRole === 'WAREHOUSE_ADMIN') setActiveTab('warehouse');
    else if (newRole === 'RETAILER') setActiveTab('pipeline');
    else if (newRole === 'COMPLIANCE_AUDITOR') setActiveTab('auditor');
  };

  // Handle Emergency Thermal Breach Toggle
  const handleToggleThermalBreach = () => {
    const nextBreach = telemetryService.toggleThermalBreach('#ASG-001');
    setIsThermalBreachActive(nextBreach);
    if (nextBreach) {
      showToast('EMERGENCY: Thermal Breach simulated (>4.0°C). Audio alarm triggered.');
    } else {
      showToast('Auxiliary cooling engaged. Thermal envelope restored.');
    }
  };

  // Handle Auxiliary Cooling Protocol Engagement
  const handleEngageAuxiliaryCooling = () => {
    telemetryService.engageAuxiliaryCooling();
    setIsThermalBreachActive(false);
    showToast('Auxiliary Cold Pack deployed! Rapid pull-down cooling active.');
  };

  // Handle Audio Alarm Mute Toggle
  const handleToggleAlarmMute = () => {
    const nextMute = !isAlarmMuted;
    setIsAlarmMuted(nextMute);
    audioAlert.setMuted(nextMute);
  };

  // Handle Manual Network Toggle (to demonstrate offline resilience)
  const handleToggleNetwork = () => {
    const next = !isOnline;
    offlineStorage.setSimulatedNetworkState(next);
    if (!next) {
      showToast('Switched to Offline Remote Mode. Mutations buffered in IndexedDB.');
    } else {
      showToast('Network restored. Reconnected to 5G cellular stream.');
      handleTriggerSync();
    }
  };

  // Trigger FIFO Queue Sync
  const handleTriggerSync = useCallback(async () => {
    if (isSyncing || queuedMutations.length === 0) return;
    setIsSyncing(true);

    const { syncedCount } = await offlineStorage.syncQueuedMutations((mutation) => {
      // Apply optimistic update into batches state if it was a created batch
      if (mutation.type === 'CREATE_BATCH') {
        const batch = mutation.payload as unknown as ProduceBatch;
        setBatches((prev) => {
          if (prev.some((b) => b.id === batch.id)) return prev;
          return [batch, ...prev];
        });
      }
    });

    audioAlert.playSyncChime();
    setIsSyncing(false);
    showToast(`Successfully synchronized ${syncedCount} queued mutations to cloud ledger.`);
  }, [isSyncing, queuedMutations]);

  const showToast = (msg: string) => {
    setSyncToastMessage(msg);
    setTimeout(() => {
      setSyncToastMessage(null);
    }, 4500);
  };

  // Add Batch handler
  const handleAddBatch = (newBatch: ProduceBatch) => {
    setBatches((prev) => [newBatch, ...prev]);
  };

  // Update Batch Status handler (e.g. from Warehouse or Alert)
  const handleUpdateBatchStatus = (batchId: string, status: ColdChainStatus) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, coldChainStatus: status } : b))
    );
  };

  // Advance Pipeline Stage handler
  const handleAdvanceStage = (batchId: string, nextStage: PipelineStage) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, stage: nextStage } : b))
    );
    audioAlert.playSyncChime();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a1017] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Bar Navigation (Strict 3-zone Top Bar Contract with Theme, Language & Breach Status) */}
      <TopNavBar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        currentRole={session.role}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenJWTModal={() => setIsRoleModalOpen(true)}
        isOnline={isOnline}
        onToggleNetwork={handleToggleNetwork}
        queuedCount={queuedMutations.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        language={language}
        onSelectLanguage={setLanguage}
        isThermalBreachActive={isThermalBreachActive}
        onToggleThermalBreach={handleToggleThermalBreach}
      />

      {/* Emergency Thermal Excursion Persistent Visual Alert Banner */}
      {isThermalBreachActive && (
        <div className="bg-rose-600 text-white border-b border-rose-500 py-3 px-4 sm:px-6 shadow-lg animate-breach-pulse z-30 transition-all">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs uppercase px-2 py-0.5 bg-white text-rose-700 rounded-md tracking-wider">
                    CRITICAL THERMAL EXCURSION
                  </span>
                  <span className="text-xs font-mono font-bold">
                    Reefer Node #SN-04 · Batch #ASG-001 (Strawberries)
                  </span>
                </div>
                <p className="text-xs text-rose-100 mt-0.5">
                  Core temperature reached{' '}
                  <span className="font-mono font-black underline">
                    {(latestReading?.coreTemp || 6.2).toFixed(1)}°C
                  </span>{' '}
                  (Critical limit: 4.0°C). Compressor failure detected.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleAlarmMute}
                title={isAlarmMuted ? 'Unmute Web Audio Alarm' : 'Mute Web Audio Alarm'}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition text-xs font-semibold flex items-center gap-1.5"
              >
                {isAlarmMuted ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Unmute Alarm</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    <span>Mute Alarm</span>
                  </>
                )}
              </button>

              <button
                onClick={handleEngageAuxiliaryCooling}
                className="px-3.5 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-black text-xs transition shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <Power className="w-4 h-4 text-rose-600" />
                <span>Engage Auxiliary Cooling</span>
              </button>

              <button
                onClick={() => setActiveTab('warehouse')}
                className="px-3 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition border border-rose-400 flex items-center gap-1 active:scale-95"
              >
                <span>Inspect Batch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Synchronization Banner & Resilience Controls */}
      <OfflineSyncIndicator
        isOnline={isOnline}
        onToggleNetwork={handleToggleNetwork}
        mutations={queuedMutations}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <CommandOverview
            onNavigateTab={setActiveTab}
            batches={batches}
            currentRole={session.role}
            isOnline={isOnline}
            onToggleNetwork={handleToggleNetwork}
            language={language}
            isThermalBreachActive={isThermalBreachActive}
            onToggleThermalBreach={handleToggleThermalBreach}
            onEngageAuxiliaryCooling={handleEngageAuxiliaryCooling}
            latestReading={latestReading}
          />
        )}

        {activeTab === 'farmer' && (
          <FarmerModule
            batches={batches}
            onAddBatch={handleAddBatch}
            isOnline={isOnline}
          />
        )}

        {activeTab === 'transporter' && (
          <TransporterModule />
        )}

        {activeTab === 'warehouse' && (
          <WarehouseModule
            batches={batches}
            onUpdateBatchStatus={handleUpdateBatchStatus}
            onUpdateBatchStage={handleAdvanceStage}
          />
        )}

        {activeTab === 'pipeline' && (
          <KanbanPipeline
            batches={batches}
            onAdvanceStage={handleAdvanceStage}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsModule
            batches={batches}
          />
        )}

        {activeTab === 'auditor' && (
          <AuditorModule
            batches={batches}
          />
        )}
      </main>

      {/* Bottom Footer (Clean single-line footer) */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#070b10] py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-white">AgriSupply Platform</span>
            <span>·</span>
            <span>Farm to Future Cold-Chain Protocol</span>
            <span>·</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              IoT Telemetry Stream (2000ms Ticks)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>USDA-AMS & GlobalGAP Certified</span>
            <span>·</span>
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="text-emerald-700 dark:text-amber-400 hover:underline"
            >
              Session: {session.name} ({session.role})
            </button>
          </div>
        </div>
      </footer>

      {/* Role Switcher & JWT Security Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentRole={session.role}
        onSelectRole={handleSelectRole}
        currentToken={session.token}
      />

      {/* Floating Role-Aware AI Assistant Widget */}
      <AIAssistantWidget
        currentRole={session.role}
        batches={batches}
        isThermalBreachActive={isThermalBreachActive}
        theme={theme}
      />

      {/* Toast Notification Container */}
      {syncToastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-medium">{syncToastMessage}</span>
        </div>
      )}

    </div>
  );
}
