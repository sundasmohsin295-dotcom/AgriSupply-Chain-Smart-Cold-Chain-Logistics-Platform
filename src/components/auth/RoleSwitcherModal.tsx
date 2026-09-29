import React, { useState } from 'react';
import { UserRole } from '../../types';
import { ROLE_DEFINITIONS, decodeJWT } from '../../lib/jwtAuth';
import { X, Check, Shield, Tractor, Truck, Warehouse, ShieldCheck, Key, Copy, CheckCircle } from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  currentToken: string;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
  currentToken
}) => {
  const [activeTab, setActiveTab] = useState<'personas' | 'jwt'>('personas');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const roles: UserRole[] = ['FARMER', 'TRANSPORTER', 'WAREHOUSE_ADMIN', 'COMPLIANCE_AUDITOR'];
  const decoded = decodeJWT(currentToken);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'FARMER':
        return <Tractor className="w-5 h-5 text-emerald-600 dark:text-amber-400" />;
      case 'TRANSPORTER':
        return <Truck className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case 'WAREHOUSE_ADMIN':
        return <Warehouse className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'COMPLIANCE_AUDITOR':
        return <ShieldCheck className="w-5 h-5 text-violet-600 dark:text-violet-400" />;
    }
  };

  const handleCopyJWT = () => {
    navigator.clipboard.writeText(currentToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0f1722] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Enterprise Multi-Tenant RBAC & JWT Security</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cryptographic token claims & tenant-scoped permission profiles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c131c] px-6 pt-2">
          <button
            onClick={() => setActiveTab('personas')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'personas'
                ? 'border-emerald-600 text-emerald-700 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Select Role Persona (4 Roles)
          </button>
          <button
            onClick={() => setActiveTab('jwt')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'jwt'
                ? 'border-emerald-600 text-emerald-700 dark:border-amber-400 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Decoded JWT Security Inspector
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'personas' ? (
            <div className="space-y-3">
              {roles.map((role) => {
                const info = ROLE_DEFINITIONS[role];
                const isSelected = currentRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => {
                      onSelectRole(role);
                      onClose();
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-amber-400/10 border-emerald-400 dark:border-amber-400/40 shadow-xs'
                        : 'bg-white dark:bg-[#141d2a] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-[#0c131c] border border-slate-200 dark:border-slate-800 shrink-0">
                      {getRoleIcon(role)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{info.title}</span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">({info.name})</span>
                        </div>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-amber-400 bg-emerald-100 dark:bg-amber-400/10 px-2 py-0.5 rounded">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{info.organization} · {info.location}</p>

                      <div className="flex flex-wrap gap-1.5">
                        {info.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="text-[10px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Base64 Encoded Token:</span>
                <button
                  onClick={handleCopyJWT}
                  className="flex items-center gap-1 text-xs text-emerald-600 dark:text-amber-400 hover:underline"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Token' : 'Copy Full JWT'}</span>
                </button>
              </div>

              <div className="bg-slate-100 dark:bg-[#0a1017] p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-300 break-all select-all">
                {currentToken}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Header */}
                <div className="bg-slate-50 dark:bg-[#141d2a] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-rose-500 font-bold block mb-2">
                    Header (Algorithm & Type)
                  </span>
                  <pre className="font-mono text-xs text-slate-800 dark:text-slate-300 overflow-x-auto bg-white dark:bg-[#0a1017] p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    {JSON.stringify(decoded.header, null, 2)}
                  </pre>
                </div>

                {/* Signature */}
                <div className="bg-slate-50 dark:bg-[#141d2a] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-sky-500 font-bold block mb-2">
                    HMAC-SHA256 Signature
                  </span>
                  <div className="bg-white dark:bg-[#0a1017] p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-300 break-all">
                    {decoded.signature}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Cryptographically bound to tenant security salt.
                  </p>
                </div>
              </div>

              {/* Payload */}
              <div className="bg-slate-50 dark:bg-[#141d2a] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block mb-2">
                  Payload (Claims & Role Scopes)
                </span>
                <pre className="font-mono text-xs text-slate-800 dark:text-slate-300 overflow-x-auto bg-white dark:bg-[#0a1017] p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  {JSON.stringify(decoded.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-[#0c131c] border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <span>Tenant: <span className="font-mono text-slate-800 dark:text-slate-200">tenant_agri_coop_us_west</span></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg text-xs font-semibold transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
