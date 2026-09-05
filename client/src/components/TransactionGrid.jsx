import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Send,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export default function TransactionGrid({
  transactions,
  onInspectTransaction,
  onOpenMobileSimulator,
  onApproveHumanAction
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'RECOVERED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 MONEY RECOVERED
          </span>
        );
      case 'PAUSED_HUMAN_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> 🛑 HUMAN APPROVAL REQUIRED
          </span>
        );
      case 'PAUSED_P2P':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" /> 🟡 PROMISE-TO-PAY LOGGED
          </span>
        );
      case 'STOPPED_GUARDRAIL':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30 px-2.5 py-1 rounded-full">
            <ShieldAlert className="w-3.5 h-3.5" /> ⚪ GUARDRAIL STOPPED
          </span>
        );
      case 'DIAGNOSED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> 🔵 AI DIAGNOSED
          </span>
        );
      default:
        if (status?.startsWith('ACTION_SENT')) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full">
              <Send className="w-3.5 h-3.5" /> 🔵 ACTION EXECUTED
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" /> 🔴 REVENUE AT RISK
          </span>
        );
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="glass-card p-12 rounded-2xl text-center border border-slate-800">
        <p className="text-slate-400 text-sm">No transaction records match the current filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <AnimatePresence mode="popLayout">
        {transactions.map((txn) => (
          <motion.div
            key={txn.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`glass-card glass-card-hover p-5 rounded-2xl border relative flex flex-col justify-between ${
              txn.status === 'RECOVERED'
                ? 'border-emerald-500/40 bg-emerald-950/10'
                : txn.status === 'PAUSED_HUMAN_APPROVAL'
                ? 'border-amber-500/40 bg-amber-950/10'
                : 'border-slate-800'
            }`}
          >
            {/* Top Bar: Merchant Tag & Status Badge */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                  {txn.merchantName}
                </span>
                {getStatusBadge(txn.status)}
              </div>

              {/* Amount & Customer Info */}
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-bold text-slate-100 text-base">{txn.customerName}</h3>
                <span className="text-lg font-extrabold text-white">₹{txn.amount.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs text-slate-400 mb-3 line-clamp-1">{txn.itemDescription}</p>

              {/* High-Value Human Approval Banner if Paused */}
              {txn.status === 'PAUSED_HUMAN_APPROVAL' && (
                <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl mb-4 text-xs text-amber-200 space-y-2">
                  <div className="font-bold flex items-center justify-between">
                    <span>🛑 High-Value Guardrail Triggered</span>
                    <span className="text-[10px] text-amber-400 font-mono">Amount ≥ ₹50,000 (50K)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    High value transaction (₹{txn.amount.toLocaleString('en-IN')}) requires Finance Manager authorization before AI nudge execution.
                  </p>
                  <button
                    onClick={() => onApproveHumanAction(txn)}
                    className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>🧑‍💼 Approve AI Recovery Action</span>
                  </button>
                </div>
              )}

            </div>

            {/* Bottom Actions: Inspect AI Rationale & Try-it-Yourself Simulator */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
              <button
                onClick={() => onInspectTransaction(txn)}
                className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <span>Audit & AI Inspector</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onOpenMobileSimulator(txn)}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Try It Yourself — Simulate Customer Payment View"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Try View</span>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
