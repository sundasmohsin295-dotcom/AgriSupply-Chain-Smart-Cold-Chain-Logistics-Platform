import { GeofenceCoordinate, GeofenceZone } from '../types';

/**
 * Calculates great-circle distance between two geographic coordinates using Haversine formula
 * @returns distance in meters
 */
export function calculateHaversineDistance(
  coord1: GeofenceCoordinate,
  coord2: GeofenceCoordinate
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (coord1.lat * Math.PI) / 180;
  const phi2 = (coord2.lat * Math.PI) / 180;
  const deltaPhi = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLambda = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Checks whether coordinate is strictly inside a geofence zone boundary
 */
export function isCoordinateInsideGeofence(
  coord: GeofenceCoordinate,
  zone: GeofenceZone
): { inside: boolean; distanceMeters: number } {
  const distanceMeters = calculateHaversineDistance(coord, zone.center);
  return {
    inside: distanceMeters <= zone.radiusMeters,
    distanceMeters
  };
}

/**
 * Finds closest geofence zone for a vehicle and calculates status
 */
export function evaluateVehicleGeofences(
  coord: GeofenceCoordinate,
  zones: GeofenceZone[]
): {
  nearestZone: GeofenceZone | null;
  distanceMeters: number;
  isInside: boolean;
  insideGeofence: boolean;
  distanceToNearestMeters: number;
  alertLevel: 'NORMAL' | 'APPROACHING' | 'BREACH_ENTERED';
} {
  if (zones.length === 0) {
    return { 
      nearestZone: null, 
      distanceMeters: Infinity, 
      distanceToNearestMeters: Infinity, 
      isInside: false, 
      insideGeofence: false, 
      alertLevel: 'NORMAL' 
    };
  }

  let nearestZone: GeofenceZone = zones[0]!;
  let minDistance = calculateHaversineDistance(coord, nearestZone.center);

  for (let i = 1; i < zones.length; i++) {
    const currentZone = zones[i]!;
    const dist = calculateHaversineDistance(coord, currentZone.center);
    if (dist < minDistance) {
      minDistance = dist;
      nearestZone = currentZone;
    }
  }

  const isInside = minDistance <= nearestZone.radiusMeters;
  const isApproaching = !isInside && minDistance <= nearestZone.radiusMeters * 2.5;

  return {
    nearestZone,
    distanceMeters: Math.round(minDistance),
    distanceToNearestMeters: Math.round(minDistance),
    isInside,
    insideGeofence: isInside,
    alertLevel: isInside ? 'BREACH_ENTERED' : isApproaching ? 'APPROACHING' : 'NORMAL'
  };
}

/**
 * Interpolates coordinate between start and end given progress (0 to 1)
 */
export function interpolateRouteCoordinate(
  start: GeofenceCoordinate,
  end: GeofenceCoordinate,
  fraction: number
): GeofenceCoordinate {
  const clamped = Math.max(0, Math.min(1, fraction));
  return {
    lat: start.lat + (end.lat - start.lat) * clamped,
    lng: start.lng + (end.lng - start.lng) * clamped
  };
}
