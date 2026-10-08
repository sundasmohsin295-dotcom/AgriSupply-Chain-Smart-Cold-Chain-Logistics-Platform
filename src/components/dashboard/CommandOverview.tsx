import React, { useState } from 'react';
import { UserRole, ProduceBatch, LanguageCode, TelemetryReading, OperationalAlert } from '../../types';
import { TRANSLATIONS } from '../../lib/translations';
import { 
  Tractor, 
  Truck, 
  Warehouse, 
  Store, 
  Search, 
  ArrowRight, 
  Activity, 
  CheckCircle, 
  CloudSun, 
  Thermometer, 
  Download, 
  Eye, 
  Flame,
  Power,
  Boxes,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Clock,
  MapPin,
  RotateCcw,
  Navigation,
  FileText,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { exportBatchesWithTelemetryAndBreachesCSV } from '../../lib/reportGenerator';
import { auditLogger } from '../../services/auditLogger';

const HistoricalTemperatureChart = React.lazy(() => 
  import('../analytics/HistoricalTemperatureChart').then((m) => ({ default: m.HistoricalTemperatureChart }))
);

interface CommandOverviewProps {
  onNavigateTab: (tab: string) => void;
  batches: ProduceBatch[];
  currentRole: UserRole;
  isOnline: boolean;
  onToggleNetwork: () => void;
  language?: LanguageCode;
  isThermalBreachActive: boolean;
  onToggleThermalBreach: () => void;
  onEngageAuxiliaryCooling: () => void;
  latestReading: TelemetryReading | null;
  alerts: OperationalAlert[];
  onSelectBatch: (batch: ProduceBatch) => void;
  onInvestigateAlert: (alert: OperationalAlert) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onOpenDiagnostics: (batch?: ProduceBatch) => void;
  onOpenInspection: (batch?: ProduceBatch) => void;
  onResetDemo?: () => void;
}

export const CommandOverview: React.FC<CommandOverviewProps> = ({
  onNavigateTab,
  batches,
  isOnline,
  language = 'en',
  isThermalBreachActive,
  onToggleThermalBreach,
  onEngageAuxiliaryCooling,
  latestReading,
  alerts,
  onSelectBatch,
  onInvestigateAlert,
  onAcknowledgeAlert,
  onOpenDiagnostics,
  onOpenInspection,
  onResetDemo
}) => {
  const t = TRANSLATIONS[language];
  const inTransitCount = batches.filter((b) => b.stage === 'IN_TRANSIT').length;
  const deliveredCount = batches.filter((b) => b.stage === 'DELIVERED').length;
  const warehouseCount = batches.filter((b) => b.stage === 'AT_WAREHOUSE').length;
  const pendingIntakeCount = batches.filter((b) => b.stage === 'PENDING' || b.stage === 'QUALITY_CHECKED').length;

  const currentTemp = latestReading ? latestReading.coreTemp : (isThermalBreachActive ? 6.2 : 3.8);

  const activeAlerts = alerts.filter((a) => a.status !== 'RESOLVED');
  const recentAuditEvents = auditLogger.getRecentLogs(5);

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' as const }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* 1. OPERATIONAL STATUS SUMMARY (What is happening?) */}
      <motion.div
        variants={itemVariants}
        className="p-5 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Cold-Chain Operations Command
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                isThermalBreachActive
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isThermalBreachActive ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                {isThermalBreachActive ? '1 THERMAL EXCURSION' : 'COLD CHAIN NOMINAL'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                SIMULATED IoT (2s)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live monitoring of refrigerated transport reefers, packing hubs, and terminal cold-storage facilities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Simulation Breach Trigger */}
            <button
              onClick={onToggleThermalBreach}
              aria-label="Toggle Emergency Thermal Breach Simulation"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 border ${
                isThermalBreachActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-600 animate-breach-pulse'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-400'
              }`}
            >
              <Flame className="w-4 h-4 shrink-0" />
              <span>{isThermalBreachActive ? 'Active Breach (>4.0°C) — Reset' : 'Simulate Thermal Breach (>4.0°C)'}</span>
            </button>

            {isThermalBreachActive && (
              <button
                onClick={onEngageAuxiliaryCooling}
                aria-label="Engage Auxiliary Cold Pack cooling protocol"
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
              >
                <Power className="w-4 h-4 shrink-0" />
                <span>Engage Aux Cooling</span>
              </button>
            )}

            {onResetDemo && (
              <button
                onClick={onResetDemo}
                title="Reset all demo states, alerts, and batches to clean competition starting baseline"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            )}

            <button
              onClick={() => exportBatchesWithTelemetryAndBreachesCSV(batches)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Level 1 Decision Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
          <div className="p-3 bg-slate-50 dark:bg-[#131c28] border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Active Shipments</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{batches.length}</span>
              <span className="text-[10px] text-slate-500 font-mono">Total Lots</span>
            </div>
            <span className="text-[10px] text-sky-700 dark:text-sky-400 font-medium block mt-0.5">
              {inTransitCount} in active transit
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#131c28] border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Cold-Chain Status</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-xl font-bold font-mono ${isThermalBreachActive ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {currentTemp.toFixed(1)}°C
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Probe #01</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Target Envelope: 2°C – 4°C
            </span>
          </div>

          <div className={`p-3 rounded-xl border transition ${
            activeAlerts.length > 0 
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700' 
              : 'bg-slate-50 dark:bg-[#131c28] border-slate-200 dark:border-slate-800'
          }`}>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Action Required</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-xl font-bold font-mono ${activeAlerts.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {activeAlerts.length}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Exceptions</span>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block mt-0.5">
              {isThermalBreachActive ? 'Critical excursion active' : `${activeAlerts.length} pending reviews`}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#131c28] border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Cold Storage Hubs</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">4</span>
              <span className="text-[10px] text-slate-400 font-mono">Monitored</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {warehouseCount} lots stored at bay
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#131c28] border border-slate-200 dark:border-slate-800 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Next Recommended Action</span>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
              {isThermalBreachActive ? 'Deploy Aux Cold Pack #ASG-001' : 'Inspect TRK-024 (3.8°C)'}
            </div>
            <button
              onClick={() => {
                const targetBatch = batches.find((b) => b.id === '#ASG-001') || batches[0]!;
                onSelectBatch(targetBatch);
              }}
              className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 mt-0.5"
            >
              <span>Execute Action</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2 & 3. ATTENTION REQUIRED WORKFLOW (Is anything wrong? What requires my attention?) */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Attention Required ({activeAlerts.length} Prioritized Operations)
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Real-time exception resolution queue
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {activeAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL' || (isThermalBreachActive && alert.assetId === 'TRK-024');
            const matchingBatch = alert.batchId ? batches.find((b) => b.id === alert.batchId) : undefined;

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                  isCritical
                    ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                    : alert.severity === 'HIGH'
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                    : 'bg-white dark:bg-[#0f1722] border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      isCritical
                        ? 'bg-rose-600 text-white'
                        : alert.severity === 'HIGH'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}>
                      {isCritical ? 'CRITICAL EXCURSION' : `${alert.severity} PRIORITY`}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {alert.timestamp} {alert.duration && `· ${alert.duration}`}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {alert.assetName}
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                      {alert.reason}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/70 dark:bg-black/30 border border-slate-200/60 dark:border-slate-800 text-[11px] font-mono">
                    <span className="text-slate-500">Current: <strong>{alert.currentValue}</strong></span>
                    <span className="text-slate-500">Limit: <strong>{alert.thresholdLimit}</strong></span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Action: {alert.recommendedAction}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      if (alert.actionType === 'INVESTIGATE' && matchingBatch) {
                        onSelectBatch(matchingBatch);
                      } else if (alert.actionType === 'ENGAGE_COOLING') {
                        onEngageAuxiliaryCooling();
                      } else if (alert.actionType === 'REVIEW_ROUTE') {
                        onNavigateTab('transporter');
                      } else if (alert.actionType === 'OPEN_INSPECTION' && matchingBatch) {
                        onOpenInspection(matchingBatch);
                      } else {
                        onInvestigateAlert(alert);
                      }
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 ${
                      isCritical
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : alert.severity === 'HIGH'
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <span>
                      {alert.actionType === 'INVESTIGATE' ? 'Investigate' :
                       alert.actionType === 'ENGAGE_COOLING' ? 'Engage Cooling' :
                       alert.actionType === 'REVIEW_ROUTE' ? 'Review Route' :
                       alert.actionType === 'OPEN_INSPECTION' ? 'Open Inspection' : 'Resolve'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold"
                    title="Acknowledge Alert"
                  >
                    Ack
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 4. WHERE ARE MY SHIPMENTS? (Live Operational Overview) */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Live Fleet & Shipment Control Room
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any active shipment row to open the complete control workspace drawer.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('transporter')}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            <span>Full Corridor Map & Geofences</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0c131c] text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Shipment Batch</th>
                  <th className="py-3 px-4">Commodity</th>
                  <th className="py-3 px-4">Origin Farm</th>
                  <th className="py-3 px-4">Destination Hub</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Pulp Temp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {batches.map((batch) => {
                  const isThisBatchBreached = isThermalBreachActive && batch.id === '#ASG-001';

                  return (
                    <tr
                      key={batch.id}
                      onClick={() => onSelectBatch(batch)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition ${
                        isThisBatchBreached ? 'bg-rose-50 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {batch.id}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{batch.variety}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{batch.quantityKg.toLocaleString()} kg</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {batch.farmerName.split(' ')[0]}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {batch.destinationHub}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {batch.assignedReeferId || 'TRK-024'}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={`font-bold ${
                          isThisBatchBreached 
                            ? 'text-rose-600 animate-pulse' 
                            : batch.currentTemp > batch.targetTempMax 
                            ? 'text-amber-600' 
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {batch.currentTemp.toFixed(1)}°C
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          ({batch.targetTempMin}° - {batch.targetTempMax}°)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isThisBatchBreached
                            ? 'bg-rose-600 text-white animate-pulse'
                            : batch.stage === 'IN_TRANSIT'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
                            : batch.stage === 'AT_WAREHOUSE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : batch.stage === 'QUALITY_CHECKED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                        }`}>
                          ● {isThisBatchBreached ? 'AT RISK - EXCURSION' : batch.stage.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition">
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Open</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* 5. IS THE COLD CHAIN HEALTHY? (One Strong Temperature Chart with Safe Envelope) */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              24-Hour Cold-Chain Thermal Envelope & Telemetry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sensor readings continuously evaluated against safe threshold ceiling.
            </p>
          </div>

          <button
            onClick={() => onOpenDiagnostics()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Open Sensor Diagnostics</span>
          </button>
        </div>

        <React.Suspense fallback={
          <div className="h-72 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-xs font-mono text-slate-400">
            Loading 24-Hour Telemetry Engine...
          </div>
        }>
          <HistoricalTemperatureChart
            batches={batches}
            latestReading={latestReading}
            isThermalBreachActive={isThermalBreachActive}
          />
        </React.Suspense>
      </motion.div>

      {/* 6. WHAT IS MOVING THROUGH THE SUPPLY CHAIN? (Supply Pipeline Progression) */}
      <motion.div variants={itemVariants} className="p-5 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
            End-to-End Supply Chain Progression
          </h2>
          <button
            onClick={() => onNavigateTab('pipeline')}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Interactive Pipeline</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
          <button
            onClick={() => onNavigateTab('farmer')}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121c28] hover:border-emerald-400 text-left transition"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <Tractor className="w-4 h-4 text-emerald-600" />
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">1</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">1. Farm Harvest</span>
            <span className="text-[10px] text-slate-400">Intake & Pre-Cooling</span>
          </button>

          <button
            onClick={() => {
              const pendingBatch = batches.find((b) => b.stage === 'PENDING' || b.stage === 'QUALITY_CHECKED') || batches[0]!;
              onOpenInspection(pendingBatch);
            }}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121c28] hover:border-emerald-400 text-left transition"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{pendingIntakeCount}</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">2. Quality Check</span>
            <span className="text-[10px] text-slate-400">Pulp & Defect Cert</span>
          </button>

          <button
            onClick={() => onNavigateTab('transporter')}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121c28] hover:border-sky-400 text-left transition"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <Truck className="w-4 h-4 text-sky-600" />
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{inTransitCount}</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">3. Reefer Transit</span>
            <span className="text-[10px] text-slate-400">N-5 Corridor Highway</span>
          </button>

          <button
            onClick={() => onNavigateTab('warehouse')}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121c28] hover:border-amber-400 text-left transition"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <Warehouse className="w-4 h-4 text-amber-600" />
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{warehouseCount}</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">4. Cold Depot</span>
            <span className="text-[10px] text-slate-400">Storage & FEFO Hold</span>
          </button>

          <button
            onClick={() => onNavigateTab('pipeline')}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121c28] hover:border-violet-400 text-left transition col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <Store className="w-4 h-4 text-violet-600" />
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{deliveredCount}</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">5. Retail Receipt</span>
            <span className="text-[10px] text-slate-400">Final Shelf Arrival</span>
          </button>
        </div>
      </motion.div>

      {/* 7. WHAT HAPPENED RECENTLY? (Operational Activity Timeline) */}
      <motion.div variants={itemVariants} className="p-5 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              Operational Activity & Chain-of-Custody Ledger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified operational events recorded with actors and timestamps.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('auditor')}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Full Audit Ledger</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/80">
          {recentAuditEvents.map((evt) => (
            <div key={evt.id} className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <div className="flex items-start sm:items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shrink-0">
                  {evt.type.replace(/_/g, ' ')}
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {evt.details}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono shrink-0">
                <span>Actor: {evt.actor.split(' ')[0]}</span>
                <span>•</span>
                <span>{evt.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export { DashboardWidget } from './DashboardWidget';
