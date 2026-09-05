import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ShieldCheck, ExternalLink, Clock, FileCode, CheckCircle2, History } from 'lucide-react';

export default function InspectorDrawer({ txn, logs, onClose }) {
  if (!txn) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-xl bg-[#0B0E14] border-l border-slate-800 h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between"
        >
          {/* Top Bar */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">AI Inspector & Audit Drawer</h2>
                  <span className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md">
                    {txn.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {txn.merchantName || 'TechGear India'} ({txn.category || (txn.id?.includes('D2C') ? 'D2C E-Commerce' : txn.id?.includes('SAAS') ? 'SaaS Subscriptions' : 'B2B Enterprise')})
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Item Overview */}
            <div className="glass-card p-4 rounded-xl border border-slate-800 mb-6 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-slate-200">{txn.customerName || 'Kavin'} ({txn.customerEmail || 'kavin@example.com'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Item / Invoice:</span>
                <span className="font-semibold text-slate-200">{txn.itemDescription || 'Order Purchase'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount at Risk:</span>
                <span className="font-extrabold text-white text-sm">₹{(txn.amount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* AI Diagnostic Reasoning Section */}
            {txn.diagnosis && (
              <div className="glass-card p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> AI Root Cause Diagnosis
                  </span>
                  <span className="text-[10px] text-blue-300/60 font-mono">Confidence: {(txn.diagnosis.confidenceScore * 100).toFixed(0)}%</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed mb-3">{txn.diagnosis.rootCauseSummary}</p>
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1 text-xs">
                  <div className="text-slate-400">Target Strategy: <span className="text-amber-300 font-semibold">{txn.diagnosis.incentiveOffered}</span></div>
                  <div className="text-slate-400">Selected Action: <span className="text-blue-300 font-semibold">{txn.diagnosis.recommendedAction}</span></div>
                </div>
              </div>
            )}

            {/* Generated Razorpay Link */}
            {txn.razorpayLink && (
              <div className="glass-card p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 mb-6 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Generated Razorpay Link
                  </span>
                  <a
                    href={txn.razorpayLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 underline font-semibold flex items-center gap-1"
                  >
                    Open Link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-slate-300 font-mono text-[11px]">
                  {txn.razorpayLink}
                </div>
              </div>
            )}

            {/* Chronological Audit Trail Timeline */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-400" /> Step-by-Step Audit Log
              </h3>
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-slate-800">
                {logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="relative pl-7 text-xs">
                      <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-[#0B0E14]" />
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-blue-300">{log.eventType}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                        </div>
                        <p className="text-slate-300">{log.detail}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 pl-7">No log entries recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Close Button */}
          <div className="pt-4 border-t border-slate-800 mt-auto">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              Close Audit Inspector
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
