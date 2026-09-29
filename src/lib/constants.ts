import { ProduceCommodity, ProduceBatch, GeofenceZone, ReeferVehicle, ComplianceAuditLog } from '../types';

export const COMMODITY_PROFILES: Record<ProduceCommodity, {
  name: string;
  scientificName: string;
  icon: string;
  defaultTempMin: number;
  defaultTempMax: number;
  defaultHumidityMin: number;
  defaultHumidityMax: number;
  optimalBrix: string;
  firmnessRange: string;
  shelfLifeDays: number;
  recommendedPreCooling: string;
  lossRiskFactor: string;
}> = {
  strawberries: {
    name: 'Organic Albion Strawberries',
    scientificName: 'Fragaria × ananassa',
    icon: '🍓',
    defaultTempMin: 0.5,
    defaultTempMax: 2.5,
    defaultHumidityMin: 90,
    defaultHumidityMax: 95,
    optimalBrix: '8.5 - 12.0° Bx',
    firmnessRange: '4.5 - 6.2 PSI',
    shelfLifeDays: 7,
    recommendedPreCooling: 'Forced-Air Cooling within 1h of harvest',
    lossRiskFactor: 'High respiration; rapid botrytis mold if T > 4.0°C'
  },
  lettuce: {
    name: 'Hydroponic Romaine Hearts',
    scientificName: 'Lactuca sativa var. longifolia',
    icon: '🥬',
    defaultTempMin: 1.0,
    defaultTempMax: 3.5,
    defaultHumidityMin: 95,
    defaultHumidityMax: 98,
    optimalBrix: '3.2 - 4.5° Bx',
    firmnessRange: 'N/A (Turgor Pressure > 85%)',
    shelfLifeDays: 14,
    recommendedPreCooling: 'Vacuum Cooling to 2°C within 45m',
    lossRiskFactor: 'Tipburn and ethylene sensitivity; wilt risk'
  },
  tomatoes: {
    name: 'Vine-Ripened Roma Tomatoes',
    scientificName: 'Solanum lycopersicum',
    icon: '🍅',
    defaultTempMin: 10.0,
    defaultTempMax: 13.0,
    defaultHumidityMin: 85,
    defaultHumidityMax: 90,
    optimalBrix: '4.8 - 6.5° Bx',
    firmnessRange: '7.0 - 9.5 PSI',
    shelfLifeDays: 18,
    recommendedPreCooling: 'Room cooling (chilling injury occurs below 10°C)',
    lossRiskFactor: 'Chilling injury below 8°C causing mealy flesh'
  },
  avocados: {
    name: 'California Hass Avocados',
    scientificName: 'Persea americana',
    icon: '🥑',
    defaultTempMin: 4.5,
    defaultTempMax: 6.5,
    defaultHumidityMin: 85,
    defaultHumidityMax: 90,
    optimalBrix: 'N/A (Dry Matter > 24%)',
    firmnessRange: '14.0 - 18.0 PSI (Firm Stage 2)',
    shelfLifeDays: 28,
    recommendedPreCooling: 'Controlled Atmosphere Forced Air (2% O2 / 5% CO2)',
    lossRiskFactor: 'Internal flesh browning if delayed pre-cooling'
  },
  blueberries: {
    name: 'Coastal Organic Blueberries',
    scientificName: 'Vaccinium corymbosum',
    icon: '🫐',
    defaultTempMin: 0.0,
    defaultTempMax: 2.0,
    defaultHumidityMin: 90,
    defaultHumidityMax: 95,
    optimalBrix: '11.5 - 15.0° Bx',
    firmnessRange: '180 - 220 g/mm',
    shelfLifeDays: 21,
    recommendedPreCooling: 'Hydrocooling followed by forced-air drying',
    lossRiskFactor: 'Weight loss & stem dehydration above 3°C'
  }
};

export const GEOFENCE_ZONES: GeofenceZone[] = [
  {
    id: 'ZONE-SALINAS-FARM',
    name: 'Salinas Valley Central Harvest Intake',
    type: 'ORIGIN_FARM',
    center: { lat: 36.6777, lng: -121.6555 },
    radiusMeters: 1800,
    color: '#10b981' // emerald
  },
  {
    id: 'ZONE-GILROY-DEPOT',
    name: 'Gilroy Intermodal Cold Bay Depot',
    type: 'INTERMEDIATE_DEPOT',
    center: { lat: 37.0058, lng: -121.5683 },
    radiusMeters: 1200,
    color: '#38bdf8' // sky
  },
  {
    id: 'ZONE-SAN-JOSE-HUB',
    name: 'Silicon Valley Central Cold Storage Bay',
    type: 'COLD_STORAGE_HUB',
    center: { lat: 37.3382, lng: -121.8863 },
    radiusMeters: 2200,
    color: '#f59e0b' // amber
  },
  {
    id: 'ZONE-SF-URBAN-DC',
    name: 'San Francisco Bay Urban Distribution Center',
    type: 'URBAN_DISTRIBUTION',
    center: { lat: 37.7749, lng: -122.4194 },
    radiusMeters: 2500,
    color: '#8b5cf6' // violet
  }
];

export const INITIAL_BATCHES: ProduceBatch[] = [
  {
    id: 'BATCH-2026-0849',
    commodity: 'strawberries',
    variety: 'Albion Premium Export',
    farmerName: 'Mateo Morales & Sons',
    farmLocation: 'Salinas Valley Ranch #4, CA',
    harvestDate: '2026-09-28 06:30 PST',
    quantityKg: 4200,
    targetTempMin: 0.5,
    targetTempMax: 2.5,
    targetHumidityMin: 90,
    targetHumidityMax: 95,
    currentTemp: 1.8,
    currentHumidity: 92.4,
    coldChainStatus: 'OPTIMAL',
    qualityGrade: 'GRADE_A_EXPORT',
    brixSugarScore: 10.8,
    firmnessPsi: 5.6,
    stage: 'IN_TRANSIT_REEFER',
    assignedReeferId: 'REEFER-TRK-804',
    destinationHub: 'San Francisco Bay Urban Distribution Center',
    blockchainSealHash: '0x7f8a92e104b9c51a7e2830f3c8d91b40285a3b21',
    stageEnteredAt: '2026-09-28 14:15 PST',
    inspectedBy: 'Inspector Dr. Helen Vance (USDA #4829)',
    notes: 'Pre-cooled via forced air in 42 minutes. Sealed tamper-evident pallet tags.'
  },
  {
    id: 'BATCH-2026-0850',
    commodity: 'lettuce',
    variety: 'Hydroponic Artisan Romaine',
    farmerName: 'Verdant Valley Co-Op',
    farmLocation: 'Pajaro Dunes Farmstead, CA',
    harvestDate: '2026-09-28 08:15 PST',
    quantityKg: 6800,
    targetTempMin: 1.0,
    targetTempMax: 3.5,
    targetHumidityMin: 95,
    targetHumidityMax: 98,
    currentTemp: 2.2,
    currentHumidity: 96.1,
    coldChainStatus: 'OPTIMAL',
    qualityGrade: 'GRADE_A_EXPORT',
    brixSugarScore: 3.8,
    stage: 'COLD_HUB_INTAKE',
    assignedReeferId: 'REEFER-TRK-912',
    destinationHub: 'Silicon Valley Central Cold Storage Bay',
    blockchainSealHash: '0x3c990a184f7b2c5519ea81b94d12c8a7732d8471',
    stageEnteredAt: '2026-09-28 17:40 PST',
    inspectedBy: 'Lead Agronomist S. Chen',
    notes: 'Vacuum cooled. Zero discoloration detected on outer bracts.'
  },
  {
    id: 'BATCH-2026-0851',
    commodity: 'avocados',
    variety: 'California Haas Reserve',
    farmerName: 'Coastal Ridge Groves',
    farmLocation: 'Carpinteria Bench, CA',
    harvestDate: '2026-09-27 11:00 PST',
    quantityKg: 12500,
    targetTempMin: 4.5,
    targetTempMax: 6.5,
    targetHumidityMin: 85,
    targetHumidityMax: 90,
    currentTemp: 5.1,
    currentHumidity: 88.0,
    coldChainStatus: 'OPTIMAL',
    qualityGrade: 'GRADE_A_EXPORT',
    firmnessPsi: 16.5,
    stage: 'URBAN_DISTRIBUTION',
    destinationHub: 'San Francisco Bay Urban Distribution Center',
    blockchainSealHash: '0x9910e527fca83018e47b319aa514d9b23419c8f0',
    stageEnteredAt: '2026-09-29 02:20 PST',
    inspectedBy: 'Inspector J. Thorne (GlobalGAP)',
    notes: 'Controlled atmosphere intake verified. Dry matter tested at 26.4%.'
  },
  {
    id: 'BATCH-2026-0852',
    commodity: 'blueberries',
    variety: 'Emerald Sweet Crisp',
    farmerName: 'Del Mar Berry Farms',
    farmLocation: 'Watsonville Plot 12, CA',
    harvestDate: '2026-09-29 05:00 PST',
    quantityKg: 2800,
    targetTempMin: 0.0,
    targetTempMax: 2.0,
    targetHumidityMin: 90,
    targetHumidityMax: 95,
    currentTemp: 1.1,
    currentHumidity: 93.8,
    coldChainStatus: 'OPTIMAL',
    qualityGrade: 'GRADE_A_EXPORT',
    brixSugarScore: 13.9,
    stage: 'PRE_COOLING_QA',
    destinationHub: 'Silicon Valley Central Cold Storage Bay',
    blockchainSealHash: '0x14f9d832a68c071e98bb42c589a1945d820bf991',
    stageEnteredAt: '2026-09-29 06:10 PST',
    inspectedBy: 'Station Tech Marcus Ray',
    notes: 'Currently undergoing hydrocooling in Bay #02.'
  },
  {
    id: 'BATCH-2026-0853',
    commodity: 'tomatoes',
    variety: 'San Marzano Vine Roma',
    farmerName: 'SunHarvest Organics',
    farmLocation: 'Hollister Valley, CA',
    harvestDate: '2026-09-28 13:00 PST',
    quantityKg: 8400,
    targetTempMin: 10.0,
    targetTempMax: 13.0,
    targetHumidityMin: 85,
    targetHumidityMax: 90,
    currentTemp: 11.4,
    currentHumidity: 87.2,
    coldChainStatus: 'OPTIMAL',
    qualityGrade: 'GRADE_B_DOMESTIC',
    brixSugarScore: 5.4,
    firmnessPsi: 8.2,
    stage: 'HARVEST_INTAKE',
    destinationHub: 'Silicon Valley Central Cold Storage Bay',
    blockchainSealHash: '0x8849bca719e00234f9a341098e71b26c04f98127',
    stageEnteredAt: '2026-09-29 04:30 PST',
    inspectedBy: 'Receiving Tech Amanda Gomez',
    notes: 'Awaiting pallet barcode scanning and initial core probe log.'
  },
  {
    id: 'BATCH-2026-0847',
    commodity: 'strawberries',
    variety: 'Monterey Day-Neutral',
    farmerName: 'Morales Agro Holdings',
    farmLocation: 'Castroville Fields, CA',
    harvestDate: '2026-09-26 07:00 PST',
    quantityKg: 5100,
    targetTempMin: 0.5,
    targetTempMax: 2.5,
    targetHumidityMin: 90,
    targetHumidityMax: 95,
    currentTemp: 1.9,
    currentHumidity: 91.5,
    coldChainStatus: 'OPTIMAL',
    qualityGrade: 'GRADE_A_EXPORT',
    brixSugarScore: 11.2,
    stage: 'RETAIL_READY',
    destinationHub: 'Whole Foods Market Flagship Northern CA',
    blockchainSealHash: '0x22194b8e3a7590d9841f38e409b8c029d816a445',
    stageEnteredAt: '2026-09-28 20:15 PST',
    inspectedBy: 'Retail Acceptance Specialist K. Ross',
    notes: 'Store shelf distribution initiated with 99.4% freshness index.'
  }
];

export const INITIAL_REEFERS: ReeferVehicle[] = [
  {
    id: 'REEFER-TRK-804',
    driverName: 'Carlos Mendonca',
    carrier: 'Pacific Cold-Link Logistics Inc.',
    licensePlate: '7CA-COLD804',
    status: 'EN_ROUTE',
    currentLocation: { lat: 37.1950, lng: -121.7200 },
    speedKmh: 88,
    headingDegrees: 335,
    cargoBatchId: 'BATCH-2026-0849',
    cargoDescription: '4,200 kg Organic Albion Strawberries',
    reeferTemp: 1.8,
    targetTemp: 1.5,
    humidity: 92.4,
    compressorRpm: 1950,
    batteryHealthPercent: 96,
    doorSealed: true,
    distanceToDestKm: 78.4,
    etaMinutes: 53,
    insideGeofence: false,
    nearestGeofenceZoneId: 'ZONE-SAN-JOSE-HUB',
    routeProgressPercent: 58
  },
  {
    id: 'REEFER-TRK-912',
    driverName: 'Sgt. Dale Vance',
    carrier: 'Sierra Reefer Express',
    licensePlate: '9CA-FROST912',
    status: 'PERIMETER_APPROACH',
    currentLocation: { lat: 37.3320, lng: -121.8890 },
    speedKmh: 34,
    headingDegrees: 310,
    cargoBatchId: 'BATCH-2026-0850',
    cargoDescription: '6,800 kg Hydroponic Romaine Hearts',
    reeferTemp: 2.2,
    targetTemp: 2.0,
    humidity: 96.1,
    compressorRpm: 1420,
    batteryHealthPercent: 92,
    doorSealed: true,
    distanceToDestKm: 1.2,
    etaMinutes: 3,
    insideGeofence: true,
    nearestGeofenceZoneId: 'ZONE-SAN-JOSE-HUB',
    routeProgressPercent: 94
  },
  {
    id: 'REEFER-TRK-440',
    driverName: 'Tariq Al-Mansoor',
    carrier: 'Golden State Freight',
    licensePlate: '3CA-CHILL440',
    status: 'STATIONARY_LOADING',
    currentLocation: { lat: 36.6780, lng: -121.6560 },
    speedKmh: 0,
    headingDegrees: 0,
    cargoBatchId: 'BATCH-2026-0853',
    cargoDescription: '8,400 kg Roma Tomatoes',
    reeferTemp: 11.4,
    targetTemp: 11.5,
    humidity: 87.2,
    compressorRpm: 800,
    batteryHealthPercent: 98,
    doorSealed: false,
    distanceToDestKm: 122.0,
    etaMinutes: 110,
    insideGeofence: true,
    nearestGeofenceZoneId: 'ZONE-SALINAS-FARM',
    routeProgressPercent: 0
  }
];

export const INITIAL_AUDIT_LOGS: ComplianceAuditLog[] = [
  {
    id: 'AUD-8831',
    timestamp: '2026-09-29 04:50 PST',
    batchId: 'BATCH-2026-0849',
    auditorName: 'Automated ColdGuard Oracle #19',
    action: 'Continuous Telemetry Ledger Commit',
    blockchainHash: '0x7f8a92e104b9c51a7e2830f3c8d91b40285a3b21',
    status: 'VERIFIED',
    details: '480 continuous 30-second thermal samples verified within ±0.3°C variance band. Zero breach incidents.'
  },
  {
    id: 'AUD-8830',
    timestamp: '2026-09-28 18:30 PST',
    batchId: 'BATCH-2026-0850',
    auditorName: 'Senior Inspector Dr. Helen Vance',
    action: 'USDA-AMS Pre-Cooling Sign-Off',
    blockchainHash: '0x3c990a184f7b2c5519ea81b94d12c8a7732d8471',
    status: 'VERIFIED',
    details: 'Core probe calibration checked against NIST standard thermometer #771. Deviation < 0.05°C.'
  },
  {
    id: 'AUD-8829',
    timestamp: '2026-09-28 09:12 PST',
    batchId: 'BATCH-2026-0845',
    auditorName: 'FDA FSMA Rule 204 Protocol',
    action: 'Traceability Lot Code Verification',
    blockchainHash: '0x9910e527fca83018e47b319aa514d9b23419c8f0',
    status: 'VERIFIED',
    details: 'Harvest origin coordinates and water quality microbial testing certificates verified on-chain.'
  }
];
