import React, { useState } from 'react';
import { ProduceBatch, PipelineStage } from '../../types';
import { COMMODITY_PROFILES } from '../../lib/constants';
import { auditLogger } from '../../services/auditLogger';
import { 
  GitFork, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  Thermometer, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Store,
  Layers,
  Move
} from 'lucide-react';

interface KanbanPipelineProps {
  batches: ProduceBatch[];
  onAdvanceStage: (batchId: string, nextStage: PipelineStage) => void;
}

const PIPELINE_COLUMNS: {
  id: PipelineStage;
  label: string;
  sublabel: string;
}[] = [
  { id: 'PENDING', label: 'Harvest Intake', sublabel: 'Awaiting Farm Verification' },
  { id: 'QUALITY_CHECKED', label: 'Quality Checked', sublabel: 'Brix & Core Temp Approved' },
  { id: 'IN_TRANSIT', label: 'In Transit', sublabel: 'Reefer Telematics Monitored' },
  { id: 'AT_WAREHOUSE', label: 'At Warehouse', sublabel: 'Depot Cold Bay Holding' },
  { id: 'DELIVERED', label: 'Delivered', sublabel: 'Urban Retail Shelf Accepted' }
];

export const KanbanPipeline: React.FC<KanbanPipelineProps> = ({
  batches,
  onAdvanceStage
}) => {
  const [draggedBatchId, setDraggedBatchId] = useState<string | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<PipelineStage | null>(null);

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

  // HTML5 Drag and Drop Handlers (Requirements 17 & 18)
  const handleDragStart = (e: React.DragEvent, batchId: string) => {
    setDraggedBatchId(batchId);
    e.dataTransfer.setData('text/plain', batchId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropTarget !== stage) {
      setActiveDropTarget(stage);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, stage: PipelineStage) => {
    if (activeDropTarget === stage) {
      setActiveDropTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    setActiveDropTarget(null);
    const batchId = e.dataTransfer.getData('text/plain') || draggedBatchId;
    if (!batchId) return;

    const targetBatch = batches.find((b) => b.id === batchId);
    if (!targetBatch || targetBatch.stage === targetStage) return;

    // Apply stage transition
    onAdvanceStage(batchId, targetStage);

    // Audit log entry (Requirement 17)
    auditLogger.log({
      type: 'SHIPMENT_STAGE_CHANGED',
      tenantId: 'tenant_punjab_agri_coop',
      actor: 'Logistics Pipeline Coordinator',
      role: 'TRANSPORTER',
      details: `Batch ${batchId} transitioned via drag-and-drop: ${targetBatch.stage} -> ${targetStage}.`,
      metadata: { previousStage: targetBatch.stage, newStage: targetStage, batchId }
    });

    setDraggedBatchId(null);
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Interactive Supply Pipeline (Kanban)</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                Drag & Drop Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag cards between stages or use keyboard arrows. Automatically syncs to shared state and generates audit logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl">
            {batches.length} Total Batches Across Corridor
          </span>
        </div>
      </div>

      {/* Kanban Board Container with Native Drag-and-Drop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {PIPELINE_COLUMNS.map((column) => {
          const columnBatches = batches.filter((b) => b.stage === column.id);
          const totalKg = columnBatches.reduce((acc, b) => acc + b.quantityKg, 0);
          const isTargeted = activeDropTarget === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`rounded-2xl p-3 flex flex-col min-w-[240px] transition-all border ${
                isTargeted
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-dashed border-emerald-500 shadow-md'
                  : 'bg-slate-50/80 dark:bg-[#0f1722] border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              {/* Column Header */}
              <div className="pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{column.label}</span>
                    <span className="text-slate-400 font-mono">({columnBatches.length})</span>
                  </h3>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {totalKg.toLocaleString()} kg
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{column.sublabel}</p>
              </div>

              {/* Column Batch Cards */}
              <div className="space-y-3 flex-1 min-h-[140px]">
                {columnBatches.map((batch) => {
                  const prof = COMMODITY_PROFILES[batch.commodity];
                  const nextStage = getNextStage(batch.stage);
                  const prevStage = getPreviousStage(batch.stage);
                  const isBreached = batch.coldChainStatus === 'CRITICAL_BREACH';

                  return (
                    <div
                      key={batch.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, batch.id)}
                      className={`p-3.5 bg-white dark:bg-[#131d2a] border rounded-xl shadow-xs transition-all cursor-grab active:cursor-grabbing hover:shadow-md ${
                        isBreached
                          ? 'border-rose-400 dark:border-rose-500/60 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Move className="w-3 h-3 text-slate-400" />
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                            {batch.id}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isBreached
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {isBreached ? 'AT RISK' : prof?.icon}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mb-1">
                        {batch.variety}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono mb-2">
                        <span>{batch.quantityKg.toLocaleString()} kg</span>
                        <span className={`font-bold ${isBreached ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {batch.currentTemp.toFixed(1)}°C
                        </span>
                      </div>

                      {/* Accessible Keyboard & Click Transition Controls */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1">
                        {prevStage ? (
                          <button
                            onClick={() => onAdvanceStage(batch.id, prevStage)}
                            title={`Move back to ${prevStage}`}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] flex items-center gap-0.5"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span className="hidden sm:inline">Back</span>
                          </button>
                        ) : <div />}

                        {nextStage ? (
                          <button
                            onClick={() => onAdvanceStage(batch.id, nextStage)}
                            title={`Advance forward to ${nextStage}`}
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-0.5 transition"
                          >
                            <span>Advance</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            ✓ Delivered
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {columnBatches.length === 0 && (
                  <div className="h-28 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-[11px] text-slate-400 font-mono">
                    Drop batches here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
