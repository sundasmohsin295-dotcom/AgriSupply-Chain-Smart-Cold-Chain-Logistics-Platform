import React, { useState } from 'react';
import { ProduceCommodity, ProduceBatch, QualityGrade } from '../../types';
import { COMMODITY_PROFILES } from '../../lib/constants';
import { offlineStorage } from '../../lib/offlineStore';
import { audioAlert } from '../../lib/audioAlert';
import { 
  Tractor, 
  ClipboardCheck, 
  Upload, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Sparkles, 
  Camera, 
  ShieldCheck,
  Database,
  Thermometer,
  Layers,
  FileCheck
} from 'lucide-react';

interface FarmerModuleProps {
  batches: ProduceBatch[];
  onAddBatch: (batch: ProduceBatch) => void;
  isOnline: boolean;
}

export const FarmerModule: React.FC<FarmerModuleProps> = ({
  batches,
  onAddBatch,
  isOnline
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [commodity, setCommodity] = useState<ProduceCommodity>('tomatoes');
  const [batchId, setBatchId] = useState<string>(`#ASG-00${batches.length + 1}`);
  const [quantityKg, setQuantityKg] = useState<number>(2000);
  const [farmLocation, setFarmLocation] = useState<string>('Farm A, Haryana (Okara Cooperative)');
  const [farmerName, setFarmerName] = useState<string>('Rahul Sharma');
  
  // Quality Parameters matching Reference Image
  const [freshness, setFreshness] = useState<string>('Excellent');
  const [sizeGrade, setSizeGrade] = useState<string>('Medium');
  const [defectsPercent, setDefectsPercent] = useState<string>('1-2%');
  const [remarks, setRemarks] = useState<string>('Fresh and good quality');
  
  // Sensors
  const [coreTemp, setCoreTemp] = useState<number>(11.2);
  const [humidity, setHumidity] = useState<number>(88.4);

  // Images Proof
  const [uploadedImages, setUploadedImages] = useState<string[]>([
    '/src/assets/images/harvest_quality_berries_1790684177286.jpg'
  ]);
  const [submittedSealHash, setSubmittedSealHash] = useState<string | null>(null);

  const selectedProfile = COMMODITY_PROFILES[commodity];

  const handleCommodityChange = (c: ProduceCommodity) => {
    setCommodity(c);
    const prof = COMMODITY_PROFILES[c];
    setCoreTemp(Number(((prof.defaultTempMin + prof.defaultTempMax) / 2).toFixed(1)));
    setHumidity(Number(((prof.defaultHumidityMin + prof.defaultHumidityMax) / 2).toFixed(1)));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImages((prev) => [url, ...prev]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hash = `0x7f8a${Math.random().toString(36).substring(2, 10)}${Date.now().toString(16)}b40285a3b21`.substring(0, 42);

    const newBatch: ProduceBatch = {
      id: batchId,
      commodity,
      variety: selectedProfile.name,
      farmerName,
      farmLocation,
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
      freshnessScorePercent: freshness === 'Excellent' ? 99 : 92,
      defectsPercent: defectsPercent === '1-2%' ? 1.5 : 3.0,
      stage: 'QUALITY_CHECKED',
      destinationHub: 'Delhi Central Distribution Hub',
      estimatedTransitTime: '2h 30m',
      blockchainSealHash: hash,
      stageEnteredAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' PST',
      inspectedBy: 'Inspector Rameshwar (USDA/Agmark #4829)',
      notes: remarks,
      telemetryHistory: [
        {
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          temperatureC: Number(coreTemp),
          ambientTempC: 28.5,
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
        `Inspection submission cached offline for ${batchId}`
      );
    }

    audioAlert.playSyncChime();
    onAddBatch(newBatch);
    setSubmittedSealHash(hash);
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Quality Inspection Form</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete the inspection details for the selected agricultural produce
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl">
            {batches.length} Registered Batches
          </span>
        </div>
      </div>

      {/* Wizard Form Container (Matching Reference Image) */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        
        {/* Step Indicator Header matching Reference Image */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Inspection Progress
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
            {[
              { num: 1, label: 'General' },
              { num: 2, label: 'Quality' },
              { num: 3, label: 'Images' },
              { num: 4, label: 'Review' }
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`flex items-center gap-1.5 transition-colors ${
                  currentStep === s.num
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : currentStep > s.num
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                  currentStep === s.num
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold'
                    : currentStep > s.num
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {currentStep > s.num ? '✓' : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {submittedSealHash ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Inspection Certified & Sealed</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Batch {batchId} has been successfully validated with a Grade-A export score. Immutable cryptographic hash created on ledger.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-[#0a1017] border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs text-emerald-700 dark:text-amber-300 max-w-lg mx-auto break-all">
              {submittedSealHash}
            </div>
            <button
              onClick={() => {
                setSubmittedSealHash(null);
                setCurrentStep(1);
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
            >
              Inspect Another Batch
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Step 1: General Produce Details (Matching Reference Image) */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Produce Type *
                    </label>
                    <select
                      value={commodity}
                      onChange={(e) => handleCommodityChange(e.target.value as ProduceCommodity)}
                      className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="tomatoes">Tomatoes</option>
                      <option value="potatoes">Potatoes</option>
                      <option value="spinach">Spinach</option>
                      <option value="mangoes">Sindh Mangoes</option>
                      <option value="apples">Swat Apples</option>
                      <option value="strawberries">Strawberries</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Batch ID *
                    </label>
                    <input
                      type="text"
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Quantity (kg) *
                    </label>
                    <input
                      type="number"
                      value={quantityKg}
                      onChange={(e) => setQuantityKg(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Farm Location *
                    </label>
                    <input
                      type="text"
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    <span>Proceed to Quality Parameters</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Quality Parameters (Matching Reference Image) */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Freshness *
                    </label>
                    <select
                      value={freshness}
                      onChange={(e) => setFreshness(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Excellent">Excellent (Grade A)</option>
                      <option value="Good">Good (Domestic Market)</option>
                      <option value="Fair">Fair (Immediate Processing)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Size Grade *
                    </label>
                    <select
                      value={sizeGrade}
                      onChange={(e) => setSizeGrade(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                      <option value="Small">Small</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Defects (%) *
                    </label>
                    <select
                      value={defectsPercent}
                      onChange={(e) => setDefectsPercent(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="0%">0% (Export Select)</option>
                      <option value="1-2%">1-2% (Nominal)</option>
                      <option value="3-5%">3-5% (Standard)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Core Probe Temp (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={coreTemp}
                      onChange={(e) => setCoreTemp(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0a1017] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    <span>Proceed to Image Upload</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Upload Images (Matching Reference Image) */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Upload Produce Inspection Images *
                </label>

                {/* Dropzone & Preview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Upload Dropzone */}
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/50">
                    <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Click to upload</span>
                    <span className="text-[11px] text-slate-500">or drag and drop JPG, PNG (Max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Previews */}
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-square group shadow-xs">
                      <img
                        src={img}
                        alt="Produce Inspection"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur rounded-lg p-1.5 text-center text-[10px] text-white font-mono">
                        AI Grade: 98.6% Nominal
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    <span>Proceed to Review & Sign</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-[#141d2a] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Batch Identifier:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{batchId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Commodity:</span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">{commodity} ({quantityKg} kg)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Farm Location:</span>
                    <span className="text-slate-800 dark:text-slate-200">{farmLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Core Probe Temperature:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{coreTemp}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Freshness Evaluation:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{freshness} · {defectsPercent} defects</span>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-sm"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Confirm & Sign Blockchain Certificate</span>
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

      </div>

    </div>
  );
};
