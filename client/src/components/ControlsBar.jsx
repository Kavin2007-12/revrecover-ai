import React from 'react';
import { Play, Sparkles, Filter, Store, ShoppingCart, RefreshCw, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ControlsBar({
  merchants,
  selectedMerchant,
  onSelectMerchant,
  onRunSimulation,
  isSimulating,
  statusFilter,
  onSelectStatusFilter
}) {
  const getMerchantIcon = (merchantId) => {
    if (merchantId === 'mch_d2c_01') return <ShoppingCart className="w-3.5 h-3.5" />;
    if (merchantId === 'mch_saas_02') return <RefreshCw className="w-3.5 h-3.5" />;
    if (merchantId === 'mch_b2b_03') return <FileText className="w-3.5 h-3.5" />;
    return <Store className="w-3.5 h-3.5" />;
  };

  return (
    <div className="glass-card p-4 rounded-2xl border border-slate-800 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
      
      {/* Merchant Switcher Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
        <button
          onClick={() => onSelectMerchant('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedMerchant === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>All Merchants (Global View)</span>
        </button>

        {merchants.map((m) => {
          const isSelected = selectedMerchant === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMerchant(m.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {getMerchantIcon(m.id)}
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>

      {/* Action Controls: Hero Run Batch Button */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => onSelectStatusFilter(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900">All Statuses</option>
            <option value="AT_RISK" className="bg-slate-900">🔴 Revenue At Risk</option>
            <option value="DIAGNOSED" className="bg-slate-900">🟡 AI Diagnosed</option>
            <option value="ACTION_SENT" className="bg-slate-900">🔵 Action Executed</option>
            <option value="RECOVERED" className="bg-slate-900">🟢 Money Recovered</option>
          </select>
        </div>

        {/* Hero Trigger Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRunSimulation}
          disabled={isSimulating}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
            isSimulating
              ? 'bg-amber-600/50 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/30'
          }`}
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Running AI Batch Simulation...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>⚡ RUN RECOVERY BATCH</span>
            </>
          )}
        </motion.button>
      </div>

    </div>
  );
}
