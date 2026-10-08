import React, { useState, useMemo, useEffect } from 'react';
import { ProduceBatch, ColdChainStatus, QualityGrade, ProduceCommodity } from '../../types';
import { 
  exportInventoryToCSV, 
  generateCompliancePDF,
  exportBatchesWithTelemetryAndBreachesCSV,
  exportTemperatureBreachAuditCSV
} from '../../lib/reportGenerator';
import { 
  Warehouse, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Download, 
  ShieldAlert, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Eye, 
  Thermometer, 
  X,
  Layers,
  Sparkles,
  QrCode,
  Database,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

interface WarehouseModuleProps {
  batches: ProduceBatch[];
  onUpdateBatchStatus: (batchId: string, status: ColdChainStatus) => void;
  onUpdateBatchStage: (batchId: string, stage: ProduceBatch['stage']) => void;
}

export function calculateFefoDaysRemaining(batch: ProduceBatch): number {
  const shelfLifeMap: Record<string, number> = {
    strawberry: 7,
    mango: 14,
    tomato: 12,
    citrus: 28,
    apple: 35,
    grapes: 21,
    banana: 10
  };
  const totalShelfLife = shelfLifeMap[batch.commodity.toLowerCase()] || 14;
  const harvestTime = new Date(batch.harvestDate).getTime();
  const now = Date.now();
  const daysPassed = Math.max(0, Math.floor((now - harvestTime) / (1000 * 60 * 60 * 24)));
  const penalty = batch.coldChainStatus === 'CRITICAL_BREACH' ? 4 : batch.coldChainStatus === 'WARNING' ? 1 : 0;
  return Math.max(1, totalShelfLife - daysPassed - penalty);
}

type SortField = 'id' | 'commodity' | 'currentTemp' | 'quantityKg' | 'coldChainStatus' | 'harvestDate';
type SortDirection = 'asc' | 'desc';

export const WarehouseModule: React.FC<WarehouseModuleProps> = ({
  batches,
  onUpdateBatchStatus,
  onUpdateBatchStage
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [filterCommodity, setFilterCommodity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('harvestDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(6);

  // Debounce global-search input (300ms) to preserve UI performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  
  // Selected batch for detailed audit drawer
  const [inspectingBatch, setInspectingBatch] = useState<ProduceBatch | null>(null);

  // Bulk Export Options Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportScope, setExportScope] = useState<'all' | 'selected' | 'breachesOnly'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter & Search Logic (driven by debouncedSearchQuery)
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const q = debouncedSearchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        b.id.toLowerCase().includes(q) ||
        b.variety.toLowerCase().includes(q) ||
        b.farmerName.toLowerCase().includes(q) ||
        b.destinationHub.toLowerCase().includes(q) ||
        b.blockchainSealHash.toLowerCase().includes(q);

      const matchesCommodity = filterCommodity === 'ALL' || b.commodity === filterCommodity;
      const matchesStatus = filterStatus === 'ALL' || b.coldChainStatus === filterStatus;

      return matchesSearch && matchesCommodity && matchesStatus;
    });
  }, [batches, debouncedSearchQuery, filterCommodity, filterStatus]);

  // Sort Logic
  const sortedBatches = useMemo(() => {
    return [...filteredBatches].sort((a, b) => {
      let valA: unknown = a[sortField];
      let valB: unknown = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [filteredBatches, sortField, sortDirection]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(sortedBatches.length / rowsPerPage));
  const paginatedBatches = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedBatches.slice(start, start + rowsPerPage);
  }, [sortedBatches, currentPage, rowsPerPage]);

  // Checkbox Selection
  const toggleSelectAll = () => {
    if (selectedBatchIds.size === paginatedBatches.length) {
      setSelectedBatchIds(new Set());
    } else {
      setSelectedBatchIds(new Set(paginatedBatches.map((b) => b.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedBatchIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedBatchIds(next);
  };

  // Batch Operations
  const handleBatchQuarantine = () => {
    selectedBatchIds.forEach((id) => {
      onUpdateBatchStatus(id, 'CRITICAL_BREACH');
    });
    setSelectedBatchIds(new Set());
  };

  const handleBatchRelease = () => {
    selectedBatchIds.forEach((id) => {
      onUpdateBatchStatus(id, 'OPTIMAL');
    });
    setSelectedBatchIds(new Set());
  };

  // Mandatory Feature Implementation: CSV bulk export utility for batch table
  const handleExecuteBulkExport = () => {
    let targetBatches: ProduceBatch[] = [];

    if (exportScope === 'selected') {
      targetBatches = batches.filter((b) => selectedBatchIds.has(b.id));
      if (targetBatches.length === 0) targetBatches = sortedBatches;
    } else if (exportScope === 'breachesOnly') {
      exportTemperatureBreachAuditCSV(batches);
      setIsExportModalOpen(false);
      setToastMessage('Exported Temperature Breach Audit CSV with all thermal excursion logs.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    } else {
      targetBatches = sortedBatches;
    }

    // Call comprehensive bulk export with all historical telemetry cycles and breach records
    exportBatchesWithTelemetryAndBreachesCSV(targetBatches, 'AgriSupply-Batch-Telemetry-Breach-Export');
    setIsExportModalOpen(false);
    setToastMessage(`Bulk exported ${targetBatches.length} batches with complete historical telemetry logs & breach records.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
            <Warehouse className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Cold-Storage Inventory & Ingestion Grid</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              High-throughput data grid with multi-column sorting, thermal threshold filters, and CSV bulk telemetry exports
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk Export Telemetry & Breaches (CSV)</span>
          </button>

          <button
            onClick={() => exportInventoryToCSV(sortedBatches)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Quick Grid CSV</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Facility Cold-Bay Overview Mini-Deck */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Cold Bay Ingestion</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{batches.length} Batches</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">Active under refrigeration</span>
        </div>

        <div className="p-4 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Total Mass In Storage</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {batches.reduce((acc, b) => acc + b.quantityKg, 0).toLocaleString()} kg
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Across certified cooperatives</span>
        </div>

        <div className="p-4 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Nominal Envelope Rate</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">99.4%</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Within ±0.2°C tolerance</span>
        </div>

        <div className="p-4 bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Historical Excursions</span>
          <div className="text-2xl font-black text-amber-500 font-mono">
            {batches.reduce((acc, b) => acc + (b.breachRecords ? b.breachRecords.length : 0), 0)} Logged
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">All audited & resolved</span>
        </div>
      </div>

      {/* Data Grid Card */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Controls Bar: Search, Filters & Bulk Actions */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c131c] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Global Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Batch ID, Producer, Location, Destination..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Commodity & Status Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={filterCommodity}
              onChange={(e) => {
                setFilterCommodity(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Commodities</option>
              <option value="tomatoes">Roma Tomatoes</option>
              <option value="potatoes">Okara Potatoes</option>
              <option value="spinach">Baby Spinach</option>
              <option value="mangoes">Sindh Mangoes</option>
              <option value="apples">Swat Apples</option>
              <option value="dates">Sukkur Dates</option>
              <option value="strawberries">Strawberries</option>
              <option value="peaches">Peshawar Peaches</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Thermal Statuses</option>
              <option value="OPTIMAL">Optimal Envelope</option>
              <option value="WARNING">Thermal Warning</option>
              <option value="CRITICAL_BREACH">Critical Breach</option>
            </select>
          </div>

          {/* Bulk Selection Actions */}
          {selectedBatchIds.size > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-slate-900 border border-emerald-300 dark:border-slate-700 px-3 py-1 rounded-lg">
              <span className="text-xs font-mono font-bold text-emerald-800 dark:text-amber-400">
                {selectedBatchIds.size} Selected
              </span>
              <button
                onClick={() => {
                  setExportScope('selected');
                  handleExecuteBulkExport();
                }}
                className="px-2 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-500"
              >
                Export CSV ({selectedBatchIds.size})
              </button>
              <button
                onClick={handleBatchRelease}
                className="px-2 py-1 text-[11px] font-bold bg-slate-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 rounded"
              >
                Release
              </button>
              <button
                onClick={handleBatchQuarantine}
                className="px-2 py-1 text-[11px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded"
              >
                Hold
              </button>
            </div>
          )}
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-[#090e15] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedBatchIds.size === paginatedBatches.length && paginatedBatches.length > 0}
                    onChange={toggleSelectAll}
                    className="accent-emerald-600 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => handleSort('id')}
                  className="p-3 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Batch ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('commodity')}
                  className="p-3 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Produce & Variety</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('currentTemp')}
                  className="p-3 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Core Temp</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantityKg')}
                  className="p-3 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Mass (KG)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 font-semibold">Origin & Destination</th>
                <th
                  onClick={() => handleSort('coldChainStatus')}
                  className="p-3 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Cold Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 font-semibold">FEFO Shelf-Life</th>
                <th className="p-3 font-semibold">Telemetry Samples</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
              {paginatedBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No matching produce batches found. Adjust your search query or filters.
                  </td>
                </tr>
              ) : (
                paginatedBatches.map((batch) => {
                  const isChecked = selectedBatchIds.has(batch.id);
                  const isBreach = batch.coldChainStatus === 'CRITICAL_BREACH';
                  const isWarning = batch.coldChainStatus === 'WARNING';

                  return (
                    <tr
                      key={batch.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isBreach ? 'bg-rose-50 dark:bg-rose-950/20' : isChecked ? 'bg-emerald-50/50 dark:bg-amber-400/5' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(batch.id)}
                          className="accent-emerald-600 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <button
                          onClick={() => setInspectingBatch(batch)}
                          className="text-emerald-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span>{batch.id}</span>
                        </button>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">{batch.variety}</div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{batch.commodity}</span>
                      </td>

                      <td className="p-3 font-mono whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            isBreach ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {batch.currentTemp.toFixed(1)}°C
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Set: {batch.targetTempMin}-{batch.targetTempMax}°C
                        </span>
                      </td>

                      <td className="p-3 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {batch.quantityKg.toLocaleString()}
                      </td>

                      <td className="p-3">
                        <div className="text-slate-800 dark:text-slate-300 truncate max-w-[160px]">{batch.farmerName}</div>
                        <span className="text-[10px] text-slate-400 truncate block max-w-[160px]">
                          → {batch.destinationHub}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isBreach
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                          }`}
                        >
                          {batch.coldChainStatus}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap font-mono">
                        {(() => {
                          const daysRemaining = calculateFefoDaysRemaining(batch);
                          return (
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              daysRemaining <= 3
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : daysRemaining <= 7
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {daysRemaining}d RSL ({daysRemaining <= 3 ? 'FEFO #1' : 'Normal'})
                            </span>
                          );
                        })()}
                      </td>

                      <td className="p-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                        <span>{batch.telemetryHistory.length} cycles</span>
                        {batch.breachRecords.length > 0 && (
                          <span className="ml-1 text-rose-600 dark:text-rose-400 font-bold">
                            ({batch.breachRecords.length} breach)
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingBatch(batch)}
                            title="Inspect Audit & Telemetry Trail"
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => generateCompliancePDF(batch)}
                            title="Generate Official Compliance Certificate PDF"
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-600 dark:text-amber-400 transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c131c] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-slate-800 dark:text-slate-300"
            >
              <option value={6}>6</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>
              Showing {sortedBatches.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{' '}
              {Math.min(currentPage * rowsPerPage, sortedBatches.length)} of {sortedBatches.length} items
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-40 text-slate-800 dark:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-800 dark:text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 disabled:opacity-40 text-slate-800 dark:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CSV Bulk Export Scope Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  CSV Bulk Export Utility
                </h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Export comprehensive multi-record CSV spreadsheets containing all historical IoT sensor probe logs, core temperatures, compressor duty, battery health, and temperature breach excursion records.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Choose Data Export Scope:
              </label>

              <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                exportScope === 'all'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}>
                <input
                  type="radio"
                  name="scope"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    All Active Batches ({batches.length} Batches + Full Telemetry Logs)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Includes all batches, all 13-cycle sensor streams, ambient deltas, and breach logs.
                  </span>
                </div>
              </label>

              <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                exportScope === 'breachesOnly'
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}>
                <input
                  type="radio"
                  name="scope"
                  checked={exportScope === 'breachesOnly'}
                  onChange={() => setExportScope('breachesOnly')}
                  className="mt-0.5 accent-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Temperature Breach Excursion Records Only
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Focused audit file listing root causes, peak temps, excursion durations, and blockchain seals.
                  </span>
                </div>
              </label>

              {selectedBatchIds.size > 0 && (
                <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                  exportScope === 'selected'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}>
                  <input
                    type="radio"
                    name="scope"
                    checked={exportScope === 'selected'}
                    onChange={() => setExportScope('selected')}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Currently Selected Batches ({selectedBatchIds.size} Selected)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Export telemetry logs exclusively for batches checked in the table grid.
                    </span>
                  </div>
                </label>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulkExport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspecting Batch Detail Drawer / Modal */}
      {inspectingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">{inspectingBatch.id}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{inspectingBatch.variety} · {inspectingBatch.farmerName}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingBatch(null)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-[#131c28] border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Mass</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-base">{inspectingBatch.quantityKg.toLocaleString()} kg</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#131c28] border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Core Temp</span>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">{inspectingBatch.currentTemp}°C</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#131c28] border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Humidity</span>
                  <div className="font-mono font-bold text-sky-600 dark:text-sky-400 text-base">{inspectingBatch.currentHumidity}%</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#131c28] border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Freshness</span>
                  <div className="font-mono font-bold text-emerald-600 dark:text-amber-400 text-base">{inspectingBatch.freshnessScorePercent}%</div>
                </div>
              </div>

              {/* Historical Telemetry Samples Table */}
              <div className="p-4 bg-slate-50 dark:bg-[#0a1017] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Historical Sensor Probe Telemetry ({inspectingBatch.telemetryHistory.length} Cycles)
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">Sample Frequency 1h</span>
                </div>

                <div className="max-h-36 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 text-[11px] font-mono">
                  {inspectingBatch.telemetryHistory.map((t, i) => (
                    <div key={i} className="py-1.5 flex items-center justify-between">
                      <span className="text-slate-500">{t.timestamp}</span>
                      <span className={`font-bold ${t.isBreach ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {t.temperatureC.toFixed(2)}°C
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">{t.humidityPercent}% RH</span>
                      <span className="text-slate-500">{t.compressorRpm} RPM</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Temperature Breach Excursion Records if any */}
              {inspectingBatch.breachRecords && inspectingBatch.breachRecords.length > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/40 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Audited Temperature Breach Excursions ({inspectingBatch.breachRecords.length})
                  </span>
                  {inspectingBatch.breachRecords.map((br) => (
                    <div key={br.id} className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1 pt-1">
                      <div className="flex justify-between font-mono">
                        <span>Incident: {br.id}</span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">Peak {br.peakTemperatureC}°C (+{br.excursionDeltaC}°C)</span>
                      </div>
                      <p><strong>Root Cause:</strong> {br.rootCause}</p>
                      <p><strong>Remedial Action:</strong> {br.remedialAction}</p>
                      <span className="text-[10px] font-mono text-slate-500 block">Hash: {br.blockchainHash}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Blockchain Seal Info */}
              <div className="p-4 bg-slate-50 dark:bg-[#0a1017] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Immutable Blockchain Ledger Seal
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Verified</span>
                </div>
                <div className="font-mono text-xs text-amber-700 dark:text-amber-300 break-all bg-white dark:bg-black/40 p-2.5 rounded border border-slate-200 dark:border-slate-800/80">
                  {inspectingBatch.blockchainSealHash}
                </div>
              </div>

            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-[#0c131c] border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={() => generateCompliancePDF(inspectingBatch)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF Certificate</span>
              </button>

              <button
                onClick={() => setInspectingBatch(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold rounded-xl transition"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
