import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { GeofenceZone, GeofenceCoordinate, ReeferVehicle } from '../../types';
import { GEOFENCE_ZONES, INITIAL_REEFERS } from '../../lib/constants';
import { calculateHaversineDistance, evaluateVehicleGeofences } from '../../lib/geofence';
import { audioAlert } from '../../lib/audioAlert';
import { 
  Layers, 
  MapPin, 
  Plus, 
  Trash2, 
  Compass, 
  Radio, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  Crosshair, 
  Volume2, 
  VolumeX, 
  History, 
  RefreshCw,
  Eye,
  Info,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export type GeofencePerimeterStatus = 'IN_ZONE' | 'EXITED_ZONE' | 'APPROACHING';

export interface GeofenceTransitionEvent {
  id: string;
  timestamp: string;
  truckId: string;
  zoneId: string;
  zoneName: string;
  status: GeofencePerimeterStatus;
  distanceMeters: number;
  coordinates: GeofenceCoordinate;
}

interface GeofenceManagerProps {
  onSelectVehicle?: (vehicleId: string) => void;
  className?: string;
}

export const GeofenceManager: React.FC<GeofenceManagerProps> = ({
  onSelectVehicle,
  className = ''
}) => {
  // Defined Circular Geofence Zones
  const [zones, setZones] = useState<GeofenceZone[]>(() => [...GEOFENCE_ZONES]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(GEOFENCE_ZONES[0]?.id || '');

  // Form Inputs for Defining New Circular Zones
  const [isAddingZone, setIsAddingZone] = useState<boolean>(false);
  const [newZoneName, setNewZoneName] = useState<string>('Multan Mango Cold Depository');
  const [newZoneType, setNewZoneType] = useState<GeofenceZone['type']>('COLD_STORAGE_HUB');
  const [newZoneLat, setNewZoneLat] = useState<number>(30.1575);
  const [newZoneLng, setNewZoneLng] = useState<number>(71.5249);
  const [newZoneRadius, setNewZoneRadius] = useState<number>(3000);

  // Active Shipment Vehicles & Positions
  const [vehicles, setVehicles] = useState<ReeferVehicle[]>(() => [...INITIAL_REEFERS]);
  const [activeTestTruckId, setActiveTestTruckId] = useState<string>(INITIAL_REEFERS[0]?.id || 'TRK-024');

  // Interactive Shipment Position Controls
  const [testLat, setTestLat] = useState<number>(28.6139);
  const [testLng, setTestLng] = useState<number>(77.2090);
  const [routeProgress, setRouteProgress] = useState<number>(68);

  // Live Visual Status Banner & Transition Event History
  const [liveBanner, setLiveBanner] = useState<{
    truckId: string;
    zoneName: string;
    status: GeofencePerimeterStatus;
    timestamp: string;
  } | null>(null);

  const [transitionEvents, setTransitionEvents] = useState<GeofenceTransitionEvent[]>([
    {
      id: 'EVT-101',
      timestamp: '14:24:10 PST',
      truckId: 'TRK-024',
      zoneId: 'ZONE-DELHI-DC',
      zoneName: 'Delhi Central Distribution Hub',
      status: 'IN_ZONE',
      distanceMeters: 420,
      coordinates: { lat: 28.6139, lng: 77.2090 }
    },
    {
      id: 'EVT-100',
      timestamp: '13:50:02 PST',
      truckId: 'TRK-017',
      zoneId: 'ZONE-ISB-DC',
      zoneName: 'Islamabad Federal Distribution Center',
      status: 'EXITED_ZONE',
      distanceMeters: 14200,
      coordinates: { lat: 34.0151, lng: 71.5249 }
    }
  ]);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleLayersRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkersRef = useRef<L.LayerGroup | null>(null);

  // Active Tested Vehicle Object
  const currentVehicle = useMemo(
    () => vehicles.find((v) => v.id === activeTestTruckId) || vehicles[0]!,
    [vehicles, activeTestTruckId]
  );

  // Calculate live perimeter status for a coordinate against all active zones
  const evaluateCoordinateStatus = (coord: GeofenceCoordinate): {
    status: GeofencePerimeterStatus;
    closestZone: GeofenceZone;
    distanceMeters: number;
  } => {
    if (zones.length === 0) {
      return {
        status: 'EXITED_ZONE',
        closestZone: GEOFENCE_ZONES[0]!,
        distanceMeters: Infinity
      };
    }

    let minDistance = Infinity;
    let closestZone = zones[0]!;

    for (const z of zones) {
      const dist = calculateHaversineDistance(coord, z.center);
      if (dist < minDistance) {
        minDistance = dist;
        closestZone = z;
      }
    }

    if (minDistance <= closestZone.radiusMeters) {
      return { status: 'IN_ZONE', closestZone, distanceMeters: Math.round(minDistance) };
    }
    if (minDistance <= closestZone.radiusMeters * 2.2) {
      return { status: 'APPROACHING', closestZone, distanceMeters: Math.round(minDistance) };
    }
    return { status: 'EXITED_ZONE', closestZone, distanceMeters: Math.round(minDistance) };
  };

  // Current live status of the active test truck
  const currentVehicleEvaluation = useMemo(() => {
    return evaluateCoordinateStatus(currentVehicle.currentLocation);
  }, [currentVehicle.currentLocation, zones]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [30.5, 73.0],
        zoom: 6,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 3
      }).addTo(map);

      // Click on map to populate Lat and Lng inputs!
      map.on('click', (e: L.LeafletMouseEvent) => {
        const clickedLat = parseFloat(e.latlng.lat.toFixed(4));
        const clickedLng = parseFloat(e.latlng.lng.toFixed(4));
        setNewZoneLat(clickedLat);
        setNewZoneLng(clickedLng);
        setTestLat(clickedLat);
        setTestLng(clickedLng);
      });

      circleLayersRef.current = L.layerGroup().addTo(map);
      vehicleMarkersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount handled gracefully
    };
  }, []);

  // Update Leaflet Circular Zones on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !circleLayersRef.current) return;

    circleLayersRef.current.clearLayers();

    zones.forEach((z) => {
      const color =
        z.type === 'ORIGIN_FARM'
          ? '#10b981'
          : z.type === 'COLD_STORAGE_HUB'
          ? '#0284c7'
          : z.type === 'INTERMEDIATE_DEPOT'
          ? '#f59e0b'
          : '#8b5cf6';

      const isSelected = z.id === selectedZoneId;

      // Draw Leaflet Circular Zone
      const circle = L.circle([z.center.lat, z.center.lng], {
        radius: z.radiusMeters,
        color: color,
        weight: isSelected ? 3 : 2,
        fillColor: color,
        fillOpacity: isSelected ? 0.28 : 0.16,
        dashArray: isSelected ? undefined : '4, 4'
      });

      circle.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px;">
          <b>${z.name}</b><br/>
          Type: ${z.type.replace(/_/g, ' ')}<br/>
          Radius: ${(z.radiusMeters / 1000).toFixed(1)} km (${z.radiusMeters}m)
        </div>`,
        { direction: 'top' }
      );

      circle.on('click', () => {
        setSelectedZoneId(z.id);
      });

      circleLayersRef.current?.addLayer(circle);

      // Center Pin Marker
      const centerIcon = L.divIcon({
        className: 'geofence-center-pin',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      L.marker([z.center.lat, z.center.lng], { icon: centerIcon }).addTo(circleLayersRef.current!);
    });
  }, [zones, selectedZoneId]);

  // Update Shipment / Vehicle Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !vehicleMarkersRef.current) return;

    vehicleMarkersRef.current.clearLayers();

    vehicles.forEach((veh) => {
      const evalResult = evaluateCoordinateStatus(veh.currentLocation);
      const isCurrent = veh.id === activeTestTruckId;

      const badgeColor =
        evalResult.status === 'IN_ZONE'
          ? '#10b981'
          : evalResult.status === 'APPROACHING'
          ? '#f59e0b'
          : '#64748b';

      const truckIcon = L.divIcon({
        className: 'geofence-truck-marker',
        html: `
          <div style="
            display: flex; 
            align-items: center; 
            gap: 4px; 
            background: #0f172a; 
            color: #ffffff; 
            padding: 2px 6px; 
            border-radius: 8px; 
            border: 2px solid ${badgeColor}; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            font-family: monospace; 
            font-size: 10px; 
            font-weight: bold;
            white-space: nowrap;
          ">
            <span>🚚 ${veh.id}</span>
            <span style="background: ${badgeColor}; color: #ffffff; padding: 1px 4px; border-radius: 4px; font-size: 9px;">
              ${evalResult.status === 'IN_ZONE' ? 'IN' : evalResult.status === 'APPROACHING' ? 'NEAR' : 'OUT'}
            </span>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12]
      });

      const marker = L.marker([veh.currentLocation.lat, veh.currentLocation.lng], { icon: truckIcon });
      marker.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px;">
          <b>${veh.id} — ${veh.driverName}</b><br/>
          Status: <b>${evalResult.status}</b> (${evalResult.closestZone.name})<br/>
          Distance to Boundary: ${evalResult.distanceMeters}m<br/>
          Cargo: ${veh.cargoDescription}
        </div>`
      );

      marker.on('click', () => {
        setActiveTestTruckId(veh.id);
        setTestLat(veh.currentLocation.lat);
        setTestLng(veh.currentLocation.lng);
      });

      vehicleMarkersRef.current?.addLayer(marker);
    });
  }, [vehicles, activeTestTruckId, zones]);

  // Handle Form Submit: Define New Circular Zone
  const handleSaveZone = (e: React.FormEvent) => {
    e.preventDefault();
    const newZone: GeofenceZone = {
      id: `ZONE-CUSTOM-${Date.now().toString().slice(-4)}`,
      name: newZoneName,
      type: newZoneType,
      center: { lat: Number(newZoneLat), lng: Number(newZoneLng) },
      radiusMeters: Number(newZoneRadius),
      color:
        newZoneType === 'ORIGIN_FARM'
          ? '#10b981'
          : newZoneType === 'COLD_STORAGE_HUB'
          ? '#0284c7'
          : newZoneType === 'INTERMEDIATE_DEPOT'
          ? '#f59e0b'
          : '#8b5cf6'
    };

    const updated = [newZone, ...zones];
    setZones(updated);
    setSelectedZoneId(newZone.id);
    setIsAddingZone(false);

    // Center map on newly plotted zone
    mapInstanceRef.current?.setView([newZone.center.lat, newZone.center.lng], 10, { animate: true });
  };

  // Handle Delete Zone
  const handleDeleteZone = (id: string) => {
    const updated = zones.filter((z) => z.id !== id);
    setZones(updated);
    if (selectedZoneId === id && updated.length > 0) {
      setSelectedZoneId(updated[0]!.id);
    }
  };

  // Handle Coordinate Movement for Live Shipment (Triggers visual status updates!)
  const handleUpdateShipmentCoordinates = (newCoord: GeofenceCoordinate) => {
    const prevEval = evaluateCoordinateStatus(currentVehicle.currentLocation);
    const nextEval = evaluateCoordinateStatus(newCoord);

    // Update vehicle position state
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === activeTestTruckId
          ? {
              ...v,
              currentLocation: newCoord,
              insideGeofence: nextEval.status === 'IN_ZONE'
            }
          : v
      )
    );

    setTestLat(newCoord.lat);
    setTestLng(newCoord.lng);

    // If status changed (e.g. EXITED_ZONE -> IN_ZONE or IN_ZONE -> EXITED_ZONE)
    if (prevEval.status !== nextEval.status) {
      audioAlert.playSyncChime();

      const timeStr = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Display live transition banner
      setLiveBanner({
        truckId: activeTestTruckId,
        zoneName: nextEval.closestZone.name,
        status: nextEval.status,
        timestamp: timeStr
      });

      // Append to transition events audit log
      const newEvent: GeofenceTransitionEvent = {
        id: `EVT-${Date.now().toString().slice(-4)}`,
        timestamp: `${timeStr} PST`,
        truckId: activeTestTruckId,
        zoneId: nextEval.closestZone.id,
        zoneName: nextEval.closestZone.name,
        status: nextEval.status,
        distanceMeters: nextEval.distanceMeters,
        coordinates: newCoord
      };

      setTransitionEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
    }
  };

  // Preset: Simulate Truck Entering Zone
  const handleSimulateMoveInside = (zone: GeofenceZone) => {
    handleUpdateShipmentCoordinates({
      lat: zone.center.lat + 0.003,
      lng: zone.center.lng + 0.003
    });
    mapInstanceRef.current?.setView([zone.center.lat, zone.center.lng], 11, { animate: true });
  };

  // Preset: Simulate Truck Exiting Zone
  const handleSimulateMoveOutside = (zone: GeofenceZone) => {
    handleUpdateShipmentCoordinates({
      lat: zone.center.lat + 0.22,
      lng: zone.center.lng + 0.22
    });
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 ${className}`}>
      
      {/* Geofence Manager Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Geofence Manager & Spatial Rules Engine
              </h2>
              <span className="text-[10px] font-mono uppercase bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-full font-bold">
                {zones.length} Circular Zones Active
              </span>
              <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                Live Spatial Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Define circular geographical boundaries on Leaflet with custom latitude, longitude, and radius. Automatically evaluates shipment coordinates and triggers visual perimeter status updates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddingZone(!isAddingZone)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingZone ? 'Cancel Form' : 'Define New Circular Zone'}</span>
          </button>
        </div>
      </div>

      {/* Live Perimeter Transition Alert Banner (Triggers dynamically when a vehicle enters or exits a zone!) */}
      {liveBanner && (
        <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200 ${
          liveBanner.status === 'IN_ZONE'
            ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
            : liveBanner.status === 'APPROACHING'
            ? 'bg-amber-50 border-amber-500 text-amber-950'
            : 'bg-slate-100 border-slate-400 text-slate-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold ${
              liveBanner.status === 'IN_ZONE' ? 'bg-emerald-600' : liveBanner.status === 'APPROACHING' ? 'bg-amber-600' : 'bg-slate-700'
            }`}>
              <Truck className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-extrabold uppercase px-2 py-0.5 rounded-md bg-white border">
                  {liveBanner.status === 'IN_ZONE'
                    ? '● STATUS UPDATE: IN_ZONE'
                    : liveBanner.status === 'APPROACHING'
                    ? '◐ STATUS UPDATE: APPROACHING'
                    : '○ STATUS UPDATE: EXITED_ZONE'}
                </span>
                <span className="text-xs font-mono text-slate-500">[{liveBanner.timestamp}]</span>
              </div>
              <p className="text-xs font-medium mt-0.5">
                Shipment <b>{liveBanner.truckId}</b> coordinate transition confirmed for perimeter boundary: <b>{liveBanner.zoneName}</b>.
              </p>
            </div>
          </div>

          <button
            onClick={() => setLiveBanner(null)}
            className="text-xs font-mono font-bold text-slate-500 hover:text-slate-800 px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left Column = Form Inputs & Zones; Right Column = Interactive Leaflet Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Form Inputs & Zone Definitions */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* New Circular Zone Creation Form */}
          {isAddingZone && (
            <form onSubmit={handleSaveZone} className="p-4 bg-slate-50 rounded-2xl border border-slate-300 space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase font-mono text-slate-900">
                  Define Circular Perimeter Zone
                </span>
                <span className="text-[10px] text-sky-700 font-mono">Click map to set Lat/Lng</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="e.g. Lahore Cold Terminal Depository"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Zone Classification</label>
                  <select
                    value={newZoneType}
                    onChange={(e) => setNewZoneType(e.target.value as GeofenceZone['type'])}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none"
                  >
                    <option value="ORIGIN_FARM">Origin Farm</option>
                    <option value="COLD_STORAGE_HUB">Cold Storage Hub</option>
                    <option value="INTERMEDIATE_DEPOT">Intermediate Depot</option>
                    <option value="URBAN_DISTRIBUTION">Urban Distribution</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Radius: {(newZoneRadius / 1000).toFixed(1)} km ({newZoneRadius}m)
                  </label>
                  <input
                    type="range"
                    min={500}
                    max={25000}
                    step={250}
                    value={newZoneRadius}
                    onChange={(e) => setNewZoneRadius(Number(e.target.value))}
                    className="w-full accent-sky-600 mt-2"
                  />
                </div>
              </div>

              {/* Coordinates Inputs: Latitude & Longitude */}
              <div className="grid grid-cols-2 gap-2.5 font-mono">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step={0.0001}
                    required
                    value={newZoneLat}
                    onChange={(e) => setNewZoneLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step={0.0001}
                    required
                    value={newZoneLng}
                    onChange={(e) => setNewZoneLng(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer"
              >
                Save & Plot Circular Geofence
              </button>
            </form>
          )}

          {/* Active Defined Zones List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-600">
                Configured Circular Perimeters ({zones.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Click to view & center</span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {zones.map((z) => {
                const isSelected = z.id === selectedZoneId;
                const vehicleInThisZone = vehicles.find((v) => {
                  const dist = calculateHaversineDistance(v.currentLocation, z.center);
                  return dist <= z.radiusMeters;
                });

                return (
                  <div
                    key={z.id}
                    onClick={() => {
                      setSelectedZoneId(z.id);
                      mapInstanceRef.current?.setView([z.center.lat, z.center.lng], 11, { animate: true });
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-400 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">{z.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold shrink-0">
                          {(z.radiusMeters / 1000).toFixed(1)} km
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-500">
                        <span>{z.center.lat.toFixed(4)}°N, {z.center.lng.toFixed(4)}°E</span>
                        <span>·</span>
                        <span className="capitalize">{z.type.replace(/_/g, ' ').toLowerCase()}</span>
                      </div>

                      {/* Real-time In-Zone occupancy tag */}
                      {vehicleInThisZone && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-emerald-800 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Occupied by {vehicleInThisZone.id} (IN_ZONE)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulateMoveInside(z);
                        }}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-mono font-bold transition"
                        title="Simulate truck entering this circular zone"
                      >
                        Enter
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulateMoveOutside(z);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold transition"
                        title="Simulate truck exiting this circular zone"
                      >
                        Exit
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteZone(z.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg"
                        title="Delete Zone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Shipment Coordinate Simulator */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-slate-700" />
                <span className="font-bold text-xs uppercase font-mono text-slate-900">
                  Shipment Coordinate Tester
                </span>
              </div>

              {/* Status Badge: IN_ZONE, EXITED_ZONE, APPROACHING */}
              <span className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-md uppercase border ${
                currentVehicleEvaluation.status === 'IN_ZONE'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : currentVehicleEvaluation.status === 'APPROACHING'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-200 text-slate-800 border-slate-300'
              }`}>
                {currentVehicleEvaluation.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-mono font-bold text-slate-600">Select Reefer:</label>
              <select
                value={activeTestTruckId}
                onChange={(e) => {
                  const targetId = e.target.value;
                  setActiveTestTruckId(targetId);
                  const veh = vehicles.find((v) => v.id === targetId);
                  if (veh) {
                    setTestLat(veh.currentLocation.lat);
                    setTestLng(veh.currentLocation.lng);
                  }
                }}
                className="px-2.5 py-1 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} — {v.driverName} ({v.cargoDescription})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Shipment Lat (°N)</label>
                <input
                  type="number"
                  step={0.0001}
                  value={testLat}
                  onChange={(e) => {
                    const lat = parseFloat(e.target.value) || 0;
                    handleUpdateShipmentCoordinates({ lat, lng: testLng });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Shipment Lng (°E)</label>
                <input
                  type="number"
                  step={0.0001}
                  value={testLng}
                  onChange={(e) => {
                    const lng = parseFloat(e.target.value) || 0;
                    handleUpdateShipmentCoordinates({ lat: testLat, lng });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold"
                />
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Closest Zone:</span>
                <span className="font-bold text-slate-900 truncate max-w-[170px]">
                  {currentVehicleEvaluation.closestZone.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Distance to Center:</span>
                <span className="font-bold text-slate-900">
                  {(currentVehicleEvaluation.distanceMeters / 1000).toFixed(2)} km ({currentVehicleEvaluation.distanceMeters}m)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Zone Boundary Radius:</span>
                <span className="font-bold text-slate-900">
                  {(currentVehicleEvaluation.closestZone.radiusMeters / 1000).toFixed(1)} km
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (7 Cols): Interactive Leaflet Spatial Canvas */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-mono font-bold uppercase text-slate-700">
                Leaflet Circular Geofence Visualizer
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> IN_ZONE
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> APPROACHING
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> EXITED_ZONE
              </span>
            </div>
          </div>

          {/* Leaflet Map Canvas Container */}
          <div className="w-full h-[400px] sm:h-[450px] rounded-2xl overflow-hidden border border-slate-300 relative bg-slate-100 shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full" />
            
            {/* Click-to-Plot Map Overlay Tooltip */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/80 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl text-[11px] font-mono flex items-center gap-2 shadow-md pointer-events-none">
              <Crosshair className="w-3.5 h-3.5 text-sky-400" />
              <span>Click anywhere on map to capture Lat & Lng coordinates</span>
            </div>
          </div>

          {/* Live Geofence Event Transition Log */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-xs font-mono font-bold uppercase text-slate-700">
                  Perimeter Boundary Event Log
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Real-Time Spatial Transition Log
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px]">
              {transitionEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      evt.status === 'IN_ZONE'
                        ? 'bg-emerald-500'
                        : evt.status === 'APPROACHING'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`} />
                    <span className="font-bold text-slate-900">{evt.truckId}</span>
                    <span className="text-slate-500 truncate">{evt.zoneName}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      evt.status === 'IN_ZONE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : evt.status === 'APPROACHING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {evt.status}
                    </span>
                    <span className="text-[10px] text-slate-400">{evt.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
