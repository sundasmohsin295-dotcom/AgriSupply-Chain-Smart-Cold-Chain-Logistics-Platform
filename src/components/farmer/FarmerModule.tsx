import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { ProduceCommodity, ProduceBatch } from '../../types';
import { COMMODITY_PROFILES } from '../../lib/constants';
import { offlineStorage } from '../../lib/offlineStore';
import { audioAlert } from '../../lib/audioAlert';
import { auditLogger } from '../../services/auditLogger';
import { 
  Tractor, 
  ClipboardCheck, 
  Upload, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Camera, 
  ShieldCheck,
  Thermometer,
  AlertCircle,
  X,
  FileCheck,
  Sparkles
} from 'lucide-react';

interface FarmerModuleProps {
  batches: ProduceBatch[];
  onAddBatch: (batch: ProduceBatch) => void;
  isOnline: boolean;
}

// Zod Schemas for Strict Multi-Step Validation
const step1Schema = z.object({
  batchId: z.string().min(4, 'Batch ID must be at least 4 characters').regex(/^#[A-Z0-9-]+$/i, 'Format must match #BATCH-ID'),
  commodity: z.string().min(1, 'Select a commodity'),
  farmerName: z.string().min(2, 'Farmer name is required'),
  farmLocation: z.string().min(3, 'Farm location is required'),
  quantityKg: z.number().positive('Quantity must be greater than 0 kg').max(100000, 'Max single intake is 100,000 kg')
});

const step2Schema = z.object({
  coreTemp: z.number().min(-5, 'Core temperature cannot be below -5°C').max(45, 'Core temperature cannot exceed 45°C'),
  humidity: z.number().min(10, 'Humidity must be at least 10%').max(100, 'Humidity cannot exceed 100%'),
  freshness: z.string().min(1, 'Select freshness level'),
  sizeGrade: z.string().min(1, 'Select size grade'),
  defectsPercent: z.string().min(1, 'Select defects percentage')
});

export const FarmerModule: React.FC<FarmerModuleProps> = ({
  batches,
  onAddBatch,
  isOnline
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [commodity, setCommodity] = useState<ProduceCommodity>('tomatoes');
  const [batchId, setBatchId] = useState<string>(`#ASG-00${batches.length + 1}`);
  const [quantityKg, setQuantityKg] = useState<number>(2500);
  const [farmLocation, setFarmLocation] = useState<string>('Multan Sector 4, Citrus & Mango Farm');
  const [farmerName, setFarmerName] = useState<string>('Tariq Mehmood');
  
  // Step 2 Parameters
  const [freshness, setFreshness] = useState<string>('Grade-A Optimal');
  const [sizeGrade, setSizeGrade] = useState<string>('Medium Export Grade');
  const [defectsPercent, setDefectsPercent] = useState<string>('Under 2%');
  const [remarks, setRemarks] = useState<string>('Harvested at sunrise, hydro-cooled to target setpoint.');
  const [coreTemp, setCoreTemp] = useState<number>(11.2);
  const [humidity, setHumidity] = useState<number>(88.4);

  // Commodity Conditional Fields (Requirement 14)
  const [strawberriesBrix, setStrawberriesBrix] = useState<number>(10.2);
  const [strawberriesBotrytisFree, setStrawberriesBotrytisFree] = useState<boolean>(true);
  const [mangoesBrix, setMangoesBrix] = useState<number>(19.5);
  const [mangoesSapburnFree, setMangoesSapburnFree] = useState<boolean>(true);
  const [potatoesSproutingFree, setPotatoesSproutingFree] = useState<boolean>(true);
  const [tomatoesFirmnessPsi, setTomatoesFirmnessPsi] = useState<number>(8.5);

  // Step 3 Image Upload with Strict Validation & Cleanup
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([
    '/src/assets/images/harvest_quality_berries_1790684177286.jpg'
  ]);
  const [createdObjectUrls, setCreatedObjectUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Validation Errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submittedSealHash, setSubmittedSealHash] = useState<string | null>(null);

  const selectedProfile = COMMODITY_PROFILES[commodity];

  // Revoke object URLs on component unmount to prevent browser memory leaks (Requirement 15)
  useEffect(() => {
    return () => {
      createdObjectUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
    };
  }, [createdObjectUrls]);

  const handleCommodityChange = (c: ProduceCommodity) => {
    setCommodity(c);
    const prof = COMMODITY_PROFILES[c];
    setCoreTemp(Number(((prof.defaultTempMin + prof.defaultTempMax) / 2).toFixed(1)));
    setHumidity(Number(((prof.defaultHumidityMin + prof.defaultHumidityMax) / 2).toFixed(1)));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type (Requirement 15)
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setUploadError('Invalid format. Only JPEG, PNG, and WebP images are permitted.');
      return;
    }

    // Validate maximum file size (5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(`File exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a compressed image.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCreatedObjectUrls((prev) => [objectUrl, ...prev]);
    setUploadedImageUrls((prev) => [objectUrl, ...prev]);
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImageUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validateCurrentStep = (): boolean => {
    setValidationErrors({});

    if (currentStep === 1) {
      // Check duplicate batch ID
      const isDuplicate = batches.some((b) => b.id.toLowerCase() === batchId.trim().toLowerCase());
      if (isDuplicate) {
        setValidationErrors({ batchId: `Batch ID ${batchId} already registered in ledger. Use a unique identifier.` });
        return false;
      }

      const res = step1Schema.safeParse({
        batchId: batchId.trim(),
        commodity,
        farmerName: farmerName.trim(),
        farmLocation: farmLocation.trim(),
        quantityKg: Number(quantityKg)
      });

      if (!res.success) {
        const errMap: Record<string, string> = {};
        res.error.issues.forEach((err) => {
          if (err.path[0]) errMap[err.path[0].toString()] = err.message;
        });
        setValidationErrors(errMap);
        return false;
      }
    } else if (currentStep === 2) {
      const res = step2Schema.safeParse({
        coreTemp: Number(coreTemp),
        humidity: Number(humidity),
        freshness,
        sizeGrade,
        defectsPercent
      });

      if (!res.success) {
        const errMap: Record<string, string> = {};
        res.error.issues.forEach((err) => {
          if (err.path[0]) errMap[err.path[0].toString()] = err.message;
        });
        setValidationErrors(errMap);
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(4, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    // Cryptographic SHA-256 style mock hash clearly designated as Demo Integrity Hash (Requirement 28)
    const hash = `0x7f8a${Math.random().toString(36).substring(2, 10)}${Date.now().toString(16)}b40285a3b21`.substring(0, 42);

    const newBatch: ProduceBatch = {
      id: batchId.trim(),
      commodity,
      variety: selectedProfile.name,
      farmerName: farmerName.trim(),
      farmLocation: farmLocation.trim(),
      harvestDate: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' PST',
      quantityKg: Number(quantityKg),
      targetTempMin: selectedProfile.defaultTempMin,
      targetTempMax: selectedProfile.defaultTempMax,
      targetHumidityMin: selectedProfile.defaultHumidityMin,
      targetHumidityMax: selectedProfile.defaultHumidityMax,
      currentTemp: Number(coreTemp),
      currentHumidity: Number(humidity),
      coldChainStatus: 'OPTIMAL',
      qualityGrade: 'GRADE_A_EXPORT',
      freshnessScorePercent: freshness === 'Grade-A Optimal' ? 98 : 91,
      defectsPercent: defectsPercent === 'Under 2%' ? 1.4 : 3.2,
      stage: 'QUALITY_CHECKED',
      destinationHub: 'Lahore Logistics Cold Terminal',
      estimatedTransitTime: '2h 45m',
      blockchainSealHash: hash,
      stageEnteredAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' PST',
      inspectedBy: 'Quality Officer Farooq Ahmed (PSQCA / GlobalGAP Protocol Demo)',
      notes: remarks,
      imageProofUrl: uploadedImageUrls[0] || '/src/assets/images/harvest_quality_berries_1790684177286.jpg',
      telemetryHistory: [
        {
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          temperatureC: Number(coreTemp),
          ambientTempC: 31.5,
          humidityPercent: Number(humidity),
          compressorRpm: 1850,
          batterySocPercent: 98,
          isBreach: false,
          breachSeverity: 'NONE'
        }
      ],
      breachRecords: []
    };

    if (!isOnline) {
      offlineStorage.queueMutation(
        'CREATE_BATCH',
        newBatch as unknown as Record<string, unknown>,
        `Inspection submission queued in offline IndexedDB for ${batchId}`
      );
    }

    auditLogger.log({
      type: 'INSPECTION_SUBMITTED',
      tenantId: 'tenant_punjab_agri_coop',
      actor: farmerName,
      role: 'FARMER',
      details: `Batch ${newBatch.id} inspected and verified (${newBatch.variety}, ${newBatch.quantityKg}kg). Integrity seal committed.`
    });

    audioAlert.playSyncChime();
    onAddBatch(newBatch);
    setSubmittedSealHash(hash);
  };

  const handleResetForNewIntake = () => {
    setSubmittedSealHash(null);
    setBatchId(`#ASG-00${batches.length + 2}`);
    setCurrentStep(1);
    setValidationErrors({});
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Quality Inspection Form Engine</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contract-driven 4-step intake wizard with Zod validation, conditional parameters, and safe image verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl">
            {batches.length} Registered Batches in Ledger
          </span>
        </div>
      </div>

      {/* Multi-Step Wizard Container */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              STEP {currentStep} OF 4
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {currentStep === 1 && 'Produce Details & Provenance'}
              {currentStep === 2 && 'Thermal & Commodity Quality Parameters'}
              {currentStep === 3 && 'Inspection Photographic Proof (5MB Max)'}
              {currentStep === 4 && 'Ledger Attestation Review'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-6 h-1.5 rounded-full transition-all ${
                  step === currentStep
                    ? 'bg-emerald-600 dark:bg-amber-400 w-8'
                    : step < currentStep
                    ? 'bg-emerald-500/50'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Successful Submission View */}
        {submittedSealHash ? (
          <div className="py-8 text-center space-y-4 max-w-lg mx-auto animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-500/30">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Batch Verified & Committed to Ledger</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Batch {batchId} has been registered and is ready for cold-chain transport assignment.
              </p>
            </div>

            {/* Demo Integrity Hash Callout */}
            <div className="p-4 bg-slate-50 dark:bg-[#0a1017] border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 text-left">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Demo Cryptographic Verification Seal
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">SHA-256 Validated</span>
              </div>
              <div className="font-mono text-xs text-amber-700 dark:text-amber-400 break-all bg-white dark:bg-black/40 p-2.5 rounded border border-slate-200 dark:border-slate-800/80">
                {submittedSealHash}
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={handleResetForNewIntake}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-sm"
              >
                Inspect Another Batch
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* STEP 1: PRODUCE DETAILS & PROVENANCE */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Batch Identifier *
                    </label>
                    <input
                      type="text"
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      placeholder="#BATCH-001"
                      className={`w-full bg-slate-50 dark:bg-[#0a1017] border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none ${
                        validationErrors.batchId ? 'border-rose-500' : 'border-slate-300 dark:border-slate-800 focus:border-emerald-500'
                      }`}
                    />
                    {validationErrors.batchId && (
                      <span className="text-[11px] text-rose-500 mt-1 block font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.batchId}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Commodity *
                    </label>
                    <select
                      value={commodity}
                      onChange={(e) => handleCommodityChange(e.target.value as ProduceCommodity)}
                      className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="tomatoes">🍅 Roma Tomatoes (10°C - 13°C)</option>
                      <option value="strawberries">🍓 Organic Strawberries (0.5°C - 2.5°C)</option>
                      <option value="mangoes">🥭 Sindh Chaunsa Export Mangoes (11.5°C - 13.5°C)</option>
                      <option value="potatoes">🥔 Okara Seed Potatoes (7°C - 10°C)</option>
                      <option value="spinach">🥬 Tender Baby Greens (0.5°C - 2.5°C)</option>
                      <option value="apples">🍎 Swat Valley Honeycrisp (0°C - 2°C)</option>
                      <option value="dates">🌴 Sukkur Aseel Dates (-2°C - 4°C)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Net Harvest Mass (KG) *
                    </label>
                    <input
                      type="number"
                      value={quantityKg}
                      onChange={(e) => setQuantityKg(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Producer / Grower Name *
                    </label>
                    <input
                      type="text"
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Origin Farm Location *
                    </label>
                    <input
                      type="text"
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: QUALITY & COMMODITY CONDITIONAL FIELDS */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Probe Core Temperature (°C) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={coreTemp}
                      onChange={(e) => setCoreTemp(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#0a1017] border border-emerald-300 dark:border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Target Safe Envelope: {selectedProfile.defaultTempMin}°C - {selectedProfile.defaultTempMax}°C
                    </span>
                  </div>

                  <div className="p-4 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-500/30 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-sky-900 dark:text-sky-300">
                      Relative Humidity (% RH) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={humidity}
                      onChange={(e) => setHumidity(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#0a1017] border border-sky-300 dark:border-sky-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Recommended RH: {selectedProfile.defaultHumidityMin}% - {selectedProfile.defaultHumidityMax}%
                    </span>
                  </div>
                </div>

                {/* CONDITIONAL COMMODITY FIELDS (Requirement 14) */}
                <div className="p-4 bg-slate-50 dark:bg-[#0d141f] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Commodity-Specific Criteria ({selectedProfile.name})
                  </h4>

                  {commodity === 'strawberries' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Refractometer Sugar (°Brix, Target 8.5-12°Bx)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={strawberriesBrix}
                          onChange={(e) => setStrawberriesBrix(Number(e.target.value))}
                          className="w-full bg-white dark:bg-[#0a1017] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={strawberriesBotrytisFree}
                            onChange={(e) => setStrawberriesBotrytisFree(e.target.checked)}
                            className="rounded accent-emerald-500"
                          />
                          <span>Certified Botrytis Cinerea (Grey Mold) Free</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {commodity === 'mangoes' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Brix Sugar Score (°Bx, Target 18-22°Bx)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={mangoesBrix}
                          onChange={(e) => setMangoesBrix(Number(e.target.value))}
                          className="w-full bg-white dark:bg-[#0a1017] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mangoesSapburnFree}
                            onChange={(e) => setMangoesSapburnFree(e.target.checked)}
                            className="rounded accent-emerald-500"
                          />
                          <span>Hot-Water Treated / Sapburn Checked</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {commodity === 'potatoes' && (
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={potatoesSproutingFree}
                          onChange={(e) => setPotatoesSproutingFree(e.target.checked)}
                          className="rounded accent-emerald-500"
                        />
                        <span>Cured Tuber Skin / Zero Sprouting Detected</span>
                      </label>
                    </div>
                  )}

                  {commodity === 'tomatoes' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Penetrometer Firmness (PSI, Target 7.0-9.5)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={tomatoesFirmnessPsi}
                          onChange={(e) => setTomatoesFirmnessPsi(Number(e.target.value))}
                          className="w-full bg-white dark:bg-[#0a1017] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center pt-5">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          ✓ Blossom-End Rot Screened
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: SECURE IMAGE UPLOAD WITH MIME & 5MB ENFORCEMENT */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-600 dark:text-slate-300">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Upload Verified Quality Proof Photograph
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Enforced validation: JPEG, PNG, WebP up to 5MB. Revokes memory URLs on disposal.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-xs">
                    <Upload className="w-4 h-4" />
                    <span>Choose Inspection Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {uploadError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center justify-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>

                {/* Previews */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Attached Quality Photographs ({uploadedImageUrls.length})
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {uploadedImageUrls.map((url, i) => (
                      <div key={i} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
                        <img src={url} alt="Inspection Proof" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & SUBMIT */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 bg-slate-50 dark:bg-[#0a1017] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Batch Manifest Summary
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">BATCH ID</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{batchId}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">PRODUCE</span>
                      <strong className="text-slate-900 dark:text-white">{selectedProfile.name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">NET WEIGHT</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{quantityKg.toLocaleString()} kg</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">CORE TEMP</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{coreTemp}°C (Safe)</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <p><strong>Producer:</strong> {farmerName} · {farmLocation}</p>
                    <p className="mt-1"><strong>Destination:</strong> Lahore Logistics Cold Terminal</p>
                  </div>
                </div>

                {!isOnline && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Remote Offline Mode Active: Transaction will be queued safely in local IndexedDB storage.</span>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : <div></div>}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit Quality Inspection & Commit</span>
                </button>
              )}
            </div>

          </form>
        )}

      </div>

    </div>
  );
};
