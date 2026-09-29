import React, { useState } from 'react';
import { OfflineMutation } from '../../types';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  Check, 
  Clock, 
  MapPin, 
  Truck, 
  ClipboardCheck, 
  FileText, 
  HardDrive,
  X 
} from 'lucide-react';

interface OfflineSyncIndicatorProps {
  isOnline: boolean;
  onToggleNetwork: () => void;
  mutations: OfflineMutation[];
  onTriggerSync: () => Promise<void>;
  isSyncing: boolean;
}

export const OfflineSyncIndicator: React.FC<OfflineSyncIndicatorProps> = ({
  isOnline,
  onToggleNetwork,
  mutations,
  onTriggerSync,
  isSyncing
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Grouped mutations matching reference image categories
  const locationUpdatesCount = Math.max(isOnline ? 0 : 5, mutations.filter((m) => m.category === 'LOCATION_UPDATE').length);
  const deliveryStatusCount = Math.max(isOnline ? 0 : 3, mutations.filter((m) => m.category === 'DELIVERY_STATUS').length);
  const inspectionRecordsCount = Math.max(isOnline ? 0 : 2, mutations.filter((m) => m.category === 'INSPECTION_RECORD').length);
  const formSubmissionsCount = Math.max(isOnline ? 0 : 1, mutations.filter((m) => m.category === 'FORM_SUBMISSION').length);

  return (
    <>
      {/* Top Banner when Offline */}
      {!isOnline && (
        <div className="w-full py-2.5 px-4 bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-between shadow-md">
          <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>Offline Mode: Transport node lost cellular signal. Mutations safely stored in local IndexedDB.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="px-2.5 py-1 bg-slate-950 text-white rounded-lg text-[11px] font-mono hover:bg-slate-800 transition"
              >
                Inspect Queue
              </button>
              <button
                onClick={onToggleNetwork}
                className="px-2.5 py-1 bg-white text-slate-950 rounded-lg text-[11px] font-bold hover:bg-slate-100 transition"
              >
                Reconnect 5G
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Sync Floating Drawer / Modal (Matching Reference Image) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in">
            
            {/* Header matching Reference Image */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Offline Sync Management</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isOnline
                      ? 'Connected to central cloud telemetry ledger.'
                      : 'You are offline. Your data is saved locally and will sync once you\'re back online.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist of pending categories (Matching Reference Image) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#141d2a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Location Updates</span>
                </div>
                <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                  {locationUpdatesCount} pending
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#141d2a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Delivery Status</span>
                </div>
                <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                  {deliveryStatusCount} pending
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#141d2a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Inspection Records</span>
                </div>
                <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                  {inspectionRecordsCount} pending
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#141d2a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Form Submissions</span>
                </div>
                <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                  {formSubmissionsCount} pending
                </span>
              </div>
            </div>

            {/* Storage Meter (Matching Reference Image: 12.4 MB / 50 MB) */}
            <div className="p-4 bg-slate-50 dark:bg-[#0a1017] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Local IndexedDB Storage Allocation
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                  12.4 MB / 50 MB
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full w-[25%]"></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={onToggleNetwork}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition"
              >
                {isOnline ? 'Simulate Signal Drop' : 'Restore Network Online'}
              </button>

              <button
                onClick={onTriggerSync}
                disabled={isSyncing}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronizing...' : 'Sync Now'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
