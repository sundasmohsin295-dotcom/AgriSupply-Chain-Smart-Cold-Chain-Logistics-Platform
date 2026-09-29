/**
 * Multi-Page CSV Data Aggregator & Exporter
 * 
 * Aggregates large batches of agricultural cold-chain records across multiple
 * paginated slices, providing progressive chunk processing, progress bar callbacks,
 * cancellation support, and robust RFC-4180 CSV serialization with UTF-8 BOM.
 */

import { ProduceBatch } from '../types';

export interface MultiPageExportProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
  stage: string;
  processedRecords: number;
}

export interface MultiPageExportResult {
  filename: string;
  rowCount: number;
  byteSize: number;
  pageCount: number;
  durationMs: number;
}

export interface MultiPageExportOptions {
  pageSize?: number;
  filenamePrefix?: string;
  onProgress?: (progress: MultiPageExportProgress) => void;
  signal?: AbortSignal;
  simulateError?: boolean;
}

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Aggregates all batches, historical telemetry cycles, and temperature breach records
 * across multiple virtualized pages with progressive asynchronous processing.
 */
export async function exportAllBatchesMultiPageCSV(
  batches: ProduceBatch[],
  options: MultiPageExportOptions = {}
): Promise<MultiPageExportResult> {
  const {
    pageSize = 3,
    filenamePrefix = 'AgriSupply-MultiPage-ColdChain-Ledger',
    onProgress,
    signal,
    simulateError = false
  } = options;

  const startTime = Date.now();
  const totalBatches = batches.length;
  const totalPages = Math.max(1, Math.ceil(totalBatches / pageSize));

  // CSV Column Headers (Comprehensive Enterprise Ledger)
  const headers = [
    'Record Classification',
    'Batch Identifier',
    'Commodity Type',
    'Produce Variety',
    'Producer Name',
    'Farm Origin Location',
    'Destination Logistics Hub',
    'Harvest Timestamp',
    'Net Quantity (KG)',
    'Quality Grade',
    'Freshness Score (%)',
    'Current Cold-Chain Status',
    'Current Logistics Stage',
    'Target Temp Min (°C)',
    'Target Temp Max (°C)',
    'Current Temp (°C)',
    'Relative Humidity (%)',
    'Assigned Reefer Unit',
    'Cryptographic Seal Hash',
    'Inspection Station / Officer',
    'Telemetry Timestamp',
    'Sensor Core Temp (°C)',
    'Ambient Reading (°C)',
    'Relative Humidity Reading (%)',
    'Compressor RPM',
    'Battery SOC (%)',
    'Telemetry Breach Severity',
    'Excursion Duration (Min)',
    'Breach Incident ID',
    'Peak Excursion Temp (°C)',
    'Safe Limit Threshold (°C)',
    'Excursion Delta (°C)',
    'Location at Excursion',
    'Root Cause Analysis',
    'Remedial Action Protocol',
    'Quarantine Status',
    'Auditor Verification Status'
  ];

  const rows: string[][] = [];

  // Notify initial state
  onProgress?.({
    currentPage: 0,
    totalPages,
    percent: 5,
    stage: 'Initializing multi-page aggregation engine...',
    processedRecords: 0
  });

  await new Promise((r) => setTimeout(r, 100));
  if (signal?.aborted) throw new DOMException('Export aborted by user', 'AbortError');

  let processedCount = 0;

  // Process batches page by page
  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (signal?.aborted) throw new DOMException('Export aborted by user', 'AbortError');

    if (simulateError && pageIdx === 2) {
      throw new Error('Simulated network timeout during multi-page stream aggregation.');
    }

    const startIdx = pageIdx * pageSize;
    const pageBatches = batches.slice(startIdx, startIdx + pageSize);

    const percent = Math.min(95, Math.round(((pageIdx + 1) / totalPages) * 85) + 5);
    onProgress?.({
      currentPage: pageIdx + 1,
      totalPages,
      percent,
      stage: `Aggregating page ${pageIdx + 1} of ${totalPages} (${pageBatches.length} batch lots)...`,
      processedRecords: processedCount
    });

    // Small yield to keep UI responsive & render progress bar smoothly
    await new Promise((r) => setTimeout(r, 140));

    for (const batch of pageBatches) {
      if (signal?.aborted) throw new DOMException('Export aborted by user', 'AbortError');

      // 1. Master Batch Row
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
        // Empty telemetry/breach fields for master row
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
      processedCount++;

      // 2. Historical Telemetry Cycles
      if (batch.telemetryHistory && batch.telemetryHistory.length > 0) {
        for (const t of batch.telemetryHistory) {
          rows.push([
            escapeCSV('TELEMETRY_SAMPLE'),
            escapeCSV(batch.id),
            escapeCSV(batch.commodity),
            escapeCSV(batch.variety),
            escapeCSV(batch.farmerName),
            escapeCSV(batch.farmLocation),
            escapeCSV(batch.destinationHub),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(t.isBreach ? 'BREACH_SAMPLE' : 'NOMINAL_SAMPLE'),
            escapeCSV(batch.stage),
            escapeCSV(batch.targetTempMin),
            escapeCSV(batch.targetTempMax),
            escapeCSV(t.temperatureC),
            escapeCSV(t.humidityPercent),
            escapeCSV(batch.assignedReeferId || ''),
            escapeCSV(batch.blockchainSealHash),
            escapeCSV(''),
            escapeCSV(t.timestamp),
            escapeCSV(t.temperatureC),
            escapeCSV(t.ambientTempC),
            escapeCSV(t.humidityPercent),
            escapeCSV(t.compressorRpm),
            escapeCSV(t.batterySocPercent),
            escapeCSV(t.breachSeverity),
            escapeCSV(t.durationMinutesExceeded || 0),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(t.correctiveActionTaken || ''),
            escapeCSV(''),
            escapeCSV('')
          ]);
          processedCount++;
        }
      }

      // 3. Breach Incident Records
      if (batch.breachRecords && batch.breachRecords.length > 0) {
        for (const br of batch.breachRecords) {
          rows.push([
            escapeCSV('BREACH_INCIDENT'),
            escapeCSV(batch.id),
            escapeCSV(batch.commodity),
            escapeCSV(batch.variety),
            escapeCSV(batch.farmerName),
            escapeCSV(batch.farmLocation),
            escapeCSV(batch.destinationHub),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV('CRITICAL_BREACH'),
            escapeCSV(batch.stage),
            escapeCSV(batch.targetTempMin),
            escapeCSV(batch.targetTempMax),
            escapeCSV(br.peakTemperatureC),
            escapeCSV(''),
            escapeCSV(batch.assignedReeferId || ''),
            escapeCSV(br.blockchainHash),
            escapeCSV(''),
            escapeCSV(br.timestamp),
            escapeCSV(br.peakTemperatureC),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV(''),
            escapeCSV('CRITICAL_EXCURSION'),
            escapeCSV(br.durationMinutes),
            escapeCSV(br.id),
            escapeCSV(br.peakTemperatureC),
            escapeCSV(br.thresholdLimitC),
            escapeCSV(br.excursionDeltaC),
            escapeCSV(br.locationAtBreach),
            escapeCSV(br.rootCause),
            escapeCSV(br.remedialAction),
            escapeCSV(br.quarantineTriggered ? 'QUARANTINE_ENFORCED' : 'RELEASED_NOMINAL'),
            escapeCSV(br.auditorAck ? 'AUDITOR_ATTESTED' : 'PENDING_ATTESTATION')
          ]);
          processedCount++;
        }
      }
    }
  }

  // Finalization Stage
  onProgress?.({
    currentPage: totalPages,
    totalPages,
    percent: 98,
    stage: 'Encoding UTF-8 BOM byte buffer & initiating download...',
    processedRecords: processedCount
  });

  await new Promise((r) => setTimeout(r, 80));
  if (signal?.aborted) throw new DOMException('Export aborted by user', 'AbortError');

  // Prepend UTF-8 BOM so Microsoft Excel & LibreOffice render special characters cleanly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;

  // Trigger browser download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  onProgress?.({
    currentPage: totalPages,
    totalPages,
    percent: 100,
    stage: 'Multi-page CSV download complete!',
    processedRecords: processedCount
  });

  return {
    filename,
    rowCount: rows.length,
    byteSize: blob.size,
    pageCount: totalPages,
    durationMs: Date.now() - startTime
  };
}
