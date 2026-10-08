import { 
  ProduceCommodity, 
  ProduceBatch, 
  GeofenceZone, 
  ReeferVehicle, 
  ComplianceAuditLog,
  TelemetryPoint,
  TemperatureBreachRecord
} from '../types';

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
  potatoes: {
    name: 'Okara Cooperative Seed Potatoes',
    scientificName: 'Solanum tuberosum',
    icon: '🥔',
    defaultTempMin: 7.0,
    defaultTempMax: 10.0,
    defaultHumidityMin: 90,
    defaultHumidityMax: 95,
    optimalBrix: 'N/A (Starch index > 18%)',
    firmnessRange: 'Firm tuber integrity',
    shelfLifeDays: 90,
    recommendedPreCooling: 'Gradual curing at 15°C for 10 days before cold hold',
    lossRiskFactor: 'Sprouting above 12°C, sugar accumulation below 5°C'
  },
  spinach: {
    name: 'Tender Baby Spinach & Greens',
    scientificName: 'Spinacia oleracea',
    icon: '🥬',
    defaultTempMin: 0.5,
    defaultTempMax: 2.5,
    defaultHumidityMin: 95,
    defaultHumidityMax: 98,
    optimalBrix: '3.0 - 4.2° Bx',
    firmnessRange: 'Turgor > 90%',
    shelfLifeDays: 12,
    recommendedPreCooling: 'Hydro-vacuum cooling within 30m',
    lossRiskFactor: 'Rapid wilting and yellowing from ethylene'
  },
  mangoes: {
    name: 'Sindh Chaunsa Export Mangoes',
    scientificName: 'Mangifera indica',
    icon: '🥭',
    defaultTempMin: 11.5,
    defaultTempMax: 13.5,
    defaultHumidityMin: 85,
    defaultHumidityMax: 90,
    optimalBrix: '18.0 - 22.5° Bx',
    firmnessRange: '10.5 - 13.0 PSI',
    shelfLifeDays: 21,
    recommendedPreCooling: 'Hot water quarantine dip followed by forced-air step cooling',
    lossRiskFactor: 'Lenticel spot and sapburn; chilling injury below 10°C'
  },
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
  apples: {
    name: 'Swat Valley Honeycrisp Apples',
    scientificName: 'Malus domestica',
    icon: '🍎',
    defaultTempMin: 0.0,
    defaultTempMax: 2.0,
    defaultHumidityMin: 90,
    defaultHumidityMax: 95,
    optimalBrix: '13.0 - 15.5° Bx',
    firmnessRange: '15.0 - 18.0 PSI',
    shelfLifeDays: 120,
    recommendedPreCooling: 'Rapid room forced air to 1°C within 24h',
    lossRiskFactor: 'Internal breakdown and scald if ventilation stalls'
  },
  dates: {
    name: 'Sukkur Organic Aseel Dates',
    scientificName: 'Phoenix dactylifera',
    icon: '🌴',
    defaultTempMin: -2.0,
    defaultTempMax: 4.0,
    defaultHumidityMin: 65,
    defaultHumidityMax: 75,
    optimalBrix: '65.0 - 75.0° Bx',
    firmnessRange: 'Firm chewy crystallization',
    shelfLifeDays: 360,
    recommendedPreCooling: 'Pre-dry fumigation and cold stabilization',
    lossRiskFactor: 'Sugar migration and fermentation above 10°C'
  },
  peaches: {
    name: 'Peshawar Golden Sweet Peaches',
    scientificName: 'Prunus persica',
    icon: '🍑',
    defaultTempMin: 0.5,
    defaultTempMax: 2.0,
    defaultHumidityMin: 90,
    defaultHumidityMax: 95,
    optimalBrix: '11.0 - 13.5° Bx',
    firmnessRange: '8.0 - 11.0 PSI',
    shelfLifeDays: 14,
    recommendedPreCooling: 'Hydrocooling with chlorinated water to 3°C',
    lossRiskFactor: 'Woolliness and mealiness between 2.5°C and 7.5°C'
  },
  lettuce: {
    name: 'Hydroponic Romaine Hearts',
    scientificName: 'Lactuca sativa',
    icon: '🥬',
    defaultTempMin: 1.0,
    defaultTempMax: 3.5,
    defaultHumidityMin: 95,
    defaultHumidityMax: 98,
    optimalBrix: '3.2 - 4.5° Bx',
    firmnessRange: 'Turgor > 85%',
    shelfLifeDays: 14,
    recommendedPreCooling: 'Vacuum Cooling to 2°C within 45m',
    lossRiskFactor: 'Tipburn and ethylene sensitivity; wilt risk'
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
    firmnessRange: '14.0 - 18.0 PSI',
    shelfLifeDays: 28,
    recommendedPreCooling: 'Controlled Atmosphere Forced Air (2% O2 / 5% CO2)',
    lossRiskFactor: 'Internal flesh browning if delayed pre-cooling'
  }
};

// Helper to generate realistic historical telemetry log points
function generateTelemetryHistory(
  targetMin: number,
  targetMax: number,
  hasBreach: boolean,
  breachTemp: number = 0
): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const now = Date.now();
  const center = (targetMin + targetMax) / 2;

  for (let i = 12; i >= 0; i--) {
    const time = new Date(now - i * 3600000).toISOString().replace('T', ' ').slice(0, 16);
    
    // Simulate breach on index 4-6 if specified
    const isBreachPoint = hasBreach && (i >= 4 && i <= 6);
    const temp = isBreachPoint
      ? breachTemp + (Math.random() - 0.5) * 0.4
      : center + (Math.random() - 0.5) * 0.6;

    points.push({
      timestamp: time,
      temperatureC: parseFloat(temp.toFixed(2)),
      humidityPercent: parseFloat((91.5 + (Math.random() - 0.5) * 2).toFixed(1)),
      compressorRpm: isBreachPoint ? 950 : 1900 + Math.round((Math.random() - 0.5) * 80),
      batterySocPercent: Math.max(88, 98 - i),
      ambientTempC: parseFloat((28.5 + (Math.random() - 0.5) * 3).toFixed(1)),
      isBreach: isBreachPoint,
      breachSeverity: isBreachPoint ? (temp > targetMax + 2.5 ? 'CRITICAL_EXCURSION' : 'MINOR_VARIANCE') : 'NONE',
      durationMinutesExceeded: isBreachPoint ? 45 : 0,
      correctiveActionTaken: isBreachPoint ? 'Auxiliary DC Inverter Engaged; setpoint lowered to 1.5°C' : undefined
    });
  }
  return points;
}

export const INITIAL_BATCHES: ProduceBatch[] = [
  {
    id: '#ASG-001',
    commodity: 'tomatoes',
    variety: 'Vine-Ripened Roma Tomatoes',
    farmerName: 'Tariq Mehmood (Farm A)',
    farmLocation: 'Multan Citrus & Strawberry Hub Plot 4',
    harvestDate: '2026-09-28 06:30 PST',
    quantityKg: 2000,
    targetTempMin: 10.0,
    targetTempMax: 13.0,
    targetHumidityMin: 85,
    targetHumidityMax: 90,
    currentTemp: 11.2,
    currentHumidity: 88.4,
    coldChainStatus: 'OPTIMAL',
    qualityGrade: 'GRADE_A_EXPORT',
    freshnessScorePercent: 98,
    brixSugarScore: 5.6,
    firmnessPsi: 8.8,
    defectsPercent: 1.2,
    stage: 'IN_TRANSIT',
    assignedReeferId: 'TRK-024',
    destinationHub: 'Lahore Logistics Cold Terminal',
    estimatedTransitTime: '2h 30m',
    blockchainSealHash: '0x7f8a92e104b9c51a7e2830f3c8d91b40285a3b21',
    stageEnteredAt: '2026-09-28 14:15 PST',
    inspectedBy: 'Inspector Farooq Ahmed (PSQCA & GlobalGAP #4829)',
    notes: 'Pre-cooled in cold chamber #04. Uniform color and zero blossom-end rot.',
    imageProofUrl: '/src/assets/images/harvest_quality_berries_1790684177286.jpg',
    telemetryHistory: generateTelemetryHistory(10.0, 13.0, false),
    breachRecords: []
  },
  {
    id: '#ASG-002',
    commodity: 'potatoes',
    variety: 'Okara Cooperative Gold Tuber',
    farmerName: 'Okara Farm Collective (Farm B)',
    farmLocation: 'Okara Punjab Sector 9',
    harvestDate: '2026-09-28 08:15 PST',
    quantityKg: 5000,
    targetTempMin: 7.0,
    targetTempMax: 10.0,
    targetHumidityMin: 90,
    targetHumidityMax: 95,
    currentTemp: 8.4,
    currentHumidity: 92.1,
    coldChainStatus: 'OPTIMAL',
    qualityGrade: 'GRADE_A_EXPORT',
    freshnessScorePercent: 96,
    defectsPercent: 0.8,
    stage: 'AT_WAREHOUSE',
    assignedReeferId: 'TRK-019',
    destinationHub: 'Lahore Logistics Cold Terminal',
    estimatedTransitTime: '5h 15m',
    blockchainSealHash: '0x3c990a184f7b2c5519ea81b94d12c8a7732d8471',
    stageEnteredAt: '2026-09-28 17:40 PST',
    inspectedBy: 'Agronomist Farooq Ahmed',
    notes: 'Graded and cleaned. Cured skin intact with zero greening.',
    telemetryHistory: generateTelemetryHistory(7.0, 10.0, false),
    breachRecords: []
  },
  {
    id: '#ASG-003',
    commodity: 'spinach',
    variety: 'Hydroponic Tender Romaine & Spinach',
    farmerName: 'Green Valley Farms (Farm D)',
    farmLocation: 'Pajaro Valley Basin, CA',
    harvestDate: '2026-09-28 05:00 PST',
    quantityKg: 1200,
    targetTempMin: 0.5,
    targetTempMax: 2.5,
    targetHumidityMin: 95,
    targetHumidityMax: 98,
    currentTemp: 1.8,
    currentHumidity: 96.5,
    coldChainStatus: 'OPTIMAL',
    qualityGrade: 'GRADE_A_EXPORT',
    freshnessScorePercent: 99,
    brixSugarScore: 3.6,
    defectsPercent: 0.4,
    stage: 'QUALITY_CHECKED',
    destinationHub: 'Silicon Valley Central Cold Storage Bay',
    estimatedTransitTime: '1d 02h',
    blockchainSealHash: '0x14f9d832a68c071e98bb42c589a1945d820bf991',
    stageEnteredAt: '2026-09-28 10:20 PST',
    inspectedBy: 'Quality Lead Sarah Chen',
    notes: 'Hydro-vacuum cooled to 1.5°C in 28 minutes. Ready for cold loading.',
    telemetryHistory: generateTelemetryHistory(0.5, 2.5, false),
    breachRecords: []
  },
  {
    id: '#ASG-004',
    commodity: 'mangoes',
    variety: 'Sindh Chaunsa Reserve Export',
    farmerName: 'Mirpurkhas Mango Syndicate',
    farmLocation: 'Sindh Orchard Block 14',
    harvestDate: '2026-09-27 09:30 PST',
    quantityKg: 3500,
    targetTempMin: 11.5,
    targetTempMax: 13.5,
    targetHumidityMin: 85,
    targetHumidityMax: 90,
    currentTemp: 12.3,
    currentHumidity: 88.0,
    coldChainStatus: 'WARNING',
    qualityGrade: 'GRADE_A_EXPORT',
    freshnessScorePercent: 94,
    brixSugarScore: 19.8,
    firmnessPsi: 11.5,
    defectsPercent: 2.1,
    stage: 'DELIVERED',
    assignedReeferId: 'TRK-004',
    destinationHub: 'Karachi Port Terminal Hub 2',
    estimatedTransitTime: 'Completed',
    blockchainSealHash: '0x9910e527fca83018e47b319aa514d9b23419c8f0',
    stageEnteredAt: '2026-09-29 02:20 PST',
    inspectedBy: 'Senior Auditor Dr. Helen Vance',
    notes: 'Experienced brief 28-min thermal excursion during intermodal crane transfer; resolved via secondary reefer boost.',
    imageProofUrl: '/src/assets/images/harvest_quality_berries_1790684177286.jpg',
    telemetryHistory: generateTelemetryHistory(11.5, 13.5, true, 15.2),
    breachRecords: [
      {
        id: 'BREACH-ASG004-01',
        batchId: '#ASG-004',
        timestamp: '2026-09-28 11:45 PST',
        durationMinutes: 28,
        peakTemperatureC: 15.2,
        thresholdLimitC: 13.5,
        excursionDeltaC: 1.7,
        locationAtBreach: 'Hyderabad Bypass Toll Gate (25.3960° N, 68.3578° E)',
        rootCause: 'Carrier auxiliary power cable detached during tractor swap',
        remedialAction: 'Auxiliary diesel generator auto-started; rapid pull-down initiated',
        qualityImpactAssessment: 'SHELF_LIFE_REDUCED_10%',
        quarantineTriggered: false,
        auditorAck: true,
        blockchainHash: '0x8849bca719e00234f9a341098e71b26c04f98127'
      }
    ]
  },
  {
    id: '#ASG-005',
    commodity: 'apples',
    variety: 'Swat Valley Honeycrisp Select',
    farmerName: 'Khyber Orchard Union',
    farmLocation: 'Swat Valley Mountain Plot 8',
    harvestDate: '2026-09-28 11:00 PST',
    quantityKg: 4800,
    targetTempMin: 0.0,
    targetTempMax: 2.0,
    targetHumidityMin: 90,
    targetHumidityMax: 95,
    currentTemp: 1.1,
    currentHumidity: 93.4,
    coldChainStatus: 'OPTIMAL',
    qualityGrade: 'GRADE_A_EXPORT',
    freshnessScorePercent: 99,
    brixSugarScore: 14.2,
    firmnessPsi: 16.8,
    defectsPercent: 0.5,
    stage: 'IN_TRANSIT',
    assignedReeferId: 'TRK-017',
    destinationHub: 'Islamabad Federal Distribution Center',
    estimatedTransitTime: '3h 40m',
    blockchainSealHash: '0x5519ea81b94d12c8a7732d84713c990a184f7b2c',
    stageEnteredAt: '2026-09-28 19:10 PST',
    inspectedBy: 'Chief Inspector Tariq Al-Mansoor',
    notes: 'Controlled atmosphere reefer unit sealed with nitrogen flush.',
    telemetryHistory: generateTelemetryHistory(0.0, 2.0, false),
    breachRecords: []
  },
  {
    id: '#ASG-006',
    commodity: 'dates',
    variety: 'Sukkur Organic Aseel Dates',
    farmerName: 'Khairpur Date Palm Cooperative',
    farmLocation: 'Khairpur Mirs Sector 3',
    harvestDate: '2026-09-27 14:00 PST',
    quantityKg: 6200,
    targetTempMin: -2.0,
    targetTempMax: 4.0,
    targetHumidityMin: 65,
    targetHumidityMax: 75,
    currentTemp: 1.5,
    currentHumidity: 70.2,
    coldChainStatus: 'OPTIMAL',
    qualityGrade: 'GRADE_A_EXPORT',
    freshnessScorePercent: 100,
    brixSugarScore: 68.5,
    stage: 'QUALITY_CHECKED',
    destinationHub: 'Karachi Central Export Bay',
    estimatedTransitTime: '4h 00m',
    blockchainSealHash: '0x22194b8e3a7590d9841f38e409b8c029d816a445',
    stageEnteredAt: '2026-09-28 15:30 PST',
    inspectedBy: 'Station Tech Marcus Ray',
    notes: 'Dehydrated and vacuum-sealed pallets.',
    telemetryHistory: generateTelemetryHistory(-2.0, 4.0, false),
    breachRecords: []
  },
  {
    id: '#ASG-007',
    commodity: 'strawberries',
    variety: 'Albion Premium Export Strawberries',
    farmerName: 'Mateo Morales & Sons',
    farmLocation: 'Salinas Valley Plot 4B, CA',
    harvestDate: '2026-09-28 07:00 PST',
    quantityKg: 3800,
    targetTempMin: 0.5,
    targetTempMax: 2.5,
    targetHumidityMin: 90,
    targetHumidityMax: 95,
    currentTemp: 1.9,
    currentHumidity: 92.8,
    coldChainStatus: 'OPTIMAL',
    qualityGrade: 'GRADE_A_EXPORT',
    freshnessScorePercent: 97,
    brixSugarScore: 11.2,
    firmnessPsi: 5.8,
    stage: 'AT_WAREHOUSE',
    destinationHub: 'San Francisco Bay Urban Distribution Center',
    estimatedTransitTime: '6h 00m',
    blockchainSealHash: '0x44fa781290bb31c900aa184f7b2c5519ea81b94d',
    stageEnteredAt: '2026-09-28 21:00 PST',
    inspectedBy: 'Dr. Helen Vance (USDA AMS)',
    notes: 'Pallet thermal loggers confirmed zero deviation during transit.',
    imageProofUrl: '/src/assets/images/harvest_quality_berries_1790684177286.jpg',
    telemetryHistory: generateTelemetryHistory(0.5, 2.5, false),
    breachRecords: []
  },
  {
    id: '#ASG-008',
    commodity: 'peaches',
    variety: 'Peshawar Sugar Baby Peaches',
    farmerName: 'Nowshera Valley Growers',
    farmLocation: 'Nowshera Plot 11',
    harvestDate: '2026-09-29 04:30 PST',
    quantityKg: 2900,
    targetTempMin: 0.5,
    targetTempMax: 2.0,
    targetHumidityMin: 90,
    targetHumidityMax: 95,
    currentTemp: 1.4,
    currentHumidity: 94.0,
    coldChainStatus: 'OPTIMAL',
    qualityGrade: 'GRADE_A_EXPORT',
    freshnessScorePercent: 99,
    brixSugarScore: 12.8,
    firmnessPsi: 9.4,
    stage: 'PENDING',
    destinationHub: 'Peshawar Cold Hub Station 1',
    estimatedTransitTime: '1h 15m',
    blockchainSealHash: '0x77cba41908234f9a341098e71b26c04f98127884',
    stageEnteredAt: '2026-09-29 05:00 PST',
    inspectedBy: 'Inspector Amanda Gomez',
    notes: 'Freshly harvested. Awaiting hydrocooling chamber slot.',
    telemetryHistory: generateTelemetryHistory(0.5, 2.0, false),
    breachRecords: []
  }
];

export const INITIAL_REEFERS: ReeferVehicle[] = [
  {
    id: 'TRK-024',
    driverName: 'Ramesh Kumar',
    carrier: 'AgriSupply Express Logistics',
    licensePlate: 'HR-26-BR-9024',
    status: 'EN_ROUTE',
    currentLocation: { lat: 28.6139, lng: 77.2090 },
    speedKmh: 45,
    headingDegrees: 340,
    cargoBatchId: '#ASG-001',
    cargoDescription: '2,000 kg Vine-Ripened Roma Tomatoes',
    reeferTemp: 4.2,
    targetTemp: 4.0,
    humidity: 88.4,
    compressorRpm: 1850,
    batteryHealthPercent: 96,
    doorSealed: true,
    distanceToDestKm: 42.5,
    etaMinutes: 150,
    insideGeofence: true,
    nearestGeofenceZoneId: 'ZONE-DELHI-DC',
    routeProgressPercent: 68,
    originName: 'Farm (Haryana)',
    destinationName: 'Delhi Warehouse'
  },
  {
    id: 'TRK-017',
    driverName: 'Zahid Khan',
    carrier: 'Khyber Cold-Link Fleet',
    licensePlate: 'ISB-AA-8017',
    status: 'EN_ROUTE',
    currentLocation: { lat: 34.0151, lng: 71.5249 },
    speedKmh: 62,
    headingDegrees: 110,
    cargoBatchId: '#ASG-005',
    cargoDescription: '4,800 kg Swat Honeycrisp Apples',
    reeferTemp: 1.1,
    targetTemp: 1.0,
    humidity: 93.4,
    compressorRpm: 1720,
    batteryHealthPercent: 94,
    doorSealed: true,
    distanceToDestKm: 110.0,
    etaMinutes: 220,
    insideGeofence: false,
    nearestGeofenceZoneId: 'ZONE-ISB-DC',
    routeProgressPercent: 42,
    originName: 'Swat Valley Orchards',
    destinationName: 'Islamabad Federal DC'
  },
  {
    id: 'TRK-004',
    driverName: 'Abdul Sattar',
    carrier: 'Indus Reefer Transport',
    licensePlate: 'KHI-DX-4004',
    status: 'UNLOADING',
    currentLocation: { lat: 24.8607, lng: 67.0011 },
    speedKmh: 0,
    headingDegrees: 0,
    cargoBatchId: '#ASG-004',
    cargoDescription: '3,500 kg Sindh Chaunsa Mangoes',
    reeferTemp: 12.3,
    targetTemp: 12.0,
    humidity: 88.0,
    compressorRpm: 900,
    batteryHealthPercent: 98,
    doorSealed: false,
    distanceToDestKm: 0.0,
    etaMinutes: 0,
    insideGeofence: true,
    nearestGeofenceZoneId: 'ZONE-KHI-PORT',
    routeProgressPercent: 100,
    originName: 'Mirpurkhas Farms',
    destinationName: 'Karachi Port Terminal Hub 2'
  }
];

export const GEOFENCE_ZONES: GeofenceZone[] = [
  {
    id: 'ZONE-DELHI-DC',
    name: 'Delhi Central Distribution Hub',
    type: 'URBAN_DISTRIBUTION',
    center: { lat: 28.6139, lng: 77.2090 },
    radiusMeters: 2500,
    color: '#10b981'
  },
  {
    id: 'ZONE-ISB-DC',
    name: 'Islamabad Federal Distribution Center',
    type: 'URBAN_DISTRIBUTION',
    center: { lat: 33.6844, lng: 73.0479 },
    radiusMeters: 2200,
    color: '#f59e0b'
  },
  {
    id: 'ZONE-KHI-PORT',
    name: 'Karachi Port Terminal Hub 2',
    type: 'COLD_STORAGE_HUB',
    center: { lat: 24.8607, lng: 67.0011 },
    radiusMeters: 3000,
    color: '#38bdf8'
  },
  {
    id: 'ZONE-SALINAS-FARM',
    name: 'Salinas Valley Central Harvest Intake',
    type: 'ORIGIN_FARM',
    center: { lat: 36.6777, lng: -121.6555 },
    radiusMeters: 1800,
    color: '#10b981'
  }
];

export const INITIAL_AUDIT_LOGS: ComplianceAuditLog[] = [
  {
    id: 'AUD-8831',
    timestamp: '2026-09-29 04:50 PST',
    batchId: '#ASG-001',
    auditorName: 'Automated ColdGuard Oracle #19',
    action: 'Continuous Telemetry Ledger Commit',
    blockchainHash: '0x7f8a92e104b9c51a7e2830f3c8d91b40285a3b21',
    status: 'VERIFIED',
    details: '720 continuous 30-second thermal samples verified within ±0.2°C variance band. Zero breach incidents.'
  },
  {
    id: 'AUD-8830',
    timestamp: '2026-09-28 18:30 PST',
    batchId: '#ASG-004',
    auditorName: 'Senior Auditor Dr. Helen Vance',
    action: 'Thermal Breach Incident Review & Sign-Off',
    blockchainHash: '0x8849bca719e00234f9a341098e71b26c04f98127',
    status: 'RESOLVED',
    details: 'Excursion resolved within 28 mins; pulp firmness and Brix verified within Grade-A bounds.'
  },
  {
    id: 'AUD-8829',
    timestamp: '2026-09-28 09:12 PST',
    batchId: '#ASG-005',
    auditorName: 'FSMA Rule 204 Regulatory Oracle',
    action: 'Traceability Lot Code Verification',
    blockchainHash: '0x5519ea81b94d12c8a7732d84713c990a184f7b2c',
    status: 'VERIFIED',
    details: 'Mountain origin GPS coordinates, pre-cooling logs, and water microbial certificates verified on-chain.'
  }
];

export const INITIAL_OPERATIONAL_ALERTS: import('../types').OperationalAlert[] = [
  {
    id: 'ALT-101',
    severity: 'HIGH',
    timestamp: '10:24 AM',
    assetId: 'TRK-024',
    assetName: 'Reefer Unit TRK-024',
    batchId: '#ASG-001',
    currentValue: '3.8°C',
    thresholdLimit: '4.0°C Max',
    reason: 'Pulp temperature approaching critical cold ceiling under highway ambient load',
    recommendedAction: 'Verify reefer inverter compressor RPM and inspect secondary airflow duct',
    status: 'DETECTED',
    actionType: 'INVESTIGATE',
    duration: '04m 12s'
  },
  {
    id: 'ALT-102',
    severity: 'MEDIUM',
    timestamp: '09:50 AM',
    assetId: 'TRK-019',
    assetName: 'Reefer Unit TRK-019',
    batchId: '#ASG-002',
    currentValue: '+42 min',
    thresholdLimit: 'ETA +15 min',
    reason: 'Corridor construction bottleneck on N-5 Highway near Sahiwal Bypass',
    recommendedAction: 'Review alternative arterial bypass route via Pakpattan link',
    status: 'DETECTED',
    actionType: 'REVIEW_ROUTE',
    duration: '18m 00s'
  },
  {
    id: 'ALT-103',
    severity: 'LOW',
    timestamp: '08:45 AM',
    assetId: '#ASG-003',
    assetName: 'Tender Spinach Lot',
    batchId: '#ASG-003',
    currentValue: 'Intake Complete',
    thresholdLimit: 'Quality Check Required',
    reason: 'Harvest pre-cooling verified at 1.8°C; awaiting mandatory incoming sensory & defect sign-off',
    recommendedAction: 'Open digital quality inspection checklist and verify turgor and leaf color',
    status: 'DETECTED',
    actionType: 'OPEN_INSPECTION'
  }
];
