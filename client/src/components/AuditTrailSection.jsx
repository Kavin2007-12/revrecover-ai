import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, RefreshCw, ArrowRight, CheckCircle2, AlertTriangle, Sparkles, UserCheck, Send, Search, X } from 'lucide-react';

export default function AuditTrailSection({ selectedMerchant, transactions, onInspectTransaction }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/audit-logs?merchantId=${selectedMerchant}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Audit logs fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedMerchant, transactions]);

  // Hide Audit Trail when "All Merchants (Global View)" is selected
  if (!selectedMerchant || selectedMerchant === 'all') {
    return null;
  }

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.txnId && log.txnId.toLowerCase().includes(q)) ||
      (log.merchantName && log.merchantName.toLowerCase().includes(q)) ||
      (log.eventType && log.eventType.toLowerCase().includes(q)) ||
      (log.detail && log.detail.toLowerCase().includes(q)) ||
      (log.actor && log.actor.toLowerCase().includes(q)) ||
      (log.payload?.customerName && log.payload.customerName.toLowerCase().includes(q))
    );
  });

  const getEventBadge = (eventType) => {
    switch (eventType) {
      case 'MONEY_RECOVERED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> MONEY RECOVERED
          </span>
        );
      case 'GUARDRAIL_TRIGGERED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> GUARDRAIL TRIGGERED
          </span>
        );
      case 'HUMAN_APPROVAL_GRANTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
            <UserCheck className="w-3 h-3" /> HUMAN AUTHORIZED
          </span>
        );
      case 'AI_DIAGNOSIS_COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" /> AI DIAGNOSED
          </span>
        );
      case 'RECOVERY_ACTION_EXECUTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
            <Send className="w-3 h-3" /> ACTION EXECUTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
            {eventType}
          </span>
        );
    }
  };

  const getMerchantLabel = () => {
    if (selectedMerchant === 'mch_d2c_01' || selectedMerchant === 'd2c') return 'TechGear India D2C';
    if (selectedMerchant === 'mch_saas_02' || selectedMerchant === 'saas') return 'SaaSify Cloud';
    if (selectedMerchant === 'mch_b2b_03' || selectedMerchant === 'b2b') return 'Nexus Logistics B2B';
    return 'All Merchants (Global View)';
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 mb-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
              SQLite Live Audit Trail & Recovery Event Stream
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Filter-Adaptable Real-Time Ledger — Active Filter: <strong className="text-blue-400">{getMerchantLabel()}</strong>
          </p>
        </div>

        {/* Center Search Box */}
        <div className="flex-1 max-w-md mx-auto w-full md:w-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs by Txn ID, customer, event, detail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-blue-500/60 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Refresh Logs Button */}
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Logs</span>
        </button>
      </div>

      {/* Row Data Log Stream */}
      {filteredLogs.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-xs">
          {searchQuery ? (
            <span>No matching audit logs found for "<strong className="text-slate-200">{searchQuery}</strong>"</span>
          ) : (
            <span>No audit log events found for <strong className="text-slate-300">{getMerchantLabel()}</strong>. Trigger a checkout in Workflows Studio or run a recovery batch!</span>
          )}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
          {filteredLogs.map((log, index) => {
            const relatedTxn = transactions.find(t => t.id === log.txnId) || {
              id: log.txnId,
              merchantName: log.merchantName,
              customerName: log.payload?.customerName || 'Kavin',
              amount: log.payload?.amount || 4999,
              itemDescription: log.detail,
              status: log.eventType === 'MONEY_RECOVERED' ? 'RECOVERED' : 'AT_RISK',
              diagnosis: log.payload?.diagnosis || {
                rootCauseSummary: log.detail,
                confidenceScore: 0.94,
                recommendedAction: log.eventType,
                personalizedMessage: log.detail
              }
            };

            return (
              <div
                key={log.id}
                className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-xl text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-all group"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* S.No Badge */}
                    <span className="font-mono text-[10px] font-bold bg-blue-950/70 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded">
                      S.No #{index + 1}
                    </span>

                    {/* Txn ID */}
                    <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {log.txnId}
                    </span>
                    <span className="font-bold text-slate-200">{log.merchantName}</span>
                    {getEventBadge(log.eventType)}
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 ml-auto md:ml-0">
                      <Clock className="w-3 h-3" /> {log.timestamp}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed font-medium pt-0.5">
                    {log.detail}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                    <span>Customer: <strong className="text-slate-300">{log.payload?.customerName || 'Kavin'}</strong></span>
                    <span>Actor: <strong className="text-slate-300">{log.actor || 'RevRecover AI Agent'}</strong></span>
                    {log.payload?.amount && (
                      <span className="text-emerald-400 font-bold">Amount: ₹{log.payload.amount.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onInspectTransaction(relatedTxn)}
                  className="w-full md:w-auto text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 shrink-0"
                  title="Inspect Full AI Diagnostic Rationale & Flow"
                >
                  <span>Inspect Full Flow</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
