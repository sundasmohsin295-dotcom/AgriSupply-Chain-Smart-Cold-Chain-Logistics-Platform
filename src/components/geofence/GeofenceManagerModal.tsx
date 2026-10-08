import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { GeofenceZone, GeofenceCoordinate } from '../../types';
import { GEOFENCE_ZONES } from '../../lib/constants';
import { calculateHaversineDistance } from '../../lib/geofence';
import { 
  X, 
  MapPin, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  Layers, 
  Compass, 
  Maximize2,
  Info,
  Radio,
  Sliders
} from 'lucide-react';

interface GeofenceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onZonesUpdated?: (zones: GeofenceZone[]) => void;
}

export const GeofenceManagerModal: React.FC<GeofenceManagerModalProps> = ({
  isOpen,
  onClose,
  onZonesUpdated
}) => {
  const [zones, setZones] = useState<GeofenceZone[]>(() => [...GEOFENCE_ZONES]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(GEOFENCE_ZONES[0]?.id || '');

  // New Zone Form State
  const [isAddingZone, setIsAddingZone] = useState<boolean>(false);
  const [newZoneName, setNewZoneName] = useState<string>('Sahiwal Cold Bay Extension');
  const [newZoneType, setNewZoneType] = useState<GeofenceZone['type']>('INTERMEDIATE_DEPOT');
  const [newZoneLat, setNewZoneLat] = useState<number>(30.6682);
  const [newZoneLng, setNewZoneLng] = useState<number>(73.1114);
  const [newZoneRadius, setNewZoneRadius] = useState<number>(2500);

  // Test Coordinate Simulation State
  const [testLat, setTestLat] = useState<number>(30.8120);
  const [testLng, setTestLng] = useState<number>(73.4510);
  const [testResult, setTestResult] = useState<{ inside: boolean; zoneName?: string; distanceMeters: number } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [30.8, 73.2],
          zoom: 7,
          zoomControl: true,
          attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          minZoom: 4
        }).addTo(map);

        const circleGroup = L.layerGroup().addTo(map);
        circlesLayerRef.current = circleGroup;
        mapInstanceRef.current = map;
      }

      // Re-render circles whenever zones update
      if (circlesLayerRef.current) {
        circlesLayerRef.current.clearLayers();

        zones.forEach((z) => {
          const circleColor = z.type === 'ORIGIN_FARM' ? '#10b981' : z.type === 'COLD_STORAGE_HUB' ? '#0284c7' : '#f59e0b';
          const circle = L.circle([z.center.lat, z.center.lng], {
            radius: z.radiusMeters,
            color: circleColor,
            weight: 2,
            fillColor: circleColor,
            fillOpacity: 0.18
          });

          circle.bindTooltip(`<b>${z.name}</b><br/>Type: ${z.type}<br/>Radius: ${(z.radiusMeters / 1000).toFixed(1)} km`, {
            direction: 'top'
          });

          circlesLayerRef.current?.addLayer(circle);

          // Center Marker
          const icon = L.divIcon({
            className: 'geofence-pin',
            html: `<div style="background-color: ${circleColor}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5]
          });
          L.marker([z.center.lat, z.center.lng], { icon }).addTo(circlesLayerRef.current!);
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, zones]);

  // Clean up on modal close
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Add Zone Handler
  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    const newZone: GeofenceZone = {
      id: `zone_custom_${Date.now()}`,
      name: newZoneName,
      type: newZoneType,
      center: { lat: newZoneLat, lng: newZoneLng },
      radiusMeters: newZoneRadius,
      color: newZoneType === 'ORIGIN_FARM' ? '#10b981' : '#0284c7'
    };

    const updated = [...zones, newZone];
    setZones(updated);
    setIsAddingZone(false);
    if (onZonesUpdated) onZonesUpdated(updated);

    // Center map on new zone
    mapInstanceRef.current?.setView([newZoneLat, newZoneLng], 10, { animate: true });
  };

  // Delete Zone Handler
  const handleDeleteZone = (id: string) => {
    const updated = zones.filter((z) => z.id !== id);
    setZones(updated);
    if (onZonesUpdated) onZonesUpdated(updated);
  };

  // Test Coordinate Proximity Evaluation
  const handleTestCoordinate = (e: React.FormEvent) => {
    e.preventDefault();
    const testCoord: GeofenceCoordinate = { lat: testLat, lng: testLng };
    let insideAny = false;
    let matchedZoneName = '';
    let minDistance = Infinity;

    zones.forEach((z) => {
      const dist = calculateHaversineDistance(testCoord, z.center);
      if (dist < minDistance) {
        minDistance = dist;
      }
      if (dist <= z.radiusMeters) {
        insideAny = true;
        matchedZoneName = z.name;
      }
    });

    setTestResult({
      inside: insideAny,
      zoneName: matchedZoneName || undefined,
      distanceMeters: minDistance
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Virtual Geofence Manager & Spatial Rules Engine
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {zones.length} Active Zones
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Define circular perimeter boundaries around farms, intermediate cold depots, and terminal depositories.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Grid */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* Left Column (5 cols): Zone List & Zone Creation */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-700 uppercase">Perimeter Zones</span>
              <button
                onClick={() => setIsAddingZone(!isAddingZone)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingZone ? 'Cancel' : 'Add Virtual Zone'}</span>
              </button>
            </div>

            {/* Add Zone Inline Form */}
            {isAddingZone && (
              <form onSubmit={handleAddZone} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs animate-in fade-in">
                <div className="font-bold text-slate-900">Define New Spatial Perimeter</div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Zone Name</label>
                  <input
                    type="text"
                    required
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Zone Type</label>
                    <select
                      value={newZoneType}
                      onChange={(e) => setNewZoneType(e.target.value as GeofenceZone['type'])}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none"
                    >
                      <option value="ORIGIN_FARM">Origin Farm</option>
                      <option value="INTERMEDIATE_DEPOT">Intermediate Depot</option>
                      <option value="COLD_STORAGE_HUB">Cold Storage Hub</option>
                      <option value="URBAN_DISTRIBUTION">Urban Distribution</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Radius (Meters)</label>
                    <input
                      type="number"
                      required
                      min={500}
                      max={20000}
                      step={500}
                      value={newZoneRadius}
                      onChange={(e) => setNewZoneRadius(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Center Lat (°N)</label>
                    <input
                      type="number"
                      step={0.0001}
                      required
                      value={newZoneLat}
                      onChange={(e) => setNewZoneLat(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Center Lng (°E)</label>
                    <input
                      type="number"
                      step={0.0001}
                      required
                      value={newZoneLng}
                      onChange={(e) => setNewZoneLng(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                >
                  Save & Plot Geofence
                </button>
              </form>
            )}

            {/* List of Existing Zones */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {zones.map((z) => (
                <div
                  key={z.id}
                  onClick={() => {
                    setSelectedZoneId(z.id);
                    mapInstanceRef.current?.setView([z.center.lat, z.center.lng], 11, { animate: true });
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    selectedZoneId === z.id
                      ? 'bg-sky-50 border-sky-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900">{z.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {(z.radiusMeters / 1000).toFixed(1)} km
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                      {z.center.lat.toFixed(4)}°N, {z.center.lng.toFixed(4)}°E · {z.type}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteZone(z.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition rounded"
                    title="Delete Zone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Spatial Rule Test Simulator */}
            <form onSubmit={handleTestCoordinate} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <span className="font-bold text-slate-800 block">Test Virtual Boundary Crossing</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-mono">Test Lat</label>
                  <input
                    type="number"
                    step={0.0001}
                    value={testLat}
                    onChange={(e) => setTestLat(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-300 bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-mono">Test Lng</label>
                  <input
                    type="number"
                    step={0.0001}
                    value={testLng}
                    onChange={(e) => setTestLng(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-300 bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition"
              >
                Evaluate Geofence Breach / Arrival
              </button>

              {testResult && (
                <div className={`p-2.5 rounded-lg border text-xs font-mono ${
                  testResult.inside
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}>
                  {testResult.inside ? (
                    <span className="font-bold">✓ INSIDE PERIMETER: {testResult.zoneName} (Auto-docking triggered)</span>
                  ) : (
                    <span>● OUTSIDE PERIMETER: {(testResult.distanceMeters / 1000).toFixed(1)} km to closest zone</span>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Right Column (7 cols): Leaflet Interactive Visualizer */}
          <div className="lg:col-span-7 flex flex-col space-y-2">
            <span className="text-xs font-mono font-bold text-slate-700 uppercase">
              Leaflet Spatial Overlay Matrix
            </span>

            <div className="flex-1 w-full min-h-[360px] rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100">
              <div ref={mapContainerRef} className="w-full h-full min-h-[380px]" />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
              <span>Projection: EPSG:3857 · Spatial Math: Haversine R=6371km</span>
              <span className="text-emerald-700 font-bold">Automatic State Trigger Active</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
