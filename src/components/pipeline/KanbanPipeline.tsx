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
  Boxes,
  Plus
} from 'lucide-react';

interface KanbanPipelineProps {
  batches: ProduceBatch[];
  onAdvanceStage: (batchId: string, nextStage: PipelineStage) => void;
}

const PIPELINE_COLUMNS: {
  id: PipelineStage;
  label: string;
  sublabel: string;
  count: number;
}[] = [
  { id: 'PENDING', label: 'Pending', sublabel: 'Awaiting Intake Verification', count: 5 },
  { id: 'QUALITY_CHECKED', label: 'Quality Checked', sublabel: 'Brix & Core Temp Approved', count: 4 },
  { id: 'IN_TRANSIT', label: 'In Transit', sublabel: 'GPS & Telemetry Monitored', count: 6 },
  { id: 'AT_WAREHOUSE', label: 'At Warehouse', sublabel: 'Cold Bay Holding', count: 3 },
  { id: 'DELIVERED', label: 'Delivered', sublabel: 'Retail Shelf Accepted', count: 8 }
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
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
            <GitFork className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Supply Pipeline (Kanban)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive stage progression tracking produce from harvest intake through final distribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl">
            {batches.length} Active Batches Tracked
          </span>
        </div>
      </div>

      {/* Kanban Board Container (Matching Reference Image) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {PIPELINE_COLUMNS.map((column) => {
          const columnBatches = batches.filter((b) => b.stage === column.id);
          const totalKg = columnBatches.reduce((acc, b) => acc + b.quantityKg, 0);

          return (
            <div
              key={column.id}
              className="bg-slate-50/80 dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col min-w-[230px] shadow-xs"
            >
              {/* Column Header */}
              <div className="pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{column.label}</span>
                    <span className="text-slate-400">({columnBatches.length})</span>
                  </h3>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {totalKg.toLocaleString()} kg
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {column.sublabel}
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                {columnBatches.length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-center text-slate-400 text-xs">
                    No orders in this stage.
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
                            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40 shadow-xs'
                            : isWarning
                            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/30'
                            : 'bg-white dark:bg-[#141d2a] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                        }`}
                      >
                        {/* Card Top: Batch ID & Dwell Time */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-emerald-700 dark:text-amber-400">
                            {batch.id}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {batch.estimatedTransitTime}
                          </span>
                        </div>

                        {/* Produce & Quantity */}
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                            {batch.commodity}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {batch.quantityKg.toLocaleString()} kg · {batch.farmerName.split(' ')[0]}
                          </span>
                        </div>

                        {/* Core Temperature & Status */}
                        <div className="p-2 bg-slate-50 dark:bg-[#0a1017] border border-slate-200 dark:border-slate-800/80 rounded-lg flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Thermometer className="w-3 h-3 text-sky-500" />
                            Temp:
                          </span>
                          <span
                            className={`font-bold ${
                              isBreach ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {batch.currentTemp.toFixed(1)}°C
                          </span>
                        </div>

                        {/* Destination */}
                        <div className="text-[10px] text-slate-400 truncate">
                          To: <span className="text-slate-700 dark:text-slate-300 font-medium">{batch.destinationHub.split(' ')[0]}</span>
                        </div>

                        {/* Interactive Stage Advancement Buttons */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1">
                          <button
                            onClick={() => prev && onAdvanceStage(batch.id, prev)}
                            disabled={!prev}
                            title={prev ? `Move back to previous stage` : 'First stage'}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {column.id === 'DELIVERED' ? '✓ Complete' : 'In Transit'}
                          </span>

                          <button
                            onClick={() => next && onAdvanceStage(batch.id, next)}
                            disabled={!next}
                            title={next ? `Advance to next stage` : 'Final stage'}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-30 transition"
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
