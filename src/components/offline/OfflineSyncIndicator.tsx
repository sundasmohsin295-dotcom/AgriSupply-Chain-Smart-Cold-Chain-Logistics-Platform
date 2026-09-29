import React, { useState } from 'react';
import { OfflineMutation } from '../../types';
import { Wifi, WifiOff, RefreshCw, Database, Check, Clock, ChevronRight, X } from 'lucide-react';

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

  return (
    <>
      {/* Banner displayed when offline or when mutations are pending */}
      {(!isOnline || mutations.length > 0) && (
        <div
          className={`w-full py-2 px-4 border-b text-xs transition-colors flex items-center justify-between ${
            !isOnline
              ? 'bg-amber-950/80 border-amber-500/30 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isOnline ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold">Offline Remote Mode (IndexedDB Active)</span>
                  <span className="hidden md:inline text-amber-300/80">
                    · Cellular connection dropped in remote mountain pass. Mutations are safely buffered locally.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-white">Connection Restored</span>
                  <span>· {mutations.length} mutations queued in local IndexedDB ready for automatic sync.</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/30 hover:bg-black/50 border border-current text-[11px] font-mono transition"
              >
                <Database className="w-3 h-3" />
                <span>{mutations.length} Queued</span>
              </button>

              {isOnline && mutations.length > 0 && (
                <button
                  onClick={onTriggerSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-slate-950 rounded font-bold hover:bg-emerald-400 transition text-[11px] disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              )}

              <button
                onClick={onToggleNetwork}
                className="hidden sm:inline-block underline text-[11px] text-slate-300 hover:text-white ml-2"
              >
                {isOnline ? 'Simulate Cell Drop' : 'Reconnect Online'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queued Mutations Inspector Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0f1722] border-l border-slate-800 h-full p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">IndexedDB Transaction Queue</h3>
                  <p className="text-xs text-slate-400">FIFO Offline Resilience Log</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/60">
              <span>Status: <span className="font-mono text-white">{isOnline ? 'Online (5G Linked)' : 'Zero Coverage (Offline)'}</span></span>
              <span>Total: <strong className="text-amber-400 font-mono">{mutations.length}</strong></span>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {mutations.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Check className="w-8 h-8 mx-auto text-emerald-400/50 mb-2" />
                  <p className="text-xs">No pending offline mutations.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    All transactions are synchronized with the central cloud ledger.
                  </p>
                </div>
              ) : (
                mutations.map((mut) => (
                  <div
                    key={mut.id}
                    className="p-3 bg-[#131c28] border border-slate-800 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-amber-400">{mut.type}</span>
                      <span className="text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(mut.queuedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200">{mut.description}</p>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>ID: {mut.id}</span>
                      <span className={`px-1.5 py-0.5 rounded ${mut.status === 'PENDING' ? 'bg-amber-400/10 text-amber-400' : 'bg-sky-400/10 text-sky-400'}`}>
                        {mut.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex gap-2">
              <button
                onClick={onToggleNetwork}
                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {isOnline ? 'Drop Network (Go Offline)' : 'Restore Network (Go Online)'}
              </button>
              {isOnline && mutations.length > 0 && (
                <button
                  onClick={onTriggerSync}
                  disabled={isSyncing}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync All'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
