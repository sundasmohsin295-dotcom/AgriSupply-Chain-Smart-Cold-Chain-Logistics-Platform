import React, { useState } from 'react';
import { 
  HelpCircle, 
  ShieldCheck, 
  WifiOff, 
  Truck, 
  FileCheck2, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Lock, 
  FileText,
  ExternalLink,
  Layers,
  HeartHandshake
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'offline' | 'telemetry' | 'compliance' | 'roles';
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-offline',
    category: 'offline',
    question: 'How does offline mode work in remote farm areas?',
    answer: 'AgriSupply uses an offline-first client architecture powered by browser IndexedDB storage. When cellular connectivity drops in rural farm fields or mountainous corridors, all produce intake submissions, inspection signatures, and temperature logs are immediately buffered into a persistent FIFO (First-In, First-Out) mutation queue. As soon as connectivity is restored, the synchronization engine pushes queued mutations to the central ledger with automatic cryptographic reconciliation.'
  },
  {
    id: 'faq-signal-loss',
    category: 'telemetry',
    question: 'What happens if a refrigerated truck loses signal mid-delivery?',
    answer: 'The vehicle telematics unit continues logging core temperature, ambient temperatures, and compressor RPM locally at 2-second intervals on local non-volatile storage. The system continues monitoring thermal thresholds locally. If an excursion (>4.0°C) occurs while disconnected, an alarm is triggered in the vehicle cabin and logged. Once cellular telemetry or depot Wi-Fi reconnects, the complete uninterrupted 24-hour time series is transmitted to the cloud.'
  },
  {
    id: 'faq-compliance-crypto',
    category: 'compliance',
    question: 'How is cold-chain compliance cryptographically verified?',
    answer: 'When a compliance PDF receipt is exported, the browser calculates a genuine SHA-256 cryptographic digest of the exact binary payload using the Web Crypto API (FIPS 180-4 standard). This 64-character hash is embedded directly into the verification QR code. Any party can scan the QR code or upload the PDF document into the tamper-detection chamber to confirm that not a single byte of the temperature records or auditor sign-offs has been modified.'
  },
  {
    id: 'faq-roles-data',
    category: 'roles',
    question: 'What specific data does each role see?',
    answer: '• Farmers see their own harvested produce lots, quality inspection grades (Grade-A export vs domestic), and intake dispatch slips.\n• Transporters see active corridor GPS telematics, real-time reefer temperatures, and geofence alerts on N-5 highway corridors.\n• Warehouse Admins manage bay allocation, quarantine holds for breached cargo, and inventory staging.\n• Retailers view incoming shipment ETAs, shelf-life freshness index, and receiving approvals.\n• Compliance Auditors have full access to cryptographic verification records, immutable event logs, and PDF attestation stamps.'
  },
  {
    id: 'faq-standards',
    category: 'compliance',
    question: 'Which international standards and regulations are supported?',
    answer: 'The platform adheres to PSQCA (Pakistan Standards and Quality Control Authority) standard §4.8 for perishable food logistics, GlobalGAP post-harvest cold-chain criteria, and Codex Alimentarius HACCP critical control point principles for export-grade agricultural produce.'
  }
];

export const FAQAndTrustModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faq' | 'about' | 'privacy' | 'terms'>('faq');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-offline');
  const [faqFilter, setFaqFilter] = useState<string>('all');

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const filteredFaqs = faqFilter === 'all' 
    ? FAQS 
    : FAQS.filter(f => f.category === faqFilter);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Trust, Governance & Technical Documentation
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clear technical explanations, regulatory compliance standards, and honest demo transparency.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'faq'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'about'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            About AgriSupply
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'privacy'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Privacy Notice
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'terms'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Terms & Protocol
          </button>
        </div>
      </div>

      {/* TAB 1: ACCORDION FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFaqFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                faqFilter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              All Topics ({FAQS.length})
            </button>
            <button
              onClick={() => setFaqFilter('offline')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                faqFilter === 'offline'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Offline Resilience
            </button>
            <button
              onClick={() => setFaqFilter('telemetry')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                faqFilter === 'telemetry'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              IoT Telematics & GPS
            </button>
            <button
              onClick={() => setFaqFilter('compliance')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                faqFilter === 'compliance'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Cryptographic Compliance
            </button>
            <button
              onClick={() => setFaqFilter('roles')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                faqFilter === 'roles'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Role Visibility (RBAC)
            </button>
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {faq.question}
                      </span>
                    </div>
                    <span className="text-slate-400 p-1">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 font-sans whitespace-pre-line bg-slate-50/50 dark:bg-slate-900/20">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ABOUT */}
      {activeTab === 'about' && (
        <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Info className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              About the AgriSupply Cold-Chain Initiative
            </h2>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
            <p>
              In developing agricultural economies like Pakistan, up to <strong>35% to 40% of fresh horticultural produce</strong> (strawberries, mangoes, tomatoes, citrus) spoils before reaching export terminals or domestic consumer retail shelves. The primary breakdown occurs not on the farm, but during <strong>post-harvest transit across high-temperature highway corridors</strong> such as the N-5 highway route (Multan $\rightarrow$ Sahiwal $\rightarrow$ Okara $\rightarrow$ Lahore).
            </p>
            <p>
              <strong>AgriSupply</strong> is an autonomous, multi-tenant cold-chain integrity protocol designed to bridge smallholder growers, reefer transport fleets, refrigerated distribution centers, and compliance certifying authorities.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <span className="font-bold text-slate-900 dark:text-white block mb-1 text-sm">Real-World GPS</span>
                <p className="text-[11px] text-slate-500">
                  Browser Geolocation API support with satellite precision coupled with realistic corridor transit waypoints.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <span className="font-bold text-slate-900 dark:text-white block mb-1 text-sm">SHA-256 Attestation</span>
                <p className="text-[11px] text-slate-500">
                  Cryptographic verification receipts where every single temperature point is tamper-evident.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <span className="font-bold text-slate-900 dark:text-white block mb-1 text-sm">Offline Resilience</span>
                <p className="text-[11px] text-slate-500">
                  Zero downtime in zero-connectivity rural belts via transactional client-side IndexedDB mutations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRIVACY NOTICE */}
      {activeTab === 'privacy' && (
        <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Demonstration Privacy Notice & Data Exposure
            </h2>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
            <p>
              This application has been developed to showcase enterprise-grade cold-chain monitoring. Here is how your data is handled:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 text-xs">
              <li>
                <strong>Firebase Authentication:</strong> When you register an account, your email and password credentials are authenticated directly through Google Firebase Auth services. Verification emails are sent to your inbox.
              </li>
              <li>
                <strong>Device Geolocation:</strong> If you grant location permissions (via the "Use My Current Location" button), coordinates are processed client-side in your browser to demonstrate real satellite coordinate logging. No physical location data is harvested or tracked outside this application.
              </li>
              <li>
                <strong>Client-Side Storage:</strong> IndexedDB is utilized locally on your device to demonstrate offline synchronization. No third-party tracking scripts or advertising cookies are deployed.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: TERMS & CONDITIONS */}
      {activeTab === 'terms' && (
        <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Terms of Protocol Evaluation & Operational Use
            </h2>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
            <p>
              By accessing the AgriSupply platform demo, operators and evaluators acknowledge the following operational boundaries:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 text-xs">
              <li>
                <strong>Simulated Telematics vs. Live Transits:</strong> Highway transit logs on the Multan-Lahore corridor are simulated using authentic meteorological data from the Open-Meteo satellite API and deterministic physics curves. Real GPS mode utilizes physical browser sensors.
              </li>
              <li>
                <strong>Cryptographic Receipts:</strong> Generated compliance verification PDF receipts contain authentic SHA-256 binary digests computed via the Web Crypto API, conforming to FIPS 180-4 standard specifications.
              </li>
              <li>
                <strong>Audit Non-Repudiation:</strong> The breach acknowledging flow, temperature pull-down remedial actions, and auditor certifications represent a non-repudiation cold-chain protocol designed for food safety transparency.
              </li>
            </ul>
          </div>
        </div>
      )}

    </div>
  );
};
