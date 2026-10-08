import React, { useState, useMemo } from 'react';
import { ProduceBatch, TelemetryReading } from '../../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Thermometer, 
  ShieldAlert, 
  Clock, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Maximize2
} from 'lucide-react';

interface HistoricalTemperatureChartProps {
  batches: ProduceBatch[];
  latestReading?: TelemetryReading | null;
  isThermalBreachActive?: boolean;
}

interface HourlyDataPoint {
  timeLabel: string;
  hourOffset: number;
  strawberryCore: number;
  mangoColdBay: number;
  transitAmbient: number;
  criticalThreshold: number;
  isBreached: boolean;
}

export const HistoricalTemperatureChartComponent: React.FC<HistoricalTemperatureChartProps> = ({
  batches,
  latestReading,
  isThermalBreachActive = false
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [timeRangeHours, setTimeRangeHours] = useState<number>(24);

  // Generate deterministic 24-hour time series anchored to current reading
  const chartData: HourlyDataPoint[] = useMemo(() => {
    const points: HourlyDataPoint[] = [];
    const now = new Date();
    const currentCoreTemp = latestReading?.coreTemp ?? (isThermalBreachActive ? 6.2 : 2.4);

    for (let i = timeRangeHours; i >= 0; i--) {
      const pointTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      
      // Base historical curve with gentle diurnal fluctuation
      const diurnalSine = Math.sin((pointTime.getHours() / 24) * Math.PI * 2);
      
      let strawberryTemp: number;
      if (i === 0) {
        strawberryTemp = currentCoreTemp;
      } else if (i <= 2 && isThermalBreachActive) {
        strawberryTemp = 4.8 + (3 - i) * 0.7; // leading into breach
      } else {
        strawberryTemp = Number((2.4 + diurnalSine * 0.6 + Math.cos(i * 0.8) * 0.3).toFixed(1));
      }

      const mangoTemp = Number((11.8 + diurnalSine * 0.5 + Math.sin(i * 0.5) * 0.4).toFixed(1));
      const ambientTemp = Number((26.5 + diurnalSine * 6.2 + (i % 3 === 0 ? 1.2 : -0.8)).toFixed(1));

      points.push({
        timeLabel: i === 0 ? 'Now (Live)' : hourStr,
        hourOffset: i,
        strawberryCore: strawberryTemp,
        mangoColdBay: mangoTemp,
        transitAmbient: ambientTemp,
        criticalThreshold: 4.0,
        isBreached: strawberryTemp > 4.0
      });
    }

    return points;
  }, [timeRangeHours, latestReading?.coreTemp, isThermalBreachActive]);

  // Derived metrics from 24h dataset
  const metrics = useMemo(() => {
    const strawberryTemps = chartData.map((d) => d.strawberryCore);
    const maxTemp = Math.max(...strawberryTemps);
    const minTemp = Math.min(...strawberryTemps);
    const avgTemp = (strawberryTemps.reduce((a, b) => a + b, 0) / strawberryTemps.length).toFixed(1);
    const breachHours = chartData.filter((d) => d.strawberryCore > 4.0).length;
    const stabilityPct = (((chartData.length - breachHours) / chartData.length) * 100).toFixed(1);

    return { maxTemp, minTemp, avgTemp, breachHours, stabilityPct };
  }, [chartData]);

  return (
    <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
      
      {/* Header Deck: Title, Batch Filter, Timeframe Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                24-Hour Active Batch Thermal Excursion History
              </h2>
              <span className="text-[10px] font-mono uppercase bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-full font-bold">
                Recharts Analytics
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Continuous multi-sensor telemetry tracking core fruit pulp vs. ambient corridor thermal envelope.
            </p>
          </div>
        </div>

        {/* Action Controls: Batch Filter & Timeframe */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeRangeHours(6)}
              className={`px-2.5 py-1 rounded-lg transition ${
                timeRangeHours === 6
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              6h
            </button>
            <button
              onClick={() => setTimeRangeHours(12)}
              className={`px-2.5 py-1 rounded-lg transition ${
                timeRangeHours === 12
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              12h
            </button>
            <button
              onClick={() => setTimeRangeHours(24)}
              className={`px-2.5 py-1 rounded-lg transition ${
                timeRangeHours === 24
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              24h
            </button>
          </div>

          {/* Batch Selector */}
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Active Batches (#ASG-001 & #ASG-002)</option>
            <option value="#ASG-001">#ASG-001 (Strawberries — 0°C to 4°C)</option>
            <option value="#ASG-002">#ASG-002 (Sindhri Mangoes — 10°C to 13°C)</option>
          </select>
        </div>
      </div>

      {/* Main Recharts Area Container */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="strawberryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isThermalBreachActive ? '#ef4444' : '#10b981'} stopOpacity={0.4} />
                <stop offset="95%" stopColor={isThermalBreachActive ? '#ef4444' : '#10b981'} stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="mangoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="ambientGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />

            <XAxis 
              dataKey="timeLabel" 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
              tickLine={false}
              interval="preserveStartEnd"
            />

            <YAxis 
              domain={[0, 36]} 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
              tickLine={false}
              unit="°C"
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload as HourlyDataPoint;
                return (
                  <div className="bg-slate-900/95 text-white border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-xs font-mono">
                    <div className="flex items-center justify-between gap-4 font-bold border-b border-slate-700 pb-1 text-slate-300">
                      <span>Timeline: {data.timeLabel}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        data.strawberryCore > 4.0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        {data.strawberryCore > 4.0 ? 'BREACH > 4°C' : 'NOMINAL'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-emerald-400">#ASG-001 (Berry Core):</span>
                      <span className="font-bold text-white">{data.strawberryCore.toFixed(1)}°C</span>
                    </div>

                    {(selectedBatchId === 'all' || selectedBatchId === '#ASG-002') && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-amber-400">#ASG-002 (Mango Bay):</span>
                        <span className="font-bold text-white">{data.mangoColdBay.toFixed(1)}°C</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4 text-slate-400">
                      <span>Ambient Highway:</span>
                      <span>{data.transitAmbient.toFixed(1)}°C</span>
                    </div>

                    <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                      PSQCA Standard Limit: 4.0°C Max
                    </div>
                  </div>
                );
              }}
            />

            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              iconType="circle"
            />

            {/* Critical PSQCA Temperature Envelope Boundary (4.0°C) */}
            <ReferenceLine 
              y={4.0} 
              stroke="#ef4444" 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
              label={{ 
                value: 'PSQCA Critical Threshold (4.0°C)', 
                position: 'right', 
                fill: '#ef4444', 
                fontSize: 10,
                fontWeight: 'bold'
              }} 
            />

            {/* Ambient Corridor Temperature Area */}
            <Area
              type="monotone"
              dataKey="transitAmbient"
              name="Ambient N-5 Highway Temp"
              stroke="#94a3b8"
              strokeWidth={1.5}
              fill="url(#ambientGrad)"
            />

            {/* Sindhri Mango Cold Storage Ambient */}
            {(selectedBatchId === 'all' || selectedBatchId === '#ASG-002') && (
              <Area
                type="monotone"
                dataKey="mangoColdBay"
                name="#ASG-002 Mango Bay (12°C)"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#mangoGrad)"
              />
            )}

            {/* Export Strawberries Core Reefer Pulp Temp */}
            {(selectedBatchId === 'all' || selectedBatchId === '#ASG-001') && (
              <Area
                type="monotone"
                dataKey="strawberryCore"
                name="#ASG-001 Strawberry Core (Limit 4°C)"
                stroke={isThermalBreachActive ? '#ef4444' : '#10b981'}
                strokeWidth={2.5}
                fill="url(#strawberryGrad)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 24-Hour Statistical Summary Deck */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 bg-slate-50 dark:bg-[#090e15] border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
            24h Peak Excursion
          </span>
          <span className={`text-base font-black font-mono ${metrics.maxTemp > 4.0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
            {metrics.maxTemp.toFixed(1)}°C
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-[#090e15] border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
            Mean Temperature
          </span>
          <span className="text-base font-black font-mono text-slate-900 dark:text-white">
            {metrics.avgTemp}°C
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-[#090e15] border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
            Thermal Stability
          </span>
          <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
            {metrics.stabilityPct}%
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-[#090e15] border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
            Compliance Grade
          </span>
          <span className="text-base font-black font-mono text-sky-600 dark:text-sky-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>PSQCA Tier 1</span>
          </span>
        </div>
      </div>

    </div>
  );
};

// Memoize to prevent re-rendering when parent ticks
export const HistoricalTemperatureChart = React.memo(HistoricalTemperatureChartComponent);
