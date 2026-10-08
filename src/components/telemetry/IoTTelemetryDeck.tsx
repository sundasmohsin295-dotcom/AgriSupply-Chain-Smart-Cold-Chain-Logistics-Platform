import React, { useState, useEffect } from 'react';
import { TelemetryReading } from '../../types';
import { telemetryService } from '../../services/telemetryStream';
import { audioAlert } from '../../lib/audioAlert';
import { 
  Activity, 
  Flame, 
  Thermometer, 
  Droplets, 
  Cpu, 
  BatteryCharging, 
  Volume2, 
  VolumeX, 
  Power,
  DoorClosed,
  Zap,
  Clock
} from 'lucide-react';

export const IoTTelemetryDeck: React.FC = () => {
  const [currentReading, setCurrentReading] = useState<TelemetryReading | null>(null);
  const [history, setHistory] = useState<TelemetryReading[]>([]);
  const [isBreached, setIsBreached] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = telemetryService.subscribe((reading, hist, breach) => {
      setCurrentReading(reading);
      setHistory([...hist]);
      setIsBreached(breach);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleBreach = () => {
    const nextState = telemetryService.toggleThermalBreach();
    setIsBreached(nextState);
  };

  const handleEngageAuxiliary = () => {
    telemetryService.engageAuxiliaryCooling();
    setIsBreached(false);
  };

  const handleToggleAudio = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioAlert.setMuted(nextMute);
  };

  // SVG Chart Dimensions & Math
  const chartWidth = 720;
  const chartHeight = 140;
  const minTemp = 0;
  const maxTemp = 12; // °C scale

  const getPoints = () => {
    if (history.length === 0) return '';
    return history
      .map((item, idx) => {
        const x = (idx / (history.length - 1 || 1)) * chartWidth;
        const normalizedY = (item.coreTemp - minTemp) / (maxTemp - minTemp);
        const y = chartHeight - normalizedY * chartHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const currentTemp = currentReading ? currentReading.coreTemp : 4.2;
  const currentHumidity = currentReading ? currentReading.humidity : 85;

  return (
    <div className={`p-6 rounded-2xl border transition-all ${
      isBreached
        ? 'bg-rose-50 dark:bg-[#180d12] border-rose-400 dark:border-rose-500/60 shadow-lg animate-breach-pulse'
        : 'bg-white dark:bg-[#0f1722] border-slate-200 dark:border-slate-800 shadow-xs'
    }`}>
      
      {/* Header and Controls (Matching Reference Image) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isBreached 
              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/40' 
              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20'
          }`}>
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                IoT Temperature Monitoring: Cold Storage #04
              </h2>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                isBreached 
                  ? 'bg-rose-600 text-white' 
                  : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
              }`}>
                {isBreached ? 'THERMAL BREACH' : '● Online'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sensor Node #SN-04 · Modulated Inverter Probe · Update Frequency 1.5s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute/Unmute Audio Alert */}
          <button
            onClick={handleToggleAudio}
            title={isMuted ? 'Unmute Audio Alarm' : 'Mute Audio Alarm'}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-amber-500" />}
          </button>

          {/* Simulate Thermal Breach Toggle */}
          <button
            onClick={handleToggleBreach}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm border ${
              isBreached
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{isBreached ? 'Reset Thermal Nominal' : 'Simulate Thermal Breach'}</span>
          </button>

          {isBreached && (
            <button
              onClick={handleEngageAuxiliary}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              <Power className="w-4 h-4" />
              <span>Engage Auxiliary Cold Pack</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Temperature Display + Live Line Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-5 items-center">
        
        {/* Left Column: Big Temperature (Matching Reference Image: 4.2°C, Safe Range 2°C - 8°C) */}
        <div className="space-y-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Current Temperature</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-black font-mono tracking-tight ${
              isBreached ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-900 dark:text-white'
            }`}>
              {currentTemp.toFixed(1)}°C
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Thermometer className="w-4 h-4" />
            <span>Safe Range: 2°C – 8°C</span>
          </div>
        </div>

        {/* Right Column (2 Cols): Clean Line Chart */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>Cold-Storage Continuous Variance</span>
            <span>Target Envelope: 2.0°C - 8.0°C</span>
          </div>

          <div className="w-full h-32 relative bg-slate-50 dark:bg-[#0a1017] border border-slate-200 dark:border-slate-800 rounded-xl p-2 overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Safe Range Shaded Area (2°C to 8°C) */}
              <rect
                x="0"
                y={chartHeight - ((8.0 - minTemp) / (maxTemp - minTemp)) * chartHeight}
                width={chartWidth}
                height={((8.0 - 2.0) / (maxTemp - minTemp)) * chartHeight}
                fill="#10b981"
                fillOpacity="0.08"
              />

              {/* Threshold Lines */}
              <line
                x1="0"
                y1={chartHeight - ((8.0 - minTemp) / (maxTemp - minTemp)) * chartHeight}
                x2={chartWidth}
                y2={chartHeight - ((8.0 - minTemp) / (maxTemp - minTemp)) * chartHeight}
                stroke="#ef4444"
                strokeWidth="1"
                strokeDasharray="4,4"
                strokeOpacity="0.6"
              />

              {/* Temperature Polyline */}
              <polyline
                fill="none"
                stroke={isBreached ? '#ef4444' : '#10b981'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getPoints()}
              />
            </svg>
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
            <span>18:00</span>
          </div>
        </div>

      </div>

      {/* Sensor Data Bar: Humidity, Battery SOH, Compressor Load, Door & Power Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        
        <div className="p-3 bg-slate-50 dark:bg-[#141d2a] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Humidity</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{currentHumidity.toFixed(1)}% RH</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-[#141d2a] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <BatteryCharging className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Battery SOH</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
              {(currentReading?.batterySoc || 96.0).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-[#141d2a] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isBreached 
              ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' 
              : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Compressor Duty</span>
            <span className={`text-xs font-bold font-mono ${isBreached ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {isBreached ? '18% (Overheated)' : `${currentReading?.compressorDuty || 68}% Normal`}
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-[#141d2a] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Stream Tick</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
              {currentReading?.timestamp || 'Every 2000ms'}
            </span>
          </div>
        </div>

      </div>

      {/* WebSocket / SSE Connection Heartbeat & Live Protocol Strip */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
            WS FEED: CONNECTED (18ms latency)
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600 dark:text-slate-400">ws://telemetry.agrisupply.internal:8080/v1/stream?sensor=SN-04</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>Payload: 142 B/frame</span>
          <span>·</span>
          <span className="text-slate-700 dark:text-slate-300 font-bold">Heartbeat OK</span>
        </div>
      </div>

    </div>
  );
};
