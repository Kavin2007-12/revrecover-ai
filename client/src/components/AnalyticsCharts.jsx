import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { PieChart as PieIcon, BarChart3, CheckCircle2 } from 'lucide-react';

const COLORS = ['#3884F6', '#FFB800', '#22C55E', '#EC4899', '#A855F7', '#64748B'];

export default function AnalyticsCharts({ transactions, merchants }) {
  // Filter recovered transactions for the ledger
  const recoveredTxns = React.useMemo(() => {
    return transactions.filter(t => t.status === 'RECOVERED');
  }, [transactions]);

  const totalRecoveredAmount = React.useMemo(() => {
    return recoveredTxns.reduce((sum, t) => sum + (t.recoveredAmount || t.amount), 0);
  }, [recoveredTxns]);

  // Aggregate root cause breakdowns with high-contrast labels
  const rootCauseData = React.useMemo(() => {
    const counts = {};
    transactions.forEach(t => {
      let category = t.diagnosis?.category;
      if (!category) {
        category = 'Pending AI Diagnosis';
      } else {
        if (category === 'TECHNICAL_GATEWAY') category = 'Technical Gateway Timeout';
        else if (category === 'CUSTOMER_FINANCIAL') category = 'Customer Financial / Mandate';
        else if (category === 'PRICE_FRICTION') category = 'Price Friction / Abandonment';
        else if (category === 'INVOICE_OVERDUE') category = 'B2B Overdue Terms';
      }
      counts[category] = (counts[category] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [transactions]);

  // Aggregate recovery amounts per merchant
  const merchantRecoveryData = React.useMemo(() => {
    return merchants.map(m => {
      const merchantTxns = transactions.filter(t => t.merchantId === m.id);
      const atRisk = merchantTxns.reduce((sum, t) => sum + t.amount, 0);
      const recovered = merchantTxns
        .filter(t => t.status === 'RECOVERED')
        .reduce((sum, t) => sum + (t.recoveredAmount || t.amount), 0);
      return {
        name: m.name.split(' ')[0],
        atRisk,
        recovered
      };
    });
  }, [transactions, merchants]);

  // Custom high-contrast Tooltip for dark mode readability
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-[#131A26] border border-slate-700 p-3 rounded-xl shadow-2xl text-xs text-white">
          <p className="font-bold text-slate-200 mb-1">{data.name}</p>
          <p className="text-blue-400 font-extrabold flex items-center gap-1">
            Count / Amount: <span className="text-white">{data.value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Root Cause Distribution Chart */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Failure Root Cause Breakdown</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Hover for details</span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rootCauseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {rootCauseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Merchant Comparison Bar Chart */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Multi-Merchant Recovery Performance</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">At Risk vs Recovered</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={merchantRecoveryData}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                />
                <Bar dataKey="atRisk" name="At Risk (₹)" fill="#334155" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recovered" name="Recovered (₹)" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
