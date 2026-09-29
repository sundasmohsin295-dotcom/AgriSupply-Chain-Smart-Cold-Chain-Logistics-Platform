/**
 * ComplianceQRCode Component
 * 
 * Production-grade QR code component for cryptographic verification records.
 * Validates SHA-256 hex format, renders SVG QR code, and maintains accessibility.
 */

import React from 'react';
import QRCode from 'qrcode.react';

export interface ComplianceQRCodeProps {
  /**
   * SHA-256 hash value (64 hex characters, lowercase)
   * REQUIRED
   */
  hash: string;
  
  /**
   * QR code size in pixels
   * @default 240
   */
  size?: number;
  
  /**
   * Accessible title for the QR code
   * @default "Compliance QR Code"
   */
  title?: string;
  
  /**
   * Report ID for context
   */
  reportId?: string;
  
  /**
   * Callback when validation fails
   */
  onValidationError?: (error: string) => void;
}

/**
 * Validates SHA-256 hash format (64 hex characters)
 */
function isValidSHA256(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  const sha256Regex = /^[a-f0-9]{64}$/;
  return sha256Regex.test(normalized);
}

/**
 * Normalizes hash to lowercase
 */
function normalizeHash(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * ComplianceQRCode: Production QR verification component
 */
export const ComplianceQRCode: React.FC<ComplianceQRCodeProps> = ({
  hash,
  size = 240,
  title = 'Compliance QR Code',
  reportId = 'REPORT-ID-UNKNOWN',
  onValidationError
}) => {
  const normalizedHash = normalizeHash(hash);
  const isValid = isValidSHA256(normalizedHash);

  if (!isValid) {
    const errorMsg = `Invalid SHA-256 format. Expected 64 hex characters, got ${hash.length}`;
    if (onValidationError) {
      onValidationError(errorMsg);
    }
    return (
      <div
        className="flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-red-300 rounded-lg p-6"
        role="alert"
      >
        <div className="text-red-600 font-bold text-sm mb-2">Invalid QR Hash</div>
        <div className="text-red-500 text-xs font-mono text-center">{errorMsg}</div>
        <div className="text-slate-500 text-xs mt-2">Hash provided: {hash.substring(0, 32)}...</div>
      </div>
    );
  }

  /**
   * QR payload: deterministic verification record
   * Contains all information needed for independent verification
   */
  const qrPayload = JSON.stringify({
    v: 1, // version
    type: 'AGRISUPPLY_LEDGER_RECORD',
    reportId,
    hash: normalizedHash,
    algorithm: 'SHA-256',
    timestamp: new Date().toISOString(),
    environment: 'SIMULATION_LEDGER'
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Code Container */}
      <div
        className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm"
        role="img"
        aria-label={title}
      >
        <QRCode
          value={qrPayload}
          size={size}
          level="H" // High error correction
          includeMargin={true}
          quietZone={4}
        />
      </div>

      {/* Hash Display */}
      <div className="w-full">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
          SHA-256 Hash
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs break-all text-slate-800">
          {normalizedHash}
        </div>
      </div>

      {/* Metadata */}
      <div className="w-full grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-slate-500 font-semibold">Report ID</div>
          <div className="font-mono text-slate-700 mt-1">{reportId}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-slate-500 font-semibold">Algorithm</div>
          <div className="font-mono text-slate-700 mt-1">SHA-256</div>
        </div>
        <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
          <div className="text-amber-800 font-semibold text-[10px]">SIMULATION LEDGER</div>
          <div className="text-amber-700 text-xs mt-1">This is a demonstration verification record, not a production blockchain.</div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceQRCode;
