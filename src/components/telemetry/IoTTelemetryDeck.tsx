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
  ShieldCheck, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  Power
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
  const chartHeight = 160;
  const minTemp = 0;
  const maxTemp = 8; // °C scale

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

  const currentTemp = currentReading ? currentReading.coreTemp : 1.8;
  const currentHumidity = currentReading ? currentReading.humidity : 92.4;
  const compressorDuty = currentReading ? currentReading.compressorDuty : 65;
  const batterySoc = currentReading ? currentReading.batterySoc : 96;

  return (
    <div className={`p-6 rounded-2xl border transition-all ${
      isBreached
        ? 'bg-[#180d12] border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.15)] animate-breach-pulse'
        : 'bg-[#0f1722] border-slate-800 shadow-xl'
    }`}>
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isBreached ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Real-Time IoT Cold-Chain Telemetry Stream</h2>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                isBreached ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {isBreached ? 'CRITICAL THERMAL BREACH' : 'IoT STREAM LIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sensor Node #SN-804A · 2.4GHz IEEE 802.15.4 Low-Power Mesh · Probe Sample Frequency 1.5s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute/Unmute Audio Alert */}
          <button
            onClick={handleToggleAudio}
            title={isMuted ? 'Unmute Audio Alarm' : 'Mute Audio Alarm'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Simulate Thermal Breach Toggle */}
          <button
            onClick={handleToggleBreach}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-md border ${
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition border border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Power className="w-4 h-4" />
              <span>Engage Auxiliary Cold Pack</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Metrics 4-Box Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-5">
        
        {/* Core Temperature */}
        <div className={`p-4 rounded-xl border transition-colors ${
          isBreached ? 'bg-rose-950/40 border-rose-500/50' : 'bg-[#141d2a] border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Thermometer className={`w-4 h-4 ${isBreached ? 'text-rose-400' : 'text-sky-400'}`} />
              Core Pulp Temp
            </span>
            <span className="font-mono text-[10px] text-slate-500">Envelope: 0.5-2.5°C</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${
              isBreached ? 'text-rose-400 animate-pulse' : 'text-white'
            }`}>
              {currentTemp.toFixed(2)}°C
            </span>
          </div>
          <span className={`text-[10px] font-semibold mt-1 block ${
            isBreached ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {isBreached ? 'BREACH THRESHOLD EXCEEDED' : 'Normal Biological Latency'}
          </span>
        </div>

        {/* Humidity */}
        <div className="p-4 bg-[#141d2a] border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Droplets className="w-4 h-4 text-sky-400" />
              Relative Humidity
            </span>
            <span className="font-mono text-[10px] text-slate-500">Target: 90-95%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">
              {currentHumidity.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">RH</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 mt-1 block">
            Anti-Dehydration Vapor Nominal
          </span>
        </div>

        {/* Compressor Duty */}
        <div className="p-4 bg-[#141d2a] border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Cpu className="w-4 h-4 text-amber-400" />
              Compressor Duty
            </span>
            <span className="font-mono text-[10px] text-slate-500">Carrier Vector 1550</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${
              isBreached ? 'text-rose-400' : 'text-white'
            }`}>
              {compressorDuty}%
            </span>
            <span className="text-xs text-slate-400 font-mono">Load</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 mt-1 block">
            {isBreached ? 'Auxiliary Auto-Kick Armed' : 'Modulated Inverter Drive'}
          </span>
        </div>

        {/* Battery State of Health */}
        <div className="p-4 bg-[#141d2a] border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              Sensor Battery SOH
            </span>
            <span className="font-mono text-[10px] text-slate-500">LiFePO4 Cell</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">
              {batterySoc}%
            </span>
            <span className="text-xs text-slate-400 font-mono">State of Health</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 mt-1 block">
            Solar Auxiliary Assisted
          </span>
        </div>

      </div>

      {/* Live Vector SVG Waveform Curve */}
      <div className="p-4 bg-[#0a1017] border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-white flex items-center gap-2">
            <span>Continuous Thermal Envelope Waveform</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
          </span>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span> Safe Ceiling (2.5°C)
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-3 h-0.5 bg-rose-500 inline-block"></span> Critical Breach (4.0°C)
            </span>
          </div>
        </div>

        {/* Responsive SVG Chart */}
        <div className="w-full h-36 relative overflow-hidden">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Safe Zone Shading (0.5°C to 2.5°C) */}
            <rect
              x="0"
              y={chartHeight - ((2.5 - minTemp) / (maxTemp - minTemp)) * chartHeight}
              width={chartWidth}
              height={((2.5 - 0.5) / (maxTemp - minTemp)) * chartHeight}
              fill="#10b981"
              fillOpacity="0.08"
            />

            {/* Critical Threshold Line at 4.0°C */}
            <line
              x1="0"
              y1={chartHeight - ((4.0 - minTemp) / (maxTemp - minTemp)) * chartHeight}
              x2={chartWidth}
              y2={chartHeight - ((4.0 - minTemp) / (maxTemp - minTemp)) * chartHeight}
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              strokeOpacity="0.7"
            />

            {/* Safe Ceiling Line at 2.5°C */}
            <line
              x1="0"
              y1={chartHeight - ((2.5 - minTemp) / (maxTemp - minTemp)) * chartHeight}
              x2={chartWidth}
              y2={chartHeight - ((2.5 - minTemp) / (maxTemp - minTemp)) * chartHeight}
              stroke="#10b981"
              strokeWidth="1"
              strokeOpacity="0.5"
            />

            {/* Real-Time Temperature Polyline */}
            <polyline
              fill="none"
              stroke={isBreached ? '#f43f5e' : '#38bdf8'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={getPoints()}
            />

            {/* Latest Reading Indicator Dot */}
            {history.length > 0 && (() => {
              const last = history[history.length - 1]!;
              const lastX = chartWidth;
              const normalizedY = (last.coreTemp - minTemp) / (maxTemp - minTemp);
              const lastY = chartHeight - normalizedY * chartHeight;
              return (
                <circle
                  cx={lastX}
                  cy={lastY}
                  r="5"
                  fill={isBreached ? '#f43f5e' : '#38bdf8'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              );
            })()}
          </svg>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-900">
          <span>-45 Seconds Ago</span>
          <span>Buffer: 30 Rolling Telemetry Cycles</span>
          <span>Now (Live WebSocket Emulation)</span>
        </div>
      </div>

    </div>
  );
};
