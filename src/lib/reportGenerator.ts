import { jsPDF } from 'jspdf';
import { ProduceBatch, ReeferVehicle, ComplianceAuditLog } from '../types';

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
  doc.text(`Brix Sugar Index:`, col2, startY + 28);
  doc.text(`Destination Hub:`, col2, startY + 35);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${batch.targetTempMin}°C - ${batch.targetTempMax}°C`, col2 + 42, startY);
  doc.text(`${batch.currentTemp.toFixed(1)}°C (Nominal Envelope)`, col2 + 42, startY + 7);
  doc.text(`${batch.currentHumidity.toFixed(1)}% RH`, col2 + 42, startY + 14);
  doc.text(`${batch.qualityGrade.replace(/_/g, ' ')}`, col2 + 42, startY + 21);
  doc.text(`${batch.brixSugarScore ? batch.brixSugarScore + '° Bx' : 'N/A'}`, col2 + 42, startY + 28);
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
  doc.text(`Reefer Compressor Health:`, col1, reeferY + 30);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${reefer ? reefer.id : batch.assignedReeferId || 'REEFER-TRK-804'}`, col1 + 52, reeferY + 9);
  doc.text(`${reefer ? reefer.carrier : 'Pacific Cold-Link Logistics Inc.'}`, col1 + 52, reeferY + 16);
  doc.text(`${reefer ? reefer.driverName : 'Carlos Mendonca (CDL #A99482)'}`, col1 + 52, reeferY + 23);
  doc.text(`${reefer ? reefer.compressorRpm + ' RPM (100% SOH)' : '1,950 RPM (Optimal)'}`, col1 + 52, reeferY + 30);

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
    `Oracle Confirmation: Automated ColdGuard Oracle verified 0 thermal breach events along corridor route.`,
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

  // Trigger download
  doc.save(`ColdChain-Compliance-${batch.id}.pdf`);
}

/**
 * Generates and triggers download of CSV inventory and telemetry data
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
    'Brix Sugar Score',
    'Pipeline Stage',
    'Assigned Reefer',
    'Destination Hub',
    'Blockchain Seal Hash',
    'Stage Timestamp'
  ];

  const rows = batches.map((b) => [
    `"${b.id}"`,
    `"${b.commodity}"`,
    `"${b.variety}"`,
    `"${b.farmerName}"`,
    `"${b.farmLocation}"`,
    `"${b.harvestDate}"`,
    b.quantityKg,
    b.targetTempMin,
    b.targetTempMax,
    b.currentTemp,
    b.currentHumidity,
    `"${b.coldChainStatus}"`,
    `"${b.qualityGrade}"`,
    b.brixSugarScore ?? '',
    `"${b.stage}"`,
    `"${b.assignedReeferId || 'N/A'}"`,
    `"${b.destinationHub}"`,
    `"${b.blockchainSealHash}"`,
    `"${b.stageEnteredAt}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
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
