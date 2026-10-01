import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Tractor, 
  Boxes, 
  Warehouse, 
  Truck, 
  Store, 
  ArrowRight, 
  Thermometer, 
  Droplets, 
  ShieldCheck, 
  Sparkles, 
  Navigation, 
  ChevronRight, 
  Flame, 
  Activity,
  CheckCircle,
  Leaf,
  Wind
} from 'lucide-react';
import { TelemetryReading } from '../../types';
import heroBannerImage from '../../assets/images/cold_chain_hero_banner_1790770710100.jpg';

interface InteractiveColdChainHeroProps {
  onNavigateTab: (tab: string) => void;
  isThermalBreachActive: boolean;
  onToggleThermalBreach: () => void;
  latestReading: TelemetryReading | null;
  batchesCount: number;
}

export const InteractiveColdChainHero: React.FC<InteractiveColdChainHeroProps> = ({
  onNavigateTab,
  isThermalBreachActive,
  onToggleThermalBreach,
  latestReading,
  batchesCount
}) => {
  const [activePipelineStep, setActivePipelineStep] = useState<number>(2); // Default on Cold Storage

  const currentTemp = latestReading 
    ? latestReading.coreTemp.toFixed(1) 
    : (isThermalBreachActive ? '4.8' : '2.8');

  const currentHumidity = latestReading 
    ? latestReading.humidity.toFixed(0) 
    : '86';

  const pipelineStages = [
    {
      id: 'farmer',
      label: 'FARM',
      sublabel: 'Harvested Farm',
      icon: Tractor,
      temp: 'Field Temp 22°C',
      color: 'emerald'
    },
    {
      id: 'pack',
      label: 'PACK',
      sublabel: 'Quality Checked',
      icon: Boxes,
      temp: 'Pre-Cool 8°C',
      color: 'teal'
    },
    {
      id: 'coldStore',
      label: 'COLD STORE',
      sublabel: '2°C - 4°C',
      icon: Warehouse,
      temp: `${currentTemp}°C Target`,
      color: isThermalBreachActive ? 'rose' : 'emerald'
    },
    {
      id: 'transit',
      label: 'TRANSIT',
      sublabel: 'Depart Fleet',
      icon: Truck,
      temp: 'Reefer 3.2°C',
      color: 'sky'
    },
    {
      id: 'retail',
      label: 'RETAIL',
      sublabel: 'On Your Table',
      icon: Store,
      temp: 'Shelf Ready',
      color: 'amber'
    }
  ];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-slate-900 group">
      
      {/* Background Hero Visual Image with Cinematic Lighting & Atmosphere */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={heroBannerImage}
          alt="Smart Agricultural Cold Chain from Farm to Urban Distribution"
          className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-102 transition-transform duration-1000 ease-out"
        />
        {/* Multilayered Atmospheric Overlays for optimal readability and contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30 dark:from-black/90 dark:via-black/75 dark:to-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/40"></div>
      </div>

      {/* Foreground Content Container */}
      <div className="relative z-10 p-5 sm:p-8 lg:p-10 flex flex-col justify-between min-h-[580px] lg:min-h-[640px] space-y-8">
        
        {/* TOP INTERACTIVE PIPELINE FLOW (Matching Reference Video) */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full"
        >
          <div className="max-w-4xl mx-auto backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border border-white/60 dark:border-slate-700/60 rounded-2xl p-2.5 sm:p-3 shadow-xl">
            <div className="flex items-center justify-between gap-1 sm:gap-3 overflow-x-auto no-scrollbar">
              {pipelineStages.map((stage, index) => {
                const Icon = stage.icon;
                const isActive = activePipelineStep === index;
                const isColdStore = stage.id === 'coldStore';

                return (
                  <React.Fragment key={stage.id}>
                    <button
                      onClick={() => {
                        setActivePipelineStep(index);
                        if (stage.id === 'farmer') onNavigateTab('farmer');
                        else if (stage.id === 'pack') onNavigateTab('farmer');
                        else if (stage.id === 'coldStore') onNavigateTab('warehouse');
                        else if (stage.id === 'transit') onNavigateTab('transporter');
                        else if (stage.id === 'retail') onNavigateTab('pipeline');
                      }}
                      className={`flex items-center gap-2 sm:gap-2.5 py-1.5 px-2.5 sm:px-3 rounded-xl transition-all text-left shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 dark:bg-emerald-500/20 text-white dark:text-emerald-300 shadow-sm border border-emerald-500/40'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}
                      title={`Inspect ${stage.label} Stage`}
                    >
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white dark:text-emerald-300'
                          : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] sm:text-xs font-black tracking-wider uppercase font-mono ${
                            isActive ? 'text-white dark:text-emerald-300' : 'text-slate-900 dark:text-white'
                          }`}>
                            {stage.label}
                          </span>
                          {isColdStore && isThermalBreachActive && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                          )}
                        </div>
                        <span className={`text-[10px] block leading-tight truncate ${
                          isActive ? 'text-emerald-100 dark:text-emerald-400/90' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {stage.sublabel}
                        </span>
                      </div>
                    </button>

                    {/* Step Connector Arrow */}
                    {index < pipelineStages.length - 1 && (
                      <div className="flex items-center text-slate-400 dark:text-slate-600 shrink-0 px-0.5">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              <div className="hidden xl:flex items-center pl-2 border-l border-slate-300 dark:border-slate-700 shrink-0">
                <span className="text-[11px] font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Leaf className="w-3 h-3" />
                  <span>Fresh Markets</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* MIDDLE SECTION: HERO HEADLINE (LEFT) & FLOATING LIVE TELEMETRY CARDS (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
          
          {/* LEFT COLUMN: HERO TEXT & VALUE PILLS */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-5"
          >
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Fresh Produce · Smart Logistics · Sustainable Future</span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] drop-shadow-md">
              From Farm to Future <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">
                Freshness, Guaranteed.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-200 font-medium max-w-xl leading-relaxed drop-shadow-sm">
              AgriSupply Grain & Smart Cold Chain Logistics Platform connecting remote harvest fields, automated cold-storage hubs, and urban fresh markets with sub-degree temperature control and cryptographic provenance.
            </p>

            {/* Action Group: CTA + Breach Simulation Button */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigateTab('pipeline')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-95 group/btn cursor-pointer"
              >
                <span>Explore Our Platform</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </button>

              <button
                onClick={onToggleThermalBreach}
                className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer backdrop-blur-md border ${
                  isThermalBreachActive
                    ? 'bg-rose-600/90 text-white border-rose-400 animate-breach-pulse'
                    : 'bg-white/15 hover:bg-white/25 text-white border-white/30'
                }`}
                title="Simulate a real-time thermal excursion (>4.0°C) across the cold-chain"
              >
                <Flame className={`w-4 h-4 ${isThermalBreachActive ? 'animate-bounce' : 'text-amber-400'}`} />
                <span>{isThermalBreachActive ? 'Breach Active (>4.0°C)' : 'Simulate Thermal Breach'}</span>
              </button>
            </div>

            {/* Feature Badges Row (Matching Reference Video) */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span>Less Food Waste</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Best Quality</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>Always Fresh Food</span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: FLOATING LIVE TELEMETRY CARDS (Directly Overlaid like in Video) */}
          <div className="lg:col-span-5 flex flex-col items-end space-y-4">
            
            {/* FLOATING CARD 1: Cold Storage & Core Sensor Beacon */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: [0, -6, 0] }}
              transition={{ 
                opacity: { duration: 0.6, delay: 0.2 },
                y: { repeat: Infinity, duration: 4.5, ease: 'easeInOut' }
              }}
              className="w-full max-w-sm backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border border-white/60 dark:border-slate-700/80 rounded-2xl p-4 shadow-2xl relative"
            >
              {/* Corner Ping Beacon */}
              <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isThermalBreachActive ? 'bg-rose-500' : 'bg-emerald-500'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-4 w-4 ${
                  isThermalBreachActive ? 'bg-rose-600' : 'bg-emerald-500'
                }`}></span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isThermalBreachActive ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Cold Storage Chamber #4
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      Standard Envelope: 2°C - 4°C
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  isThermalBreachActive 
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {isThermalBreachActive ? 'CRITICAL EXCURSION' : 'NOMINAL'}
                </span>
              </div>

              {/* 3 Telemetry Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-3 text-center">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-mono">Core Temp</span>
                  <span className={`text-base font-black font-mono ${
                    isThermalBreachActive ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {currentTemp}°C
                  </span>
                </div>

                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-mono">Humidity</span>
                  <span className="text-base font-black font-mono text-slate-800 dark:text-slate-200">
                    {currentHumidity}%
                  </span>
                </div>

                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-mono">Quality</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {isThermalBreachActive ? 'At Risk' : 'Optimal'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* FLOATING CARD 2: Live Fleet Tracking Reefer Vehicle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: [0, -5, 0] }}
              transition={{ 
                opacity: { duration: 0.6, delay: 0.35 },
                y: { repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 0.5 }
              }}
              onClick={() => onNavigateTab('transporter')}
              className="w-full max-w-sm backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border border-white/60 dark:border-slate-700/80 rounded-2xl p-4 shadow-2xl hover:border-sky-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Live Fleet Tracking
                      </h4>
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      Truck TRK-024 (Reefer Unit)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black font-mono text-sky-600 dark:text-sky-400 block">
                    25.1 km
                  </span>
                  <span className="text-[10px] text-slate-400">to Retail Hub</span>
                </div>
              </div>

              {/* Transit Route Progress Line */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-sky-500" />
                  <span>Speed: 64 km/h</span>
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Reefer: 3.2°C Locked
                </span>
              </div>
            </motion.div>

          </div>

        </div>

        {/* BOTTOM METRIC STRIP (Single Line Highlights) */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{batchesCount} Batches Actively Managed</span>
            </span>
            <span>·</span>
            <span>PSQCA & GlobalGAP Standards Verified</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Autonomous ColdGuard Telemetry Stream:</span>
            <span className="text-emerald-300 font-bold">ACTIVE (2000ms)</span>
          </div>
        </div>

      </div>

    </div>
  );
};
