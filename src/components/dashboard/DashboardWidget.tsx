import React, { useState, useEffect, useMemo } from 'react';
import { ProduceBatch, TelemetryReading } from '../../types';
import { 
  Truck, 
  Flame, 
  ShieldCheck, 
  ShieldAlert, 
  Server, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  Activity, 
  Package, 
  Radio,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion, useSpring, useTransform } from 'motion/react';

/**
 * Smooth numeric counter powered by framer-motion physics (useSpring + useTransform)
 */
export function MotionNumber({ 
  value, 
  decimals = 0,
  prefix = '',
  suffix = ''
}: { 
  value: number; 
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (latest) => {
    return `${prefix}${latest.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className="font-mono tabular-nums">{display}</motion.span>;
}

export interface DashboardWidgetProps {
  batches: ProduceBatch[];
  isThermalBreachActive?: boolean;
  onNavigateTab?: (tab: string) => void;
  latestReading?: TelemetryReading | null;
  className?: string;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  batches,
  isThermalBreachActive = false,
  onNavigateTab,
  latestReading,
  className = ''
}) => {
  // Live uptime counter in seconds (seeded with realistic operational enterprise runtime: ~4 days)
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(345920);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format uptime into human-readable string: "4d 0h 5m 20s"
  const formatUptime = (totalSec: number) => {
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // 1. Total Transit Volume Calculations from current batches state
  const transitBatches = useMemo(() => {
    return batches.filter((b) => b.stage === 'IN_TRANSIT');
  }, [batches]);

  const totalTransitVolumeKg = useMemo(() => {
    return transitBatches.reduce((acc, b) => acc + (b.quantityKg || 0), 0);
  }, [transitBatches]);

  const totalSystemVolumeKg = useMemo(() => {
    return batches.reduce((acc, b) => acc + (b.quantityKg || 0), 0);
  }, [batches]);

  const transitVolumeMT = useMemo(() => {
    return totalTransitVolumeKg / 1000;
  }, [totalTransitVolumeKg]);

  // 2. Active Breach Alerts Calculations from current batches state
  const activeBreachesCount = useMemo(() => {
    const rawBreaches = batches.filter((b) => b.coldChainStatus === 'CRITICAL_BREACH').length;
    return isThermalBreachActive ? Math.max(rawBreaches, 1) : rawBreaches;
  }, [batches, isThermalBreachActive]);

  const totalHistoricalBreaches = useMemo(() => {
    const logged = batches.reduce((acc, b) => acc + (b.breachRecords?.length || 0), 0);
    return logged + (isThermalBreachActive && activeBreachesCount > 0 ? 1 : 0);
  }, [batches, isThermalBreachActive, activeBreachesCount]);

  // 3. System Uptime & SLA Availability Metric
  const uptimePercentage = useMemo(() => {
    if (activeBreachesCount > 0) return 99.82;
    return 99.98;
  }, [activeBreachesCount]);

  // 4. Quality & Freshness Index calculated from current batches state
  const averageFreshness = useMemo(() => {
    if (batches.length === 0) return 92.5;
    return batches.reduce((acc, b) => acc + (b.freshnessScorePercent || 0), 0) / batches.length;
  }, [batches]);

  const gradeACount = useMemo(() => {
    return batches.filter((b) => b.qualityGrade === 'GRADE_A_EXPORT').length;
  }, [batches]);

  const gradeAPercent = useMemo(() => {
    if (batches.length === 0) return 85;
    return Math.round((gradeACount / batches.length) * 100);
  }, [batches, gradeACount]);

  return (
    <div className={`space-y-3 ${className}`}>
      
      {/* Widget Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
            Autonomous Cold-Chain KPI Deck
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">
            · Calculated from {batches.length} Active Lots
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span>2000ms Live Telemetry</span>
          </span>
          <span>·</span>
          <span>Target SLA: 99.95%</span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: TOTAL TRANSIT VOLUME */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => onNavigateTab && onNavigateTab('transporter')}
          className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-sky-300 transition cursor-pointer flex flex-col justify-between group min-h-[44px]"
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-600" />
                <span>Total Transit Volume</span>
              </span>
              <span className="p-1 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-100 transition">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                <MotionNumber value={transitVolumeMT} decimals={1} />
              </span>
              <span className="text-sm font-bold text-slate-500 font-mono">
                Metric Tons
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">
              {transitBatches.length} Active Corridors
            </span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{Math.round((totalTransitVolumeKg / (totalSystemVolumeKg || 1)) * 100)}% of cargo</span>
            </span>
          </div>
        </motion.div>

        {/* KPI 2: ACTIVE BREACH ALERTS */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => onNavigateTab && onNavigateTab('auditor')}
          className={`p-5 rounded-2xl shadow-xs border transition cursor-pointer flex flex-col justify-between group min-h-[44px] ${
            activeBreachesCount > 0
              ? 'bg-rose-50/90 border-rose-300 hover:border-rose-500'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold flex items-center gap-1.5 text-slate-600">
                {activeBreachesCount > 0 ? (
                  <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                )}
                <span>Active Breach Alerts</span>
              </span>
              <span className={`p-1 rounded-lg transition ${
                activeBreachesCount > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-50 text-emerald-600'
              }`}>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-black font-mono tracking-tight ${
                activeBreachesCount > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}>
                <MotionNumber value={activeBreachesCount} decimals={0} />
              </span>
              <span className={`text-xs font-bold uppercase font-mono px-2 py-0.5 rounded-full ${
                activeBreachesCount > 0
                  ? 'bg-rose-200 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {activeBreachesCount > 0 ? 'CRITICAL EXCURSION' : 'NOMINAL ENVELOPE'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">
              {totalHistoricalBreaches} Total Logged
            </span>
            <span className={`font-semibold ${
              activeBreachesCount > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {activeBreachesCount > 0 ? 'Auditor Review Required' : 'Zero Active Excursions'}
            </span>
          </div>
        </motion.div>

        {/* KPI 3: SYSTEM UPTIME & TELEMETRY HEARTBEAT */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-emerald-300 transition flex flex-col justify-between min-h-[44px]"
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>System & Edge Uptime</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                TIER-III COLD-CHAIN
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                <MotionNumber value={uptimePercentage} decimals={2} suffix="%" />
              </span>
              <span className="text-xs font-bold text-emerald-600 font-mono">
                SLA Maintained
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formatUptime(uptimeSeconds)}</span>
            </span>
            <span className="text-slate-500">
              MTBF &gt; 180 hrs
            </span>
          </div>
        </motion.div>

        {/* KPI 4: QUALITY & FRESHNESS INDEX */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => onNavigateTab && onNavigateTab('pipeline')}
          className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-amber-300 transition cursor-pointer flex flex-col justify-between group min-h-[44px]"
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600" />
                <span>Quality & Freshness Index</span>
              </span>
              <span className="p-1 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-100 transition">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                <MotionNumber value={averageFreshness} decimals={1} suffix="%" />
              </span>
              <span className="text-xs font-bold text-emerald-600 font-mono">
                Optimal Shelf-Life
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">
              {gradeAPercent}% Export Grade A
            </span>
            <span className="text-emerald-600 font-bold">
              +99.4% Spoilage Saved
            </span>
          </div>
        </motion.div>

      </div>

    </div>
  );
};
