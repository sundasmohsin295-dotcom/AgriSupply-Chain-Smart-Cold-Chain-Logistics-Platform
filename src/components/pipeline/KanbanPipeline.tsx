import React from 'react';
import { ProduceBatch, PipelineStage } from '../../types';
import { COMMODITY_PROFILES } from '../../lib/constants';
import { 
  GitFork, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  Thermometer, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Building2,
  Store,
  Boxes
} from 'lucide-react';

interface KanbanPipelineProps {
  batches: ProduceBatch[];
  onAdvanceStage: (batchId: string, nextStage: PipelineStage) => void;
}

const PIPELINE_COLUMNS: {
  id: PipelineStage;
  label: string;
  sublabel: string;
  icon: string;
}[] = [
  { id: 'HARVEST_INTAKE', label: '1. Harvest Intake', sublabel: 'Field Receiving & Palletizing', icon: 'Boxes' },
  { id: 'PRE_COOLING_QA', label: '2. Pre-Cooling & QA', sublabel: 'Forced Air / Hydrocooling', icon: 'Thermometer' },
  { id: 'IN_TRANSIT_REEFER', label: '3. In-Transit Reefer', sublabel: 'GPS & Telemetry Monitored', icon: 'Truck' },
  { id: 'COLD_HUB_INTAKE', label: '4. Cold Hub Intake', sublabel: 'Quarantine & Bay Sorting', icon: 'Building2' },
  { id: 'URBAN_DISTRIBUTION', label: '5. Urban DC', sublabel: 'Cross-Dock Allocation', icon: 'Building2' },
  { id: 'RETAIL_READY', label: '6. Retail Ready', sublabel: 'Freshness Guaranteed Shelf', icon: 'Store' }
];

export const KanbanPipeline: React.FC<KanbanPipelineProps> = ({
  batches,
  onAdvanceStage
}) => {
  const getNextStage = (current: PipelineStage): PipelineStage | null => {
    const idx = PIPELINE_COLUMNS.findIndex((c) => c.id === current);
    if (idx >= 0 && idx < PIPELINE_COLUMNS.length - 1) {
      return PIPELINE_COLUMNS[idx + 1]!.id;
    }
    return null;
  };

  const getPreviousStage = (current: PipelineStage): PipelineStage | null => {
    const idx = PIPELINE_COLUMNS.findIndex((c) => c.id === current);
    if (idx > 0) {
      return PIPELINE_COLUMNS[idx - 1]!.id;
    }
    return null;
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-[#0f1722] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
            <GitFork className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Interactive Cold-Chain Supply Pipeline</h1>
            <p className="text-xs text-slate-400">
              State-switched order progression tracking produce from Salinas harvest intake through urban fulfillment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Active Batches in Pipeline:</span>
          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
            {batches.length} Active Orders
          </span>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {PIPELINE_COLUMNS.map((column) => {
          const columnBatches = batches.filter((b) => b.stage === column.id);
          const totalKg = columnBatches.reduce((acc, b) => acc + b.quantityKg, 0);

          return (
            <div
              key={column.id}
              className="bg-[#0f1722] border border-slate-800 rounded-2xl p-3 flex flex-col min-w-[240px] shadow-lg"
            >
              {/* Column Header */}
              <div className="pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-white">{column.label}</h3>
                  <span className="font-mono text-xs font-bold text-amber-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                    {columnBatches.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate">{column.sublabel}</span>
                  <span className="font-mono">{totalKg.toLocaleString()} kg</span>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                {columnBatches.length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-800/80 rounded-xl text-center text-slate-600 text-xs">
                    No batches currently in this stage.
                  </div>
                ) : (
                  columnBatches.map((batch) => {
                    const profile = COMMODITY_PROFILES[batch.commodity];
                    const isBreach = batch.coldChainStatus === 'CRITICAL_BREACH';
                    const isWarning = batch.coldChainStatus === 'WARNING';
                    const prev = getPreviousStage(batch.stage);
                    const next = getNextStage(batch.stage);

                    return (
                      <div
                        key={batch.id}
                        className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                          isBreach
                            ? 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
                            : isWarning
                            ? 'bg-amber-950/20 border-amber-500/30'
                            : 'bg-[#141d2a] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Card Top: Commodity & Batch */}
                        <div className="flex items-center justify-between">
                          <span className="text-base" title={batch.commodity}>{profile.icon}</span>
                          <span className="font-mono font-bold text-xs text-white">{batch.id}</span>
                        </div>

                        {/* Variety & Mass */}
                        <div>
                          <div className="text-xs font-semibold text-slate-200 truncate">{batch.variety}</div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {batch.quantityKg.toLocaleString()} kg · {batch.farmerName.split(' ')[0]}
                          </span>
                        </div>

                        {/* Core Temperature & Status */}
                        <div className="p-2 bg-[#0a1017] border border-slate-800/80 rounded-lg flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Thermometer className="w-3 h-3 text-sky-400" />
                            Core:
                          </span>
                          <span
                            className={`font-bold ${
                              isBreach ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {batch.currentTemp.toFixed(1)}°C
                          </span>
                        </div>

                        {/* Destination */}
                        <div className="text-[10px] text-slate-400 truncate">
                          To: <span className="text-slate-300 font-medium">{batch.destinationHub.split(' ')[0]} Hub</span>
                        </div>

                        {/* Interactive Stage Advancement Buttons */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                          <button
                            onClick={() => prev && onAdvanceStage(batch.id, prev)}
                            disabled={!prev}
                            title={prev ? `Revert to previous stage` : 'First stage'}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-[10px] text-slate-500 font-mono">
                            {column.id === 'RETAIL_READY' ? 'Ready' : 'In Stage'}
                          </span>

                          <button
                            onClick={() => next && onAdvanceStage(batch.id, next)}
                            disabled={!next}
                            title={next ? `Advance to next stage` : 'Final stage reached'}
                            className="p-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold disabled:opacity-30 disabled:hover:bg-slate-800 disabled:text-slate-500 transition"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
