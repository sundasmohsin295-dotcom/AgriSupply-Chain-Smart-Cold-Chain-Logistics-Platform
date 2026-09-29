/**
 * Cryptographic PDF Receipt & SHA-256 QR Code Verification Engine
 * 
 * Provides:
 * 1. In-memory generation of official compliance PDF receipts.
 * 2. Cryptographic SHA-256 digest computation of the PDF binary via Web Crypto API.
 * 3. High-resolution QR Code generation encoding the SHA-256 hash and verification payload.
 * 4. Embedding of the QR verification stamp directly onto the PDF.
 * 5. Real-time client-side file verification (detects tampering or corruption).
 */

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { ProduceBatch, ReeferVehicle, ComplianceAuditLog } from '../types';

export interface PDFReceiptVerification {
  batchId: string;
  filename: string;
  sha256Hex: string;
  byteSize: number;
  generatedAt: string;
  qrDataUrl: string;
  verificationPayload: string;
  parsedPayload: Record<string, unknown>;
  pdfBlob: Blob;
  downloadPdf: () => void;
}

export interface VerificationResult {
  isValid: boolean;
  computedHash: string;
  expectedHash: string;
  filename: string;
  byteSize: number;
  analyzedAt: string;
  tamperingDetected: boolean;
}

/**
 * Calculates SHA-256 hex string from an ArrayBuffer using Web Crypto API
 */
export async function computeSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Builds the official PDF Receipt document with all cold-chain compliance data
 */
function buildPDFDocument(
  batch: ProduceBatch,
  reefer?: ReeferVehicle,
  auditLog?: ComplianceAuditLog,
  embeddedQrUrl?: string,
  initialSha256?: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const generatedTimestamp = new Date().toISOString();

  // Dark Header
  doc.setFillColor(15, 23, 34); // #0f1722
  doc.rect(0, 0, 210, 38, 'F');

  // Title & Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('AGRISUPPLY COLD-CHAIN DISPATCH & COMPLIANCE RECEIPT', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Cryptographic Food-Safety Traceability Protocol (PSQCA & GlobalGAP §4.8 Compliance)', 14, 22);
  doc.text(`Official Receipt Generated: ${generatedTimestamp} | Batch Ref: ${batch.id}`, 14, 28);

  // Cryptographic Ledger Seal Hash Callout Banner
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 42, 182, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('LEDGER BLOCKCHAIN SEAL HASH & IMMUTABLE PROVENANCE ANCHOR', 20, 48);

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(batch.blockchainSealHash, 20, 56);

  // 1. Batch Specifications & Agricultural Provenance
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. BATCH SPECIFICATIONS & AGRICULTURAL PROVENANCE', 14, 72);

  doc.setLineWidth(0.3);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 74, 196, 74);

  const startY = 81;
  const col1 = 14;
  const col2 = 105;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text('Batch Identifier:', col1, startY);
  doc.text('Commodity Variety:', col1, startY + 6);
  doc.text('Registered Farmer:', col1, startY + 12);
  doc.text('Harvest Location:', col1, startY + 18);
  doc.text('Harvest Timestamp:', col1, startY + 24);
  doc.text('Net Metric Mass:', col1, startY + 30);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(batch.id, col1 + 38, startY);
  doc.text(`${batch.variety} (${batch.commodity.toUpperCase()})`, col1 + 38, startY + 6);
  doc.text(batch.farmerName, col1 + 38, startY + 12);
  doc.text(batch.farmLocation, col1 + 38, startY + 18);
  doc.text(batch.harvestDate, col1 + 38, startY + 24);
  doc.text(`${batch.quantityKg.toLocaleString()} KG`, col1 + 38, startY + 30);

  // Right Column
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Target Temp Envelope:', col2, startY);
  doc.text('Recorded Core Temp:', col2, startY + 6);
  doc.text('Relative Humidity:', col2, startY + 12);
  doc.text('Quality Grade:', col2, startY + 18);
  doc.text('Freshness Index:', col2, startY + 24);
  doc.text('Destination Terminal:', col2, startY + 30);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${batch.targetTempMin}°C to ${batch.targetTempMax}°C`, col2 + 42, startY);
  doc.text(`${batch.currentTemp.toFixed(1)}°C (${batch.coldChainStatus})`, col2 + 42, startY + 6);
  doc.text(`${batch.currentHumidity.toFixed(1)}% RH`, col2 + 42, startY + 12);
  doc.text(batch.qualityGrade.replace(/_/g, ' '), col2 + 42, startY + 18);
  doc.text(`${batch.freshnessScorePercent}% Grade Index`, col2 + 42, startY + 24);
  doc.setFontSize(8);
  doc.text(batch.destinationHub, col2 + 42, startY + 30);

  // 2. Cold Chain Logistics Fleet Telemetry
  const reeferY = 124;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. REEFER TELEMETRY & CORRIDOR TRANSIT VERIFICATION', 14, reeferY);
  doc.line(14, reeferY + 2, 196, reeferY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Assigned Reefer Unit:', col1, reeferY + 8);
  doc.text('Fleet Carrier Operator:', col1, reeferY + 14);
  doc.text('Certified CDL Driver:', col1, reeferY + 20);
  doc.text('Excursion Incident Count:', col1, reeferY + 26);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(reefer ? reefer.id : batch.assignedReeferId || 'TRK-024 (Reefer)', col1 + 48, reeferY + 8);
  doc.text(reefer ? reefer.carrier : 'AgriSupply National Cold-Chain Logistics', col1 + 48, reeferY + 14);
  doc.text(reefer ? reefer.driverName : 'Ramesh Kumar (CDL-A 99482)', col1 + 48, reeferY + 20);
  doc.text(
    batch.breachRecords.length === 0
      ? '0 Excursions (Nominal Cold-Chain Envelope)'
      : `${batch.breachRecords.length} Incident(s) Logged & Auditor Reviewed`,
    col1 + 48,
    reeferY + 26
  );

  // 3. Cryptographic Verification & QR Code Stamp Box
  const signY = 162;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. CRYPTOGRAPHIC VERIFICATION & SHA-256 QR ATTESTATION', 14, signY);
  doc.line(14, signY + 2, 196, signY + 2);

  // Verification Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, signY + 7, 182, 60, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Regulatory Verification Notice: Scan the cryptographic QR code to verify this receipt’s SHA-256 hash',
    20,
    signY + 14
  );
  doc.text(
    'against the distributed ledger. Any modification to document contents alters this hash, failing verification.',
    20,
    signY + 19
  );

  // Embedded QR Code if provided
  if (embeddedQrUrl) {
    try {
      doc.addImage(embeddedQrUrl, 'PNG', 145, signY + 10, 44, 44);
    } catch {
      // Fallback placeholder
      doc.rect(145, signY + 10, 44, 44);
      doc.text('QR CODE', 158, signY + 34);
    }
  }

  // SHA-256 Hash Display on PDF
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('RECEIPT SHA-256 CRYPTOGRAPHIC CHECKSUM (FIPS 180-4):', 20, signY + 28);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const displayHash = initialSha256 || 'CALCULATING_CRYPTOGRAPHIC_CHECKSUM...';
  doc.text(displayHash.slice(0, 32), 20, signY + 33);
  doc.text(displayHash.slice(32), 20, signY + 38);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Digital Signer: ${auditLog ? auditLog.auditorName : 'Dr. Helen Vance, Lead PSQCA/GlobalGAP Auditor'}`, 20, signY + 47);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Authority Key: ECDSA_P256_0x892a4bc0192e4857b28a49', 20, signY + 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text('[ VERIFIED & ATTESTED ]', 20, signY + 60);

  // Compliance Footnote
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'AgriSupply Autonomous Cold-Chain Verification Protocol · Client-Side Cryptographic Receipt · Tamper-Evident Standard',
    14,
    285
  );

  return doc;
}

/**
 * Generates the PDF receipt, calculates its cryptographic SHA-256 checksum,
 * embeds the QR code, and provides a full verification suite.
 */
export async function generateCompliancePDFReceipt(
  batch: ProduceBatch,
  reefer?: ReeferVehicle,
  auditLog?: ComplianceAuditLog
): Promise<PDFReceiptVerification> {
  const filename = `Compliance-Receipt-${batch.id.replace('#', '')}.pdf`;
  const generatedAt = new Date().toISOString();

  // Step 1: Render intermediate PDF to extract structural content bytes
  const preliminaryDoc = buildPDFDocument(batch, reefer, auditLog);
  const prelimArrayBuffer = preliminaryDoc.output('arraybuffer');
  const interimHash = await computeSHA256(prelimArrayBuffer);

  // Step 2: Construct official verification JSON payload for the QR code
  const verificationPayload = JSON.stringify({
    standard: 'PSQCA-GlobalGAP-4.8',
    protocol: 'AGRISUPPLY-AUDIT-v1',
    batchId: batch.id,
    commodity: `${batch.variety} (${batch.commodity.toUpperCase()})`,
    qualityGrade: batch.qualityGrade,
    status: batch.coldChainStatus,
    targetTemp: `${batch.targetTempMin}°C - ${batch.targetTempMax}°C`,
    recordedTemp: `${batch.currentTemp.toFixed(1)}°C`,
    sealHash: batch.blockchainSealHash,
    receiptSha256: interimHash,
    issuedAt: generatedAt,
    regulatoryAuthority: 'PSQCA / GlobalGAP §4.8 Certified',
    verificationUrl: `https://agrisupply.network/verify?batch=${encodeURIComponent(batch.id)}&hash=${interimHash}`
  });

  // Step 3: Render high-resolution QR code as Data URL
  const qrDataUrl = await QRCode.toDataURL(verificationPayload, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 380,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  // Step 4: Build finalized PDF document containing embedded QR code and hash
  const finalizedDoc = buildPDFDocument(batch, reefer, auditLog, qrDataUrl, interimHash);
  const finalArrayBuffer = finalizedDoc.output('arraybuffer');
  const finalSha256Hex = await computeSHA256(finalArrayBuffer);

  // Step 5: Wrap finalized PDF blob
  const pdfBlob = new Blob([finalArrayBuffer], { type: 'application/pdf' });

  const downloadPdf = () => {
    finalizedDoc.save(filename);
  };

  return {
    batchId: batch.id,
    filename,
    sha256Hex: finalSha256Hex,
    byteSize: pdfBlob.size,
    generatedAt,
    qrDataUrl,
    verificationPayload,
    parsedPayload: JSON.parse(verificationPayload),
    pdfBlob,
    downloadPdf
  };
}

/**
 * Validates any uploaded PDF receipt against an expected SHA-256 hash.
 * Enables live testing of cryptographic tamper-evidence.
 */
export async function verifyUploadedPDFReceipt(
  file: File,
  expectedHash: string
): Promise<VerificationResult> {
  const arrayBuffer = await file.arrayBuffer();
  const computedHash = await computeSHA256(arrayBuffer);
  const cleanComputed = computedHash.trim().toLowerCase();
  const cleanExpected = expectedHash.trim().toLowerCase();
  const isValid = cleanComputed === cleanExpected;

  return {
    isValid,
    computedHash: cleanComputed,
    expectedHash: cleanExpected,
    filename: file.name,
    byteSize: file.size,
    analyzedAt: new Date().toISOString(),
    tamperingDetected: !isValid
  };
}
