/**
 * Blockchain Ledger Verification Service
 * 
 * Provides simulated ledger operations with real cryptographic verification.
 * NOT connected to an actual blockchain, but performs genuine cryptographic operations
 * using Web Crypto API for SHA-256 hashing, ECDSA signing, and verification.
 */

export interface BlockchainAuditRecord {
  recordId: string;
  reportId: string;
  batchId: string;
  pdfSha256: string;
  canonicalReceiptHash: string;
  algorithm: 'SHA-256';
  signatureAlgorithm: 'ECDSA-P256-SHA256';
  signedPayload: string;
  signatureBase64: string;
  publicKeyJwk: JsonWebKey;
  createdAt: string;
  ledgerStatus: 'VERIFIED' | 'REVOKED' | 'PENDING';
  tenantId: string;
  auditEventId: string;
}

export interface VerificationRequest {
  reportId: string;
  scannedHash: string;
}

export interface VerificationResult {
  isValid: boolean;
  status:
    | 'VERIFIED'
    | 'HASH_MISMATCH'
    | 'REPORT_NOT_FOUND'
    | 'AUDIT_RECORD_NOT_FOUND'
    | 'SIGNATURE_INVALID'
    | 'RECORD_REVOKED'
    | 'INVALID_HASH';
  computedHash?: string;
  expectedHash?: string;
  reportId?: string;
  auditRecordId?: string;
  verifiedAt: string;
  details: string;
}

/**
 * Demo ledger storage - in production this would be a real database
 */
const auditLedger = new Map<string, BlockchainAuditRecord>();
const reportRegistry = new Map<
  string,
  {
    batchId: string;
    canonicalHash: string;
    pdfHash: string;
    createdAt: string;
  }
>();

/**
 * Validates SHA-256 hex format (64 hex characters)
 */
export function isValidSHA256Hash(hash: string): boolean {
  const normalized = hash.trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(normalized);
}

/**
 * Normalizes hash to lowercase
 */
export function normalizeHash(hash: string): string {
  return hash.trim().toLowerCase();
}

/**
 * Generates a deterministic signed payload for audit record
 */
function createSignedPayload(
  reportId: string,
  batchId: string,
  pdfHash: string,
  createdAt: string
): string {
  return `${reportId}:${batchId}:${pdfHash}:${createdAt}`;
}

/**
 * Signs payload with generated ECDSA P-256 key (Demo only)
 */
export async function signAuditRecord(
  reportId: string,
  batchId: string,
  pdfHash: string,
  createdAt: string
): Promise<{ signature: string; publicKeyJwk: JsonWebKey }> {
  // In a real application, this would be performed on the server with a secure key
  // For demo, we generate a test key pair
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, // not extractable in production
    ['sign', 'verify']
  );

  const signedPayload = createSignedPayload(reportId, batchId, pdfHash, createdAt);
  const encodedPayload = new TextEncoder().encode(signedPayload);

  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyPair.privateKey,
    encodedPayload
  );

  const signatureBase64 = btoa(
    String.fromCharCode.apply(null, Array.from(new Uint8Array(signatureBuffer)))
  );

  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

  return {
    signature: signatureBase64,
    publicKeyJwk
  };
}

/**
 * Verifies an audit record's digital signature
 */
export async function verifyAuditSignature(
  record: BlockchainAuditRecord
): Promise<boolean> {
  try {
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      record.publicKeyJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );

    const encodedPayload = new TextEncoder().encode(record.signedPayload);
    const signatureBuffer = Uint8Array.from(
      atob(record.signatureBase64),
      (c) => c.charCodeAt(0)
    );

    const isValid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signatureBuffer,
      encodedPayload
    );

    return isValid;
  } catch (err) {
    console.error('Signature verification failed:', err);
    return false;
  }
}

/**
 * Creates an audit record in the simulated ledger
 * In production, this would be called by a trusted backend
 */
export async function createAuditRecord(
  reportId: string,
  batchId: string,
  canonicalReceiptHash: string,
  finalPdfHash: string,
  tenantId: string = 'demo-tenant'
): Promise<BlockchainAuditRecord> {
  const recordId = `AUD-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
  const auditEventId = `EVT-${Date.now().toString(36).toUpperCase()}`;
  const createdAt = new Date().toISOString();

  // Sign the audit record
  const { signature, publicKeyJwk } = await signAuditRecord(
    reportId,
    batchId,
    finalPdfHash,
    createdAt
  );

  const record: BlockchainAuditRecord = {
    recordId,
    reportId,
    batchId,
    pdfSha256: finalPdfHash,
    canonicalReceiptHash,
    algorithm: 'SHA-256',
    signatureAlgorithm: 'ECDSA-P256-SHA256',
    signedPayload: createSignedPayload(reportId, batchId, finalPdfHash, createdAt),
    signatureBase64: signature,
    publicKeyJwk,
    createdAt,
    ledgerStatus: 'VERIFIED',
    tenantId,
    auditEventId
  };

  auditLedger.set(recordId, record);
  return record;
}

/**
 * Registers a report in the integrity registry
 */
export function registerReport(
  reportId: string,
  batchId: string,
  canonicalHash: string,
  pdfHash: string
): void {
  reportRegistry.set(reportId, {
    batchId,
    canonicalHash,
    pdfHash,
    createdAt: new Date().toISOString()
  });
}

/**
 * Retrieves audit record by ID
 */
export function getAuditRecord(recordId: string): BlockchainAuditRecord | null {
  return auditLedger.get(recordId) || null;
}

/**
 * Retrieves audit record by report ID
 */
export function getAuditRecordByReportId(reportId: string): BlockchainAuditRecord | null {
  for (const record of auditLedger.values()) {
    if (record.reportId === reportId) {
      return record;
    }
  }
  return null;
}

/**
 * Retrieves report record by ID
 */
export function getReportRecord(reportId: string) {
  return reportRegistry.get(reportId) || null;
}

/**
 * Core verification flow: scanned QR hash -> verification record -> signature check
 */
export async function simulateBlockchainVerificationRequest(
  request: VerificationRequest
): Promise<VerificationResult> {
  const verifiedAt = new Date().toISOString();

  // 1. Validate hash format
  if (!isValidSHA256Hash(request.scannedHash)) {
    return {
      isValid: false,
      status: 'INVALID_HASH',
      verifiedAt,
      details: `Hash format invalid. Expected 64 hex characters, got ${request.scannedHash.length}`
    };
  }

  const normalizedScannedHash = normalizeHash(request.scannedHash);

  // 2. Find report record
  const reportRecord = getReportRecord(request.reportId);
  if (!reportRecord) {
    return {
      isValid: false,
      status: 'REPORT_NOT_FOUND',
      reportId: request.reportId,
      verifiedAt,
      details: `Report ${request.reportId} not found in integrity registry`
    };
  }

  // 3. Find matching audit record
  const auditRecord = getAuditRecordByReportId(request.reportId);
  if (!auditRecord) {
    return {
      isValid: false,
      status: 'AUDIT_RECORD_NOT_FOUND',
      reportId: request.reportId,
      verifiedAt,
      details: `No audit record found for report ${request.reportId}`
    };
  }

  // 4. Compare hashes
  const normalizedExpectedHash = normalizeHash(auditRecord.pdfSha256);
  const hashMatch = normalizedScannedHash === normalizedExpectedHash;

  if (!hashMatch) {
    return {
      isValid: false,
      status: 'HASH_MISMATCH',
      computedHash: normalizedScannedHash,
      expectedHash: normalizedExpectedHash,
      reportId: request.reportId,
      auditRecordId: auditRecord.recordId,
      verifiedAt,
      details: `Hash mismatch. Scanned: ${normalizedScannedHash.slice(0, 16)}... Expected: ${normalizedExpectedHash.slice(0, 16)}...`
    };
  }

  // 5. Check ledger status
  if (auditRecord.ledgerStatus === 'REVOKED') {
    return {
      isValid: false,
      status: 'RECORD_REVOKED',
      reportId: request.reportId,
      auditRecordId: auditRecord.recordId,
      verifiedAt,
      details: `Record has been revoked. Ledger status: ${auditRecord.ledgerStatus}`
    };
  }

  // 6. Verify digital signature
  const signatureValid = await verifyAuditSignature(auditRecord);
  if (!signatureValid) {
    return {
      isValid: false,
      status: 'SIGNATURE_INVALID',
      reportId: request.reportId,
      auditRecordId: auditRecord.recordId,
      verifiedAt,
      details: `Digital signature verification failed for record ${auditRecord.recordId}`
    };
  }

  // All checks passed
  return {
    isValid: true,
    status: 'VERIFIED',
    computedHash: normalizedScannedHash,
    expectedHash: normalizedExpectedHash,
    reportId: request.reportId,
    auditRecordId: auditRecord.recordId,
    verifiedAt,
    details: `Cryptographic integrity verified. SHA-256 matched. Audit signature valid. Ledger status: ${auditRecord.ledgerStatus}`
  };
}

/**
 * Verify an uploaded PDF file against known hash
 */
export async function verifyUploadedPDFHash(
  file: File,
  expectedHash: string
): Promise<{
  computedHash: string;
  expectedHash: string;
  match: boolean;
  filename: string;
  size: number;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  const normalizedComputed = normalizeHash(computedHash);
  const normalizedExpected = normalizeHash(expectedHash);

  return {
    computedHash: normalizedComputed,
    expectedHash: normalizedExpected,
    match: normalizedComputed === normalizedExpected,
    filename: file.name,
    size: file.size
  };
}
