/**
 * AgriSupply Chain & Smart Cold-Chain Logistics Platform
 * Core TypeScript Domain Types & Interfaces
 */

export type UserRole = 'FARMER' | 'TRANSPORTER' | 'WAREHOUSE_ADMIN' | 'COMPLIANCE_AUDITOR';

export type ThemeMode = 'light' | 'dark';

export type LanguageCode = 
  | 'en' // English
  | 'ur' // Urdu (RTL)
  | 'pa' // Punjabi
  | 'sd' // Sindhi (RTL)
  | 'ps' // Pashto (RTL)
  | 'hi' // Hindi
  | 'ar' // Arabic (RTL)
  | 'es' // Spanish
  | 'fr' // French
  | 'zh'; // Chinese

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
  | 'tomatoes'
  | 'potatoes'
  | 'spinach'
  | 'mangoes'
  | 'strawberries'
  | 'apples'
  | 'dates'
  | 'peaches'
  | 'lettuce'
  | 'avocados';

export type QualityGrade = 'GRADE_A_EXPORT' | 'GRADE_B_DOMESTIC' | 'GRADE_C_PROCESSING' | 'REJECTED_QUARANTINE';

export type PipelineStage = 
  | 'PENDING'
  | 'QUALITY_CHECKED'
  | 'IN_TRANSIT'
  | 'AT_WAREHOUSE'
  | 'DELIVERED';

export type ColdChainStatus = 'OPTIMAL' | 'WARNING' | 'CRITICAL_BREACH' | 'RECOVERING';

export interface TelemetryPoint {
  timestamp: string;
  temperatureC: number;
  humidityPercent: number;
  compressorRpm: number;
  batterySocPercent: number;
  ambientTempC: number;
  isBreach: boolean;
  breachSeverity: 'NONE' | 'MINOR_VARIANCE' | 'CRITICAL_EXCURSION';
  durationMinutesExceeded?: number;
  correctiveActionTaken?: string;
}

export interface TemperatureBreachRecord {
  id: string;
  batchId: string;
  timestamp: string;
  durationMinutes: number;
  peakTemperatureC: number;
  thresholdLimitC: number;
  excursionDeltaC: number;
  locationAtBreach: string;
  rootCause: string;
  remedialAction: string;
  qualityImpactAssessment: 'NEGLIGIBLE' | 'SHELF_LIFE_REDUCED_10%' | 'CRITICAL_SPOILAGE_RISK';
  quarantineTriggered: boolean;
  auditorAck: boolean;
  blockchainHash: string;
}

export interface ProduceBatch {
  id: string; // e.g. #ASG-001 or BATCH-2026-0849
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
  freshnessScorePercent: number;
  brixSugarScore?: number;
  firmnessPsi?: number;
  defectsPercent?: number;
  stage: PipelineStage;
  assignedReeferId?: string;
  destinationHub: string;
  estimatedTransitTime: string;
  blockchainSealHash: string;
  stageEnteredAt: string;
  inspectedBy?: string;
  notes?: string;
  imageProofUrl?: string;
  telemetryHistory: TelemetryPoint[];
  breachRecords: TemperatureBreachRecord[];
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
  id: string; // e.g. TRK-024
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
  originName: string;
  destinationName: string;
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
  category: 'LOCATION_UPDATE' | 'DELIVERY_STATUS' | 'INSPECTION_RECORD' | 'FORM_SUBMISSION';
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

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  quickActions?: string[];
}
