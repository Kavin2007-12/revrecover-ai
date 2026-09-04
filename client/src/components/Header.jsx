import React from 'react';
import { ShieldCheck, Cpu, RefreshCw, Zap } from 'lucide-react';

export default function Header({ isSimulating, onReset }) {
  return (
    <header className="border-b border-slate-800 bg-[#0B0E14]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Razorpay Branding */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-2.5 rounded-xl shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/30 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 102L68 18L52 60H95L52 102H25Z" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">Razorpay</span>
            </div>
            <h1 className="text-xs text-slate-400 font-medium">RevRecover AI — Multi-Merchant Revenue Recovery Platform</h1>
          </div>
        </div>

        {/* Right: Status Indicators & Reset */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulating ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSimulating ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="font-medium text-slate-300">
              {isSimulating ? 'AI Recovery Engine Running...' : 'AI Engine Ready'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-xs text-blue-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Guardrails Active</span>
          </div>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
            title="Reset Batch Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>

      </div>
    </header>
  );
}
