import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ExternalLink, X, CheckCircle2 } from 'lucide-react';

export default function WhatsAppNotificationToast({ notification, onClose, onRecover }) {
  if (!notification) return null;

  return (
    <AnimatePresence>
      <div className="fixed top-20 right-6 z-50 max-w-sm w-full">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="bg-[#128C7E]/95 backdrop-blur-md border border-[#25D366]/50 p-4 rounded-2xl shadow-2xl text-white space-y-2.5"
        >
          {/* Notification Header */}
          <div className="flex items-center justify-between border-b border-white/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="bg-[#25D366] p-1 rounded-full text-slate-950 font-bold">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold tracking-wide">WhatsApp Business Nudge</span>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Customer & Message Content */}
          <div className="space-y-1 text-xs">
            <div className="text-[11px] font-semibold text-emerald-200">
              To: {notification.customerName || 'Rahul Sharma'} ({notification.phone || '+91 98765 43210'})
            </div>
            <p className="bg-slate-950/40 p-2.5 rounded-xl text-slate-100 font-sans leading-relaxed border border-white/10">
              "{notification.message || 'Hi Rahul, your checkout timed out. Click to pay instantly: '}"
              <span className="text-blue-300 underline block font-mono text-[10px] mt-1">{notification.link}</span>
            </p>
          </div>

          {/* Interactive Recovery Action Button */}
          <button
            onClick={() => onRecover(notification.item)}
            className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#128C7E]" />
            <span>Open Recovery Link & Save Sale (₹{notification.amount?.toLocaleString('en-IN')})</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
