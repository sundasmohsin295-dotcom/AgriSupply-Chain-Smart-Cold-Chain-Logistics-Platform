import React, { useState, useEffect } from 'react';
import { ReeferVehicle, GeofenceZone, GeofenceCoordinate } from '../../types';
import { GEOFENCE_ZONES, INITIAL_REEFERS } from '../../lib/constants';
import { calculateHaversineDistance, evaluateVehicleGeofences, interpolateRouteCoordinate } from '../../lib/geofence';
import { 
  Truck, 
  MapPin, 
  Compass, 
  Gauge, 
  ShieldAlert, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Radio, 
  AlertTriangle,
  ArrowUpRight,
  Navigation,
  Clock,
  Thermometer,
  ShieldCheck,
  User,
  ArrowRight
} from 'lucide-react';

interface TransporterModuleProps {
  onAcknowledgeBreach?: () => void;
}

export const TransporterModule: React.FC<TransporterModuleProps> = () => {
  const [reefers, setReefers] = useState<ReeferVehicle[]>(INITIAL_REEFERS);
  const [selectedReeferId, setSelectedReeferId] = useState<string>('TRK-024');
  const [isPlayingSimulation, setIsPlayingSimulation] = useState<boolean>(true);
  const [routeProgress, setRouteProgress] = useState<number>(68); // %
  const [manualGeofenceBreach, setManualGeofenceBreach] = useState<boolean>(false);

  const selectedReefer = reefers.find((r) => r.id === selectedReeferId) || reefers[0]!;

  // Waypoints from Farm to Central Hub
  const ROUTE_WAYPOINTS: GeofenceCoordinate[] = [
    { lat: 28.4595, lng: 76.9950 }, // Farm (Haryana)
    { lat: 28.5200, lng: 77.0600 }, // Gurgaon Corridor
    { lat: 28.5800, lng: 77.1200 }, // Airport Outer Ring
    { lat: 28.6139, lng: 77.2090 }  // Delhi Central Warehouse
  ];

  const calculateCurrentPosition = (progressPct: number): GeofenceCoordinate => {
    if (manualGeofenceBreach) {
      return { lat: 28.7500, lng: 77.4000 }; // off-corridor
    }

    const totalSegments = ROUTE_WAYPOINTS.length - 1;
    const scaledProgress = (progressPct / 100) * totalSegments;
    const segmentIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1);
    const segmentFraction = scaledProgress - segmentIndex;

    const start = ROUTE_WAYPOINTS[segmentIndex]!;
    const end = ROUTE_WAYPOINTS[segmentIndex + 1]!;

    return interpolateRouteCoordinate(start, end, segmentFraction);
  };

  useEffect(() => {
    if (!isPlayingSimulation) return;

    const interval = setInterval(() => {
      setRouteProgress((prev) => {
        const next = prev >= 100 ? 10 : prev + 1.2;
        return Number(next.toFixed(1));
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlayingSimulation]);

  const currentPos = calculateCurrentPosition(routeProgress);
  const geofenceEval = evaluateVehicleGeofences(currentPos, GEOFENCE_ZONES);

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-300 dark:border-sky-500/20 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Live Fleet Geo-Tracking & Geofence Engine</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active GPS telemetry streaming, boundary alert triggers, and reefer compressor diagnostics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlayingSimulation(!isPlayingSimulation)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              isPlayingSimulation
                ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-500/30'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
            }`}
          >
            {isPlayingSimulation ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlayingSimulation ? 'GPS Stream Active' : 'GPS Stream Paused'}</span>
          </button>

          <button
            onClick={() => setManualGeofenceBreach(!manualGeofenceBreach)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              manualGeofenceBreach
                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/50 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>{manualGeofenceBreach ? 'Clear Route Breach' : 'Simulate Off-Route Deviation'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left) + Driver Telematics HUD (Right) - Matching Reference Image */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Satellite / Vector Map Container */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Satellite Dispatch Corridor: {selectedReefer.originName} → {selectedReefer.destinationName}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              SIMULATION MODE · GPS Stream 1.5s
            </span>
          </div>

          {/* SVG Map Canvas */}
          <div className="w-full h-80 sm:h-96 relative bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
            
            {/* Topographic Background Simulation */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <svg viewBox="0 0 800 500" className="w-full h-full select-none">
              
              {/* Route Road Line */}
              <path
                d="M 120,400 Q 280,320 440,240 T 680,100"
                fill="none"
                stroke="#334155"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 120,400 Q 280,320 440,240 T 680,100"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="6,4"
              />

              {/* Origin Farm Zone Circle */}
              <circle cx="120" cy="400" r="45" fill="#10b981" fillOpacity="0.12" stroke="#10b981" strokeWidth="1.5" />
              <text x="120" y="420" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">
                {selectedReefer.originName}
              </text>

              {/* Destination Geofence Alert Circle (Entered Delivery Zone - Matching Reference Image!) */}
              <circle cx="680" cy="100" r="75" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" />
              <text x="680" y="65" fill="#ef4444" fontSize="11" fontWeight="bold" textAnchor="middle">
                Geofence Alert: Entered Delivery Zone
              </text>
              <text x="680" y="125" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                {selectedReefer.destinationName}
              </text>

              {/* Truck Icon and Marker */}
              {(() => {
                let vx = 120 + ((routeProgress / 100) * 560);
                let vy = 400 - ((routeProgress / 100) * 300);
                if (manualGeofenceBreach) {
                  vx = 340;
                  vy = 100;
                }

                return (
                  <g>
                    {/* Pulsing ring */}
                    <circle cx={vx} cy={vy} r="20" fill="none" stroke={manualGeofenceBreach ? '#ef4444' : '#38bdf8'} strokeWidth="2" className="animate-ping origin-center" />
                    
                    {/* Vehicle Node */}
                    <circle cx={vx} cy={vy} r="9" fill={manualGeofenceBreach ? '#ef4444' : '#0284c7'} stroke="#ffffff" strokeWidth="2.5" />

                    {/* Popup Pill */}
                    <rect x={vx - 60} y={vy - 36} width="120" height="22" rx="6" fill="#0f1722" stroke={manualGeofenceBreach ? '#ef4444' : '#0284c7'} strokeWidth="1" />
                    <text x={vx} y={vy - 21} fill="#ffffff" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      {selectedReefer.id} · {selectedReefer.speedKmh} km/h · {selectedReefer.reeferTemp}°C
                    </text>
                  </g>
                );
              })()}

            </svg>

            {/* Geofence Legend Bar at bottom of map */}
            <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur border border-slate-700 p-2.5 rounded-xl flex items-center justify-between text-[11px] text-white font-mono">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-emerald-500 inline-block"></span> Truck Route
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40 border border-rose-500 inline-block"></span> Geofence Zone
                </span>
                <span className="flex items-center gap-1.5 text-sky-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span> Current Location
                </span>
              </div>

              <span className="text-amber-400 font-bold">Progress: {routeProgress}%</span>
            </div>

          </div>

          {/* Interactive Progress Slider */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Progress:</span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={routeProgress}
              onChange={(e) => setRouteProgress(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white w-12 text-right">{routeProgress}%</span>
          </div>

        </div>

        {/* Right Column: Driver Telematics HUD (Matching Reference Image) */}
        <div className="space-y-4">
          
          <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
            
            {/* Truck ID & Driver */}
            <div className="space-y-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400 block uppercase">Truck ID</span>
                  <span className="text-base font-black font-mono text-slate-900 dark:text-white">{selectedReefer.id}</span>
                </div>
                <span className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Truck className="w-5 h-5" />
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" /> Driver
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedReefer.driverName}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-500" /> Current Location
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                  {currentPos.lat.toFixed(4)}° N, {currentPos.lng.toFixed(4)}° E
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-amber-500" /> Speed
                </span>
                <span className="font-mono text-slate-900 dark:text-white font-bold">{selectedReefer.speedKmh} km/h</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-emerald-500" /> Temperature
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  {selectedReefer.reeferTemp}°C <span className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">Normal</span>
                </span>
              </div>
            </div>

            {/* Route Progress Dots (Matching Reference Image) */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Route Progression</span>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>● {selectedReefer.originName}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-emerald-700 dark:text-emerald-400">● {selectedReefer.destinationName}</span>
              </div>
            </div>

            {/* Status Checklist Box (Matching Reference Image) */}
            <div className="p-3 bg-slate-50 dark:bg-[#0a1017] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Estimated Transit ETA:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{selectedReefer.etaMinutes} mins (2h 30m)</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Location Updated:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">2 min ago</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Geofence Status:</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">Entered Zone</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
