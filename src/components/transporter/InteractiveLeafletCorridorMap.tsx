import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { GeofenceCoordinate, GeofenceZone } from '../../types';
import { GEOFENCE_ZONES } from '../../lib/constants';
import { calculateHaversineDistance } from '../../lib/geofence';
import { 
  Truck, 
  MapPin, 
  Compass, 
  Layers, 
  Maximize2, 
  Radio, 
  ShieldCheck, 
  AlertTriangle,
  LocateFixed,
  Globe,
  Navigation,
  Thermometer,
  Droplets,
  Clock,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Satellite
} from 'lucide-react';

export type TerritoryMode = 'GLOBAL' | 'PAKISTAN_N5' | 'US_CALIFORNIA' | 'EU_RHINE' | 'DEVICE_GPS';
export type BasemapMode = 'STREET' | 'SATELLITE' | 'DARK';

interface InteractiveLeafletCorridorMapProps {
  currentCoord: GeofenceCoordinate;
  reeferId?: string;
  temperatureC?: number;
  humidityPercent?: number;
  onGeofenceStateChange?: (state: 'OUTSIDE' | 'APPROACHING' | 'ENTERED', nearestZone: GeofenceZone | null) => void;
  className?: string;
}

// Global corridors definitions
const TERRITORY_CONFIGS: Record<TerritoryMode, {
  name: string;
  flag: string;
  center: [number, number];
  zoom: number;
  waypoints: { name: string; coord: [number, number]; isHub?: boolean }[];
  description: string;
}> = {
  GLOBAL: {
    name: 'Global Earth Cold-Chain Fleet',
    flag: '🌍',
    center: [25.0, 45.0],
    zoom: 2,
    waypoints: [
      { name: 'Salinas Valley, USA', coord: [36.6777, -121.6555], isHub: true },
      { name: 'Port of Rotterdam, NL', coord: [51.9244, 4.4777], isHub: true },
      { name: 'Dubai Cold Terminal, UAE', coord: [25.2048, 55.2708], isHub: true },
      { name: 'Karachi Port, PK', coord: [24.8607, 67.0011], isHub: true },
      { name: 'Multan Agro Hub, PK', coord: [29.9715, 71.4930], isHub: true },
      { name: 'Singapore PSA Terminal', coord: [1.3521, 103.8198], isHub: true },
      { name: 'Shanghai Port, CN', coord: [31.2304, 121.4737], isHub: true }
    ],
    description: 'Autonomous transcontinental reefers & marine ISO tank containers across planet Earth.'
  },
  PAKISTAN_N5: {
    name: 'Pakistan National Agro Corridor (N-5)',
    flag: '🇵🇰',
    center: [30.8, 73.2],
    zoom: 8,
    waypoints: [
      { name: 'Multan Farm Hub (Origin)', coord: [29.9715, 71.4930], isHub: true },
      { name: 'Khanewal Logistics Checkpoint', coord: [30.2850, 72.3120] },
      { name: 'Sahiwal Cold Bay #02', coord: [30.6682, 73.1114], isHub: true },
      { name: 'Okara Agro Depository', coord: [30.8100, 73.4500], isHub: true },
      { name: 'Pattoki Exchange Hub', coord: [31.1850, 73.8500] },
      { name: 'Lahore Central Terminal (Dest)', coord: [31.5204, 74.3587], isHub: true }
    ],
    description: 'Farm-to-fork perishable Mango & Citrus arterial line maintaining 0°C–4°C threshold.'
  },
  US_CALIFORNIA: {
    name: 'Salinas Valley Salad Bowl (CA, USA)',
    flag: '🇺🇸',
    center: [36.2, -120.5],
    zoom: 7,
    waypoints: [
      { name: 'Salinas Organic Harvest Point', coord: [36.6777, -121.6555], isHub: true },
      { name: 'Fresno Inland Cold Depository', coord: [36.7468, -119.7726], isHub: true },
      { name: 'Bakersfield Waypoint', coord: [35.3733, -119.0187] },
      { name: 'Los Angeles Terminal Port', coord: [34.0522, -118.2437], isHub: true }
    ],
    description: 'High-speed interstate reefer convoy tracking organic greens & berry freight.'
  },
  EU_RHINE: {
    name: 'EU Rhine-Danube Cold Corridor',
    flag: '🇪🇺',
    center: [50.5, 7.5],
    zoom: 7,
    waypoints: [
      { name: 'Rotterdam Port Cold Logistics', coord: [51.9244, 4.4777], isHub: true },
      { name: 'Venlo Fresh Park Depot', coord: [51.3700, 6.1724], isHub: true },
      { name: 'Frankfurt CargoCity South', coord: [50.0379, 8.5622], isHub: true },
      { name: 'Munich Agro Wholesale Depository', coord: [48.1351, 11.5820], isHub: true }
    ],
    description: 'Trans-European perishable food security network under EU-GDP Annex 15 standards.'
  },
  DEVICE_GPS: {
    name: 'Real Physical Device GPS (Live Earth Fix)',
    flag: '📡',
    center: [0, 0],
    zoom: 14,
    waypoints: [],
    description: 'Physical satellite triangulation from your device browser anywhere on Earth.'
  }
};

const BASEMAP_TILES: Record<BasemapMode, { url: string; attribution: string }> = {
  STREET: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  SATELLITE: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  DARK: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap, © CARTO'
  }
};

export const InteractiveLeafletCorridorMap: React.FC<InteractiveLeafletCorridorMapProps> = ({
  currentCoord,
  reeferId = 'TRK-024',
  temperatureC = 3.8,
  humidityPercent = 88.5,
  onGeofenceStateChange,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const deviceAccuracyCircleRef = useRef<L.Circle | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const geofenceLayersRef = useRef<L.LayerGroup | null>(null);

  const [territory, setTerritory] = useState<TerritoryMode>('PAKISTAN_N5');
  const [basemap, setBasemap] = useState<BasemapMode>('STREET');
  const [showGeofences, setShowGeofences] = useState(true);
  const [isLocatingDevice, setIsLocatingDevice] = useState(false);
  const [deviceFix, setDeviceFix] = useState<{ lat: number; lng: number; accuracy: number; speed: number | null } | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Active coordinates to track: device fix if in DEVICE_GPS mode, otherwise corridor currentCoord
  const activeCoord = useMemo(() => {
    if (territory === 'DEVICE_GPS' && deviceFix) {
      return { lat: deviceFix.lat, lng: deviceFix.lng };
    }
    return currentCoord;
  }, [territory, deviceFix, currentCoord]);

  // Real-time Geofence Proximity & Smart Reroute Calculation
  const nearestZoneInfo = useMemo(() => {
    let nearest: GeofenceZone | null = null;
    let minDistance = Infinity;

    GEOFENCE_ZONES.forEach((zone) => {
      const dist = calculateHaversineDistance(activeCoord, zone.center);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = zone;
      }
    });

    const isInside = nearest ? minDistance <= (nearest as GeofenceZone).radiusMeters : false;
    const isApproaching = nearest ? minDistance <= 5000 : false;

    // Smart Rerouting logic: If temp is breached (>4.2°C), find nearest intermediate cold storage hub
    const coldHubs = GEOFENCE_ZONES.filter((z) => z.type === 'INTERMEDIATE_DEPOT' || z.type === 'COLD_STORAGE_HUB');
    let nearestSafeDepot: GeofenceZone | null = null;
    let minDepotDist = Infinity;
    coldHubs.forEach((hub) => {
      const d = calculateHaversineDistance(activeCoord, hub.center);
      if (d < minDepotDist) {
        minDepotDist = d;
        nearestSafeDepot = hub;
      }
    });

    return {
      nearestZone: nearest as GeofenceZone | null,
      distanceMeters: minDistance,
      isInside,
      isApproaching,
      emergencyDivertDepot: nearestSafeDepot as GeofenceZone | null,
      divertDistanceKm: (minDepotDist / 1000).toFixed(1),
      estimatedDivertMinutes: Math.round((minDepotDist / 1000) / 60 * 60) // assuming 60 km/h avg speed
    };
  }, [activeCoord]);

  // Inform parent when geofence status changes
  useEffect(() => {
    if (onGeofenceStateChange) {
      const state = nearestZoneInfo.isInside 
        ? 'ENTERED' 
        : nearestZoneInfo.isApproaching 
        ? 'APPROACHING' 
        : 'OUTSIDE';
      onGeofenceStateChange(state, nearestZoneInfo.nearestZone);
    }
  }, [nearestZoneInfo, onGeofenceStateChange]);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialConfig = TERRITORY_CONFIGS[territory];
    const map = L.map(mapContainerRef.current, {
      center: initialConfig.center,
      zoom: initialConfig.zoom,
      zoomControl: false,
      attributionControl: false
    });

    // Add Base Tile Layer
    const tileLayer = L.tileLayer(BASEMAP_TILES[basemap].url, {
      maxZoom: 19,
      minZoom: 2,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);
    baseTileLayerRef.current = tileLayer;

    // Layer Group for Geofences
    const geofenceGroup = L.layerGroup().addTo(map);
    geofenceLayersRef.current = geofenceGroup;

    // Render Geofence Radii Rings
    GEOFENCE_ZONES.forEach((zone) => {
      const isDestination = zone.id === 'zone_lahore_terminal';
      const circleColor = isDestination ? '#10b981' : '#f59e0b';

      const circle = L.circle([zone.center.lat, zone.center.lng], {
        radius: zone.radiusMeters,
        color: circleColor,
        weight: 2,
        fillColor: circleColor,
        fillOpacity: 0.15
      });

      circle.bindTooltip(`<b>${zone.name}</b><br/>Cold Bay Radius: ${(zone.radiusMeters / 1000).toFixed(1)} km`, {
        permanent: false,
        direction: 'top'
      });

      geofenceGroup.addLayer(circle);

      // Node Hub Pin
      const icon = L.divIcon({
        className: 'geofence-hub-icon',
        html: `<div style="background-color: ${circleColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      L.marker([zone.center.lat, zone.center.lng], { icon }).addTo(geofenceGroup);
    });

    // Route Polyline
    const routeCoords = initialConfig.waypoints.map((w) => w.coord);
    if (routeCoords.length > 0) {
      const poly = L.polyline(routeCoords, {
        color: '#0284c7',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 6',
        lineCap: 'round'
      }).addTo(map);
      routePolylineRef.current = poly;
    }

    // Custom Animated Truck DivIcon
    const truckIcon = L.divIcon({
      className: 'custom-reefer-truck-icon',
      html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(2, 132, 199, 0.25); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 30px; height: 30px; border-radius: 50%; background: #0284c7; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.4); color: #ffffff;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
              <circle cx="17" cy="18" r="2"/>
              <circle cx="7" cy="18" r="2"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([activeCoord.lat, activeCoord.lng], { icon: truckIcon }).addTo(map);
    truckMarkerRef.current = marker;

    marker.bindPopup(`
      <div style="font-family: monospace; font-size: 11px; padding: 4px; line-height: 1.5;">
        <div style="font-weight: bold; color: #0284c7; margin-bottom: 2px;">REEFER UNIT: ${reeferId}</div>
        <div>Core Temp: <b>${temperatureC.toFixed(1)}°C</b></div>
        <div>Humidity: <b>${humidityPercent.toFixed(1)}% RH</b></div>
        <div>Fix: ${activeCoord.lat.toFixed(4)}°N, ${activeCoord.lng.toFixed(4)}°E</div>
        <div>Network: Tier-III Autonomous Telemetry</div>
      </div>
    `);

    mapInstanceRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Tiles
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;
    baseTileLayerRef.current.setUrl(BASEMAP_TILES[basemap].url);
  }, [basemap]);

  // Handle Territory / Corridor Changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const config = TERRITORY_CONFIGS[territory];

    // If switching to Device GPS, trigger real browser geolocation
    if (territory === 'DEVICE_GPS') {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        setIsLocatingDevice(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setDeviceFix({
              lat,
              lng,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed
            });
            setIsLocatingDevice(false);
            mapInstanceRef.current?.setView([lat, lng], 15, { animate: true });

            // Add or update accuracy circle
            if (deviceAccuracyCircleRef.current) {
              deviceAccuracyCircleRef.current.setLatLng([lat, lng]).setRadius(pos.coords.accuracy);
            } else {
              deviceAccuracyCircleRef.current = L.circle([lat, lng], {
                radius: pos.coords.accuracy,
                color: '#38bdf8',
                fillColor: '#38bdf8',
                fillOpacity: 0.15,
                weight: 1
              }).addTo(mapInstanceRef.current!);
            }
          },
          (err) => {
            console.warn('Physical device geolocation unavailable:', err);
            setIsLocatingDevice(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    } else {
      // Regular territory switch
      mapInstanceRef.current.setView(config.center, config.zoom, { animate: true });

      // Update route polyline
      const routeCoords = config.waypoints.map((w) => w.coord);
      if (routePolylineRef.current) {
        routePolylineRef.current.setLatLngs(routeCoords);
      } else if (routeCoords.length > 0) {
        routePolylineRef.current = L.polyline(routeCoords, {
          color: '#0284c7',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 6'
        }).addTo(mapInstanceRef.current);
      }
    }
  }, [territory]);

  // Update Truck Marker Position smoothly
  useEffect(() => {
    if (!truckMarkerRef.current || !mapInstanceRef.current) return;
    truckMarkerRef.current.setLatLng([activeCoord.lat, activeCoord.lng]);
  }, [activeCoord]);

  // Actions
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([activeCoord.lat, activeCoord.lng], territory === 'GLOBAL' ? 4 : 11, { animate: true });
  };

  const handleFitCorridor = () => {
    if (!mapInstanceRef.current) return;
    const config = TERRITORY_CONFIGS[territory];
    if (config.waypoints.length > 0) {
      const bounds = L.latLngBounds(config.waypoints.map((w) => w.coord));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
    }
  };

  const handleToggleGeofences = () => {
    if (!mapInstanceRef.current || !geofenceLayersRef.current) return;
    if (showGeofences) {
      mapInstanceRef.current.removeLayer(geofenceLayersRef.current);
    } else {
      mapInstanceRef.current.addLayer(geofenceLayersRef.current);
    }
    setShowGeofences(!showGeofences);
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-md ${className}`}>
      
      {/* Map Interactive Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-96 sm:h-[460px] z-10" />

      {/* Top Left Navigation Header: Territory & Basemap Selectors */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        
        {/* Territory Selector */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm px-2.5 py-1.5 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-sky-600" />
          <select
            value={territory}
            onChange={(e) => setTerritory(e.target.value as TerritoryMode)}
            className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-1"
          >
            {Object.entries(TERRITORY_CONFIGS).map(([key, cfg]) => (
              <option key={key} value={key} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {cfg.flag} {cfg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Basemap Switcher */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-1 flex items-center gap-1">
          <button
            onClick={() => setBasemap('STREET')}
            className={`px-2 py-1 rounded-xl text-[11px] font-semibold transition ${
              basemap === 'STREET' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Street
          </button>
          <button
            onClick={() => setBasemap('SATELLITE')}
            className={`px-2 py-1 rounded-xl text-[11px] font-semibold transition flex items-center gap-1 ${
              basemap === 'SATELLITE' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Satellite className="w-3 h-3" />
            <span>Satellite</span>
          </button>
          <button
            onClick={() => setBasemap('DARK')}
            className={`px-2 py-1 rounded-xl text-[11px] font-semibold transition ${
              basemap === 'DARK' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Dark HUD
          </button>
        </div>

      </div>

      {/* Top Right Floating Action Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={handleRecenter}
          className="p-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-200 transition active:scale-95"
          title="Recenter on Truck Position"
        >
          <LocateFixed className="w-4 h-4 text-sky-600" />
        </button>

        <button
          onClick={handleFitCorridor}
          className="p-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-200 transition active:scale-95"
          title="Fit Entire Territorial Corridor"
        >
          <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>

        <button
          onClick={handleToggleGeofences}
          className={`p-2.5 rounded-2xl border shadow-sm transition active:scale-95 ${
            showGeofences
              ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 text-sky-700 dark:text-sky-300'
              : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-400'
          }`}
          title="Toggle Geofence Radii Rings"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Dynamic Smart Rerouting / Divert Recommendation Notification */}
      {temperatureC > 4.2 && nearestZoneInfo.emergencyDivertDepot && (
        <div className="absolute top-16 left-3 right-3 sm:right-auto sm:max-w-md z-20 bg-rose-950/90 backdrop-blur-md border border-rose-500 rounded-2xl p-3 shadow-xl text-white animate-bounce pointer-events-auto">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <span>Thermal Breach: Smart Reroute Recommended</span>
                <span className="text-[10px] bg-rose-500 px-1.5 py-0.2 rounded font-mono">CRITICAL</span>
              </div>
              <p className="text-[11px] text-rose-200 mt-0.5 leading-snug">
                Divert vehicle to nearest cold bay at <strong>{nearestZoneInfo.emergencyDivertDepot.name}</strong> ({nearestZoneInfo.divertDistanceKm} km · {nearestZoneInfo.estimatedDivertMinutes} mins away) to prevent spoilage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Telematics & Geofence Status HUD */}
      <div className="absolute bottom-3 left-3 right-3 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 pointer-events-auto">
        
        {/* Left: Active Reefer Fix & Telemetry */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-600 animate-pulse" />
            <span className="font-bold text-slate-900 dark:text-white">{reeferId}</span>
            <span className="text-slate-400">·</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <Thermometer className="w-3.5 h-3.5" />
              <span>{temperatureC.toFixed(1)}°C</span>
            </span>
            <span className="text-slate-400">·</span>
            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold">
              <Droplets className="w-3.5 h-3.5" />
              <span>{humidityPercent.toFixed(1)}% RH</span>
            </span>
          </div>

          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Fix: {activeCoord.lat.toFixed(4)}°N, {activeCoord.lng.toFixed(4)}°E</span>
            <span className="mx-1">·</span>
            <span>Speed: {deviceFix?.speed ? `${Math.round(deviceFix.speed * 3.6)} km/h` : '68 km/h'}</span>
          </div>
        </div>

        {/* Right: Geofence State Indicator */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs border ${
            nearestZoneInfo.isInside
              ? 'bg-emerald-600 text-white border-emerald-500 animate-pulse'
              : nearestZoneInfo.isApproaching
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
          }`}>
            {nearestZoneInfo.isInside ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>INSIDE PERIMETER ({nearestZoneInfo.nearestZone?.name})</span>
              </>
            ) : nearestZoneInfo.isApproaching ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>APPROACHING DESTINATION ({(nearestZoneInfo.distanceMeters / 1000).toFixed(1)} km)</span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5 text-sky-600" />
                <span>EN ROUTE ({(nearestZoneInfo.distanceMeters / 1000).toFixed(1)} km to next cold bay)</span>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
