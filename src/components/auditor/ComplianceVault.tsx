import React, { useState, useEffect, useMemo } from 'react';
import { ProduceBatch, ColdChainStatus, PipelineStage, QualityGrade } from '../../types';
import { 
  extractBatchOperationalState, 
  generateBatchOperationalHash, 
  canonicalizeOperationalState, 
  computePayloadSHA256, 
  analyzeStateDiscrepancies, 
  BatchOperationalState, 
  DiscrepancyReport, 
  VaultVerificationResult 
} from '../../lib/complianceVaultCrypto';
import { 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  RefreshCw, 
  FileText, 
  Download, 
  Hash, 
  Database,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Sliders,
  Copy,
  Check,
  ShieldAlert,
  Fingerprint,
  Cpu,
  FileCheck2,
  Terminal,
  Activity
} from 'lucide-react';

interface ComplianceVaultProps {
  batches: ProduceBatch[];
}

export const ComplianceVault: React.FC<ComplianceVaultProps> = ({ batches }) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '#ASG-001');
  const activeBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId) || batches[0]!,
    [batches, selectedBatchId]
  );

  // Authentic Ledger State & Computed Hash
  const [authenticState, setAuthenticState] = useState<BatchOperationalState | null>(null);
  const [storedLedgerHash, setStoredLedgerHash] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Auditor Input Mode: 'FORM' (Field-by-field interactive controls) or 'JSON' (Raw cryptographic payload)
  const [inputMode, setInputMode] = useState<'FORM' | 'JSON'>('FORM');

  // Auditor Editable Input Form Fields
  const [inputBatchId, setInputBatchId] = useState<string>('');
  const [inputTemp, setInputTemp] = useState<number>(4.2);
  const [inputHumidity, setInputHumidity] = useState<number>(88.4);
  const [inputQuantityKg, setInputQuantityKg] = useState<number>(2000);
  const [inputStatus, setInputStatus] = useState<ColdChainStatus>('OPTIMAL');
  const [inputStage, setInputStage] = useState<PipelineStage>('IN_TRANSIT');
  const [inputDestination, setInputDestination] = useState<string>('Delhi Central Distribution Hub');
  const [inputGrade, setInputGrade] = useState<QualityGrade>('GRADE_A_EXPORT');
  const [inputFarmer, setInputFarmer] = useState<string>('');
  const [inputJson, setInputJson] = useState<string>('');

  // Live Real-Time Computed Hash for Auditor's Input
  const [computedInputHash, setComputedInputHash] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<VaultVerificationResult | null>(null);

  // Recalculate Authentic Operational State Hash when activeBatch changes
  useEffect(() => {
    if (!activeBatch) return;
    let isMounted = true;

    generateBatchOperationalHash(activeBatch).then(({ sha256Hex, state, canonicalJson }) => {
      if (!isMounted) return;
      setAuthenticState(state);
      setStoredLedgerHash(sha256Hex);

      // Initialize auditor input fields with authentic batch values
      setInputBatchId(state.batchId);
      setInputTemp(state.currentTemp);
      setInputHumidity(state.currentHumidity);
      setInputQuantityKg(state.quantityKg);
      setInputStatus(state.coldChainStatus as ColdChainStatus);
      setInputStage(state.stage as PipelineStage);
      setInputDestination(state.destinationHub);
      setInputGrade(state.qualityGrade as QualityGrade);
      setInputFarmer(state.farmerName);
      setInputJson(JSON.stringify(JSON.parse(canonicalJson), null, 2));

      // Reset verification state
      setVerificationResult(null);
    });

    return () => {
      isMounted = false;
    };
  }, [activeBatch]);

  // Build the current submitted operational state object
  const currentSubmittedState = useMemo<BatchOperationalState | null>(() => {
    if (!authenticState) return null;

    if (inputMode === 'JSON') {
      try {
        const parsed = JSON.parse(inputJson);
        return {
          ...authenticState,
          ...parsed
        };
      } catch {
        return null;
      }
    }

    return {
      ...authenticState,
      batchId: inputBatchId,
      currentTemp: Number(inputTemp),
      currentHumidity: Number(inputHumidity),
      quantityKg: Number(inputQuantityKg),
      coldChainStatus: inputStatus,
      stage: inputStage,
      destinationHub: inputDestination,
      qualityGrade: inputGrade,
      farmerName: inputFarmer
    };
  }, [
    authenticState, 
    inputMode, 
    inputJson, 
    inputBatchId, 
    inputTemp, 
    inputHumidity, 
    inputQuantityKg, 
    inputStatus, 
    inputStage, 
    inputDestination, 
    inputGrade, 
    inputFarmer
  ]);

  // Live SHA-256 calculation whenever inputs change
  useEffect(() => {
    if (!currentSubmittedState) {
      setComputedInputHash('INVALID_JSON_SYNTAX');
      return;
    }

    let isMounted = true;
    const canonical = canonicalizeOperationalState(currentSubmittedState);
    computePayloadSHA256(canonical).then((hash) => {
      if (isMounted) {
        setComputedInputHash(hash);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentSubmittedState]);

  // Synchronize JSON string when form fields change (if in FORM mode)
  useEffect(() => {
    if (inputMode === 'FORM' && currentSubmittedState) {
      setInputJson(JSON.stringify(currentSubmittedState, null, 2));
    }
  }, [inputMode, currentSubmittedState]);

  // Handle Verify Integrity Action
  const handleVerifyIntegrity = async () => {
    if (!authenticState || !currentSubmittedState) return;
    setIsVerifying(true);

    try {
      const canonicalSubmitted = canonicalizeOperationalState(currentSubmittedState);
      const computedHash = await computePayloadSHA256(canonicalSubmitted);
      const canonicalAuthentic = canonicalizeOperationalState(authenticState);
      const authenticHash = await computePayloadSHA256(canonicalAuthentic);

      const isValid = computedHash.toLowerCase() === authenticHash.toLowerCase();
      const discrepancies = analyzeStateDiscrepancies(authenticState, currentSubmittedState);
      const tamperedCount = discrepancies.filter((d) => d.isTampered).length;
      const integrityScore = tamperedCount === 0 ? 100 : Math.max(0, 100 - tamperedCount * 22);

      const result: VaultVerificationResult = {
        isValid,
        computedHash,
        storedLedgerHash: authenticHash,
        discrepancies,
        tamperedFieldsCount: tamperedCount,
        analyzedAt: new Date().toISOString(),
        consensusIntegrityScore: integrityScore,
        attestationMessage: isValid
          ? `Cryptographic Consensus Confirmed: The submitted operational state record 100% matches the immutable ledger root. Zero unauthorized modifications detected.`
          : `CRITICAL INTEGRITY BREACH: The submitted record diverges from the secure ledger consensus root. Cryptographic checksum mismatch detected.`
      };

      setVerificationResult(result);
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Preset Scenario Handlers
  const handleResetToAuthentic = () => {
    if (!authenticState) return;
    setInputBatchId(authenticState.batchId);
    setInputTemp(authenticState.currentTemp);
    setInputHumidity(authenticState.currentHumidity);
    setInputQuantityKg(authenticState.quantityKg);
    setInputStatus(authenticState.coldChainStatus as ColdChainStatus);
    setInputStage(authenticState.stage as PipelineStage);
    setInputDestination(authenticState.destinationHub);
    setInputGrade(authenticState.qualityGrade as QualityGrade);
    setInputFarmer(authenticState.farmerName);
    setInputJson(JSON.stringify(authenticState, null, 2));
    setVerificationResult(null);
  };

  const handleSimulateThermalBreachTamper = () => {
    if (!authenticState) return;
    // Malicious actor attempts to mask a real 6.5°C thermal spike by reporting 2.1°C with 'OPTIMAL' status
    setInputTemp(2.1);
    setInputStatus('OPTIMAL');
    setVerificationResult(null);
  };

  const handleSimulateCargoDiversionTamper = () => {
    if (!authenticState) return;
    // Cargo theft/diversion: reported quantity reduced by 400 kg
    setInputQuantityKg(Math.max(100, authenticState.quantityKg - 400));
    setVerificationResult(null);
  };

  const handleSimulateCounterfeitGrade = () => {
    if (!authenticState) return;
    // Falsifies grade to GRADE_A_EXPORT while batch was downgraded
    setInputGrade('GRADE_A_EXPORT');
    setInputStage('DELIVERED');
    setVerificationResult(null);
  };

  const handleCopyHash = () => {
    if (!storedLedgerHash) return;
    navigator.clipboard.writeText(storedLedgerHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Export Cryptographic Attestation Record
  const handleExportAttestation = () => {
    if (!verificationResult || !authenticState) return;
    const record = {
      vaultVersion: 'AgriSupply-Vault-FIPS180-4-v2.4',
      batchId: authenticState.batchId,
      timestamp: verificationResult.analyzedAt,
      consensusStatus: verificationResult.isValid ? 'CONSENSUS_VALID' : 'TAMPER_ALERT',
      integrityScore: `${verificationResult.consensusIntegrityScore}%`,
      storedLedgerHash: verificationResult.storedLedgerHash,
      computedSubmittedHash: verificationResult.computedHash,
      tamperedFieldsCount: verificationResult.tamperedFieldsCount,
      discrepancyAudit: verificationResult.discrepancies.filter((d) => d.isTampered),
      authenticLedgerState: authenticState,
      submittedState: currentSubmittedState
    };

    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-attestation-${authenticState.batchId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      
      {/* Vault Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Cryptographic Compliance Vault & Integrity Oracle
              </h2>
              <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                FIPS 180-4 SHA-256
              </span>
              <span className="text-[10px] font-mono uppercase bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-full font-bold">
                FSMA 204
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Generates cryptographic state hashes from real-time operational parameters and verifies field records against the immutable distributed ledger.
            </p>
          </div>
        </div>

        {/* Batch Selector */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <label className="text-xs font-mono font-bold text-slate-600 whitespace-nowrap">Target Batch:</label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} — {b.commodity} ({b.variety}) [{b.coldChainStatus}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left Column = Stored Cryptographic Ledger Root; Right Column = Verify Integrity UI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Immutable Ledger Consensus Proof */}
        <div className="lg:col-span-5 bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-mono font-bold uppercase text-slate-700">
                  Immutable Ledger Root
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-md font-bold">
                Merkle Consensus
              </span>
            </div>

            {/* SHA-256 Hash Card */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  Operational State Hash (SHA-256)
                </span>
                <button
                  onClick={handleCopyHash}
                  className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 hover:text-emerald-800 transition"
                  title="Copy SHA-256 hash"
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-mono text-xs font-bold text-emerald-900 break-all select-all leading-relaxed bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                {storedLedgerHash || 'Computing SHA-256 digest...'}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                <span>Standard: NIST FIPS 180-4</span>
                <span>256-bit Hex Digest</span>
              </div>
            </div>

            {/* Live Operational State Snapshot */}
            {authenticState && (
              <div className="space-y-2 text-xs">
                <span className="text-[11px] font-mono font-bold text-slate-600 uppercase block">
                  Committed State Parameters
                </span>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase">Pulp Temp Envelope</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      {authenticState.currentTemp.toFixed(1)}°C
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      Limits: {authenticState.targetTempMin}°C - {authenticState.targetTempMax}°C
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase">Cargo Quantity</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      {authenticState.quantityKg.toLocaleString()} kg
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      Grade: {authenticState.qualityGrade}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400 uppercase">Status & Stage:</span>
                    <span className="font-bold text-slate-900">
                      {authenticState.coldChainStatus} · {authenticState.stage}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400 uppercase">Terminal Hub:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[190px]">
                      {authenticState.destinationHub}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400 uppercase">Producer Origin:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[190px]">
                      {authenticState.farmerName}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tamper Simulator Presets */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
              Auditor Stress-Test & Tamper Simulations:
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSimulateThermalBreachTamper}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 text-center"
                title="Simulate modifying reported temperature to conceal breach"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Mask Thermal Breach</span>
              </button>

              <button
                onClick={handleSimulateCargoDiversionTamper}
                className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 text-center"
                title="Simulate cargo skimming / theft"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Simulate Cargo Diversion</span>
              </button>

              <button
                onClick={handleSimulateCounterfeitGrade}
                className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 text-center"
                title="Simulate counterfeit grade promotion"
              >
                <Fingerprint className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>Falsify Grade / Stage</span>
              </button>

              <button
                onClick={handleResetToAuthentic}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 text-center"
                title="Restore authentic ledger parameters"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Restore Authentic State</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Verify Integrity UI */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Header & Mode Switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-mono font-bold uppercase text-slate-700">
                Auditor 'Verify Integrity' Chamber
              </span>
            </div>

            {/* Input Format Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setInputMode('FORM')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  inputMode === 'FORM'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Structured Fields
              </button>
              <button
                onClick={() => setInputMode('JSON')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  inputMode === 'JSON'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Raw JSON Payload
              </button>
            </div>
          </div>

          {/* Mode 1: Interactive Field-by-Field Inputs */}
          {inputMode === 'FORM' ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Core Pulp Temp Input */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1">
                    Recorded Temp (°C)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={inputTemp}
                    onChange={(e) => {
                      setInputTemp(parseFloat(e.target.value) || 0);
                      setVerificationResult(null);
                    }}
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs font-mono font-bold focus:outline-none transition ${
                      authenticState && inputTemp !== authenticState.currentTemp
                        ? 'border-rose-400 bg-rose-50 text-rose-900'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  />
                  {authenticState && inputTemp !== authenticState.currentTemp && (
                    <span className="text-[10px] text-rose-600 font-mono block mt-0.5">
                      Altered from {authenticState.currentTemp}°C
                    </span>
                  )}
                </div>

                {/* Cargo Quantity Input */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1">
                    Cargo Volume (kg)
                  </label>
                  <input
                    type="number"
                    step={10}
                    value={inputQuantityKg}
                    onChange={(e) => {
                      setInputQuantityKg(parseInt(e.target.value, 10) || 0);
                      setVerificationResult(null);
                    }}
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs font-mono font-bold focus:outline-none transition ${
                      authenticState && inputQuantityKg !== authenticState.quantityKg
                        ? 'border-rose-400 bg-rose-50 text-rose-900'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  />
                  {authenticState && inputQuantityKg !== authenticState.quantityKg && (
                    <span className="text-[10px] text-rose-600 font-mono block mt-0.5">
                      Altered from {authenticState.quantityKg} kg
                    </span>
                  )}
                </div>

                {/* Cold-Chain Status Select */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1">
                    Cold-Chain Status
                  </label>
                  <select
                    value={inputStatus}
                    onChange={(e) => {
                      setInputStatus(e.target.value as ColdChainStatus);
                      setVerificationResult(null);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-bold focus:outline-none transition ${
                      authenticState && inputStatus !== authenticState.coldChainStatus
                        ? 'border-rose-400 bg-rose-50 text-rose-900'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    <option value="OPTIMAL">OPTIMAL (Nominal)</option>
                    <option value="WARNING">WARNING (Elevated)</option>
                    <option value="CRITICAL_BREACH">CRITICAL_BREACH (Excursion)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Pipeline Stage Select */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={inputStage}
                    onChange={(e) => {
                      setInputStage(e.target.value as PipelineStage);
                      setVerificationResult(null);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-bold focus:outline-none transition ${
                      authenticState && inputStage !== authenticState.stage
                        ? 'border-rose-400 bg-rose-50 text-rose-900'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    <option value="PENDING">PENDING (Pre-cooling)</option>
                    <option value="QUALITY_CHECKED">QUALITY_CHECKED (Grade Certified)</option>
                    <option value="IN_TRANSIT">IN_TRANSIT (Reefer Corridor)</option>
                    <option value="AT_WAREHOUSE">AT_WAREHOUSE (Dock Staging)</option>
                    <option value="DELIVERED">DELIVERED (Final Intake)</option>
                  </select>
                </div>

                {/* Quality Grade Select */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1">
                    Quality Grade
                  </label>
                  <select
                    value={inputGrade}
                    onChange={(e) => {
                      setInputGrade(e.target.value as QualityGrade);
                      setVerificationResult(null);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-bold focus:outline-none transition ${
                      authenticState && inputGrade !== authenticState.qualityGrade
                        ? 'border-rose-400 bg-rose-50 text-rose-900'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    <option value="GRADE_A_EXPORT">GRADE_A_EXPORT (Export Standard)</option>
                    <option value="GRADE_B_DOMESTIC">GRADE_B_DOMESTIC (Domestic Market)</option>
                    <option value="GRADE_C_PROCESSING">GRADE_C_PROCESSING (Processing Only)</option>
                    <option value="REJECTED_QUARANTINE">REJECTED_QUARANTINE (Quarantine Hold)</option>
                  </select>
                </div>

                {/* Destination Hub */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1">
                    Destination Hub
                  </label>
                  <input
                    type="text"
                    value={inputDestination}
                    onChange={(e) => {
                      setInputDestination(e.target.value);
                      setVerificationResult(null);
                    }}
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs font-medium focus:outline-none transition ${
                      authenticState && inputDestination !== authenticState.destinationHub
                        ? 'border-rose-400 bg-rose-50 text-rose-900'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Raw JSON Chamber */
            <div className="space-y-2">
              <textarea
                value={inputJson}
                onChange={(e) => {
                  setInputJson(e.target.value);
                  setVerificationResult(null);
                }}
                rows={7}
                className="w-full p-3.5 rounded-2xl border border-slate-300 bg-slate-950 text-emerald-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed shadow-inner"
                placeholder="Paste or edit canonical batch operational JSON record..."
              />
            </div>
          )}

          {/* Real-time Computed Hash Preview Strip */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap">
                Real-Time Input Hash:
              </span>
              <span className={`font-bold truncate ${
                storedLedgerHash && computedInputHash.toLowerCase() === storedLedgerHash.toLowerCase()
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}>
                {computedInputHash}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`w-2 h-2 rounded-full ${
                storedLedgerHash && computedInputHash.toLowerCase() === storedLedgerHash.toLowerCase()
                  ? 'bg-emerald-500'
                  : 'bg-rose-500 animate-pulse'
              }`} />
              <span className="text-[11px] font-bold">
                {storedLedgerHash && computedInputHash.toLowerCase() === storedLedgerHash.toLowerCase()
                  ? 'In Consensus'
                  : 'Desynchronized'}
              </span>
            </div>
          </div>

          {/* Action Button: Verify Cryptographic Integrity */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <button
              onClick={handleVerifyIntegrity}
              disabled={isVerifying || !currentSubmittedState}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
            >
              {isVerifying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>Verify Integrity Against Secure Ledger</span>
            </button>

            <span className="text-[11px] font-mono text-slate-400">
              Deterministic Byte-for-Byte Audit
            </span>
          </div>

          {/* Verification Result Banner & Discrepancy Matrix */}
          {verificationResult && (
            <div className={`p-5 rounded-2xl border-2 transition-all space-y-4 animate-in zoom-in-95 duration-150 ${
              verificationResult.isValid
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                : 'bg-rose-50 border-rose-500 text-rose-950'
            }`}>
              {/* Status Header */}
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold shadow-xs ${
                  verificationResult.isValid ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                  {verificationResult.isValid ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-white border tracking-wide">
                      {verificationResult.isValid
                        ? '✓ INTEGRITY CONFIRMED: 100% LEDGER CONSENSUS MATCH'
                        : '⚠️ ALERT: CRYPTOGRAPHIC HASH MISMATCH / TAMPER DETECTED'}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white/80 border">
                      Score: {verificationResult.consensusIntegrityScore}%
                    </span>
                  </div>

                  <p className="text-xs font-medium leading-relaxed">
                    {verificationResult.attestationMessage}
                  </p>
                </div>
              </div>

              {/* Side-by-Side Hash Comparison */}
              <div className="p-3 bg-white/90 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-slate-500 uppercase">Computed Hash:</span>
                  <span className={`break-all font-bold ${
                    verificationResult.isValid ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {verificationResult.computedHash}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-slate-100">
                  <span className="font-bold text-slate-500 uppercase">Stored Ledger Hash:</span>
                  <span className="break-all font-bold text-slate-900">
                    {verificationResult.storedLedgerHash}
                  </span>
                </div>
              </div>

              {/* Field-by-Field Discrepancy Matrix if Tampering is Detected */}
              {!verificationResult.isValid && verificationResult.discrepancies.filter((d) => d.isTampered).length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-rose-900">
                      Discrepancies Identified by Cryptographic Oracle ({verificationResult.tamperedFieldsCount} altered):
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-rose-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-rose-100/70 text-rose-900 font-mono text-[10px] uppercase border-b border-rose-200">
                        <tr>
                          <th className="py-2 px-3">Field</th>
                          <th className="py-2 px-3">Submitted (Auditor)</th>
                          <th className="py-2 px-3">Stored Ledger (Truth)</th>
                          <th className="py-2 px-3">Oracle Assessment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100 font-mono">
                        {verificationResult.discrepancies
                          .filter((d) => d.isTampered)
                          .map((d, i) => (
                            <tr key={i} className="hover:bg-rose-50/50">
                              <td className="py-2.5 px-3 font-bold text-slate-900">{d.label}</td>
                              <td className="py-2.5 px-3 text-rose-700 font-bold bg-rose-50/80">
                                {String(d.submittedValue)}
                              </td>
                              <td className="py-2.5 px-3 text-emerald-800 font-bold">
                                {String(d.ledgerValue)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                                {d.explanation}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Attestation Certificate Export */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={handleExportAttestation}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download Attestation Audit Record (JSON)</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
