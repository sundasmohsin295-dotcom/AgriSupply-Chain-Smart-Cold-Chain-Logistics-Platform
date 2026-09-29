import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserRole, 
  ProduceBatch, 
  ColdChainStatus, 
  PipelineStage, 
  OfflineMutation, 
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
import { JudgeDefenseModal } from './components/demo/JudgeDefenseModal';
import { 
  Flame, 
  Power, 
  Volume2, 
  VolumeX, 
  ArrowRight
} from 'lucide-react';

export default function App() {
  // Language State (Light mode only)
  const [language, setLanguage] = useState<LanguageCode>('en');

  // Session & RBAC State
  const [session, setSession] = useState(() => getStoredSession());
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);
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

  // Set up light mode and RTL on mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('light');
    root.classList.remove('dark');

    if (isRTL(language)) {
      root.setAttribute('dir', 'rtl');
    } else {
      root.setAttribute('dir', 'ltr');
    }
  }, [language]);

  // Subscribe to Offline Storage Engine
  useEffect(() => {
    const unsubscribe = offlineStorage.subscribe((muts, online) => {
      setQueuedMutations([...muts]);
      setIsOnline(online);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to Live IoT Telemetry Stream
  useEffect(() => {
    const unsubscribe = telemetryService.subscribe((reading, _hist, breach) => {
      setLatestReading(reading);
      setIsThermalBreachActive(breach);

      // Reflect live sensor readings directly onto the targeted reefer batch
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
                  blockchainHash: `LEDGER-REC-${crypto.randomUUID().substring(0, 8).toUpperCase()}`
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

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle Role Switching (with session validation)
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
      showToast('⚠️ SIMULATION: Thermal Breach triggered (>4.0°C). Audio alarm activated.');
    } else {
      showToast('✓ Auxiliary cooling engaged. Thermal envelope restored.');
    }
  };

  // Handle Auxiliary Cooling Protocol Engagement
  const handleEngageAuxiliaryCooling = () => {
    telemetryService.engageAuxiliaryCooling();
    setIsThermalBreachActive(false);
    showToast('✓ Auxiliary Cold Pack deployed! Rapid pull-down cooling active.');
  };

  // Handle Audio Alarm Mute Toggle
  const handleToggleAlarmMute = () => {
    const nextMute = !isAlarmMuted;
    setIsAlarmMuted(nextMute);
    audioAlert.setMuted(nextMute);
  };

  // Handle Manual Network Toggle (simulation for offline resilience demo)
  const handleToggleNetwork = () => {
    const next = !isOnline;
    offlineStorage.setSimulatedNetworkState(next);
    if (!next) {
      showToast('📡 SIMULATION: Offline mode. Mutations buffered in IndexedDB.');
    } else {
      showToast('📡 SIMULATION: Network restored. Sync initiated.');
      handleTriggerSync();
    }
  };

  // Trigger FIFO Queue Sync
  const handleTriggerSync = useCallback(async () => {
    if (isSyncing || queuedMutations.length === 0) return;
    setIsSyncing(true);

    const { syncedCount } = await offlineStorage.syncQueuedMutations((mutation) => {
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
    showToast(`✓ Synchronized ${syncedCount} mutations.`);
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

  // Update Batch Status handler
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      <TopNavBar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        currentRole={session.role}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenJudgePanel={() => setIsJudgeModalOpen(true)}
        isOnline={isOnline}
        onToggleNetwork={handleToggleNetwork}
        queuedCount={queuedMutations.length}
        language={language}
        onSelectLanguage={setLanguage}
        isThermalBreachActive={isThermalBreachActive}
        onToggleThermalBreach={handleToggleThermalBreach}
      />

      {/* Emergency Thermal Breach Alert Banner */}
      {isThermalBreachActive && (
        <div className="bg-red-600 text-white border-b border-red-500 py-3 px-4 sm:px-6 shadow-md z-30">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 bg-white text-red-700 rounded-md tracking-wide">
                    THERMAL BREACH
                  </span>
                  <span className="text-xs font-mono">
                    Reefer #SN-04 · Batch #ASG-001
                  </span>
                </div>
                <p className="text-xs text-red-100 mt-0.5">
                  Temperature: <span className="font-mono font-bold">{(latestReading?.coreTemp || 6.2).toFixed(1)}°C</span> (Limit: 4.0°C)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end">
              <button
                onClick={handleToggleAlarmMute}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition text-xs font-semibold flex items-center gap-1.5"
              >
                {isAlarmMuted ? (
                  <><VolumeX className="w-4 h-4" /><span>Unmute</span></>
                ) : (
                  <><Volume2 className="w-4 h-4" /><span>Mute</span></>
                )}
              </button>

              <button
                onClick={handleEngageAuxiliaryCooling}
                className="px-3 py-2 rounded-lg bg-white text-red-700 hover:bg-red-50 font-bold text-xs transition flex items-center gap-1.5"
              >
                <Power className="w-4 h-4" />
                <span>Engage Cooling</span>
              </button>

              <button
                onClick={() => setActiveTab('warehouse')}
                className="px-3 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs transition border border-red-400 flex items-center gap-1"
              >
                <span>Inspect</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Synchronization Banner */}
      <OfflineSyncIndicator
        isOnline={isOnline}
        onToggleNetwork={handleToggleNetwork}
        mutations={queuedMutations}
        onTriggerSync={handleTriggerSync}
        isSyncing={isSyncing}
      />

      {/* Main Content */}
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

        {activeTab === 'transporter' && <TransporterModule />}

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

        {activeTab === 'reports' && <ReportsModule batches={batches} />}

        {activeTab === 'auditor' && <AuditorModule batches={batches} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-600">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">AgriSupply</span>
            <span>•</span>
            <span>Farm to Future Cold-Chain Platform</span>
            <span>•</span>
            <span className="font-mono text-emerald-700">Simulation Demo v1.0</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Competition Demonstration</span>
            <span>•</span>
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="text-emerald-700 hover:underline font-mono"
            >
              {session.name} ({session.role})
            </button>
          </div>
        </div>
      </footer>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentRole={session.role}
        onSelectRole={handleSelectRole}
        currentToken={session.token}
      />

      {/* Judge Defense Modal */}
      <JudgeDefenseModal
        isOpen={isJudgeModalOpen}
        onClose={() => setIsJudgeModalOpen(false)}
        currentRole={session.role}
        isOnline={isOnline}
        onToggleNetwork={handleToggleNetwork}
        isThermalBreachActive={isThermalBreachActive}
        onToggleThermalBreach={handleToggleThermalBreach}
        onEngageAuxiliaryCooling={handleEngageAuxiliaryCooling}
        latestReading={latestReading}
        queuedMutations={queuedMutations}
        batches={batches}
        onNavigateTab={setActiveTab}
      />

      {/* Toast Notification */}
      {syncToastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-xs font-medium">{syncToastMessage}</span>
        </div>
      )}
    </div>
  );
}
