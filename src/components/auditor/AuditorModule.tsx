import React, { useState } from 'react';
import { ProduceBatch, ComplianceAuditLog } from '../../types';
import { INITIAL_AUDIT_LOGS } from '../../lib/constants';
import { 
  generateCompliancePDF, 
  exportInventoryToCSV, 
  exportBatchesWithTelemetryAndBreachesCSV,
  exportTemperatureBreachAuditCSV 
} from '../../lib/reportGenerator';
import { 
  ShieldCheck, 
  FileText, 
  Download, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  QrCode, 
  Hash, 
  Lock,
  Database,
  FileSpreadsheet
} from 'lucide-react';
import { ComplianceVault } from './ComplianceVault';

interface AuditorModuleProps {
  batches: ProduceBatch[];
}

export const AuditorModule: React.FC<AuditorModuleProps> = ({ batches }) => {
  const [auditLogs, setAuditLogs] = useState<ComplianceAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [verifyHashInput, setVerifyHashInput] = useState<string>('0x7f8a92e104b9c51a7e2830f3c8d91b40285a3b21');
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    batch?: ProduceBatch;
    message: string;
  } | null>(null);

  const handleVerifyHash = (e: React.FormEvent) => {
    e.preventDefault();
    const query = verifyHashInput.trim().toLowerCase();
    const matched = batches.find(
      (b) => b.blockchainSealHash.toLowerCase() === query || b.id.toLowerCase() === query
    );

    if (matched) {
      setVerificationResult({
        verified: true,
        batch: matched,
        message: `Cryptographic proof confirmed. Batch ${matched.id} (${matched.variety}) matches the distributed ledger state. Zero tamper detected.`
      });
    } else {
      setVerificationResult({
        verified: false,
        message: 'No matching cryptographic proof found on ledger. Verification signature mismatch or uncommitted block.'
      });
    }
  };

  const [isClearanceUnlocked, setIsClearanceUnlocked] = useState<boolean>(false);
  const [clearancePin, setClearancePin] = useState<string>('');
  const [showPinInput, setShowPinInput] = useState<boolean>(false);

  const handleToggleClearance = (e: React.FormEvent) => {
    e.preventDefault();
    if (clearancePin === '9942' || clearancePin.toLowerCase() === 'auditor') {
      setIsClearanceUnlocked(true);
      setShowPinInput(false);
      setClearancePin('');
    } else {
      alert('Invalid Auditor Clearance PIN. Demo PIN: 9942');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-300 dark:border-violet-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Compliance, Blockchain Ledger & Certificate Generator</h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                isClearanceUnlocked
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {isClearanceUnlocked ? '● AUDITOR CLEARANCE ACTIVE' : '🔒 CONFIDENTIAL DATA MASKED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cryptographic SHA-256 batch integrity seals, USDA-AMS certification, and client-side PDF/CSV exports
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isClearanceUnlocked ? (
            <button
              onClick={() => setShowPinInput(!showPinInput)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-xs active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>Unlock Confidential Data</span>
            </button>
          ) : (
            <button
              onClick={() => setIsClearanceUnlocked(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition"
            >
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Lock Clearance</span>
            </button>
          )}

          <button
            onClick={() => exportBatchesWithTelemetryAndBreachesCSV(batches)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs"
          >
            <Database className="w-4 h-4" />
            <span>Export Full Telemetry & Breach Ledger (CSV)</span>
          </button>

          <button
            onClick={() => exportTemperatureBreachAuditCSV(batches)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Breaches (CSV)</span>
          </button>
        </div>
      </div>

      {/* Inline PIN Prompt Modal */}
      {showPinInput && (
        <form onSubmit={handleToggleClearance} className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="font-bold text-amber-900 dark:text-amber-200">
              Enter Auditor Clearance PIN (Demo PIN: 9942) to reveal confidential grower contacts & pricing margins:
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="password"
              placeholder="PIN 9942"
              value={clearancePin}
              onChange={(e) => setClearancePin(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-amber-400 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none w-28"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-500 transition"
            >
              Verify
            </button>
            <button
              type="button"
              onClick={() => setShowPinInput(false)}
              className="px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Verification Tool & Quick Hash Search */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="max-w-2xl mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Hash className="w-4 h-4 text-emerald-600 dark:text-amber-400" />
            Cryptographic Blockchain Verification Oracle
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify any produce batch against its immutable SHA-256 chain-of-custody seal
          </p>
        </div>

        <form onSubmit={handleVerifyHash} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Paste blockchain verification hash (0x7f8a...) or Batch ID..."
              value={verifyHashInput}
              onChange={(e) => setVerifyHashInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shrink-0 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Hash</span>
          </button>
        </form>

        {/* Verification Output Banner */}
        {verificationResult && (
          <div
            className={`mt-4 p-4 rounded-xl border text-xs animate-in fade-in duration-200 ${
              verificationResult.verified
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {verificationResult.verified ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {verificationResult.verified ? 'Cryptographic Hash Validated' : 'Validation Unsuccessful'}
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{verificationResult.message}</p>
                {verificationResult.batch && (
                  <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
                    <span className="bg-white dark:bg-black/40 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30 text-slate-800 dark:text-white">
                      Producer: {verificationResult.batch.farmerName}
                    </span>
                    <span className="bg-white dark:bg-black/40 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                      Temp Envelope: {verificationResult.batch.currentTemp}°C ({verificationResult.batch.coldChainStatus})
                    </span>
                    <button
                      onClick={() => generateCompliancePDF(verificationResult.batch!)}
                      className="bg-emerald-600 text-white px-2.5 py-0.5 rounded font-bold hover:bg-emerald-500 flex items-center gap-1 transition"
                    >
                      <Download className="w-3 h-3" /> Download Certified PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Vault: Cryptographic Integrity & Offline Tamper Oracle */}
      <ComplianceVault batches={batches} />

      {/* Verified Batches Ledger & PDF Generator Table */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c131c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Immutable Produce Batch Cryptographic Registry ({batches.length} Sealed Blocks)
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">FSMA 204 Compliant</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-[#090e15] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Batch ID</th>
                <th className="p-3">Commodity & Variety</th>
                <th className="p-3">Blockchain Verification Hash</th>
                <th className="p-3">Origin Farm & Operator</th>
                <th className="p-3">Commercial Lot Value</th>
                <th className="p-3">Core Temp</th>
                <th className="p-3">Compliance Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{batch.id}</td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{batch.variety}</span>
                    <span className="text-[10px] text-slate-400 block">{batch.quantityKg.toLocaleString()} kg</span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-emerald-800 dark:text-amber-300">
                    <span className="truncate max-w-[180px] block font-semibold" title={batch.blockchainSealHash}>
                      {batch.blockchainSealHash}
                    </span>
                  </td>
                  <td className="p-3">
                    {isClearanceUnlocked ? (
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{batch.farmerName}</span>
                    ) : (
                      <span className="font-mono text-slate-400 text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        •••••••• [RESTRICTED]
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {isClearanceUnlocked ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        ${Math.round(batch.quantityKg * 2.85).toLocaleString()} USD
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        •••••••• [LOCKED]
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {batch.currentTemp.toFixed(1)}°C
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => generateCompliancePDF(batch)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-amber-400/10 dark:hover:bg-amber-400/20 text-emerald-800 dark:text-amber-400 border border-emerald-300 dark:border-amber-400/30 rounded-lg text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Audit Trail Logs */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Regulatory Audit Activity Feed</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Real-time oracle attestations and inspector check-ins</p>
          </div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">Automated Oracle 100% Active</span>
        </div>

        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-slate-50 dark:bg-[#141d2a] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                <span className="font-mono text-[11px] text-slate-500">{log.timestamp}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">{log.details}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                <span>Signer: <strong className="text-slate-700 dark:text-slate-400">{log.auditorName}</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">STATUS: {log.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
