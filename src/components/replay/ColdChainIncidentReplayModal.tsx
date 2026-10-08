import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Thermometer, 
  Droplets, 
  Truck, 
  MapPin, 
  AlertTriangle, 
  Flame, 
  ShieldCheck, 
  Clock, 
  Warehouse, 
  Activity, 
  CheckCircle2, 
  ExternalLink,
  Info
} from 'lucide-react';
import { audioAlert } from '../../lib/audioAlert';

interface ReplayStep {
  stepNumber: number;
  time: string;
  title: string;
  location: string;
  stage: string;
  coreTempC: number;
  humidityPercent: number;
  ambientTempC: number;
  status: 'SAFE' | 'WARNING' | 'BREACH';
  summary: string;
  operationalAction: string;
  coordinates: { lat: number; lng: number };
}

const REPLAY_STEPS: ReplayStep[] = [
  {
    stepNumber: 1,
    time: '08:30 AM',
    title: 'Harvest Pre-Cooling & Batch Registration',
    location: 'Tariq Mansoor Farm, Multan Sector A-4',
    stage: 'PRE_COOLING',
    coreTempC: 3.2,
    humidityPercent: 90.0,
    ambientTempC: 24.5,
    status: 'SAFE',
    summary: 'Batch #ASG-001 harvested and pre-cooled to 3.2°C with forced-air cooling. Loaded into Reefer TRK-024.',
    operationalAction: 'Quality inspector verified Grade-A export status. Digital cryptographic seal generated.',
    coordinates: { lat: 29.9715, lng: 71.4930 }
  },
  {
    stepNumber: 2,
    time: '10:15 AM',
    title: 'Departure on N-5 Highway Corridor',
    location: 'Multan Toll Plaza (N-5 Highway)',
    stage: 'IN_TRANSIT',
    coreTempC: 3.4,
    humidityPercent: 88.5,
    ambientTempC: 31.0,
    status: 'SAFE',
    summary: 'Reefer vehicle departs for Lahore Central Terminal. Telematics locked at 68 km/h.',
    operationalAction: 'Compressor duty operating nominal at 68%. Geofence perimeter departure logged.',
    coordinates: { lat: 30.2850, lng: 72.3120 }
  },
  {
    stepNumber: 3,
    time: '11:45 AM',
    title: 'Thermal Warning: Heatwave Stress',
    location: 'Sahiwal Bypass Corridor',
    stage: 'WARNING_DETECTED',
    coreTempC: 4.5,
    humidityPercent: 84.0,
    ambientTempC: 38.5,
    status: 'WARNING',
    summary: 'External ambient temperature surges to 38.5°C. Reefer cargo air crosses safe target limit into 4.5°C.',
    operationalAction: 'Telematics engine issues automated Warning notification to driver & logistics dispatch.',
    coordinates: { lat: 30.6682, lng: 73.1114 }
  },
  {
    stepNumber: 4,
    time: '12:20 PM',
    title: 'Critical Cold-Chain Breach: Belt Slip',
    location: 'Okara District Transit Mile 142',
    stage: 'CRITICAL_BREACH',
    coreTempC: 6.8,
    humidityPercent: 78.0,
    ambientTempC: 40.2,
    status: 'BREACH',
    summary: 'Refrigeration unit encounters compressor slippage. Cargo temp spikes to 6.8°C (+2.8°C excursion).',
    operationalAction: 'INCIDENT #INC-894 auto-created. Audible cabin buzzer triggered. Divert protocol flagged.',
    coordinates: { lat: 30.8100, lng: 73.4500 }
  },
  {
    stepNumber: 5,
    time: '12:28 PM',
    title: 'Operator Intervention: Auxiliary Cooling',
    location: 'Okara Service Station',
    stage: 'INTERVENTION_ENGAGED',
    coreTempC: 5.4,
    humidityPercent: 82.5,
    ambientTempC: 39.0,
    status: 'WARNING',
    summary: 'Driver halts vehicle. Auxiliary eutectic cold pack engaged and secondary diesel generator started.',
    operationalAction: 'Driver acknowledges incident via mobile portal. Auxiliary cooling pulls down temperature.',
    coordinates: { lat: 30.9500, lng: 73.6500 }
  },
  {
    stepNumber: 6,
    time: '01:10 PM',
    title: 'Rapid Pull-Down: Envelope Restored',
    location: 'Pattoki Agro Exchange Hub',
    stage: 'ENVELOPE_RESTORED',
    coreTempC: 3.1,
    humidityPercent: 89.0,
    ambientTempC: 34.0,
    status: 'SAFE',
    summary: 'Cargo temperature successfully pulled down below 3.5°C. Total excursion limited to 22 mins.',
    operationalAction: 'Incident status marked INVESTIGATING. Spoilage risk averted (RSL preserved at 94%).',
    coordinates: { lat: 31.1850, lng: 73.8500 }
  },
  {
    stepNumber: 7,
    time: '02:45 PM',
    title: 'Arrival & Cold Bay Docking at Terminal',
    location: 'Lahore Central Terminal Depository',
    stage: 'DELIVERED_SECURE',
    coreTempC: 2.8,
    humidityPercent: 91.0,
    ambientTempC: 29.5,
    status: 'SAFE',
    summary: 'Reefer arrives safely at Bay #02. Digital bill of lading verified against SHA-256 blockchain seal.',
    operationalAction: 'Produce cleared by warehouse admin. Received into temperature-controlled storage room.',
    coordinates: { lat: 31.5204, lng: 74.3587 }
  }
];

interface ColdChainIncidentReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId?: string;
}

export const ColdChainIncidentReplayModal: React.FC<ColdChainIncidentReplayModalProps> = ({
  isOpen,
  onClose,
  batchId = '#ASG-001'
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const currentStep = REPLAY_STEPS[currentStepIndex] || REPLAY_STEPS[0]!;

  // Handle auto-play
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < REPLAY_STEPS.length - 1) {
          const next = prev + 1;
          // Play alert chime if next step is breach
          if (REPLAY_STEPS[next]?.status === 'BREACH') {
            audioAlert.playBreachAlarm();
          }
          return next;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, 3200);

    return () => clearInterval(timer);
  }, [isPlaying]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < REPLAY_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      if (REPLAY_STEPS[nextIndex]?.status === 'BREACH') {
        audioAlert.playBreachAlarm();
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const getStatusBadge = (status: ReplayStep['status']) => {
    switch (status) {
      case 'SAFE':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>SAFE (0°C – 4°C)</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>WARNING (&gt;4.0°C)</span>
          </span>
        );
      case 'BREACH':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1.5 animate-pulse">
            <Flame className="w-3.5 h-3.5 text-red-600" />
            <span>CRITICAL BREACH</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Cold-Chain Incident Replay Studio
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                  {batchId}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  DETERMINISTIC SIMULATION
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Step-by-step forensic reconstruction of cargo telemetry, thermal breach excursion, and intervention recovery.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="Close Replay Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1">
          
          {/* Step Timeline Progress Scrubber */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span>Timeline Progress: Step {currentStep.stepNumber} of {REPLAY_STEPS.length}</span>
              <span className="font-bold text-slate-800">{currentStep.time}</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {REPLAY_STEPS.map((step, idx) => {
                const isCurrent = idx === currentStepIndex;
                const isPast = idx < currentStepIndex;

                let stepColor = 'bg-slate-200 text-slate-600';
                if (step.status === 'BREACH') {
                  stepColor = isCurrent ? 'bg-red-600 text-white ring-2 ring-red-400' : isPast ? 'bg-red-200 text-red-800' : 'bg-slate-100 text-slate-400';
                } else if (step.status === 'WARNING') {
                  stepColor = isCurrent ? 'bg-amber-500 text-white ring-2 ring-amber-300' : isPast ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-400';
                } else {
                  stepColor = isCurrent ? 'bg-emerald-600 text-white ring-2 ring-emerald-300' : isPast ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-400';
                }

                return (
                  <button
                    key={step.stepNumber}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStepIndex(idx);
                      if (step.status === 'BREACH') audioAlert.playBreachAlarm();
                    }}
                    className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center justify-center gap-1 ${stepColor} hover:opacity-90`}
                  >
                    <span className="text-[10px] font-mono font-bold leading-none">{step.time.split(' ')[0]}</span>
                    <span className="text-[11px] font-bold leading-none hidden sm:inline">#{step.stepNumber}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Visualizer: Left Telemetry Card + Right Operational Narrative */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Left Telemetry Gauge Card (5 cols) */}
            <div className={`md:col-span-5 p-5 rounded-2xl border transition-all ${
              currentStep.status === 'BREACH'
                ? 'bg-red-50 border-red-300 shadow-sm'
                : currentStep.status === 'WARNING'
                ? 'bg-amber-50 border-amber-300'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold uppercase text-slate-500">Sensor Telemetry</span>
                {getStatusBadge(currentStep.status)}
              </div>

              {/* Big Core Temperature Reading */}
              <div className="text-center py-3">
                <div className="inline-flex items-center gap-1.5">
                  <Thermometer className={`w-8 h-8 ${
                    currentStep.status === 'BREACH'
                      ? 'text-red-600 animate-bounce'
                      : currentStep.status === 'WARNING'
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`} />
                  <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
                    currentStep.status === 'BREACH'
                      ? 'text-red-700'
                      : currentStep.status === 'WARNING'
                      ? 'text-amber-700'
                      : 'text-slate-900'
                  }`}>
                    {currentStep.coreTempC.toFixed(1)}°C
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono block mt-1">
                  Target Safe Limit: 0.0°C – 4.0°C
                </span>
              </div>

              {/* Secondary Sensor Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-200/80 text-xs font-mono">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">Relative Humidity</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-500" />
                    <span>{currentStep.humidityPercent.toFixed(1)}% RH</span>
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase">Ambient Exterior</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                    <span>{currentStep.ambientTempC.toFixed(1)}°C</span>
                  </span>
                </div>
              </div>

              {/* Geographical Coordinates Fix */}
              <div className="mt-3 p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2 text-[11px] font-mono text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="truncate">Fix: {currentStep.coordinates.lat.toFixed(4)}°N, {currentStep.coordinates.lng.toFixed(4)}°E</span>
              </div>
            </div>

            {/* Right Operational Narrative & Incident Log (7 cols) */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Timestamp: {currentStep.time}</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    STAGE: {currentStep.stage}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {currentStep.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Truck className="w-4 h-4 text-sky-600" />
                  <span>{currentStep.location}</span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                  <p className="font-medium">{currentStep.summary}</p>
                </div>

                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[11px] uppercase tracking-wide text-emerald-800">
                      Standard Operating Procedure (SOP)
                    </span>
                    <p className="mt-0.5 leading-snug">{currentStep.operationalAction}</p>
                  </div>
                </div>
              </div>

              {/* Regulatory Integrity Note */}
              <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>Protocol: FIPS 180-4 / FSMA 204</span>
                <span className="text-emerald-600 font-bold">SHA-256 Ledger Witnessed</span>
              </div>
            </div>

          </div>

          {/* Interactive Playback Control Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Restart Replay"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
                title="Previous Step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs flex items-center gap-1.5 transition text-white shadow-xs"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause Simulation' : 'Auto Play Journey'}</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentStepIndex === REPLAY_STEPS.length - 1}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
                title="Next Step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>{isPlaying ? 'Simulation Running' : 'Manual Stepper'}</span>
              </span>
              <span>·</span>
              <span>Total Corridor Time: 6h 15m</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Demonstrates complete lifecycle from farm dispatch, sensor breach, intervention, to recovery.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
          >
            Close Replay
          </button>
        </div>

      </div>
    </div>
  );
};
