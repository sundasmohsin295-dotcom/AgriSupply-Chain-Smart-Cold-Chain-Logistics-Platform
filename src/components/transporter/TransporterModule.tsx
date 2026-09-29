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
  Navigation
} from 'lucide-react';

interface TransporterModuleProps {
  onAcknowledgeBreach?: () => void;
}

export const TransporterModule: React.FC<TransporterModuleProps> = () => {
  const [reefers, setReefers] = useState<ReeferVehicle[]>(INITIAL_REEFERS);
  const [selectedReeferId, setSelectedReeferId] = useState<string>('REEFER-TRK-804');
  const [isPlayingSimulation, setIsPlayingSimulation] = useState<boolean>(true);
  const [routeProgress, setRouteProgress] = useState<number>(58); // %
  const [manualGeofenceBreach, setManualGeofenceBreach] = useState<boolean>(false);

  const selectedReefer = reefers.find((r) => r.id === selectedReeferId) || reefers[0]!;

  // Route Waypoints: Salinas Farm -> Gilroy Depot -> San Jose Hub -> SF Distribution Center
  const ROUTE_WAYPOINTS: GeofenceCoordinate[] = [
    { lat: 36.6777, lng: -121.6555 }, // Salinas Farm (0%)
    { lat: 36.8500, lng: -121.6000 }, // Pajaro Pass
    { lat: 37.0058, lng: -121.5683 }, // Gilroy Intermodal (35%)
    { lat: 37.1950, lng: -121.7200 }, // Morgan Hill
    { lat: 37.3382, lng: -121.8863 }, // San Jose Cold Hub (70%)
    { lat: 37.5500, lng: -122.1000 }, // Bay Crossing
    { lat: 37.7749, lng: -122.4194 }  // SF Urban Distribution (100%)
  ];

  // Calculate current location along polyline
  const calculateCurrentPosition = (progressPct: number): GeofenceCoordinate => {
    if (manualGeofenceBreach) {
      // Offset vehicle coordinate outside highway corridor into mountain zone
      return { lat: 37.2800, lng: -121.4500 };
    }

    const totalSegments = ROUTE_WAYPOINTS.length - 1;
    const scaledProgress = (progressPct / 100) * totalSegments;
    const segmentIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1);
    const segmentFraction = scaledProgress - segmentIndex;

    const start = ROUTE_WAYPOINTS[segmentIndex]!;
    const end = ROUTE_WAYPOINTS[segmentIndex + 1]!;

    return interpolateRouteCoordinate(start, end, segmentFraction);
  };

  // Continuous background GPS coordinate streaming simulation
  useEffect(() => {
    if (!isPlayingSimulation) return;

    const interval = setInterval(() => {
      setRouteProgress((prev) => {
        const next = prev >= 100 ? 5 : prev + 1.2;
        return Number(next.toFixed(1));
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlayingSimulation]);

  // Update reefer coordinates and geofence evaluation on route progress
  const currentPos = calculateCurrentPosition(routeProgress);
  const geofenceEval = evaluateVehicleGeofences(currentPos, GEOFENCE_ZONES);

  const destinationZone = GEOFENCE_ZONES[3]!; // SF Urban Distribution
  const distanceToDestMeters = calculateHaversineDistance(currentPos, destinationZone.center);
  const distanceToDestKm = (distanceToDestMeters / 1000).toFixed(1);
  const calculatedEtaMinutes = Math.max(1, Math.round(Number(distanceToDestKm) * 0.9));

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-[#0f1722] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Fleet Geofencing & Live Telematics Engine</h1>
            <p className="text-xs text-slate-400">
              Active GPS satellite tracking, automated perimeter arrival triggers, and route deviation monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlayingSimulation(!isPlayingSimulation)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              isPlayingSimulation
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {isPlayingSimulation ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlayingSimulation ? 'GPS Streaming Active' : 'GPS Stream Paused'}</span>
          </button>

          <button
            onClick={() => setManualGeofenceBreach(!manualGeofenceBreach)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              manualGeofenceBreach
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{manualGeofenceBreach ? 'Clear Route Breach' : 'Simulate Off-Route Deviation'}</span>
          </button>
        </div>
      </div>

      {/* Reefer Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reefers.map((r) => {
          const isSelected = selectedReeferId === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedReeferId(r.id)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-sky-400/10 border-sky-400 text-white shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                  : 'bg-[#0f1722] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs text-white">{r.id}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  r.status === 'EN_ROUTE' ? 'bg-emerald-500/20 text-emerald-400' :
                  r.status === 'PERIMETER_APPROACH' ? 'bg-amber-400/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {r.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="text-xs text-slate-300 font-semibold truncate mb-1">
                {r.cargoDescription}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                <span>Driver: {r.driverName.split(' ')[0]}</span>
                <span className="text-sky-400 font-bold">{r.reeferTemp}°C (Set {r.targetTemp}°C)</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Vector Geo-Map & Telemetry HUD Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Vector SVG Interactive Map Canvas */}
        <div className="lg:col-span-2 bg-[#0f1722] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-4 z-10">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                California Cold-Chain Transit Corridor (SVG Vector Telematics)
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Scale: 1:1,500,000 · High-Res Orthographic Projection
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="w-full h-80 sm:h-96 relative bg-[#090e15] border border-slate-800/80 rounded-xl overflow-hidden flex items-center justify-center">
            
            {/* Subtle Map Grid Lines */}
            <svg className="absolute inset-0 w-full h-full stroke-slate-800/30" strokeWidth="0.5">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Main Interactive Vector Map */}
            <svg viewBox="0 0 800 500" className="w-full h-full select-none">
              
              {/* Regional Terrain Background Contours */}
              <path
                d="M 50,450 Q 200,380 400,320 T 750,150"
                fill="none"
                stroke="#1e293b"
                strokeWidth="32"
                strokeLinecap="round"
                className="opacity-40"
              />

              {/* Highway Corridor (Interstate-5 / Route 101) */}
              <path
                d="M 120,420 Q 260,340 380,260 T 680,80"
                fill="none"
                stroke="#334155"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M 120,420 Q 260,340 380,260 T 680,80"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray="4,4"
              />

              {/* Geofence Boundary Circles */}
              {/* 1. Salinas Valley Harvest Intake */}
              <circle cx="120" cy="420" r="48" fill="#10b981" fillOpacity="0.08" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" />
              <text x="120" y="440" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">Salinas Farm Origin (1.8km)</text>

              {/* 2. Gilroy Intermodal Cold Bay */}
              <circle cx="280" cy="320" r="38" fill="#38bdf8" fillOpacity="0.08" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,3" />
              <text x="280" y="340" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">Gilroy Cold Bay (1.2km)</text>

              {/* 3. San Jose Cold Storage Hub */}
              <circle cx="460" cy="210" r="54" fill="#f59e0b" fillOpacity="0.08" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" />
              <text x="460" y="235" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">Silicon Valley Cold Hub (2.2km)</text>

              {/* 4. SF Bay Urban Distribution Center */}
              <circle cx="680" cy="80" r="62" fill="#8b5cf6" fillOpacity="0.08" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3,3" />
              <text x="680" y="105" fill="#8b5cf6" fontSize="10" fontWeight="bold" textAnchor="middle">SF Urban DC Hub (2.5km)</text>

              {/* Real-Time Reefer Vehicle Position */}
              {(() => {
                // Compute SVG coordinate based on routeProgress or deviation
                let vx = 120 + ((routeProgress / 100) * 560);
                let vy = 420 - ((routeProgress / 100) * 340);
                if (manualGeofenceBreach) {
                  vx = 360;
                  vy = 120; // Off-corridor
                }

                return (
                  <g>
                    {/* Radar Pulse Ring */}
                    <circle
                      cx={vx}
                      cy={vy}
                      r="16"
                      fill="none"
                      stroke={manualGeofenceBreach ? '#ef4444' : '#38bdf8'}
                      strokeWidth="2"
                      className="animate-ping origin-center"
                    />

                    {/* Vehicle Core Dot */}
                    <circle
                      cx={vx}
                      cy={vy}
                      r="7"
                      fill={manualGeofenceBreach ? '#ef4444' : '#38bdf8'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* Vehicle Label Tag */}
                    <rect
                      x={vx - 50}
                      y={vy - 32}
                      width="100"
                      height="20"
                      rx="4"
                      fill="#0f1722"
                      stroke={manualGeofenceBreach ? '#ef4444' : '#38bdf8'}
                      strokeWidth="1"
                    />
                    <text
                      x={vx}
                      y={vy - 18}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {selectedReefer.id} · {selectedReefer.reeferTemp}°C
                    </text>
                  </g>
                );
              })()}

            </svg>

            {/* Boundary Alert Overlay Pill */}
            <div className="absolute bottom-4 left-4 right-4 bg-[#0a1017]/90 backdrop-blur border border-slate-800 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {manualGeofenceBreach ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-breach-pulse"></span>
                ) : geofenceEval.isInside ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-telemetry-pulse"></span>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                )}
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {manualGeofenceBreach ? (
                      <span className="text-rose-400 flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4" /> Off-Corridor Geofence Breach Triggered
                      </span>
                    ) : geofenceEval.isInside ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Inside {geofenceEval.nearestZone?.name} Boundary
                      </span>
                    ) : (
                      <span className="text-sky-300">
                        Approaching {geofenceEval.nearestZone?.name} ({geofenceEval.distanceMeters}m to perimeter)
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Auto-Checkin Protocol: {geofenceEval.isInside ? 'Triggered at bay intake gate' : 'Armed & standing by'}
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-300">
                <span>Route Progress:</span>
                <span className="text-amber-400 font-bold">{routeProgress}%</span>
              </div>
            </div>
          </div>

          {/* Interactive Route Slider */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-4">
            <span className="text-xs text-slate-400 whitespace-nowrap">Simulate Route Progress:</span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={routeProgress}
              onChange={(e) => setRouteProgress(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <span className="font-mono text-xs font-bold text-white w-12 text-right">{routeProgress}%</span>
          </div>
        </div>

        {/* Live Vehicle Telematics Diagnostics HUD */}
        <div className="space-y-4">
          
          {/* Main Telematics Card */}
          <div className="bg-[#0f1722] border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold">{selectedReefer.id}</span>
                <h3 className="text-sm font-bold text-white">Reefer Telematics Core</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                Plate: {selectedReefer.licensePlate}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#131c28] border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-mono mb-1">Ground Speed</span>
                <div className="flex items-baseline gap-1 text-white font-mono font-bold text-lg">
                  <Gauge className="w-4 h-4 text-sky-400" />
                  <span>{selectedReefer.speedKmh}</span>
                  <span className="text-xs text-slate-400 font-normal">km/h</span>
                </div>
              </div>

              <div className="p-3 bg-[#131c28] border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-mono mb-1">Compass Heading</span>
                <div className="flex items-baseline gap-1 text-white font-mono font-bold text-lg">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>{selectedReefer.headingDegrees}°</span>
                  <span className="text-xs text-slate-400 font-normal">NNW</span>
                </div>
              </div>

              <div className="p-3 bg-[#131c28] border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-mono mb-1">Cargo Cold Core</span>
                <div className="flex items-baseline gap-1 text-emerald-400 font-mono font-bold text-lg">
                  <span>{selectedReefer.reeferTemp}°C</span>
                  <span className="text-[10px] text-slate-400 font-normal">(±0.2)</span>
                </div>
              </div>

              <div className="p-3 bg-[#131c28] border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-mono mb-1">Battery Health</span>
                <div className="flex items-baseline gap-1 text-white font-mono font-bold text-lg">
                  <span>{selectedReefer.batteryHealthPercent}%</span>
                  <span className="text-xs text-slate-400 font-normal">SOH</span>
                </div>
              </div>
            </div>

            {/* Distance & ETA */}
            <div className="p-4 bg-[#141d2a] border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-sky-400" /> Destination
                </span>
                <span className="text-white font-bold truncate max-w-[160px] text-right">
                  SF Urban DC
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Haversine Distance:</span>
                <span className="font-mono text-white font-bold">{distanceToDestKm} km</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Dynamic Arrival ETA:</span>
                <span className="font-mono text-amber-400 font-bold">~{calculatedEtaMinutes} mins</span>
              </div>
            </div>

            {/* GPS Raw Coordinates */}
            <div className="p-3 bg-[#0a1017] border border-slate-800 rounded-xl space-y-1 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>GPS Latitude:</span>
                <span className="text-slate-200">{currentPos.lat.toFixed(6)}° N</span>
              </div>
              <div className="flex justify-between">
                <span>GPS Longitude:</span>
                <span className="text-slate-200">{currentPos.lng.toFixed(6)}° W</span>
              </div>
              <div className="flex justify-between">
                <span>Container Door:</span>
                <span className="text-emerald-400 font-bold">SEALED (Sensors Armed)</span>
              </div>
            </div>

          </div>

          {/* Fleet Transport Hero Card */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 group">
            <img
              src="/src/assets/images/hero_coldchain_fleet_1790684154978.jpg"
              alt="Cold-Chain Transport Reefer Fleet"
              referrerPolicy="no-referrer"
              className="w-full h-36 object-cover brightness-90 group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end p-4">
              <div className="text-[11px]">
                <span className="text-amber-400 font-bold block">Pacific Cold-Link Carrier Network</span>
                <span className="text-slate-300">Direct autonomous telemetry integration to California ports</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
