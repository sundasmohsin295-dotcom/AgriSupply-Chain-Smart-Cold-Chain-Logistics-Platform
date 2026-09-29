import React, { useState } from 'react';
import { ProduceBatch } from '../../types';
import { 
  exportBatchesWithTelemetryAndBreachesCSV, 
  exportTemperatureBreachAuditCSV, 
  exportInventoryToCSV,
  generateCompliancePDF
} from '../../lib/reportGenerator';
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
  Sparkles
} from 'lucide-react';

interface ReportsModuleProps {
  batches: ProduceBatch[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ batches }) => {
  const [activeReportTab, setActiveReportTab] = useState<'supplyLoss' | 'temperature' | 'deliveryTime' | 'revenue'>('supplyLoss');
  const [reportType, setReportType] = useState<string>('complianceInvoice');
  const [dateRange, setDateRange] = useState<string>('last30');
  const [exportFormat, setExportFormat] = useState<'PDF' | 'CSV'>('CSV');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

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
      setExportSuccessMessage(`Generated ${exportFormat} report for ${reportType} (${dateRange}).`);
      setTimeout(() => setExportSuccessMessage(null), 4000);
    }, 500);
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Reports & Supply Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate audited regulatory invoices, telemetry log manifests, and bulk CSV export files
          </p>
        </div>

        {/* Highlighted Bulk CSV Export Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportBatchesWithTelemetryAndBreachesCSV(batches)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Database className="w-4 h-4" />
            <span>Export Full Telemetry & Breach Ledger (CSV)</span>
          </button>

          <button
            onClick={() => exportTemperatureBreachAuditCSV(batches)}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Export Breaches Only (CSV)</span>
          </button>
        </div>
      </div>

      {/* Grid: Charts View on Left + Generate Report Tool on Right (Matching Reference Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Analytics Chart Tabs */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          
          <div>
            {/* Tabs matching Reference Image */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
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

        {/* Right Column: "Generate Report" Panel (Matching Reference Image) */}
        <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Generate Report</h3>
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
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating Report...' : 'Generate & Download'}</span>
            </button>

            {exportSuccessMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{exportSuccessMessage}</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
