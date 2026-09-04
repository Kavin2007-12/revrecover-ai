import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Smartphone, Send, CheckCircle2, ShieldCheck, Calendar, ArrowRight } from 'lucide-react';

export default function CustomerSimulatorModal({ txn, onClose, onSimulateOutcome }) {
  const [p2pDate, setP2pDate] = useState('2026-09-12');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!txn) return null;

  const handlePayNow = async () => {
    setIsSubmitting(true);
    await onSimulateOutcome(txn.id, 'RECOVERED');
    setIsSubmitting(false);
    onClose();
  };

  const handlePromiseToPay = async () => {
    setIsSubmitting(true);
    await onSimulateOutcome(txn.id, 'PROMISE_TO_PAY', p2pDate);
    setIsSubmitting(false);
    onClose();
  };

  const handleOptOut = async () => {
    setIsSubmitting(true);
    await onSimulateOutcome(txn.id, 'OPT_OUT');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Smartphone Frame Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">Interactive Customer View</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* WhatsApp / SMS Customer Nudge Preview */}
        <div className="p-6 space-y-4">
          <div className="bg-emerald-950/40 border border-emerald-800/40 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Incoming Nudge ({txn.actionPayload?.channel || 'WhatsApp'})
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              "{txn.diagnosis?.personalizedMessage || 'Your payment for ' + txn.itemDescription + ' requires attention.'}"
            </p>
          </div>

          {/* Amount & Link Display */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 text-center space-y-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Amount Due</span>
            <div className="text-2xl font-black text-white">₹{txn.amount.toLocaleString('en-IN')}</div>
            <p className="text-[11px] text-slate-400">{txn.itemDescription}</p>
          </div>

          {/* Interactive Action Options for Judges */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handlePayNow}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simulate Customer Paying Now via Razorpay (Recover Money)</span>
            </button>

            {/* B2B Promise to Pay Option */}
            {txn.category === 'B2B Enterprise Invoices' && (
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Select Promise-to-Pay Date:
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={p2pDate}
                    onChange={(e) => setP2pDate(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none flex-1"
                  />
                  <button
                    onClick={handlePromiseToPay}
                    disabled={isSubmitting}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Submit P2P
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleOptOut}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-xs border border-slate-800 transition-colors"
            >
              Simulate Customer Opt-Out / DNC
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
