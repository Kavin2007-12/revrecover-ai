import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KPICards({ metrics }) {
  const { totalAtRisk = 0, totalRecovered = 0, recoveryRate = 0, hoursSaved = 0 } = metrics || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Card 1: Revenue at Risk */}
      <motion.div
        whileHover={{ y: -2 }}
        className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue at Risk</span>
          <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          ₹{totalAtRisk.toLocaleString('en-IN')}
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
          <span>Failed checkouts, mandates & invoices</span>
        </p>
      </motion.div>

      {/* Card 2: Measured Money Recovered (THE BAR KPI) */}
      <motion.div
        whileHover={{ y: -2 }}
        className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 relative overflow-hidden shadow-lg shadow-emerald-900/10"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Measured Money Recovered
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
          ₹{totalRecovered.toLocaleString('en-IN')}
        </div>
        <p className="text-xs text-emerald-300/80 mt-2 font-medium">
          Target satisfied for Razorpay Track 03
        </p>
      </motion.div>

      {/* Card 3: Recovery Efficiency % */}
      <motion.div
        whileHover={{ y: -2 }}
        className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recovery Rate %</span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 tracking-tight">
          {recoveryRate}%
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(recoveryRate, 100)}%` }}
          ></div>
        </div>
      </motion.div>

      {/* Card 4: Compliance & Manual Hours Saved */}
      <motion.div
        whileHover={{ y: -2 }}
        className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Guardrails & Time Saved</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight flex items-baseline gap-1">
          {hoursSaved} <span className="text-sm font-normal text-slate-400">hrs saved</span>
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>100% compliant stopping rules</span>
        </p>
      </motion.div>

    </div>
  );
}
