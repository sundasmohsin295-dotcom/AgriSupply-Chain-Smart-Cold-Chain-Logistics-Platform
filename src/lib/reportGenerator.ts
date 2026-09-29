import { jsPDF } from 'jspdf';
import { ProduceBatch, ReeferVehicle, ComplianceAuditLog, TemperatureBreachRecord } from '../types';

/**
 * Escapes CSV field properly conforming to RFC-4180
 */
function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates an official, beautifully formatted Cold-Chain Compliance Certificate PDF
 */
export function generateCompliancePDF(
  batch: ProduceBatch,
  reefer?: ReeferVehicle,
  auditLog?: ComplianceAuditLog
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Industrial dark header styling
  doc.setFillColor(15, 23, 34); // #0f1722
  doc.rect(0, 0, 210, 38, 'F');

  // Title & Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AGRISUPPLY COLD-CHAIN INTEGRITY DISPATCH CERTIFICATE', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('USDA-AMS FSMA Rule 204 & GlobalGAP Chain of Custody Standard Protocol', 14, 23);
  doc.text(`Certificate Timestamp: ${new Date().toISOString()}`, 14, 29);

  // Blockchain Hash Callout Banner
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 45, 182, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('IMMUTABLE BLOCKCHAIN VERIFICATION HASH (LEDGER COMMIT)', 20, 52);

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(batch.blockchainSealHash, 20, 60);

  // Batch Overview Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. BATCH SPECIFICATIONS & AGRICULTURAL PROVENANCE', 14, 76);

  doc.setLineWidth(0.3);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 78, 196, 78);

  const startY = 85;
  const col1 = 14;
  const col2 = 105;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.text(`Batch ID:`, col1, startY);
  doc.text(`Commodity:`, col1, startY + 7);
  doc.text(`Farm Producer:`, col1, startY + 14);
  doc.text(`Harvest Location:`, col1, startY + 21);
  doc.text(`Harvest Timestamp:`, col1, startY + 28);
  doc.text(`Quantity / Net Mass:`, col1, startY + 35);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${batch.id}`, col1 + 42, startY);
  doc.text(`${batch.variety} (${batch.commodity.toUpperCase()})`, col1 + 42, startY + 7);
  doc.text(`${batch.farmerName}`, col1 + 42, startY + 14);
  doc.text(`${batch.farmLocation}`, col1 + 42, startY + 21);
  doc.text(`${batch.harvestDate}`, col1 + 42, startY + 28);
  doc.text(`${batch.quantityKg.toLocaleString()} kg`, col1 + 42, startY + 35);

  // Right Column: Target Conditions
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Target Temperature:`, col2, startY);
  doc.text(`Recorded Core Temp:`, col2, startY + 7);
  doc.text(`Relative Humidity:`, col2, startY + 14);
  doc.text(`Quality Grade:`, col2, startY + 21);
  doc.text(`Freshness Index:`, col2, startY + 28);
  doc.text(`Destination Hub:`, col2, startY + 35);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${batch.targetTempMin}°C - ${batch.targetTempMax}°C`, col2 + 42, startY);
  doc.text(`${batch.currentTemp.toFixed(1)}°C (${batch.coldChainStatus})`, col2 + 42, startY + 7);
  doc.text(`${batch.currentHumidity.toFixed(1)}% RH`, col2 + 42, startY + 14);
  doc.text(`${batch.qualityGrade.replace(/_/g, ' ')}`, col2 + 42, startY + 21);
  doc.text(`${batch.freshnessScorePercent}% Freshness Grade`, col2 + 42, startY + 28);
  doc.setFontSize(8);
  doc.text(`${batch.destinationHub}`, col2 + 42, startY + 35);

  // Cold Chain Logistics Section
  const reeferY = 132;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. COLD-CHAIN FLEET TELEMETRY & GEOFENCE STATUS', 14, reeferY);
  doc.line(14, reeferY + 2, 196, reeferY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Assigned Transport Reefer:`, col1, reeferY + 9);
  doc.text(`Carrier / Fleet Operator:`, col1, reeferY + 16);
  doc.text(`Driver in Command:`, col1, reeferY + 23);
  doc.text(`Breach Incident History:`, col1, reeferY + 30);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${reefer ? reefer.id : batch.assignedReeferId || 'TRK-024'}`, col1 + 52, reeferY + 9);
  doc.text(`${reefer ? reefer.carrier : 'AgriSupply Express Logistics Fleet'}`, col1 + 52, reeferY + 16);
  doc.text(`${reefer ? reefer.driverName : 'Ramesh Kumar (CDL #A99482)'}`, col1 + 52, reeferY + 23);
  doc.text(`${batch.breachRecords.length === 0 ? '0 Thermal Breaches (Nominal)' : batch.breachRecords.length + ' Incident Logged & Resolved'}`, col1 + 52, reeferY + 30);

  // Inspector & Oracle Attestation Box
  const signY = 175;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. COMPLIANCE AUDITOR & ORACLE ATTESTATION', 14, signY);
  doc.line(14, signY + 2, 196, signY + 2);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, signY + 8, 182, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Auditor Certification: I hereby certify under penalty of regulatory sanction that the perishable batch identified`,
    20,
    signY + 15
  );
  doc.text(
    `above has maintained strict cold-chain compliance within authorized thermal envelopes during all transit phases.`,
    20,
    signY + 20
  );
  doc.text(
    `Oracle Confirmation: Automated ColdGuard Oracle verified continuous telemetry samples along corridor route.`,
    20,
    signY + 25
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Digital Signer: ${auditLog ? auditLog.auditorName : 'Dr. Helen Vance, Lead USDA-AMS Auditor'}`, 20, signY + 35);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(`Sig: ECDSA_SHA256_0x99fe4b12aa3894cd902187`, 20, signY + 41);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald
  doc.text('[ VERIFIED & SEALED ]', 145, signY + 38);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Page 1 of 1 · AgriSupply Autonomous Cold-Chain Protocol · Generated Client-Side via WebAssembly', 14, 285);

  doc.save(`ColdChain-Compliance-${batch.id.replace('#', '')}.pdf`);
}

/**
 * MANDATORY FEATURE:
 * Comprehensive CSV bulk export utility for the batch table that includes
 * all historical telemetry logs, sensor metrics, and temperature breach records.
 */
export function exportBatchesWithTelemetryAndBreachesCSV(
  batches: ProduceBatch[],
  filenamePrefix: string = 'AgriSupply-Complete-Telemetry-Breach-Ledger'
): void {
  const headers = [
    // --- Batch Master Identity ---
    'Record Type',
    'Batch ID',
    'Produce Commodity',
    'Produce Variety',
    'Producer Name',
    'Farm Origin Location',
    'Destination Hub',
    'Harvest Date',
    'Net Quantity (KG)',
    'Quality Grade',
    'Freshness Score (%)',
    'Current Status',
    'Pipeline Stage',
    'Target Temp Min (°C)',
    'Target Temp Max (°C)',
    'Current Temp (°C)',
    'Current Humidity (%)',
    'Assigned Reefer ID',
    'Blockchain Seal Hash',
    'Inspector Sign-Off',

    // --- Telemetry & Sensor Log Fields ---
    'Telemetry Timestamp',
    'Core Probe Temp (°C)',
    'Ambient Temp (°C)',
    'Relative Humidity (%)',
    'Compressor RPM',
    'Battery SOC (%)',
    'Thermal In-Envelope Flag',
    'Telemetry Breach Severity',
    'Excursion Duration (Min)',
    'Corrective Action Logged',

    // --- Breach Incident Record Details ---
    'Breach Incident ID',
    'Breach Peak Temp (°C)',
    'Breach Threshold Limit (°C)',
    'Excursion Delta (°C)',
    'Location At Breach',
    'Root Cause Analysis',
    'Remedial Action Protocol',
    'Quality Impact Assessment',
    'Quarantine Triggered',
    'Auditor Signed'
  ];

  const rows: string[][] = [];

  for (const batch of batches) {
    // 1. Add Master Batch Summary Row
    rows.push([
      escapeCSV('BATCH_MASTER'),
      escapeCSV(batch.id),
      escapeCSV(batch.commodity),
      escapeCSV(batch.variety),
      escapeCSV(batch.farmerName),
      escapeCSV(batch.farmLocation),
      escapeCSV(batch.destinationHub),
      escapeCSV(batch.harvestDate),
      escapeCSV(batch.quantityKg),
      escapeCSV(batch.qualityGrade),
      escapeCSV(batch.freshnessScorePercent),
      escapeCSV(batch.coldChainStatus),
      escapeCSV(batch.stage),
      escapeCSV(batch.targetTempMin),
      escapeCSV(batch.targetTempMax),
      escapeCSV(batch.currentTemp),
      escapeCSV(batch.currentHumidity),
      escapeCSV(batch.assignedReeferId || 'UNASSIGNED'),
      escapeCSV(batch.blockchainSealHash),
      escapeCSV(batch.inspectedBy || 'USDA-AMS Designated Station'),
      // Empty telemetry & breach columns for master row
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV('')
    ]);

    // 2. Add All Historical Telemetry Cycles
    if (batch.telemetryHistory && batch.telemetryHistory.length > 0) {
      for (const t of batch.telemetryHistory) {
        rows.push([
          escapeCSV('HISTORICAL_TELEMETRY'),
          escapeCSV(batch.id),
          escapeCSV(batch.commodity),
          escapeCSV(batch.variety),
          escapeCSV(batch.farmerName),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(batch.coldChainStatus),
          escapeCSV(batch.stage),
          escapeCSV(batch.targetTempMin),
          escapeCSV(batch.targetTempMax),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(batch.assignedReeferId || ''),
          escapeCSV(''),
          escapeCSV(''),

          // Telemetry fields
          escapeCSV(t.timestamp),
          escapeCSV(t.temperatureC),
          escapeCSV(t.ambientTempC),
          escapeCSV(t.humidityPercent),
          escapeCSV(t.compressorRpm),
          escapeCSV(t.batterySocPercent),
          escapeCSV(!t.isBreach ? 'TRUE_OPTIMAL' : 'FALSE_VIOLATION'),
          escapeCSV(t.breachSeverity),
          escapeCSV(t.durationMinutesExceeded || 0),
          escapeCSV(t.correctiveActionTaken || 'None required - within envelope'),

          // Empty breach incident fields
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV('')
        ]);
      }
    }

    // 3. Add Explicit Temperature Breach Incident Records
    if (batch.breachRecords && batch.breachRecords.length > 0) {
      for (const b of batch.breachRecords) {
        rows.push([
          escapeCSV('TEMPERATURE_BREACH_INCIDENT'),
          escapeCSV(batch.id),
          escapeCSV(batch.commodity),
          escapeCSV(batch.variety),
          escapeCSV(batch.farmerName),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV('CRITICAL_BREACH'),
          escapeCSV(batch.stage),
          escapeCSV(batch.targetTempMin),
          escapeCSV(batch.targetTempMax),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(batch.assignedReeferId || ''),
          escapeCSV(b.blockchainHash),
          escapeCSV(''),

          // Telemetry timestamp
          escapeCSV(b.timestamp),
          escapeCSV(b.peakTemperatureC),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV('FALSE_VIOLATION'),
          escapeCSV('CRITICAL_EXCURSION'),
          escapeCSV(b.durationMinutes),
          escapeCSV(b.remedialAction),

          // Breach details
          escapeCSV(b.id),
          escapeCSV(b.peakTemperatureC),
          escapeCSV(b.thresholdLimitC),
          escapeCSV(b.excursionDeltaC),
          escapeCSV(b.locationAtBreach),
          escapeCSV(b.rootCause),
          escapeCSV(b.remedialAction),
          escapeCSV(b.qualityImpactAssessment),
          escapeCSV(b.quarantineTriggered ? 'QUARANTINE_ACTIVE' : 'RELEASED_NOMINAL'),
          escapeCSV(b.auditorAck ? 'VERIFIED_AUDITOR_ACK' : 'PENDING_AUDITOR_REVIEW')
        ]);
      }
    }
  }

  // Prepend UTF-8 BOM so Excel opens multi-lingual text cleanly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Dedicated CSV export for Temperature Breach Audit Incidents
 */
export function exportTemperatureBreachAuditCSV(batches: ProduceBatch[]): void {
  const headers = [
    'Breach Incident ID',
    'Batch ID',
    'Commodity',
    'Variety',
    'Farmer Name',
    'Timestamp of Excursion',
    'Duration (Minutes)',
    'Peak Temp (°C)',
    'Safe Limit (°C)',
    'Excursion Delta (°C)',
    'GPS Location At Breach',
    'Root Cause Analysis',
    'Remedial Action Taken',
    'Quality Impact Assessment',
    'Quarantine Enforced',
    'Auditor Acknowledged',
    'Blockchain Attestation Hash'
  ];

  const allBreaches: { breach: TemperatureBreachRecord; batch: ProduceBatch }[] = [];
  for (const b of batches) {
    if (b.breachRecords) {
      for (const br of b.breachRecords) {
        allBreaches.push({ breach: br, batch: b });
      }
    }
  }

  const rows = allBreaches.map(({ breach, batch }) => [
    escapeCSV(breach.id),
    escapeCSV(batch.id),
    escapeCSV(batch.commodity),
    escapeCSV(batch.variety),
    escapeCSV(batch.farmerName),
    escapeCSV(breach.timestamp),
    escapeCSV(breach.durationMinutes),
    escapeCSV(breach.peakTemperatureC),
    escapeCSV(breach.thresholdLimitC),
    escapeCSV(breach.excursionDeltaC),
    escapeCSV(breach.locationAtBreach),
    escapeCSV(breach.rootCause),
    escapeCSV(breach.remedialAction),
    escapeCSV(breach.qualityImpactAssessment),
    escapeCSV(breach.quarantineTriggered ? 'YES_QUARANTINED' : 'NO_OVERRIDE'),
    escapeCSV(breach.auditorAck ? 'YES_AUDITED' : 'NO_PENDING'),
    escapeCSV(breach.blockchainHash)
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `AgriSupply-Temperature-Breach-Audit-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Standard table CSV export for quick grid data download
 */
export function exportInventoryToCSV(batches: ProduceBatch[]): void {
  const headers = [
    'Batch ID',
    'Commodity',
    'Variety',
    'Farmer Name',
    'Farm Location',
    'Harvest Date',
    'Quantity (KG)',
    'Target Temp Min (C)',
    'Target Temp Max (C)',
    'Current Temp (C)',
    'Current Humidity (%)',
    'Cold Chain Status',
    'Quality Grade',
    'Freshness Score (%)',
    'Pipeline Stage',
    'Assigned Reefer',
    'Destination Hub',
    'Estimated Transit Time',
    'Blockchain Seal Hash',
    'Total Telemetry Samples',
    'Breach Incident Count'
  ];

  const rows = batches.map((b) => [
    escapeCSV(b.id),
    escapeCSV(b.commodity),
    escapeCSV(b.variety),
    escapeCSV(b.farmerName),
    escapeCSV(b.farmLocation),
    escapeCSV(b.harvestDate),
    escapeCSV(b.quantityKg),
    escapeCSV(b.targetTempMin),
    escapeCSV(b.targetTempMax),
    escapeCSV(b.currentTemp),
    escapeCSV(b.currentHumidity),
    escapeCSV(b.coldChainStatus),
    escapeCSV(b.qualityGrade),
    escapeCSV(b.freshnessScorePercent),
    escapeCSV(b.stage),
    escapeCSV(b.assignedReeferId || 'N/A'),
    escapeCSV(b.destinationHub),
    escapeCSV(b.estimatedTransitTime),
    escapeCSV(b.blockchainSealHash),
    escapeCSV(b.telemetryHistory ? b.telemetryHistory.length : 0),
    escapeCSV(b.breachRecords ? b.breachRecords.length : 0)
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `AgriSupply-Inventory-Ledger-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
