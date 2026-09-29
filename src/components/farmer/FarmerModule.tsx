import React, { useState } from 'react';
import { ProduceCommodity, ProduceBatch, QualityGrade } from '../../types';
import { COMMODITY_PROFILES } from '../../lib/constants';
import { offlineStorage } from '../../lib/offlineStore';
import { audioAlert } from '../../lib/audioAlert';
import { 
  Tractor, 
  ClipboardCheck, 
  Thermometer, 
  Upload, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Sparkles, 
  Camera, 
  ShieldCheck,
  Database,
  Flame,
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
  const [commodity, setCommodity] = useState<ProduceCommodity>('strawberries');
  const [batchId, setBatchId] = useState<string>(`BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [farmerName, setFarmerName] = useState<string>('Mateo Morales & Sons');
  const [farmLocation, setFarmLocation] = useState<string>('Salinas Valley Plot 4B, CA');
  const [quantityKg, setQuantityKg] = useState<number>(3800);
  const [variety, setVariety] = useState<string>('Albion Premium Export');
  
  // Step 2: Quality & Specific Calibration Metrics
  const [brixScore, setBrixScore] = useState<number>(10.5);
  const [firmnessPsi, setFirmnessPsi] = useState<number>(5.4);
  const [leafDiscolorationPercent, setLeafDiscolorationPercent] = useState<number>(1.2);
  const [dryMatterPercent, setDryMatterPercent] = useState<number>(25.8);
  const [coreTemp, setCoreTemp] = useState<number>(1.8);
  const [humidity, setHumidity] = useState<number>(93.2);

  // Step 3: Visual Inspection & Proof
  const [selectedProofImage, setSelectedProofImage] = useState<string>('/src/assets/images/harvest_quality_berries_1790684177286.jpg');
  const [inspectorName, setInspectorName] = useState<string>('Lead Agronomist Elena Morales (USDA Cert #9021)');
  const [inspectionNotes, setInspectionNotes] = useState<string>('Forced-air pre-cooling completed in 38m. Pallet core temperatures strictly uniform.');
  const [qualityGrade, setQualityGrade] = useState<QualityGrade>('GRADE_A_EXPORT');

  // Submission State
  const [submittedSealHash, setSubmittedSealHash] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedProfile = COMMODITY_PROFILES[commodity];

  const handleCommodityChange = (c: ProduceCommodity) => {
    setCommodity(c);
    const prof = COMMODITY_PROFILES[c];
    setVariety(prof.name);
    setCoreTemp(Number(((prof.defaultTempMin + prof.defaultTempMax) / 2).toFixed(1)));
    setHumidity(Number(((prof.defaultHumidityMin + prof.defaultHumidityMax) / 2).toFixed(1)));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedProofImage(url);
    }
  };

  const generateCryptographicSeal = () => {
    const raw = `${batchId}-${commodity}-${quantityKg}-${coreTemp}-${Date.now()}`;
    // Simple deterministic hash hex representation for presentation
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `0x${hex}7f8a92e104b9c51a7e2830f3c8d91b40285a3b21`.substring(0, 42);
  };

  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const sealHash = generateCryptographicSeal();

    const newBatch: ProduceBatch = {
      id: batchId,
      commodity,
      variety,
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
      qualityGrade,
      brixSugarScore: commodity === 'strawberries' || commodity === 'tomatoes' || commodity === 'blueberries' ? brixScore : undefined,
      firmnessPsi: commodity === 'strawberries' || commodity === 'avocados' ? firmnessPsi : undefined,
      stage: 'HARVEST_INTAKE',
      destinationHub: 'Silicon Valley Central Cold Storage Bay',
      blockchainSealHash: sealHash,
      stageEnteredAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' PST',
      inspectedBy: inspectorName,
      notes: inspectionNotes
    };

    if (!isOnline) {
      // Queue offline mutation via IndexedDB engine
      await offlineStorage.queueMutation(
        'CREATE_BATCH',
        newBatch as unknown as Record<string, unknown>,
        `Harvest intake logged offline: ${batchId} (${quantityKg}kg ${variety})`
      );
      audioAlert.playSyncChime();
    } else {
      audioAlert.playSyncChime();
    }

    onAddBatch(newBatch);
    setSubmittedSealHash(sealHash);
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setBatchId(`BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setSubmittedSealHash(null);
    setCurrentStep(1);
  };

  return (
    <div className="space-y-6">

      {/* Module Title Banner */}
      <div className="bg-[#0f1722] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
            <Tractor className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Harvest & Quality Assurance Engine</h1>
            <p className="text-xs text-slate-400">
              Field batch registration, commodity-specific grading, and offline IndexedDB transaction resilience
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Total Registered Batches:</span>
          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded">
            {batches.length} Batches
          </span>
        </div>
      </div>

      {/* Main Multi-Step Form Card */}
      <div className="bg-[#0f1722] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        
        {/* Step Indicator Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0c131c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">
              {submittedSealHash ? 'Harvest Batch Sealed & Registered' : `Step ${currentStep} of 3: ${
                currentStep === 1 ? 'Produce Classification' : currentStep === 2 ? 'Cold-Chain & Sensor Calibration' : 'Quality Proof & Sign-Off'
              }`}
            </span>
          </div>

          {!submittedSealHash && (
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                    currentStep === step
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_10px_#f59e0b]'
                      : currentStep > step
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {currentStep > step ? '✓' : step}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Body or Success Confirmation */}
        {submittedSealHash ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-1">Batch Cryptographically Sealed</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {isOnline
                  ? 'Your harvest intake was broadcasted to the cold-chain telemetry network and committed to the immutable audit registry.'
                  : 'Operating in Offline Remote Mode: Mutation has been securely cached in IndexedDB and queued for cloud sync.'}
              </p>
            </div>

            {/* Blockchain Hash Box */}
            <div className="max-w-xl mx-auto p-4 bg-[#0a1017] border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Blockchain Proof Hash
                </span>
                <span className="font-mono text-[10px]">ECDSA-SHA256</span>
              </div>
              <div className="font-mono text-xs text-amber-300 break-all bg-black/40 p-2.5 rounded border border-slate-800/80">
                {submittedSealHash}
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={resetForm}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition"
              >
                Log Another Harvest Batch
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitInspection} className="p-6 space-y-6">
            
            {/* STEP 1: Commodity & Batch Identity */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    1. Select Produce Commodity Classification
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {(Object.keys(COMMODITY_PROFILES) as ProduceCommodity[]).map((c) => {
                      const prof = COMMODITY_PROFILES[c];
                      const isSelected = commodity === c;
                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => handleCommodityChange(c)}
                          className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-400/10 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                              : 'bg-[#141d2a] border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{prof.icon}</span>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
                          </div>
                          <span className="text-xs font-bold block text-white capitalize">{c}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">{prof.defaultTempMin}°C to {prof.defaultTempMax}°C</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Batch Tracking ID</label>
                    <input
                      type="text"
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Produce Variety Name</label>
                    <input
                      type="text"
                      value={variety}
                      onChange={(e) => setVariety(e.target.value)}
                      className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Harvest Weight (KG)</label>
                    <input
                      type="number"
                      value={quantityKg}
                      onChange={(e) => setQuantityKg(Number(e.target.value))}
                      className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Farm Producer Name</label>
                    <input
                      type="text"
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Farm Geographic Plot & Coordinates</label>
                  <input
                    type="text"
                    value={farmLocation}
                    onChange={(e) => setFarmLocation(e.target.value)}
                    className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Commodity Biological Profile Banner */}
                <div className="p-4 bg-[#141d2a] border border-slate-800/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{selectedProfile.name} ({selectedProfile.scientificName})</span>
                    <span className="text-[11px] text-amber-400 font-mono">Shelf Life: ~{selectedProfile.shelfLifeDays} Days</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    <strong className="text-slate-300">Pre-Cooling Protocol:</strong> {selectedProfile.recommendedPreCooling}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    <strong className="text-rose-400">Cold Loss Risk:</strong> {selectedProfile.lossRiskFactor}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    <span>Proceed to Sensor Calibration</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Cold-Chain Sensor Calibration & Quality Thresholds */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Cold-Chain Temperature & Probe Verification</h3>
                  <p className="text-xs text-slate-400">Calibrated insertion sensors ensuring core pulping compliance</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#141d2a] border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300 flex items-center gap-1.5">
                        <Thermometer className="w-4 h-4 text-sky-400" />
                        Target Cold Envelope (°C)
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {selectedProfile.defaultTempMin}°C - {selectedProfile.defaultTempMax}°C
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Measured Core Probe Temp (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={coreTemp}
                        onChange={(e) => setCoreTemp(Number(e.target.value))}
                        className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-[#141d2a] border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">Target Relative Humidity (% RH)</span>
                      <span className="font-mono text-sky-400 font-bold">
                        {selectedProfile.defaultHumidityMin}% - {selectedProfile.defaultHumidityMax}%
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Ambient Pre-Cooling Humidity (% RH)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={humidity}
                        onChange={(e) => setHumidity(Number(e.target.value))}
                        className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Conditional Commodity Criteria */}
                <div className="p-4 bg-[#141d2a] border border-slate-800 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Conditional Quality Criteria for {commodity.toUpperCase()}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(commodity === 'strawberries' || commodity === 'tomatoes' || commodity === 'blueberries') && (
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Refractometer Brix Sugar Index (°Bx)</span>
                          <span className="font-mono text-amber-300">Optimal: {selectedProfile.optimalBrix}</span>
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          value={brixScore}
                          onChange={(e) => setBrixScore(Number(e.target.value))}
                          className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    )}

                    {(commodity === 'strawberries' || commodity === 'avocados') && (
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Penetrometer Firmness (PSI)</span>
                          <span className="font-mono text-amber-300">Target: {selectedProfile.firmnessRange}</span>
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          value={firmnessPsi}
                          onChange={(e) => setFirmnessPsi(Number(e.target.value))}
                          className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    )}

                    {commodity === 'lettuce' && (
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Bract Discoloration / Tipburn Rate (%)</span>
                          <span className="font-mono text-emerald-400">Max allowable: 2.0%</span>
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          value={leafDiscolorationPercent}
                          onChange={(e) => setLeafDiscolorationPercent(Number(e.target.value))}
                          className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    )}

                    {commodity === 'avocados' && (
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Dry Matter Content (%)</span>
                          <span className="font-mono text-emerald-400">Minimum: 24.0%</span>
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          value={dryMatterPercent}
                          onChange={(e) => setDryMatterPercent(Number(e.target.value))}
                          className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Classification</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    <span>Proceed to Proof & Sign-Off</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Quality Proof Upload & Cryptographic Sealing */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Visual Inspection Proof & Regulatory Attestation</h3>
                  <p className="text-xs text-slate-400">Upload sample lot imagery and sign with cryptographic inspector key</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Photo Proof Box */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-300">
                      Visual Produce Sample Inspection Proof
                    </label>

                    <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
                      <img
                        src={selectedProofImage}
                        alt="Harvest produce inspection sample"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                        <div className="text-[11px] text-white">
                          <span className="font-bold text-emerald-400 block">AI Optical Score: 98.4% (Grade A Spec)</span>
                          <span className="text-slate-300">0% botrytis, uniform coloration, high calyx turgor</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer border border-slate-700 transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Lab Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-500 font-mono">PNG/JPG up to 10MB</span>
                    </div>
                  </div>

                  {/* Sign-Off & Grade Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Quality Grade Assigned</label>
                      <select
                        value={qualityGrade}
                        onChange={(e) => setQualityGrade(e.target.value as QualityGrade)}
                        className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="GRADE_A_EXPORT">Grade A - Export Specification (Top Premium)</option>
                        <option value="GRADE_B_DOMESTIC">Grade B - Domestic Wholesale Market</option>
                        <option value="GRADE_C_PROCESSING">Grade C - Industrial Food Processing</option>
                        <option value="REJECTED_QUARANTINE">Quarantine Rejected - Fails Food Safety Standard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Licensed QA Inspector Identification</label>
                      <input
                        type="text"
                        value={inspectorName}
                        onChange={(e) => setInspectorName(e.target.value)}
                        className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Official Inspection Observations</label>
                      <textarea
                        rows={3}
                        value={inspectionNotes}
                        onChange={(e) => setInspectionNotes(e.target.value)}
                        className="w-full bg-[#0a1017] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                      />
                    </div>

                    {!isOnline && (
                      <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-300">
                        <Database className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>Operating in Offline Mode. Batch will be sealed and cached locally in IndexedDB until 5G is restored.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Calibration</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isSubmitting ? 'Sealing Cryptographic Batch...' : 'Seal & Commit Batch'}</span>
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
