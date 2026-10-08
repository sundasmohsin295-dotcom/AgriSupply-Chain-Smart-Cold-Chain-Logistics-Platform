/**
 * Cryptographic Compliance Vault & Integrity Attestation Engine
 * 
 * Provides:
 * 1. Deterministic canonical state serialization for ProduceBatch operational states.
 * 2. Cryptographic SHA-256 digest computation using Web Crypto API (FIPS 180-4 standard).
 * 3. Deep field-level discrepancy analysis to identify tampering or ledger desynchronization.
 * 4. Cryptographic attestation seal generation for regulatory audit (FSMA 204 / USDA-AMS).
 */

import { ProduceBatch } from '../types';

export interface BatchOperationalState {
  batchId: string;
  commodity: string;
  variety: string;
  farmerName: string;
  farmLocation: string;
  quantityKg: number;
  currentTemp: number;
  currentHumidity: number;
  targetTempMin: number;
  targetTempMax: number;
  coldChainStatus: string;
  stage: string;
  destinationHub: string;
  qualityGrade: string;
  harvestDate: string;
  tamperSealId: string;
}

export interface DiscrepancyReport {
  field: keyof BatchOperationalState;
  label: string;
  ledgerValue: string | number;
  submittedValue: string | number;
  isTampered: boolean;
  severity: 'CRITICAL_BREACH' | 'WARNING' | 'INFO';
  explanation: string;
}

export interface VaultVerificationResult {
  isValid: boolean;
  computedHash: string;
  storedLedgerHash: string;
  discrepancies: DiscrepancyReport[];
  tamperedFieldsCount: number;
  analyzedAt: string;
  consensusIntegrityScore: number; // 0 to 100
  attestationMessage: string;
}

/**
 * Extracts normalized operational state fields from a ProduceBatch
 */
export function extractBatchOperationalState(batch: ProduceBatch): BatchOperationalState {
  return {
    batchId: batch.id,
    commodity: batch.commodity,
    variety: batch.variety,
    farmerName: batch.farmerName,
    farmLocation: batch.farmLocation,
    quantityKg: Number(batch.quantityKg),
    currentTemp: Number(batch.currentTemp.toFixed(1)),
    currentHumidity: Number(batch.currentHumidity.toFixed(1)),
    targetTempMin: Number(batch.targetTempMin),
    targetTempMax: Number(batch.targetTempMax),
    coldChainStatus: batch.coldChainStatus,
    stage: batch.stage,
    destinationHub: batch.destinationHub,
    qualityGrade: batch.qualityGrade,
    harvestDate: batch.harvestDate,
    tamperSealId: `SEAL-${batch.id.replace(/[^a-zA-Z0-9]/g, '')}-${batch.blockchainSealHash.slice(-6)}`
  };
}

/**
 * Produces deterministic canonical JSON string where keys are sorted alphabetically
 */
export function canonicalizeOperationalState(state: BatchOperationalState): string {
  const sortedKeys = (Object.keys(state) as (keyof BatchOperationalState)[]).sort();
  const sortedObj: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedObj[key] = state[key];
  }
  return JSON.stringify(sortedObj);
}

/**
 * Computes standard SHA-256 hexadecimal string from a text payload using Web Crypto API
 */
export async function computePayloadSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates the SHA-256 cryptographic hash directly for a shipment batch's current operational state
 */
export async function generateBatchOperationalHash(batch: ProduceBatch): Promise<{
  sha256Hex: string;
  canonicalJson: string;
  state: BatchOperationalState;
}> {
  const state = extractBatchOperationalState(batch);
  const canonicalJson = canonicalizeOperationalState(state);
  const sha256Hex = await computePayloadSHA256(canonicalJson);
  return { sha256Hex, canonicalJson, state };
}

/**
 * Compares submitted state against the authentic ledger state to identify field-level discrepancies
 */
export function analyzeStateDiscrepancies(
  authentic: BatchOperationalState,
  submitted: Partial<BatchOperationalState>
): DiscrepancyReport[] {
  const reports: DiscrepancyReport[] = [];

  const fieldDefs: {
    key: keyof BatchOperationalState;
    label: string;
    severity: 'CRITICAL_BREACH' | 'WARNING' | 'INFO';
    getExplanation: (leg: any, sub: any) => string;
  }[] = [
    {
      key: 'currentTemp',
      label: 'Core Pulp Temperature',
      severity: 'CRITICAL_BREACH',
      getExplanation: (leg, sub) =>
        sub !== leg
          ? `Thermal telemetry divergence: submitted ${sub}°C vs ledger recorded ${leg}°C (possible thermal excursion concealment)`
          : 'Exact thermal match'
    },
    {
      key: 'coldChainStatus',
      label: 'Cold-Chain Status Flag',
      severity: 'CRITICAL_BREACH',
      getExplanation: (leg, sub) =>
        sub !== leg
          ? `Status mask: record reports '${sub}' while ledger recorded '${leg}'`
          : 'Status matches ledger consensus'
    },
    {
      key: 'quantityKg',
      label: 'Cargo Volume (kg)',
      severity: 'CRITICAL_BREACH',
      getExplanation: (leg, sub) =>
        sub !== leg
          ? `Cargo quantity divergence: ${sub} kg submitted vs ${leg} kg dispatched (${Math.abs(Number(sub) - Number(leg))} kg variance - diversion risk)`
          : 'Cargo mass certified'
    },
    {
      key: 'stage',
      label: 'Supply Chain Pipeline Stage',
      severity: 'WARNING',
      getExplanation: (leg, sub) =>
        sub !== leg
          ? `Stage desynchronization: record marked '${sub}' vs verified physical position '${leg}'`
          : 'Stage progression verified'
    },
    {
      key: 'qualityGrade',
      label: 'USDA / FSMA Quality Grade',
      severity: 'WARNING',
      getExplanation: (leg, sub) =>
        sub !== leg
          ? `Grade discrepancy: labeled as '${sub}' vs inspected '${leg}' (counterfeit grade risk)`
          : 'Inspection grade identical'
    },
    {
      key: 'destinationHub',
      label: 'Designated Terminal Hub',
      severity: 'WARNING',
      getExplanation: (leg, sub) =>
        sub !== leg
          ? `Reroute divergence: destined for '${sub}' vs authorized destination '${leg}'`
          : 'Destination route verified'
    },
    {
      key: 'currentHumidity',
      label: 'Relative Humidity',
      severity: 'INFO',
      getExplanation: (leg, sub) =>
        sub !== leg
          ? `RH divergence: ${sub}% vs ${leg}%`
          : 'Humidity nominal'
    },
    {
      key: 'farmerName',
      label: 'Origin Agricultural Producer',
      severity: 'CRITICAL_BREACH',
      getExplanation: (leg, sub) =>
        sub !== leg
          ? `Farmer origin forged: '${sub}' vs ledger origin '${leg}'`
          : 'Traceability origin verified'
    },
    {
      key: 'batchId',
      label: 'Batch Identification Tag',
      severity: 'CRITICAL_BREACH',
      getExplanation: (leg, sub) =>
        sub !== leg
          ? `Batch ID mismatch: '${sub}' vs '${leg}'`
          : 'Lot identifier verified'
    }
  ];

  for (const def of fieldDefs) {
    const legVal = authentic[def.key];
    const subVal = submitted[def.key];
    const isTampered = subVal !== undefined && subVal !== legVal;

    reports.push({
      field: def.key,
      label: def.label,
      ledgerValue: legVal,
      submittedValue: subVal !== undefined ? subVal : '(Missing)',
      isTampered,
      severity: def.severity,
      explanation: isTampered ? def.getExplanation(legVal, subVal) : 'Verified in consensus ledger'
    });
  }

  return reports;
}
