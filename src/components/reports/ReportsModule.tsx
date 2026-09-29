import React, { useState, useRef } from 'react';
import { ProduceBatch } from '../../types';
import { 
  exportBatchesWithTelemetryAndBreachesCSV, 
  exportTemperatureBreachAuditCSV, 
  exportInventoryToCSV,
  generateCompliancePDF
} from '../../lib/reportGenerator';
import { 
  exportAllBatchesMultiPageCSV, 
  MultiPageExportProgress, 
  MultiPageExportResult 
} from '../../lib/multiPageExport';
import { PDFReceiptVerificationQR } from './PDFReceiptVerificationQR';
import { 
  FileText, 
  Download, 
  TrendingDown, 
  Thermometer, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Database,
  Calendar,
  Sparkles,
  RefreshCw,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Check
} from 'lucide-react';

interface ReportsModuleProps {
  batches: ProduceBatch[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ batches }) => {
  // Chart & Single-report options
  const [activeReportTab, setActiveReportTab] = useState<'supplyLoss' | 'temperature' | 'deliveryTime' | 'revenue'>('supplyLoss');
  const [reportType, setReportType] = useState<string>('complianceInvoice');
  const [dateRange, setDateRange] = useState<string>('last30');
  const [exportFormat, setExportFormat] = useState<'PDF' | 'CSV'>('CSV');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Multi-Page "Download All" State
  const [isMultiPageExporting, setIsMultiPageExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<MultiPageExportProgress | null>(null);
  const [pageSize, setPageSize] = useState<number>(3); // 3 batches per page chunk
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [simulateError, setSimulateError] = useState<boolean>(false);

  // Toast Notifications State (Clear Success & Error feedback for CSV exports)
  const [successToast, setSuccessToast] = useState<MultiPageExportResult | null>(null);
  const [errorToast, setErrorToast] = useState<{ message: string; timestamp: string } | null>(null);
  const [singleSuccessToast, setSingleSuccessToast] = useState<string | null>(null);

  // Abort Controller ref for cancelling multi-page export
  const abortControllerRef = useRef<AbortController | null>(null);

  // Pagination Math for Batch Preview
  const totalPages = Math.max(1, Math.ceil(batches.length / pageSize));
  const currentBatches = batches.slice((previewPage - 1) * pageSize, previewPage * pageSize);

  /**
   * Primary Feature Implementation:
   * 'Download All' aggregates data across multiple pages with progressive chunking,
   * animated progress bar, cancel capability, and success/error feedback toasts.
   */
  const handleDownloadAllMultiPage = async () => {
    // Reset previous toasts
    setSuccessToast(null);
    setErrorToast(null);
    setSingleSuccessToast(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsMultiPageExporting(true);

    try {
      const result = await exportAllBatchesMultiPageCSV(batches, {
        pageSize,
        filenamePrefix: 'AgriSupply-Complete-MultiPage-Ledger',
        signal: abortController.signal,
        simulateError,
        onProgress: (progress) => {
          setExportProgress(progress);
        }
      });

      // Clear progress state and show rich success toast
      setIsMultiPageExporting(false);
      setExportProgress(null);
      setSuccessToast(result);

      // Auto dismiss success toast after 7s
      setTimeout(() => {
        setSuccessToast(null);
      }, 7000);
    } catch (err: unknown) {
      setIsMultiPageExporting(false);
      setExportProgress(null);

      if (err instanceof DOMException && err.name === 'AbortError') {
        setErrorToast({
          message: 'Multi-page CSV aggregation was cancelled by user.',
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Unknown export failure occurred.';
        setErrorToast({
          message: `Multi-page CSV export failed: ${errorMsg}`,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  /**
   * Cancel ongoing multi-page download
   */
  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  /**
   * Download single page slice only
   */
  const handleDownloadCurrentPageOnly = () => {
    exportBatchesWithTelemetryAndBreachesCSV(
      currentBatches,
      `AgriSupply-Page-${previewPage}-of-${totalPages}`
    );
    setSingleSuccessToast(`Exported Page ${previewPage} (${currentBatches.length} batch lots) to CSV.`);
    setTimeout(() => setSingleSuccessToast(null), 4000);
  };

  /**
   * Standard single report generator handler
   */
  const handleGenerateReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      if (exportFormat === 'CSV') {
        if (reportType === 'telemetryBreaches') {
          exportTemperatureBreachAuditCSV(batches);
        } else if (reportType === 'fullTelemetryLedger') {
          exportBatchesWithTelemetryAndBreachesCSV(batches);
        } else {
          exportInventoryToCSV(batches);
        }
      } else {
        // PDF Export
        if (batches.length > 0) {
          generateCompliancePDF(batches[0]!);
        }
      }
      setIsExporting(false);
      setSingleSuccessToast(`Generated ${exportFormat} report for ${reportType} (${dateRange}).`);
      setTimeout(() => setSingleSuccessToast(null), 4000);
    }, 500);
  };

  return (
    <div className="space-y-6">

      {/* Persistent Feedback Toast: Multi-Page CSV Export SUCCESS */}
      {successToast && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl shadow-xl flex items-start justify-between gap-4 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-200/50 dark:bg-emerald-900/50 px-2 py-0.5 rounded">
                  CSV Export Succeeded
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {successToast.durationMs}ms
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                Aggregated Multi-Page CSV Successfully Generated
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Aggregated <strong className="font-mono text-emerald-700 dark:text-emerald-400">{successToast.pageCount} pages</strong> containing{' '}
                <strong className="font-mono">{successToast.rowCount} total records</strong> (master batches + telemetry cycles + breach records).
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>File: {successToast.filename}</span>
                <span>·</span>
                <span>Size: {(successToast.byteSize / 1024).toFixed(1)} KB</span>
                <span>·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ready in Downloads</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSuccessToast(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
            aria-label="Close toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Persistent Feedback Toast: Multi-Page CSV Export ERROR */}
      {errorToast && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500 rounded-2xl shadow-xl flex items-start justify-between gap-4 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <XCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 bg-rose-200/50 dark:bg-rose-900/50 px-2 py-0.5 rounded">
                  CSV Export Error
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {errorToast.timestamp}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                Data Aggregation Failed
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                {errorToast.message}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handleDownloadAllMultiPage}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Multi-Page Export</span>
                </button>
                {simulateError && (
                  <button
                    onClick={() => {
                      setSimulateError(false);
                      handleDownloadAllMultiPage();
                    }}
                    className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline"
                  >
                    Disable Simulated Error & Retry
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setErrorToast(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition"
            aria-label="Close error toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Single Export Success Toast */}
      {singleSuccessToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{singleSuccessToast}</span>
          </div>
          <button onClick={() => setSingleSuccessToast(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner with "Download All" Action Hub */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500/20 text-white dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Reports & Multi-Page Data Aggregation
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bulk aggregate cold-chain logs across multiple paginated slices with full historical telemetry & breach records.
          </p>
        </div>

        {/* Action Group: Download All (Multi-Page) + Specialized CSVs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* PRIMARY "DOWNLOAD ALL" MULTI-PAGE BUTTON */}
          <button
            onClick={handleDownloadAllMultiPage}
            disabled={isMultiPageExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
            title="Aggregates data across all pages with real-time progress bar"
          >
            {isMultiPageExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isMultiPageExporting ? 'Aggregating Pages...' : 'Download All (Aggregated CSV)'}</span>
          </button>

          <button
            onClick={() => exportTemperatureBreachAuditCSV(batches)}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
            title="Download thermal breach excursion audit records only"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Export Breaches (CSV)</span>
            <span className="sm:hidden">Breaches</span>
          </button>
        </div>
      </div>

      {/* PROGRESS BAR PANEL (Visible when isMultiPageExporting is active) */}
      {isMultiPageExporting && exportProgress && (
        <div className="p-5 bg-white dark:bg-[#0f1722] border-2 border-emerald-500/60 rounded-2xl shadow-lg space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  Multi-Page Aggregation in Progress
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {exportProgress.stage}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                {exportProgress.percent}%
              </span>

              <button
                onClick={handleCancelExport}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>

          {/* Graphical Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700/80">
            <div
              className="bg-gradient-to-r from-emerald-600 to-amber-400 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${exportProgress.percent}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>
              Page {exportProgress.currentPage} of {exportProgress.totalPages}
            </span>
            <span>
              {exportProgress.processedRecords} Records Processed
            </span>
          </div>
        </div>
      )}

      {/* Multi-Page Dataset Preview & Slice Explorer */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Paginated Data Partition Preview
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Browse page slices that will be merged into the unified multi-page CSV export.
            </p>
          </div>

          {/* Controls: Page Size Selector + Page Navigator */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>Slice Size:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPreviewPage(1);
                }}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value={2}>2 batches / page</option>
                <option value={3}>3 batches / page</option>
                <option value={5}>5 batches / page</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                disabled={previewPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-slate-700 dark:text-slate-300 px-2 font-bold">
                Page {previewPage} / {totalPages}
              </span>

              <button
                onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                disabled={previewPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Current Page Only Export */}
            <button
              onClick={handleDownloadCurrentPageOnly}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              title="Download only the batches on the current preview page"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Page {previewPage} Only</span>
            </button>
          </div>
        </div>

        {/* Batches on Active Page Slice */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] font-mono uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
              <tr>
                <th className="py-2.5 px-3">Batch ID</th>
                <th className="py-2.5 px-3">Commodity & Variety</th>
                <th className="py-2.5 px-3">Farm Origin</th>
                <th className="py-2.5 px-3">Net Weight</th>
                <th className="py-2.5 px-3">Telemetry Cycles</th>
                <th className="py-2.5 px-3">Breaches</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Blockchain Seal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {currentBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    {batch.id}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      {batch.commodity}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{batch.variety}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-xs">
                    {batch.farmLocation}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                    {batch.quantityKg.toLocaleString()} kg
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {batch.telemetryHistory ? `${batch.telemetryHistory.length} logs` : '0 logs'}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {batch.breachRecords && batch.breachRecords.length > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        {batch.breachRecords.length} recorded
                      </span>
                    ) : (
                      <span className="text-slate-400">0 nominal</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        batch.coldChainStatus === 'CRITICAL_BREACH'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                          : batch.coldChainStatus === 'WARNING'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}
                    >
                      ● {batch.coldChainStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-400">
                    {batch.blockchainSealHash.slice(0, 10)}...{batch.blockchainSealHash.slice(-6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info & Test mode toggle */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <span>
            Total Dataset: <strong>{batches.length} batches</strong> across <strong>{totalPages} pages</strong>. Clicking &apos;Download All&apos; will aggregate all {totalPages} pages into one unified CSV spreadsheet.
          </span>

          <label className="flex items-center gap-1.5 text-[11px] font-mono cursor-pointer select-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <input
              type="checkbox"
              checked={simulateError}
              onChange={(e) => setSimulateError(e.target.checked)}
              className="rounded accent-rose-500"
            />
            <span>Simulate Network Error on Page 2 (Defense Test)</span>
          </label>
        </div>
      </div>

      {/* Mandatory Feature: PDF Receipt SHA-256 Hash & QR Code Verification Component */}
      <PDFReceiptVerificationQR batches={batches} />

      {/* Grid: Charts View on Left + Custom Report Generator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Analytics Chart Tabs */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          
          <div>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveReportTab('supplyLoss')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeReportTab === 'supplyLoss'
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Supply Loss
              </button>
              <button
                onClick={() => setActiveReportTab('temperature')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeReportTab === 'temperature'
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Temperature
              </button>
              <button
                onClick={() => setActiveReportTab('deliveryTime')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeReportTab === 'deliveryTime'
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Delivery Time
              </button>
              <button
                onClick={() => setActiveReportTab('revenue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeReportTab === 'revenue'
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Revenue
              </button>
            </div>

            {/* Chart Area */}
            <div className="py-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                    {activeReportTab === 'supplyLoss' && 'Weekly Supply Loss Rate (%)'}
                    {activeReportTab === 'temperature' && 'Cold Chamber Average Temperature Stability (°C)'}
                    {activeReportTab === 'deliveryTime' && 'Corridor Turnaround Hours (Dock to Shelf)'}
                    {activeReportTab === 'revenue' && 'Perishable Value Preserved ($ Saved)'}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Aggregated over the selected trailing 4-week window
                  </span>
                </div>

                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  {activeReportTab === 'supplyLoss' && '-78% Spoilage Reduction'}
                  {activeReportTab === 'temperature' && '99.4% In-Envelope'}
                  {activeReportTab === 'deliveryTime' && '98.9% On-Time'}
                  {activeReportTab === 'revenue' && '+$142,500 Retained'}
                </span>
              </div>

              {/* Bar Chart Representation */}
              <div className="h-56 w-full flex items-end justify-between gap-4 pt-6 pb-2 px-2 border-b border-slate-200 dark:border-slate-800">
                {[
                  { label: 'Week 1', val: activeReportTab === 'supplyLoss' ? 6.8 : activeReportTab === 'temperature' ? 4.1 : 3.2, height: '65%' },
                  { label: 'Week 2', val: activeReportTab === 'supplyLoss' ? 5.2 : activeReportTab === 'temperature' ? 3.8 : 2.8, height: '52%' },
                  { label: 'Week 3', val: activeReportTab === 'supplyLoss' ? 3.9 : activeReportTab === 'temperature' ? 4.0 : 2.5, height: '38%' },
                  { label: 'Week 4', val: activeReportTab === 'supplyLoss' ? 2.8 : activeReportTab === 'temperature' ? 4.2 : 2.1, height: '28%' }
                ].map((col) => (
                  <div key={col.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {col.val}
                    </span>
                    <div
                      style={{ height: col.height }}
                      className="w-full max-w-[54px] bg-emerald-600 dark:bg-emerald-500 rounded-t-lg transition-all group-hover:brightness-110"
                    ></div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 font-mono mt-1">
                      {col.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Validated by automated ColdGuard Oracle telemetry</span>
            <span>N={batches.length} Certified Batches</span>
          </div>

        </div>

        {/* Right Column: "Generate Report" Panel */}
        <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Custom Query Report</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select report criteria and export format</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="complianceInvoice">Compliance Invoice & Dispatch Receipt</option>
                <option value="fullTelemetryLedger">Comprehensive Telemetry & Breach Ledger (CSV)</option>
                <option value="telemetryBreaches">Temperature Breach Incident Audit</option>
                <option value="inventorySummary">Warehouse Inventory Summary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days (Recommended)</option>
                <option value="currentQuarter">Current Harvest Quarter</option>
                <option value="allTime">Full Historical Archive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Export Format
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="format"
                    checked={exportFormat === 'PDF'}
                    onChange={() => setExportFormat('PDF')}
                    className="accent-emerald-600"
                  />
                  <span>PDF Document</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="format"
                    checked={exportFormat === 'CSV'}
                    onChange={() => setExportFormat('CSV')}
                    className="accent-emerald-600"
                  />
                  <span>CSV Spreadsheet</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={isExporting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating Report...' : 'Generate & Download'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
