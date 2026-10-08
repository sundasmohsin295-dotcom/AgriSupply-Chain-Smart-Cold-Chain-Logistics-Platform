import React, { useState } from 'react';
import { ProduceBatch, QualityGrade, PipelineStage, ColdChainStatus } from '../../types';
import { 
  ClipboardCheck, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Thermometer, 
  Droplets, 
  Package, 
  Scale, 
  Calendar,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { auditLogger } from '../../services/auditLogger';

interface QualityInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: ProduceBatch | null;
  onInspectionComplete: (
    batchId: string, 
    decision: 'PASS' | 'HOLD' | 'REJECT', 
    grade: QualityGrade, 
    notes: string
  ) => void;
}

export const QualityInspectionModal: React.FC<QualityInspectionModalProps> = ({
  isOpen,
  onClose,
  batch,
  onInspectionComplete
}) => {
  const [visualCheck, setVisualCheck] = useState<boolean>(true);
  const [tempCheck, setTempCheck] = useState<boolean>(true);
  const [humidityCheck, setHumidityCheck] = useState<boolean>(true);
  const [packagingCheck, setPackagingCheck] = useState<boolean>(true);
  const [weightCheck, setWeightCheck] = useState<boolean>(true);
  const [pestFreeCheck, setPestFreeCheck] = useState<boolean>(true);
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(14);
  const [assignedGrade, setAssignedGrade] = useState<QualityGrade>('GRADE_A_EXPORT');
  const [decision, setDecision] = useState<'PASS' | 'HOLD' | 'REJECT'>('PASS');
  const [reasonNotes, setReasonNotes] = useState<string>('');
  const [inspectorName, setInspectorName] = useState<string>('Inspector Farooq Ahmed (PSQCA / GlobalGAP #4829)');

  if (!isOpen || !batch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((decision === 'HOLD' || decision === 'REJECT') && !reasonNotes.trim()) {
      return;
    }

    const notesSummary = `Inspection (${decision}): ${assignedGrade}. Visual: ${visualCheck ? 'Pass' : 'Fail'}, Temp: ${tempCheck ? 'Pass' : 'Fail'}, Pkg: ${packagingCheck ? 'Pass' : 'Fail'}, Weight: ${weightCheck ? 'Pass' : 'Fail'}. Shelf-life: ${shelfLifeDays}d. Notes: ${reasonNotes || 'Standard compliance verified.'}`;

    // Log to operational audit trail
    auditLogger.log({
      type: 'INSPECTION_SUBMITTED',
      tenantId: 'tenant_punjab_agri_coop',
      actor: inspectorName,
      role: 'WAREHOUSE_ADMIN',
      details: `Quality Inspection completed for ${batch.id} (${batch.variety}): Outcome ${decision} (${assignedGrade}).`,
      metadata: {
        batchId: batch.id,
        decision,
        assignedGrade,
        shelfLifeDays,
        visualCheck,
        tempCheck,
        packagingCheck,
        weightCheck
      }
    });

    onInspectionComplete(batch.id, decision, assignedGrade, notesSummary);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0c131c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Digital Quality Inspection Protocol
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700">
                  {batch.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {batch.variety} · {batch.quantityKg.toLocaleString()} kg · Origin: {batch.farmerName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-[#131c28] border border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Target Temp Range</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{batch.targetTempMin}°C - {batch.targetTempMax}°C</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Intake Core Temp</span>
              <span className={`font-bold font-mono ${batch.currentTemp > batch.targetTempMax ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {batch.currentTemp.toFixed(1)}°C
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Freshness Baseline</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{batch.freshnessScorePercent}%</span>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider block">
              Operational Inspection Checklist
            </span>

            <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-[#0c131c]">
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Visual Quality & Color Uniformity</span>
                    <span className="text-[11px] text-slate-500">Produce satisfies uniform sizing, skin luster, and zero decay</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={visualCheck}
                  onChange={(e) => setVisualCheck(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Core Pulp Temperature Verification</span>
                    <span className="text-[11px] text-slate-500">Probe reading is within the safe pre-cooling specification</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={tempCheck}
                  onChange={(e) => setTempCheck(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Packaging & Corrugated Box Integrity</span>
                    <span className="text-[11px] text-slate-500">Vented crates undamaged; pallet strapping and tamper seal intact</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={packagingCheck}
                  onChange={(e) => setPackagingCheck(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Scale Tare & Weight Cross-Verification</span>
                    <span className="text-[11px] text-slate-500">Batch mass verified within ±1.5% scale variance tolerance</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={weightCheck}
                  onChange={(e) => setWeightCheck(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Biological & Pest-Free Assessment</span>
                    <span className="text-[11px] text-slate-500">Zero visible infestation, mold spores, or phytosanitary risks</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={pestFreeCheck}
                  onChange={(e) => setPestFreeCheck(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Grade & Shelf Life Estimate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Assigned Commercial Quality Grade
              </label>
              <select
                value={assignedGrade}
                onChange={(e) => setAssignedGrade(e.target.value as QualityGrade)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121c28] text-slate-900 dark:text-white font-medium"
              >
                <option value="GRADE_A_EXPORT">Grade A — Export Prime Quality</option>
                <option value="GRADE_B_DOMESTIC">Grade B — Domestic Retail Standard</option>
                <option value="GRADE_C_PROCESSING">Grade C — Industrial Processing Only</option>
                <option value="REJECTED_QUARANTINE">Rejected — Quarantine / Disposal</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Estimated FEFO Shelf-Life (Days)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={shelfLifeDays}
                onChange={(e) => setShelfLifeDays(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121c28] text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5 font-mono uppercase tracking-wider">
              Inspection Decision
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setDecision('PASS')}
                className={`py-2.5 px-3 rounded-xl border font-bold flex flex-col items-center gap-1 transition ${
                  decision === 'PASS'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>PASS</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('HOLD')}
                className={`py-2.5 px-3 rounded-xl border font-bold flex flex-col items-center gap-1 transition ${
                  decision === 'HOLD'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>HOLD</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className={`py-2.5 px-3 rounded-xl border font-bold flex flex-col items-center gap-1 transition ${
                  decision === 'REJECT'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>REJECT</span>
              </button>
            </div>
          </div>

          {/* Notes or Reason Input */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              {decision === 'PASS' ? 'Inspector Notes (Optional):' : 'Mandatory Reason & Remedial Evidence:'}
            </label>
            <textarea
              rows={2}
              value={reasonNotes}
              onChange={(e) => setReasonNotes(e.target.value)}
              placeholder={
                decision === 'PASS' 
                  ? 'All parameters confirmed within standard. Approved for cold transit dispatch.'
                  : 'Specify root cause, thermal anomaly, or defect evidence requiring hold/rejection...'
              }
              className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none transition ${
                (decision === 'HOLD' || decision === 'REJECT') && !reasonNotes.trim()
                  ? 'border-rose-400 bg-rose-50/30'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121c28]'
              }`}
            />
            {(decision === 'HOLD' || decision === 'REJECT') && !reasonNotes.trim() && (
              <span className="text-[11px] text-rose-600 font-semibold block mt-0.5">
                * A documented reason is required before submitting a HOLD or REJECT decision.
              </span>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={(decision === 'HOLD' || decision === 'REJECT') && !reasonNotes.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Submit & Update Batch State</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
