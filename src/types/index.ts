/**
 * AgriSupply Chain & Smart Cold-Chain Logistics Platform
 * Core TypeScript Domain Types & Interfaces
 */

export type UserRole = 'FARMER' | 'TRANSPORTER' | 'WAREHOUSE_ADMIN' | 'COMPLIANCE_AUDITOR';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  location: string;
  avatarUrl?: string;
  token: string;
  permissions: string[];
}

export type ProduceCommodity = 
  | 'strawberries'
  | 'lettuce'
  | 'tomatoes'
  | 'avocados'
  | 'blueberries';

export type QualityGrade = 'GRADE_A_EXPORT' | 'GRADE_B_DOMESTIC' | 'GRADE_C_PROCESSING' | 'REJECTED_QUARANTINE';

export type PipelineStage = 
  | 'HARVEST_INTAKE'
  | 'PRE_COOLING_QA'
  | 'IN_TRANSIT_REEFER'
  | 'COLD_HUB_INTAKE'
  | 'URBAN_DISTRIBUTION'
  | 'RETAIL_READY';

export type ColdChainStatus = 'OPTIMAL' | 'WARNING' | 'CRITICAL_BREACH' | 'RECOVERING';

export interface ProduceBatch {
  id: string; // e.g. BATCH-2026-0849
  commodity: ProduceCommodity;
  variety: string;
  farmerName: string;
  farmLocation: string;
  harvestDate: string;
  quantityKg: number;
  targetTempMin: number; // °C
  targetTempMax: number; // °C
  targetHumidityMin: number; // %
  targetHumidityMax: number; // %
  currentTemp: number;
  currentHumidity: number;
  coldChainStatus: ColdChainStatus;
  qualityGrade: QualityGrade;
  brixSugarScore?: number;
  firmnessPsi?: number;
  stage: PipelineStage;
  assignedReeferId?: string;
  destinationHub: string;
  blockchainSealHash: string;
  stageEnteredAt: string;
  inspectedBy?: string;
  notes?: string;
}

export interface GeofenceCoordinate {
  lat: number;
  lng: number;
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'ORIGIN_FARM' | 'INTERMEDIATE_DEPOT' | 'COLD_STORAGE_HUB' | 'URBAN_DISTRIBUTION';
  center: GeofenceCoordinate;
  radiusMeters: number;
  color: string;
}

export interface ReeferVehicle {
  id: string; // e.g. REEFER-TRK-804
  driverName: string;
  carrier: string;
  licensePlate: string;
  status: 'STATIONARY_LOADING' | 'EN_ROUTE' | 'PERIMETER_APPROACH' | 'UNLOADING' | 'THERMAL_INCIDENT';
  currentLocation: GeofenceCoordinate;
  speedKmh: number;
  headingDegrees: number;
  cargoBatchId: string;
  cargoDescription: string;
  reeferTemp: number; // °C
  targetTemp: number; // °C
  humidity: number; // %
  compressorRpm: number;
  batteryHealthPercent: number;
  doorSealed: boolean;
  distanceToDestKm: number;
  etaMinutes: number;
  insideGeofence: boolean;
  nearestGeofenceZoneId?: string;
  routeProgressPercent: number;
}

export interface TelemetryReading {
  timestamp: string;
  coreTemp: number;
  ambientTemp: number;
  humidity: number;
  compressorDuty: number;
  batterySoc: number;
  status: ColdChainStatus;
}

export interface OfflineMutation {
  id: string;
  type: 'CREATE_BATCH' | 'LOG_INSPECTION' | 'STAGE_TRANSITION' | 'THERMAL_OVERRIDE' | 'DISPATCH_RECEIPT';
  payload: Record<string, unknown>;
  queuedAt: string;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  description: string;
}

export interface ComplianceAuditLog {
  id: string;
  timestamp: string;
  batchId: string;
  auditorName: string;
  action: string;
  blockchainHash: string;
  status: 'VERIFIED' | 'FLAGGED' | 'RESOLVED';
  details: string;
}
