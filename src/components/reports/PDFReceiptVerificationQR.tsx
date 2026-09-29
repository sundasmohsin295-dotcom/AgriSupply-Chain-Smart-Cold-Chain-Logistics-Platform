import React, { useState, useEffect, useRef } from 'react';
import { ProduceBatch } from '../../types';
import { 
  generateCompliancePDFReceipt, 
  verifyUploadedPDFReceipt, 
  PDFReceiptVerification, 
  VerificationResult 
} from '../../lib/pdfReceiptCrypto';
import { 
  QrCode, 
  ShieldCheck, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  ExternalLink, 
  Sparkles, 
  Hash, 
  FileCheck2,
  Lock,
  Eye,
  Terminal,
  HelpCircle
} from 'lucide-react';

interface PDFReceiptVerificationQRProps {
  batches: ProduceBatch[];
  selectedBatchId?: string;
}

export const PDFReceiptVerificationQR: React.FC<PDFReceiptVerificationQRProps> = ({
  batches,
  selectedBatchId
}) => {
  const [selectedId, setSelectedId] = useState<string>(selectedBatchId || batches[0]?.id || '#ASG-001');
  const [verification, setVerification] = useState<PDFReceiptVerification | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'details' | 'payload' | 'verify'>('details');

  // Interactive Verification / Tampering test state
  const [testResult, setTestResult] = useState<VerificationResult | null>(null);
  const [isVerifyingFile, setIsVerifyingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeBatch = batches.find((b) => b.id === selectedId) || batches[0];

  // Generate cryptographic receipt and QR code whenever the selected batch changes
  useEffect(() => {
    if (!activeBatch) return;

    let isMounted = true;
    setIsGenerating(true);
    setTestResult(null);

    generateCompliancePDFReceipt(activeBatch)
      .then((res) => {
        if (isMounted) {
          setVerification(res);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate compliance PDF receipt:', err);
        if (isMounted) {
          setIsGenerating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeBatch]);

  const handleCopyHash = () => {
    if (!verification) return;
    navigator.clipboard.writeText(verification.sha256Hex);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !verification) return;

    setIsVerifyingFile(true);
    try {
      const result = await verifyUploadedPDFReceipt(file, verification.sha256Hex);
      setTestResult(result);
    } catch (err) {
      console.error('Error verifying file:', err);
    } finally {
      setIsVerifyingFile(false);
    }
  };

  const handleSimulateTamperTest = async () => {
    if (!verification) return;
    // Simulate comparing against an altered hash
    const fakeTamperedHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    setTestResult({
      isValid: false,
      computedHash: fakeTamperedHash,
      expectedHash: verification.sha256Hex,
      filename: `${verification.filename} [MODIFIED]`,
      byteSize: verification.byteSize + 16,
      analyzedAt: new Date().toISOString(),
      tamperingDetected: true
    });
  };

  const handleTestMatchWithCurrentBlob = async () => {
    if (!verification) return;
    const testFile = new File([verification.pdfBlob], verification.filename, { type: 'application/pdf' });
    setIsVerifyingFile(true);
    const result = await verifyUploadedPDFReceipt(testFile, verification.sha256Hex);
    setTestResult(result);
    setIsVerifyingFile(false);
  };

  if (!activeBatch) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
        <p className="text-xs text-slate-500">No produce batches available for compliance verification.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0f1722] border-2 border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-6 shadow-sm space-y-6">
      
      {/* Header with Regulatory Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500/20 text-white dark:text-emerald-400 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Cryptographic PDF Receipt & SHA-256 QR Verification</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                  PSQCA §4.8
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tamper-evident verification stamp generated directly from the SHA-256 cryptographic digest of the PDF receipt.
              </p>
            </div>
          </div>
        </div>

        {/* Batch Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
            Batch Lot:
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} — {b.variety} ({b.coldChainStatus})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: QR Code Visual Card + Cryptographic Hash Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4 cols): High-Resolution QR Code & Direct Actions */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#090e15] border border-slate-200 dark:border-slate-800/80 rounded-2xl relative">
          
          <div className="relative group">
            {isGenerating ? (
              <div className="w-56 h-56 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-xs font-mono font-medium text-slate-500">
                  Computing SHA-256 Digest...
                </span>
              </div>
            ) : verification ? (
              <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-slate-200 dark:border-slate-700 relative">
                {/* Visual Scanner Framing Marks */}
                <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-600 rounded-tl-sm pointer-events-none"></div>
                <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-600 rounded-tr-sm pointer-events-none"></div>
                <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-600 rounded-bl-sm pointer-events-none"></div>
                <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-600 rounded-br-sm pointer-events-none"></div>

                <img
                  src={verification.qrDataUrl}
                  alt={`QR Code verification for batch ${activeBatch.id}`}
                  className="w-52 h-52 object-contain"
                />
              </div>
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                No verification generated
              </div>
            )}
          </div>

          <div className="mt-4 text-center space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SHA-256 ATTESTED (FIPS 180-4)</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Scan with any mobile device to inspect provenance payload
            </p>
          </div>

          {/* Action Buttons: Download PDF & Download QR */}
          <div className="w-full flex items-center gap-2 mt-5">
            <button
              onClick={() => verification?.downloadPdf()}
              disabled={!verification || isGenerating}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {verification && (
              <a
                href={verification.qrDataUrl}
                download={`QR-Verification-${activeBatch.id.replace('#', '')}.png`}
                className="flex items-center justify-center p-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                title="Download PNG QR Code image"
                aria-label="Download QR Code image"
              >
                <QrCode className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Right Column (8 cols): Hash Cryptographic Proof & Verification Hub */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* SHA-256 Hex Digest Callout Banner */}
          <div className="p-4 bg-slate-50 dark:bg-[#070b10] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Computed PDF Receipt SHA-256 Hash</span>
              </div>

              <button
                onClick={handleCopyHash}
                disabled={!verification}
                className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                title="Copy SHA-256 Hash to clipboard"
              >
                {copiedHash ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Hash</span>
                  </>
                )}
              </button>
            </div>

            {/* Monospace Hash Container */}
            <div className="p-2.5 bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-800/80 rounded-lg">
              <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400 break-all select-all font-semibold leading-relaxed">
                {verification ? verification.sha256Hex : 'Computing cryptographic checksum...'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
              <span>Standard: SHA-256 / 256-bit</span>
              <span>·</span>
              <span>Size: {verification ? (verification.byteSize / 1024).toFixed(1) : 0} KB</span>
              <span>·</span>
              <span>Generated: {verification ? new Date(verification.generatedAt).toLocaleTimeString() : '...'}</span>
            </div>
          </div>

          {/* Tab Navigation for Inspector / Proof / Live Verification */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
            <button
              onClick={() => setActiveInspectorTab('details')}
              className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeInspectorTab === 'details'
                  ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Compliance Metadata</span>
            </button>

            <button
              onClick={() => setActiveInspectorTab('payload')}
              className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeInspectorTab === 'payload'
                  ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>QR Raw JSON Payload</span>
            </button>

            <button
              onClick={() => setActiveInspectorTab('verify')}
              className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeInspectorTab === 'verify'
                  ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Test Receipt Verification</span>
            </button>
          </div>

          {/* TAB 1: Compliance Metadata */}
          {activeInspectorTab === 'details' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in duration-150">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 block mb-0.5">Commodity & Grade</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeBatch.variety} ({activeBatch.commodity.toUpperCase()})
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  {activeBatch.qualityGrade.replace(/_/g, ' ')} · {activeBatch.freshnessScorePercent}% Freshness
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 block mb-0.5">Cold-Chain Envelope</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {activeBatch.currentTemp.toFixed(1)}°C (Target: {activeBatch.targetTempMin}°C - {activeBatch.targetTempMax}°C)
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  Status: <strong className="text-emerald-600 dark:text-emerald-400">{activeBatch.coldChainStatus}</strong>
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 block mb-0.5">Blockchain Ledger Seal</span>
                <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate block font-semibold">
                  {activeBatch.blockchainSealHash}
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  Merkle Tree Block #194,821 Attested
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 block mb-0.5">Regulatory Authority</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  PSQCA & GlobalGAP §4.8 Certified
                </span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  Digital Signer: Dr. Helen Vance (Lead Auditor)
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: QR Raw JSON Payload */}
          {activeInspectorTab === 'payload' && (
            <div className="space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Payload Encoded in QR Code Matrix:</span>
                <span>Format: Application/JSON</span>
              </div>
              <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800 leading-relaxed">
                {verification ? JSON.stringify(verification.parsedPayload, null, 2) : 'Loading...'}
              </pre>
            </div>
          )}

          {/* TAB 3: Test Receipt Verification & Tamper Detection */}
          {activeInspectorTab === 'verify' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tamper-Evidence Testing Chamber</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload any generated PDF receipt to recompute its SHA-256 checksum and verify cryptographic integrity.
                    </p>
                  </div>

                  {/* Test quick actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestMatchWithCurrentBlob}
                      disabled={!verification || isVerifyingFile}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verify Current PDF</span>
                    </button>

                    <button
                      onClick={handleSimulateTamperTest}
                      disabled={!verification || isVerifyingFile}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Simulate Tamper</span>
                    </button>
                  </div>
                </div>

                {/* Upload or Drop File */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition bg-white dark:bg-slate-950/40"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Upload or drag a downloaded PDF receipt here
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Recomputes SHA-256 byte-by-byte via Web Crypto API
                  </span>
                </div>
              </div>

              {/* Verification Result Display */}
              {testResult && (
                <div
                  className={`p-4 rounded-xl border-2 flex items-start gap-3 animate-in zoom-in-95 duration-150 ${
                    testResult.isValid
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white ${
                      testResult.isValid ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    {testResult.isValid ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/60 dark:bg-black/40">
                        {testResult.isValid ? 'VERIFIED: 100% CRYPTOGRAPHIC MATCH' : 'ALERT: CRYPTOGRAPHIC HASH MISMATCH'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold mt-1">
                      {testResult.isValid
                        ? 'Document Authenticity & Cold-Chain Receipt Certified Genuine'
                        : 'Tampering Detected: File checksum does not match regulatory ledger'}
                    </h4>

                    <div className="font-mono text-[11px] space-y-0.5 pt-1">
                      <div className="truncate">
                        <span className="opacity-70">Target Hash:</span> {testResult.expectedHash}
                      </div>
                      <div className="truncate">
                        <span className="opacity-70">Tested Hash:</span> {testResult.computedHash}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
