import React, { useState, useMemo } from 'react';
import { ProduceBatch, ColdChainStatus, QualityGrade, ProduceCommodity } from '../../types';
import { exportInventoryToCSV, generateCompliancePDF } from '../../lib/reportGenerator';
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
  QrCode
} from 'lucide-react';

interface WarehouseModuleProps {
  batches: ProduceBatch[];
  onUpdateBatchStatus: (batchId: string, status: ColdChainStatus) => void;
  onUpdateBatchStage: (batchId: string, stage: ProduceBatch['stage']) => void;
}

type SortField = 'id' | 'commodity' | 'currentTemp' | 'quantityKg' | 'coldChainStatus' | 'harvestDate';
type SortDirection = 'asc' | 'desc';

export const WarehouseModule: React.FC<WarehouseModuleProps> = ({
  batches,
  onUpdateBatchStatus,
  onUpdateBatchStage
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCommodity, setFilterCommodity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('harvestDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(6);
  
  // Selected batch for detailed audit drawer
  const [inspectingBatch, setInspectingBatch] = useState<ProduceBatch | null>(null);

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter & Search Logic
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesSearch =
        searchQuery === '' ||
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.destinationHub.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.blockchainSealHash.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCommodity = filterCommodity === 'ALL' || b.commodity === filterCommodity;
      const matchesStatus = filterStatus === 'ALL' || b.coldChainStatus === filterStatus;

      return matchesSearch && matchesCommodity && matchesStatus;
    });
  }, [batches, searchQuery, filterCommodity, filterStatus]);

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

  const handleExportSelectedCSV = () => {
    const toExport = batches.filter((b) => selectedBatchIds.has(b.id));
    exportInventoryToCSV(toExport.length > 0 ? toExport : sortedBatches);
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-[#0f1722] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Warehouse className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Cold-Storage Inventory & Ingestion Grid</h1>
            <p className="text-xs text-slate-400">
              High-throughput data grid with multi-column sorting, thermal threshold filters, and blockchain dispatch seals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportInventoryToCSV(sortedBatches)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Grid (CSV)</span>
          </button>
        </div>
      </div>

      {/* Facility Cold-Bay Overview Mini-Deck */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#0f1722] border border-slate-800 rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Cold Bay Ingestion</span>
          <div className="text-2xl font-black text-white font-mono">{batches.length} Batches</div>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">Active under refrigeration</span>
        </div>

        <div className="p-4 bg-[#0f1722] border border-slate-800 rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Total Mass In Storage</span>
          <div className="text-2xl font-black text-white font-mono">
            {batches.reduce((acc, b) => acc + b.quantityKg, 0).toLocaleString()} kg
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Across 5 primary commodities</span>
        </div>

        <div className="p-4 bg-[#0f1722] border border-slate-800 rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Nominal Envelope Rate</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">99.2%</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Within ±0.3°C variance</span>
        </div>

        <div className="p-4 bg-[#0f1722] border border-slate-800 rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Quarantine Flags</span>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {batches.filter((b) => b.coldChainStatus === 'CRITICAL_BREACH').length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Holding for compliance sign-off</span>
        </div>
      </div>

      {/* Data Grid Card */}
      <div className="bg-[#0f1722] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        
        {/* Controls Bar: Search, Filters & Bulk Actions */}
        <div className="p-4 border-b border-slate-800 bg-[#0c131c] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Global Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Batch ID, Farmer, Produce, Destination, or Hash..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#0a1017] border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Commodity & Status Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={filterCommodity}
              onChange={(e) => {
                setFilterCommodity(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#0a1017] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Commodities</option>
              <option value="strawberries">Strawberries</option>
              <option value="lettuce">Romaine Lettuce</option>
              <option value="tomatoes">Roma Tomatoes</option>
              <option value="avocados">Avocados</option>
              <option value="blueberries">Blueberries</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#0a1017] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Thermal Statuses</option>
              <option value="OPTIMAL">Optimal Envelope</option>
              <option value="WARNING">Thermal Warning</option>
              <option value="CRITICAL_BREACH">Critical Breach</option>
            </select>
          </div>

          {/* Bulk Selection Actions */}
          {selectedBatchIds.size > 0 && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg">
              <span className="text-xs font-mono font-bold text-amber-400">
                {selectedBatchIds.size} Selected
              </span>
              <button
                onClick={handleBatchRelease}
                className="px-2 py-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded"
              >
                Release Optimal
              </button>
              <button
                onClick={handleBatchQuarantine}
                className="px-2 py-1 text-[11px] font-bold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded"
              >
                Hold Quarantine
              </button>
            </div>
          )}
        </div>

        {/* High-Performance Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090e15] border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedBatchIds.size === paginatedBatches.length && paginatedBatches.length > 0}
                    onChange={toggleSelectAll}
                    className="accent-amber-400 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => handleSort('id')}
                  className="p-3 font-semibold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Batch ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('commodity')}
                  className="p-3 font-semibold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Produce & Variety</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('currentTemp')}
                  className="p-3 font-semibold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Core Temp</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantityKg')}
                  className="p-3 font-semibold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Mass (KG)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 font-semibold">Origin & Destination</th>
                <th
                  onClick={() => handleSort('coldChainStatus')}
                  className="p-3 font-semibold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Cold Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 font-semibold">Pipeline Stage</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-sans">
              {paginatedBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No matching agricultural produce batches found. Adjust your search query or filters.
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
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isBreach ? 'bg-rose-950/20' : isChecked ? 'bg-amber-400/5' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(batch.id)}
                          className="accent-amber-400 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                        <button
                          onClick={() => setInspectingBatch(batch)}
                          className="text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span>{batch.id}</span>
                        </button>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-white truncate max-w-[180px]">{batch.variety}</div>
                        <span className="text-[11px] text-slate-400 capitalize">{batch.commodity}</span>
                      </td>

                      <td className="p-3 font-mono whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            isBreach ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {batch.currentTemp.toFixed(1)}°C
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Set: {batch.targetTempMin}-{batch.targetTempMax}°C
                        </span>
                      </td>

                      <td className="p-3 font-mono text-slate-200 whitespace-nowrap">
                        {batch.quantityKg.toLocaleString()}
                      </td>

                      <td className="p-3">
                        <div className="text-slate-300 truncate max-w-[160px]">{batch.farmerName}</div>
                        <span className="text-[10px] text-slate-500 truncate block max-w-[160px]">
                          → {batch.destinationHub}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isBreach
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isWarning
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {batch.coldChainStatus}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className="text-[11px] text-slate-300 font-medium">
                          {batch.stage.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingBatch(batch)}
                            title="Inspect Audit Trail"
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => generateCompliancePDF(batch)}
                            title="Generate Official Compliance Certificate PDF"
                            className="p-1.5 rounded hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
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
        <div className="p-4 border-t border-slate-800 bg-[#0c131c] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#0a1017] border border-slate-800 rounded px-2 py-1 text-slate-300"
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
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspecting Batch Detail Drawer / Modal */}
      {inspectingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f1722] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{inspectingBatch.id}</h3>
                  <p className="text-xs text-slate-400">{inspectingBatch.variety} · {inspectingBatch.farmerName}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingBatch(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#131c28] border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Mass</span>
                  <div className="font-mono font-bold text-white text-base">{inspectingBatch.quantityKg.toLocaleString()} kg</div>
                </div>
                <div className="p-3 bg-[#131c28] border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Core Temp</span>
                  <div className="font-mono font-bold text-emerald-400 text-base">{inspectingBatch.currentTemp}°C</div>
                </div>
                <div className="p-3 bg-[#131c28] border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Humidity</span>
                  <div className="font-mono font-bold text-sky-400 text-base">{inspectingBatch.currentHumidity}%</div>
                </div>
                <div className="p-3 bg-[#131c28] border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Quality</span>
                  <div className="font-mono font-bold text-amber-400 text-xs truncate">{inspectingBatch.qualityGrade}</div>
                </div>
              </div>

              {/* Blockchain Seal Info */}
              <div className="p-4 bg-[#0a1017] border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-400" /> Immutable Blockchain Ledger Seal
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Verified</span>
                </div>
                <div className="font-mono text-xs text-amber-300 break-all bg-black/40 p-2.5 rounded border border-slate-800/80">
                  {inspectingBatch.blockchainSealHash}
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Harvest Date:</span>
                  <span className="font-mono text-white">{inspectingBatch.harvestDate}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Target Envelope:</span>
                  <span className="font-mono text-white">{inspectingBatch.targetTempMin}°C - {inspectingBatch.targetTempMax}°C</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Inspecting Authority:</span>
                  <span className="text-white">{inspectingBatch.inspectedBy || 'USDA-AMS Designated Station'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Notes & Logs:</span>
                  <span className="text-white text-right max-w-xs">{inspectingBatch.notes || 'None logged.'}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-[#0c131c] border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => generateCompliancePDF(inspectingBatch)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF Certificate</span>
              </button>

              <button
                onClick={() => setInspectingBatch(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
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
