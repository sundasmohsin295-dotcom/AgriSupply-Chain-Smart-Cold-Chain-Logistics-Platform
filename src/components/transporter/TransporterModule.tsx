import React, { useState, useEffect } from 'react';
import { ReeferVehicle, GeofenceZone, GeofenceCoordinate, RouteWeatherCondition } from '../../types';
import { GEOFENCE_ZONES, INITIAL_REEFERS } from '../../lib/constants';
import { calculateHaversineDistance, evaluateVehicleGeofences } from '../../lib/geofence';
import { gpsProvider, GPSStatus, PAKISTAN_CORRIDOR_WAYPOINTS } from '../../services/gpsProvider';
import { weatherService } from '../../services/weatherService';
import { auditLogger } from '../../services/auditLogger';
import { 
  Truck, 
  MapPin, 
  Compass, 
  Gauge, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle,
  Navigation,
  Clock,
  Thermometer,
  ShieldCheck,
  Radio,
  CloudSun,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { InteractiveLeafletCorridorMap } from './InteractiveLeafletCorridorMap';
import { GeofenceManager } from '../geofence/GeofenceManager';
import { GeofenceManagerModal } from '../geofence/GeofenceManagerModal';

interface TransporterModuleProps {
  onAcknowledgeBreach?: () => void;
}

export const TransporterModule: React.FC<TransporterModuleProps> = () => {
  const [reefers] = useState<ReeferVehicle[]>(INITIAL_REEFERS);
  const [selectedReeferId] = useState<string>('TRK-024');
  const [currentCoord, setCurrentCoord] = useState<GeofenceCoordinate>(PAKISTAN_CORRIDOR_WAYPOINTS[0]!);
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>(() => gpsProvider.getStatus());
  const [weatherConditions, setWeatherConditions] = useState<RouteWeatherCondition[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [lastGeofenceState, setLastGeofenceState] = useState<'OUTSIDE' | 'APPROACHING' | 'ENTERED'>('OUTSIDE');
  const [isGeofenceManagerOpen, setIsGeofenceManagerOpen] = useState<boolean>(false);

  const selectedReefer = reefers.find((r) => r.id === selectedReeferId) || reefers[0]!;

  // Subscribe to GPS Provider (handles both real device GPS & simulation)
  useEffect(() => {
    const unsubscribe = gpsProvider.subscribe((coord, status) => {
      setCurrentCoord(coord);
      setGpsStatus(status);
    });

    return () => unsubscribe();
  }, []);

  // Fetch real external weather from Open-Meteo for Pakistan transit corridor
  useEffect(() => {
    let isMounted = true;
    weatherService.getAllCorridorWeather()
      .then((data) => {
        if (isMounted) {
          setWeatherConditions(data);
          setIsLoadingWeather(false);
          auditLogger.log({
            type: 'WEATHER_FETCHED',
            tenantId: 'tenant_punjab_agri_coop',
            actor: 'Open-Meteo API Client',
            role: 'TRANSPORTER',
            details: `Retrieved live meteorological transit readings for ${data.length} corridor checkpoints.`
          });
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Weather fetch fallback engaged:', err);
          setIsLoadingWeather(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Geofence Evaluation with State Transition Debounce (Requirement 20)
  const geofenceEval = evaluateVehicleGeofences(currentCoord, GEOFENCE_ZONES);

  useEffect(() => {
    const currentState = geofenceEval.insideGeofence 
      ? 'ENTERED' 
      : geofenceEval.distanceToNearestMeters <= 5000 
      ? 'APPROACHING' 
      : 'OUTSIDE';

    if (currentState !== lastGeofenceState) {
      setLastGeofenceState(currentState);
      if (currentState === 'ENTERED' && geofenceEval.nearestZone) {
        auditLogger.log({
          type: 'GEOFENCE_ENTER',
          tenantId: 'tenant_punjab_agri_coop',
          actor: 'Reefer Telematics TRK-024',
          role: 'TRANSPORTER',
          details: `Vehicle TRK-024 breached perimeter of ${geofenceEval.nearestZone.name}. Dock bay reservation engaged.`
        });
      } else if (lastGeofenceState === 'ENTERED' && currentState !== 'ENTERED') {
        auditLogger.log({
          type: 'GEOFENCE_EXIT',
          tenantId: 'tenant_punjab_agri_coop',
          actor: 'Reefer Telematics TRK-024',
          role: 'TRANSPORTER',
          details: `Vehicle TRK-024 departed perimeter zone.`
        });
      }
    }
  }, [geofenceEval.insideGeofence, geofenceEval.distanceToNearestMeters, lastGeofenceState, geofenceEval.nearestZone]);

  const handleToggleGpsMode = () => {
    const nextMode = gpsStatus.mode === 'real' ? 'simulation' : 'real';
    gpsProvider.setMode(nextMode);
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-300 dark:border-sky-500/20 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Live Fleet Geo-Tracking & Geofence Engine
              </h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                gpsStatus.mode === 'real'
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
              }`}>
                {gpsStatus.mode === 'real' ? '● Real Device GPS' : '● Demo Corridor Simulation'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active GPS telematics on Multan $\to$ Sahiwal $\to$ Okara $\to$ Lahore Cold Chain Corridor (N-5 Highway)
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsGeofenceManagerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition shadow-xs active:scale-95"
            title="Configure virtual geofence perimeter zones"
          >
            <Layers className="w-4 h-4" />
            <span>Geofence Manager</span>
          </button>

          <button
            onClick={handleToggleGpsMode}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700 active:scale-95"
            title="Toggle between physical browser geolocation and route simulation"
          >
            <Radio className="w-4 h-4 text-sky-500" />
            <span>Switch to {gpsStatus.mode === 'real' ? 'Demo Simulation' : 'Device GPS'}</span>
          </button>
        </div>
      </div>

      {/* Real External Weather API Corridor Deck (Requirement 7) */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
              Transit Corridor Meteorological Conditions (Open-Meteo Live API)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            {isLoadingWeather ? 'Querying Satellite API...' : 'Live External Integration'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {weatherConditions.map((w, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                w.transitRiskLevel === 'SEVERE_THERMAL_LOAD'
                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40'
                  : 'bg-slate-50 dark:bg-[#121c28] border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">{w.locationName}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  w.transitRiskLevel === 'SEVERE_THERMAL_LOAD'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {w.transitRiskLevel === 'SEVERE_THERMAL_LOAD' ? 'HIGH THERMAL RISK' : 'NORMAL'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 my-1">
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {w.temperatureC.toFixed(1)}°C
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {w.humidityPercent}% RH
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="truncate">{w.weatherDescription}</span>
                <span>{w.windSpeedKmh} km/h</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transit Map & Telematics Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Real Interactive Leaflet Corridor Map */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Geographic Telematics & Dynamic Geofence Engine
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Multan Farm (Origin) $\to$ Okara Cold Depository $\to$ Lahore Terminal (Destination)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                geofenceEval.insideGeofence
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {geofenceEval.insideGeofence ? '● INSIDE GEOFENCE' : '● EN ROUTE (N-5)'}
              </span>
            </div>
          </div>

          {/* Interactive Leaflet Map with OpenStreetMap tiles, live truck marker & circular geofences */}
          <InteractiveLeafletCorridorMap
            currentCoord={currentCoord}
            reeferId={selectedReefer.id}
            temperatureC={selectedReefer.reeferTemp}
            humidityPercent={88.5}
          />
        </div>

        {/* Right Col: Reefer Diagnostics & Boundary Status */}
        <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reefer Telematics: {selectedReefer.id}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Carrier: {selectedReefer.carrier}</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-[#121c28] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Reefer Cargo Temp</span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {selectedReefer.reeferTemp.toFixed(1)}°C
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">Target: {selectedReefer.targetTemp}°C</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#121c28] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Geofence Boundary</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {geofenceEval.insideGeofence ? 'Inside Depot Perimeter' : 'Approaching Corridor'}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {(geofenceEval.distanceToNearestMeters / 1000).toFixed(1)} km to hub
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#121c28] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Compressor Health</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedReefer.compressorRpm} RPM · 98% SOH
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">Door: Sealed</span>
            </div>
          </div>
        </div>

      </div>

      {/* Dedicated Geofence Manager Dashboard Component */}
      <GeofenceManager />

      {/* Virtual Geofence Manager Modal */}
      <GeofenceManagerModal
        isOpen={isGeofenceManagerOpen}
        onClose={() => setIsGeofenceManagerOpen(false)}
      />

    </div>
  );
};
