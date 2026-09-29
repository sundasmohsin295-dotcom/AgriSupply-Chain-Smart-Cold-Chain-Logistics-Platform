/**
 * GPS Provider Abstraction: Real Device Geolocation + Simulated Corridor GPS
 * 
 * Provides an enterprise transport boundary allowing seamless switching between
 * real physical browser geolocation (navigator.geolocation.watchPosition) and
 * high-fidelity route simulation across Pakistani transit corridors.
 * Clearly labels telemetry as "REAL GPS" vs "DEMO GPS (SIMULATION)".
 */

import { GeofenceCoordinate } from '../types';
import { interpolateRouteCoordinate } from '../lib/geofence';

export type GPSMode = 'real' | 'simulation';

export interface GPSStatus {
  mode: GPSMode;
  isWatching: boolean;
  accuracyMeters?: number;
  errorMessage?: string;
  isRealDevice: boolean;
}

// Real Pakistani Transit Corridor Waypoints (Multan -> Okara -> Lahore)
export const PAKISTAN_CORRIDOR_WAYPOINTS: GeofenceCoordinate[] = [
  { lat: 29.9715, lng: 71.4930 }, // Multan Farm Intake (Origin)
  { lat: 30.3800, lng: 72.4800 }, // Sahiwal Transit Checkpoint
  { lat: 30.8100, lng: 73.4500 }, // Okara Cold Depository Depot
  { lat: 31.1800, lng: 73.8500 }, // Bhai Pheru Toll Corridor
  { lat: 31.5204, lng: 74.3587 }  // Lahore Central Cold Storage Hub (Destination)
];

export type GPSCoordinateListener = (
  coordinate: GeofenceCoordinate,
  status: GPSStatus
) => void;

class GPSProviderService {
  private mode: GPSMode = 'simulation';
  private watchId: number | null = null;
  private simulationIntervalId: ReturnType<typeof setInterval> | null = null;
  private routeProgress: number = 65.0; // %
  private listeners: Set<GPSCoordinateListener> = new Set();
  private lastCoord: GeofenceCoordinate = PAKISTAN_CORRIDOR_WAYPOINTS[0]!;
  private lastAccuracy?: number;
  private errorMessage?: string;

  constructor() {
    this.start();
  }

  public setMode(mode: GPSMode): void {
    if (this.mode === mode) return;
    this.stop();
    this.mode = mode;
    this.start();
  }

  public getMode(): GPSMode {
    return this.mode;
  }

  public getStatus(): GPSStatus {
    return {
      mode: this.mode,
      isWatching: this.watchId !== null || this.simulationIntervalId !== null,
      accuracyMeters: this.lastAccuracy,
      errorMessage: this.errorMessage,
      isRealDevice: this.mode === 'real'
    };
  }

  public subscribe(listener: GPSCoordinateListener): () => void {
    this.listeners.add(listener);
    // Emit immediate current state
    listener(this.lastCoord, this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public start(): void {
    this.errorMessage = undefined;

    if (this.mode === 'real') {
      this.startRealGeolocation();
    } else {
      this.startSimulation();
    }
  }

  public stop(): void {
    if (this.watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.simulationIntervalId !== null) {
      clearInterval(this.simulationIntervalId);
      this.simulationIntervalId = null;
    }
  }

  private startRealGeolocation(): void {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      this.errorMessage = 'Browser Geolocation API unavailable on this device.';
      this.notify(this.lastCoord);
      return;
    }

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.errorMessage = undefined;
          this.lastAccuracy = Math.round(pos.coords.accuracy);
          const coord: GeofenceCoordinate = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          this.lastCoord = coord;
          this.notify(coord);
        },
        (err) => {
          console.warn('[GPSProvider] Real GPS watch error:', err.message);
          this.errorMessage = `GPS Error: ${err.message}. Showing last known waypoint.`;
          this.notify(this.lastCoord);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    } catch (e) {
      this.errorMessage = 'Geolocation permission restricted or unavailable.';
      this.notify(this.lastCoord);
    }
  }

  private startSimulation(): void {
    if (this.simulationIntervalId) clearInterval(this.simulationIntervalId);

    this.simulationIntervalId = setInterval(() => {
      this.routeProgress = this.routeProgress >= 100 ? 5 : Number((this.routeProgress + 0.8).toFixed(1));
      
      const coord = this.interpolateCorridorPosition(this.routeProgress);
      this.lastCoord = coord;
      this.lastAccuracy = 8.5; // High accuracy simulated GPS fix
      this.notify(coord);
    }, 2000);
  }

  public interpolateCorridorPosition(progressPct: number): GeofenceCoordinate {
    const totalSegments = PAKISTAN_CORRIDOR_WAYPOINTS.length - 1;
    const scaled = (progressPct / 100) * totalSegments;
    const segmentIndex = Math.min(Math.floor(scaled), totalSegments - 1);
    const fraction = scaled - segmentIndex;

    const start = PAKISTAN_CORRIDOR_WAYPOINTS[segmentIndex]!;
    const end = PAKISTAN_CORRIDOR_WAYPOINTS[segmentIndex + 1]!;

    return interpolateRouteCoordinate(start, end, fraction);
  }

  public setSimulatedProgress(progressPct: number): void {
    this.routeProgress = Math.max(0, Math.min(100, progressPct));
    const coord = this.interpolateCorridorPosition(this.routeProgress);
    this.lastCoord = coord;
    this.notify(coord);
  }

  public getRouteProgress(): number {
    return this.routeProgress;
  }

  private notify(coord: GeofenceCoordinate): void {
    const status = this.getStatus();
    for (const listener of this.listeners) {
      try {
        listener(coord, status);
      } catch (err) {
        console.error('Error notifying GPS listener:', err);
      }
    }
  }
}

export const gpsProvider = new GPSProviderService();
