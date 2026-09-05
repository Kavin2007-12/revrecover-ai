import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import ControlsBar from './components/ControlsBar';
import TransactionGrid from './components/TransactionGrid';
import InspectorDrawer from './components/InspectorDrawer';
import CustomerSimulatorModal from './components/CustomerSimulatorModal';
import AnalyticsCharts from './components/AnalyticsCharts';
import WorkflowsTab from './components/WorkflowsTab';
import { BarChart2, Zap } from 'lucide-react';

export default function App() {
  const [activeMainTab, setActiveMainTab] = useState('analytics'); // 'analytics' or 'workflows'
  const [merchants, setMerchants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [metrics, setMetrics] = useState({ totalAtRisk: 0, totalRecovered: 0, recoveryRate: 0, hoursSaved: 0 });
  const [selectedMerchant, setSelectedMerchant] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [inspectedTxn, setInspectedTxn] = useState(null);
  const [simulatingTxn, setSimulatingTxn] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // Load Merchants & Initial Data
  const fetchData = async () => {
    try {
      const [mRes, tRes, kRes] = await Promise.all([
        fetch('/api/merchants'),
        fetch(`/api/transactions?merchantId=${selectedMerchant}&status=${statusFilter}`),
        fetch(`/api/metrics?merchantId=${selectedMerchant}`)
      ]);
      const mData = await mRes.json();
      const tData = await tRes.json();
      const kData = await kRes.json();

      setMerchants(mData.merchants || []);
      setTransactions(tData.transactions || []);
      setMetrics(kData || {});
    } catch (err) {
      console.error('API fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMerchant, statusFilter]);

  // WebSocket Live Updates
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}`);

    ws.onmessage = (event) => {
      try {
        const { event: wsEvent, data } = JSON.parse(event.data);

        if (wsEvent === 'TRANSACTION_UPDATED' || wsEvent === 'TRANSACTION_CREATED') {
          setTransactions(prev => {
            const idx = prev.findIndex(t => t.id === data.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = data;
              return updated;
            }
            return [data, ...prev];
          });
          fetchData();
        }

        if (wsEvent === 'METRICS_UPDATED' || wsEvent === 'SIMULATION_COMPLETED' || wsEvent === 'DATA_RESET') {
          fetchData();
          if (wsEvent === 'SIMULATION_COMPLETED') {
            setIsSimulating(false);
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    };

    return () => ws.close();
  }, [selectedMerchant, statusFilter]);

  // Handle Run Simulation
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      await fetch('/api/run-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: selectedMerchant, autoSimulateOutcome: true })
      });
    } catch (err) {
      console.error('Simulation error:', err);
      setIsSimulating(false);
    }
  };

  // Handle Human Finance Approval for High-Value Transactions
  const handleApproveHumanAction = async (txn) => {
    try {
      await fetch('/api/approve-human', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnId: txn.id })
      });
      fetchData();
    } catch (err) {
      console.error('Approve human error:', err);
    }
  };

  // Handle Reset Simulation State
  const handleReset = async () => {
    setIsSimulating(false);
    try {
      await fetch('/api/reset', { method: 'POST' });
      fetchData();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  // Handle Single Outcome Simulation (from Workflows studio or simulator modal)
  const handleSimulateOutcome = async (txnId, outcomeType, promiseToPayDate = null) => {
    try {
      await fetch('/api/simulate-outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnId, outcomeType, promiseToPayDate })
      });
      fetchData();
    } catch (err) {
      console.error('Simulate outcome error:', err);
    }
  };

  // Handle Open Inspection Drawer
  const handleInspectTransaction = async (txn) => {
    try {
      const res = await fetch(`/api/audit-logs?txnId=${txn.id}`);
      const data = await res.json();
      setAuditLogs(data.logs || []);
      setInspectedTxn(txn);
    } catch (err) {
      console.error('Inspect error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Top Header */}
      <Header isSimulating={isSimulating} onReset={handleReset} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        
        {/* Top View Mode Switcher Pills */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-fit">
          <button
            onClick={() => setActiveMainTab('analytics')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all ${
              activeMainTab === 'analytics'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Analytics & Operations</span>
          </button>

          <button
            onClick={() => setActiveMainTab('workflows')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all ${
              activeMainTab === 'workflows'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Interactive Workflows</span>
          </button>
        </div>

        {/* --- MAIN TAB 1: ANALYTICS --- */}
        {activeMainTab === 'analytics' && (
          <div className="space-y-6">
            {/* KPI Metrics Banner */}
            <KPICards metrics={metrics} />

            {/* Controls & Department Switcher */}
            <ControlsBar
              merchants={merchants}
              selectedMerchant={selectedMerchant}
              onSelectMerchant={setSelectedMerchant}
              onRunSimulation={handleRunSimulation}
              isSimulating={isSimulating}
              statusFilter={statusFilter}
              onSelectStatusFilter={setStatusFilter}
            />

            {/* Analytics Charts */}
            <AnalyticsCharts transactions={transactions} merchants={merchants} />

            {/* Main Animated Transaction Cards Grid */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">
                Active Multi-Merchant Transactions ({transactions.length})
              </h2>
              <span className="text-xs text-slate-400">High-value transactions (≥ ₹50,000) require Human Approval</span>
            </div>

            <TransactionGrid
              transactions={transactions}
              onInspectTransaction={handleInspectTransaction}
              onOpenMobileSimulator={setSimulatingTxn}
              onApproveHumanAction={handleApproveHumanAction}
            />
          </div>
        )}

        {/* --- MAIN TAB 2: INTERACTIVE WORKFLOWS --- */}
        {activeMainTab === 'workflows' && (
          <WorkflowsTab onSimulateOutcome={handleSimulateOutcome} />
        )}

      </main>

      {/* Slide-over Inspector Drawer */}
      {inspectedTxn && (
        <InspectorDrawer
          txn={inspectedTxn}
          logs={auditLogs}
          onClose={() => setInspectedTxn(null)}
        />
      )}

      {/* Try-It-Yourself Interactive Mobile View */}
      {simulatingTxn && (
        <CustomerSimulatorModal
          txn={simulatingTxn}
          onClose={() => setSimulatingTxn(null)}
          onSimulateOutcome={handleSimulateOutcome}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        Buildathon Track 03: AI Revenue Recovery Platform • Integrated with Razorpay APIs & Gemini AI
      </footer>

    </div>
  );
}
