import React from 'react';
import { UserRole, ProduceBatch, LanguageCode, TelemetryReading } from '../../types';
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
  Volume2,
  VolumeX,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';
import { IoTTelemetryDeck } from '../telemetry/IoTTelemetryDeck';
import { exportBatchesWithTelemetryAndBreachesCSV } from '../../lib/reportGenerator';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { InteractiveColdChainHero } from './InteractiveColdChainHero';
import { DashboardWidget } from './DashboardWidget';
import { GeofenceManager } from '../geofence/GeofenceManager';

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
}

export const CommandOverview: React.FC<CommandOverviewProps> = ({
  onNavigateTab,
  batches,
  isOnline,
  language = 'en',
  isThermalBreachActive,
  onToggleThermalBreach,
  onEngageAuxiliaryCooling,
  latestReading
}) => {
  const t = TRANSLATIONS[language];
  const inTransitCount = batches.filter((b) => b.stage === 'IN_TRANSIT').length;
  const deliveredCount = batches.filter((b) => b.stage === 'DELIVERED').length;
  const warehouseCount = batches.filter((b) => b.stage === 'AT_WAREHOUSE' || b.stage === 'QUALITY_CHECKED').length;

  const currentTemp = latestReading ? latestReading.coreTemp : (isThermalBreachActive ? 6.2 : 4.2);

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: 'easeOut' as const }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >

      {/* Cinematic Interactive Hero Section (From Farm to Future Freshness Guaranteed) */}
      <motion.div variants={itemVariants}>
        <InteractiveColdChainHero
          onNavigateTab={onNavigateTab}
          isThermalBreachActive={isThermalBreachActive}
          onToggleThermalBreach={onToggleThermalBreach}
          latestReading={latestReading}
          batchesCount={batches.length}
        />
      </motion.div>

      {/* Top Welcome Bar (Matching Reference Image with Live Stream & Thermal Breach Toggle) */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.welcomeBack}, Tariq! 🌱
            </h1>

            {/* LIVE IoT STREAM Indicator (CSS GPU-friendly Pulse) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-full text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isThermalBreachActive ? 'bg-rose-500 animate-breach-pulse' : 'bg-emerald-500 animate-telemetry-pulse'}`}></span>
              <span>LIVE IoT (2s)</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time cold-chain stream monitoring remote farms and refrigerated transit corridors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Weather Tag */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-mono">
            <CloudSun className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-bold text-slate-800 dark:text-slate-200">28°C</span>
            <span className="text-slate-500 dark:text-slate-400">· {t.weatherSunny}</span>
          </div>

          {/* EMERGENCY THERMAL BREACH TOGGLE (Task 1 & Main Prompt Requirement) */}
          <button
            onClick={onToggleThermalBreach}
            aria-label="Toggle Emergency Thermal Breach Simulation"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none min-h-[44px] ${
              isThermalBreachActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 animate-breach-pulse'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300'
            }`}
          >
            <Flame className="w-4 h-4 shrink-0" />
            <span>{isThermalBreachActive ? 'Active Breach (>4.0°C) — Reset' : 'Simulate Thermal Breach (>4.0°C)'}</span>
          </button>

          {isThermalBreachActive && (
            <button
              onClick={onEngageAuxiliaryCooling}
              aria-label="Engage Auxiliary Cold Pack cooling protocol"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none min-h-[44px]"
            >
              <Power className="w-4 h-4 shrink-0" />
              <span>Engage Auxiliary Cooling</span>
            </button>
          )}

          <button
            onClick={() => exportBatchesWithTelemetryAndBreachesCSV(batches)}
            aria-label="Bulk Export CSV including telemetry and breach records"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none min-h-[44px]"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Bulk Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
        </div>
      </motion.div>

      {/* Real-Time Key Performance Indicators Widget (Total Transit Volume, Active Breach Alerts, System Uptime) */}
      <motion.div variants={itemVariants}>
        <DashboardWidget
          batches={batches}
          isThermalBreachActive={isThermalBreachActive}
          onNavigateTab={onNavigateTab}
          latestReading={latestReading}
        />
      </motion.div>

      {/* Supply Chain Overview Flow (Matching Reference Image) */}
      <motion.div variants={itemVariants} className="p-5 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 font-mono">
          {t.supplyChainOverview}
        </h3>

        <div className="flex items-center justify-between max-w-4xl mx-auto py-2 px-4 overflow-x-auto gap-4">
          
          <button
            onClick={() => onNavigateTab('farmer')}
            aria-label="Navigate to Farm step in inspection module"
            className="flex flex-col items-center gap-2 group shrink-0 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition group-hover:scale-110 shadow-xs">
              <Tractor className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.farm}</span>
          </button>

          <div className="h-0.5 flex-1 bg-emerald-300 dark:bg-emerald-500/40 min-w-[24px]"></div>

          <button
            onClick={() => onNavigateTab('farmer')}
            aria-label="Navigate to Quality Inspection step"
            className="flex flex-col items-center gap-2 group shrink-0 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition group-hover:scale-110 shadow-xs">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.inspection}</span>
          </button>

          <div className="h-0.5 flex-1 bg-emerald-300 dark:bg-emerald-500/40 min-w-[24px]"></div>

          <button
            onClick={() => onNavigateTab('transporter')}
            aria-label="Navigate to Transport fleet tracking"
            className="flex flex-col items-center gap-2 group shrink-0 active:scale-95 focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl"
          >
            <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-sky-500/10 border-2 border-sky-500 text-sky-600 dark:text-sky-400 flex items-center justify-center transition group-hover:scale-110 shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.transport}</span>
          </button>

          <div className="h-0.5 flex-1 bg-sky-300 dark:bg-sky-500/40 min-w-[24px]"></div>

          <button
            onClick={() => onNavigateTab('warehouse')}
            aria-label="Navigate to Warehouse inventory"
            className="flex flex-col items-center gap-2 group shrink-0 active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl"
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-500 text-amber-600 dark:text-amber-400 flex items-center justify-center transition group-hover:scale-110 shadow-xs">
              <Warehouse className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.warehouse}</span>
          </button>

          <div className="h-0.5 flex-1 bg-amber-300 dark:bg-amber-500/40 min-w-[24px]"></div>

          <button
            onClick={() => onNavigateTab('pipeline')}
            aria-label="Navigate to Retail supply pipeline"
            className="flex flex-col items-center gap-2 group shrink-0 active:scale-95 focus-visible:ring-2 focus-visible:ring-violet-500 rounded-xl"
          >
            <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-500/10 border-2 border-violet-500 text-violet-600 dark:text-violet-400 flex items-center justify-center transition group-hover:scale-110 shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.retail}</span>
          </button>

        </div>
      </motion.div>

      {/* 24-Hour Real-Time Historical Temperature Fluctuation Chart (Recharts) */}
      <motion.div variants={itemVariants}>
        <React.Suspense fallback={
          <div className="h-72 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-center text-xs font-mono text-slate-400 animate-pulse">
            Loading Recharts 24-Hour Telemetry Engine...
          </div>
        }>
          <HistoricalTemperatureChart
            batches={batches}
            latestReading={latestReading}
            isThermalBreachActive={isThermalBreachActive}
          />
        </React.Suspense>
      </motion.div>

      {/* Grid: Supply Loss Rate Card & Temperature Trend (Matching Reference Image) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Supply Loss Rate Card */}
        <div className="p-5 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">{t.supplyLossRate}</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">2.8%</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">↓ 40% vs Baseline</span>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">This Month</span>
          </div>

          {/* SVG Area Chart */}
          <div className="h-32 w-full pt-2">
            <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 10,20 Q 60,35 120,60 T 240,75 T 390,95 L 390,120 L 10,120 Z"
                fill="url(#lossGrad)"
              />
              <path
                d="M 10,20 Q 60,35 120,60 T 240,75 T 390,95"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />
              {[
                { cx: 10, cy: 20 },
                { cx: 120, cy: 60 },
                { cx: 240, cy: 75 },
                { cx: 390, cy: 95 }
              ].map((p, i) => (
                <circle key={i} cx={p.cx} cy={p.cy} r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              ))}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 font-mono border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>Apr 1</span>
            <span>Apr 8</span>
            <span>Apr 15</span>
            <span>Apr 22</span>
            <span>Apr 30</span>
          </div>
        </div>

        {/* Temperature Trend (Cold Storage) */}
        <div className={`p-5 rounded-2xl border transition-all shadow-sm space-y-4 ${
          isThermalBreachActive
            ? 'bg-rose-50 dark:bg-[#180d12] border-rose-300 dark:border-rose-500/50'
            : 'bg-white dark:bg-[#0f1722] border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">{t.tempTrend}</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl font-black font-mono ${
                  isThermalBreachActive ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {currentTemp.toFixed(1)}°C
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isThermalBreachActive ? 'EXCEEDED >4.0°C CEILING' : 'Current Temperature'}
                </span>
              </div>
            </div>
            <span className={`text-xs font-mono px-2 py-1 rounded font-bold ${
              isThermalBreachActive
                ? 'bg-rose-600 text-white'
                : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
            }`}>
              Safe Range: 2°C - 8°C
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="h-32 w-full pt-2">
            <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
              <path
                d={isThermalBreachActive
                  ? "M 10,65 Q 80,60 160,50 T 280,30 T 390,15"
                  : "M 10,65 Q 80,60 160,70 T 280,62 T 390,68"
                }
                fill="none"
                stroke={isThermalBreachActive ? "#ef4444" : "#10b981"}
                strokeWidth="2.5"
              />
              {[
                { cx: 10, cy: 65 },
                { cx: 100, cy: isThermalBreachActive ? 58 : 62 },
                { cx: 200, cy: isThermalBreachActive ? 45 : 69 },
                { cx: 300, cy: isThermalBreachActive ? 28 : 63 },
                { cx: 390, cy: isThermalBreachActive ? 15 : 68 }
              ].map((p, i) => (
                <circle key={i} cx={p.cx} cy={p.cy} r="3" fill={isThermalBreachActive ? "#ef4444" : "#10b981"} />
              ))}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 font-mono border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
            <span>18:00 (Live Stream)</span>
          </div>
        </div>

      </motion.div>

      {/* Recent Shipments Table (Matching Reference Image) */}
      <motion.div variants={itemVariants} className="p-5 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.recentShipments}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Produce lots currently synchronized with central ledger</p>
          </div>

          <button
            onClick={() => onNavigateTab('warehouse')}
            aria-label="View all inventory in warehouse table"
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1"
          >
            <span>View All Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-slate-800 pb-2">
              <tr>
                <th className="py-2.5 px-3">Shipment ID</th>
                <th className="py-2.5 px-3">Produce</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">ETA</th>
                <th className="py-2.5 px-3 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {batches.slice(0, 5).map((batch) => {
                const isThisBatchBreached = isThermalBreachActive && batch.id === '#ASG-001';

                return (
                  <tr
                    key={batch.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                      isThisBatchBreached ? 'bg-rose-50 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {batch.id}
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize text-slate-800 dark:text-slate-200 font-semibold">{batch.commodity}</span>
                      <span className="text-[10px] text-slate-400 block">{batch.variety}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {batch.quantityKg.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isThisBatchBreached
                            ? 'bg-rose-600 text-white animate-pulse'
                            : batch.stage === 'IN_TRANSIT'
                            ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300'
                            : batch.stage === 'AT_WAREHOUSE'
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : batch.stage === 'QUALITY_CHECKED'
                            ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
                        }`}
                      >
                        ● {isThisBatchBreached ? 'AT RISK - BREACH' : batch.stage.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {batch.estimatedTransitTime}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigateTab('warehouse')}
                        aria-label={`Inspect batch ${batch.id}`}
                        className="p-2 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500"
                        title="Inspect Batch"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Real-Time IoT Telemetry Stream Module */}
      <motion.div variants={itemVariants}>
        <IoTTelemetryDeck />
      </motion.div>

      {/* Geofence Manager Dashboard Component */}
      <motion.div variants={itemVariants}>
        <GeofenceManager />
      </motion.div>

    </motion.div>
  );
};

export { DashboardWidget } from './DashboardWidget';
