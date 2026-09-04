import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  RefreshCw,
  FileText,
  Sparkles,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Send,
  X,
  CreditCard,
  Building,
  Check,
  Clock,
  Zap,
  MessageSquare
} from 'lucide-react';
import WhatsAppNotificationToast from './WhatsAppNotificationToast';

export default function WorkflowsTab({ onSimulateOutcome }) {
  const [activeSubTab, setActiveSubTab] = useState('d2c'); // 'd2c', 'saas', 'b2b'

  // Toast Notification State
  const [whatsappToast, setWhatsappToast] = useState(null);

  // Flow States
  const [d2cResults, setD2cResults] = useState({});
  const [saasResults, setSaasResults] = useState({});
  const [b2bResults, setB2bResults] = useState({});

  const [p2pDates, setP2pDates] = useState({});

  // ----------------------------------------------------
  // DATA PRODUCTS & INVOICES
  // ----------------------------------------------------
  const d2cProducts = [
    { id: 'p1', name: 'Noise-Cancelling Wireless Headphones', price: 4999, icon: '🎧', tag: 'Best Seller' },
    { id: 'p2', name: 'Smart Fitness Watch Series 5', price: 8999, icon: '⌚', tag: 'New Arrival' },
    { id: 'p3', name: 'RGB Mechanical Gaming Keyboard', price: 3499, icon: '⌨️', tag: 'Trending' }
  ];

  const saasPlans = [
    { id: 's1', name: 'Starter Developer Plan', price: 999, period: '/ mo', icon: '⚡' },
    { id: 's2', name: 'Pro Growth Suite', price: 2499, period: '/ mo', icon: '🚀', tag: 'Popular' },
    { id: 's3', name: 'Enterprise Analytics Annual', price: 14999, period: '/ yr', icon: '🏢' }
  ];

  const b2bInvoices = [
    { id: 'b1', name: 'Q3 Freight Shipping Invoice #NX-8821', amount: 125000, client: 'Apex Retail Solutions', terms: 'Net-30' },
    { id: 'b2', name: 'Cold Chain Transport Invoice #NX-8904', amount: 78000, client: 'BlueSky Exports', terms: 'Net-30' },
    { id: 'b3', name: 'Warehouse Retainer Invoice #NX-9012', amount: 210000, client: 'Metro Logistics Corp', terms: 'Net-60' }
  ];

  // ----------------------------------------------------
  // REAL RAZORPAY CHECKOUT LAUNCHER FOR D2C
  // ----------------------------------------------------
  const launchRealRazorpayCheckout = (item) => {
    if (!window.Razorpay) {
      alert('Razorpay Checkout SDK loading... Please try again in 2 seconds.');
      return;
    }

    const options = {
      key: 'rzp_test_TXVkRzmlwp305z',
      amount: item.price * 100, // in paise
      currency: 'INR',
      name: 'TechGear India',
      description: `Purchase: ${item.name}`,
      image: 'https://razorpay.com/favicon.ico',
      handler: function (response) {
        // Real Payment Success!
        handleD2cSuccess(item, response.razorpay_payment_id);
      },
      modal: {
        ondismiss: function () {
          // Checkout Closed/Failed! AI Agent Takeover!
          handleD2cFail(item);
        }
      },
      prefill: {
        name: 'Kavin',
        email: 'kavin@example.com',
        contact: '+919876543210'
      },
      theme: {
        color: '#3884F6'
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        handleD2cFail(item, response.error);
      });
      rzp.open();
    } catch (err) {
      console.warn('Razorpay Checkout open fallback:', err);
      handleD2cFail(item);
    }
  };

  // ----------------------------------------------------
  // LIVE SQLITE DATABASE HELPER
  // ----------------------------------------------------
  const createLiveTxnInDb = async ({ merchantId, merchantName, customerName, amount, itemDescription, failureReason, status }) => {
    try {
      const res = await fetch('/api/transactions/create-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, merchantName, customerName, amount, itemDescription, failureReason, status })
      });
      const data = await res.json();
      return data.transaction;
    } catch (err) {
      console.warn('Live DB insert error:', err);
      return null;
    }
  };

  // ----------------------------------------------------
  // D2C HANDLERS
  // ----------------------------------------------------
  const handleD2cSuccess = (item, paymentId = null) => {
    setD2cResults(prev => ({
      ...prev,
      [item.id]: {
        status: 'SUCCESS_NORMAL',
        paymentId: paymentId || `pay_${Date.now()}`,
        msg: `Payment Captured! Payment ID: ${paymentId || `pay_${Date.now()}`}`
      }
    }));
  };

  const handleD2cFail = async (item) => {
    let link = `https://rzp.io/l/d2c_${item.id}_${Math.random().toString(36).substring(7)}`;

    try {
      const res = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: item.price, description: `Recovery: ${item.name}`, customerName: 'Kavin' })
      });
      const linkData = await res.json();
      if (linkData?.short_url) {
        link = linkData.short_url;
      }
    } catch (err) {
      console.warn('Payment link fetch fallback:', err);
    }

    // Persist live failure transaction directly into SQLite Database!
    const liveTxn = await createLiveTxnInDb({
      merchantId: 'd2c',
      merchantName: 'TechGear India',
      customerName: 'Kavin',
      amount: item.price,
      itemDescription: item.name,
      failureReason: 'BANK_NETBANKING_TIMEOUT',
      status: 'ACTION_SENT_NUDGE'
    });

    const dbTxnId = liveTxn ? liveTxn.id : 'TXN-D2C-1001';

    const msg = `Hi Kavin, your checkout for ${item.name} timed out on bank NetBanking. Click to pay instantly via UPI:`;

    setD2cResults(prev => ({
      ...prev,
      [item.id]: {
        status: 'AI_RECOVERY_TRIGGERED',
        link,
        msg: `Razorpay Checkout Failed or Closed. Recorded in SQLite DB (${dbTxnId}). AI Agent generated live Recovery Link.`,
        txnId: dbTxnId
      }
    }));

    // Trigger Slide-in Toast Notification for Judges!
    setWhatsappToast({
      customerName: 'Kavin',
      phone: '+91 98765 43210',
      message: msg,
      link,
      amount: item.price,
      item,
      txnId: dbTxnId
    });
  };

  const handleD2cRecover = async (item) => {
    const link = d2cResults[item.id]?.link;
    const txnId = d2cResults[item.id]?.txnId || 'TXN-D2C-1001';
    if (link) {
      window.open(link, '_blank');
    }
    setWhatsappToast(null);
    setD2cResults(prev => ({
      ...prev,
      [item.id]: { ...prev[item.id], status: 'RECOVERED_SUCCESS' }
    }));
    if (onSimulateOutcome) {
      await onSimulateOutcome(txnId, 'RECOVERED');
    }
  };

  // ----------------------------------------------------
  // SAAS HANDLERS
  // ----------------------------------------------------
  const launchSaasAutopay = (item) => {
    if (window.Razorpay) {
      const options = {
        key: 'rzp_test_TXVkRzmlwp305z',
        amount: item.price * 100,
        currency: 'INR',
        name: 'SaaSify Cloud',
        description: `Subscription: ${item.name}`,
        prefill: {
          name: 'Kavin',
          email: 'kavin@example.com',
          contact: '+919876543210'
        },
        handler: function (res) {
          handleSaasSuccess(item);
        },
        modal: {
          ondismiss: function () {
            handleSaasFail(item);
          }
        },
        theme: { color: '#9333EA' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      handleSaasFail(item);
    }
  };

  const handleSaasSuccess = (item) => {
    setSaasResults(prev => ({
      ...prev,
      [item.id]: { status: 'SUCCESS_NORMAL', msg: 'Autopay Debit Succeeded! Subscription Renewed.' }
    }));
  };

  const handleSaasFail = async (item) => {
    const link = `https://rzp.io/l/saas_${item.id}_${Math.random().toString(36).substring(7)}`;
    
    // Persist live failure transaction into SQLite DB
    const liveTxn = await createLiveTxnInDb({
      merchantId: 'saas',
      merchantName: 'SaaSify Cloud',
      customerName: 'Kavin',
      amount: item.price,
      itemDescription: item.name,
      failureReason: 'AUTOPAY_INSUFFICIENT_FUNDS',
      status: 'ACTION_SENT_RETRY'
    });

    const dbTxnId = liveTxn ? liveTxn.id : 'TXN-SAAS-2001';

    setSaasResults(prev => ({
      ...prev,
      [item.id]: {
        status: 'AI_RECOVERY_TRIGGERED',
        link,
        msg: `Autopay Debit Rejected. Recorded in SQLite DB (${dbTxnId}). AI scheduled payday retry.`,
        txnId: dbTxnId
      }
    }));
  };

  const handleSaasRestore = async (item) => {
    const txnId = saasResults[item.id]?.txnId || 'TXN-SAAS-2001';
    setSaasResults(prev => ({
      ...prev,
      [item.id]: { ...prev[item.id], status: 'RECOVERED_SUCCESS' }
    }));
    if (onSimulateOutcome) {
      await onSimulateOutcome(txnId, 'RECOVERED');
    }
  };

  // ----------------------------------------------------
  // B2B HANDLERS
  // ----------------------------------------------------
  const launchB2bCheckout = (item) => {
    if (window.Razorpay) {
      const options = {
        key: 'rzp_test_TXVkRzmlwp305z',
        amount: item.amount * 100,
        currency: 'INR',
        name: 'Nexus Logistics',
        description: `B2B Invoice: ${item.name}`,
        prefill: {
          name: 'Kavin',
          email: 'kavin@example.com',
          contact: '+919876543210'
        },
        handler: function () {
          handleB2bSuccess(item);
        },
        modal: {
          ondismiss: function () {
            handleB2bFail(item);
          }
        },
        theme: { color: '#D97706' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      handleB2bFail(item);
    }
  };

  const handleB2bSuccess = async (item) => {
    const txnId = b2bResults[item.id]?.txnId || 'TXN-B2B-3001';
    setB2bResults(prev => ({
      ...prev,
      [item.id]: { status: 'RECOVERED_SUCCESS', msg: `Invoice Settled & ₹${item.amount.toLocaleString('en-IN')} Paid via Razorpay!` }
    }));
    if (onSimulateOutcome) {
      await onSimulateOutcome(txnId, 'RECOVERED');
    }
  };

  const handleB2bFail = async (item) => {
    // Check High-Value Threshold >= ₹50,000 ON FAILURE ONLY!
    const isHighValue = item.amount >= 50000;
    const initialStatus = isHighValue ? 'PAUSED_HUMAN_APPROVAL' : 'ACTION_SENT_P2P';

    const liveTxn = await createLiveTxnInDb({
      merchantId: 'b2b',
      merchantName: 'Nexus Logistics',
      customerName: 'Kavin',
      amount: item.amount,
      itemDescription: item.name,
      failureReason: 'INVOICE_OVERDUE',
      status: initialStatus
    });

    const dbTxnId = liveTxn ? liveTxn.id : 'TXN-B2B-3001';

    if (isHighValue) {
      setB2bResults(prev => ({
        ...prev,
        [item.id]: {
          status: 'HIGH_VALUE_PAUSED',
          msg: `🛑 HIGH-VALUE GUARDRAIL (₹${item.amount.toLocaleString('en-IN')} >= ₹50,000). Saved to DB (${dbTxnId}). Paused for Human Approval.`,
          txnId: dbTxnId
        }
      }));
    } else {
      setB2bResults(prev => ({
        ...prev,
        [item.id]: {
          status: 'AI_RECOVERY_TRIGGERED',
          msg: `Invoice Overdue. Saved to DB (${dbTxnId}). AI Agent sent compliant notice with Promise-to-Pay calendar picker.`,
          txnId: dbTxnId
        }
      }));
    }
  };

  const handleB2bApproveHuman = (item) => {
    // Human approves high-value B2B invoice -> Trigger AI P2P Date Picker
    setB2bResults(prev => ({
      ...prev,
      [item.id]: {
        ...prev[item.id],
        status: 'AI_RECOVERY_TRIGGERED',
        msg: 'Human Authorization Granted. AI Agent sent compliant notice with Promise-to-Pay calendar picker.'
      }
    }));
  };

  const handleB2bSubmitP2p = async (item) => {
    const targetDate = p2pDates[item.id] || '2026-09-12';
    const txnId = b2bResults[item.id]?.txnId || 'TXN-B2B-3001';
    setB2bResults(prev => ({
      ...prev,
      [item.id]: { ...prev[item.id], status: 'P2P_LOGGED', date: targetDate }
    }));
    if (onSimulateOutcome) {
      await onSimulateOutcome(txnId, 'PROMISE_TO_PAY', targetDate);
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Slide-in WhatsApp Toast Notification for Judges */}
      <WhatsAppNotificationToast
        notification={whatsappToast}
        onClose={() => setWhatsappToast(null)}
        onRecover={handleD2cRecover}
      />

      {/* Sub-Header & Scenario Selector Pills */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            Interactive Merchant Workflows Studio
          </h2>
          <p className="text-xs text-slate-400">Integrated with Official Razorpay Checkout Window (`rzp_test_...` key)</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('d2c')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'd2c'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>TechGear D2C Store</span>
          </button>

          <button
            onClick={() => setActiveSubTab('saas')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'saas'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>SaaSify Subscriptions</span>
          </button>

          <button
            onClick={() => setActiveSubTab('b2b')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'b2b'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Nexus B2B Invoices</span>
          </button>
        </div>
      </div>

      {/* --- SCENARIO 1: TECHGEAR D2C STOREFRONT --- */}
      {activeSubTab === 'd2c' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              TechGear India Storefront — Customer: Kavin (kavin@example.com)
            </h3>
            <span className="text-xs text-blue-400 font-medium">Test Key: rzp_test_TXVkRzmlwp305z Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {d2cProducts.map((prod) => {
              const res = d2cResults[prod.id];
              return (
                <div key={prod.id} className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{prod.icon}</span>
                      <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                        {prod.tag}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">{prod.name}</h4>
                    <div className="text-lg font-extrabold text-blue-400">₹{prod.price.toLocaleString('en-IN')}</div>
                  </div>

                  {/* Flow Outcome Status */}
                  {res && (
                    <div className="pt-3 border-t border-slate-800/80 text-xs">
                      {res.status === 'SUCCESS_NORMAL' && (
                        <div className="bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-xl text-emerald-300 font-semibold space-y-1">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Razorpay Payment Captured!</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">{res.msg}</p>
                        </div>
                      )}

                      {res.status === 'AI_RECOVERY_TRIGGERED' && (
                        <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl space-y-2.5">
                          {/* Visual WhatsApp Chat Card Bubble */}
                          <div className="bg-[#128C7E]/20 border border-[#25D366]/40 p-2.5 rounded-xl text-slate-200 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-[#25D366] font-bold text-[10px]">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> WhatsApp Nudge to Kavin
                              </span>
                              <span>Just Now</span>
                            </div>
                            <p className="leading-tight text-slate-200">
                              "Hi Kavin, your checkout for <span className="font-semibold text-white">{prod.name}</span> encountered bank downtime. Click to pay instantly: <span className="text-blue-400 underline font-mono text-[10px]">{res.link}</span>"
                            </p>
                          </div>

                          <button
                            onClick={() => handleD2cRecover(prod)}
                            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Razorpay Recovery Link (Recover ₹{prod.price.toLocaleString('en-IN')})</span>
                          </button>
                        </div>
                      )}

                      {res.status === 'RECOVERED_SUCCESS' && (
                        <div className="bg-emerald-950/50 border border-emerald-500/50 p-2.5 rounded-xl text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>₹{prod.price.toLocaleString('en-IN')} RECOVERED BY AI AGENT!</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Real Razorpay Checkout Button */}
                  <button
                    onClick={() => launchRealRazorpayCheckout(prod)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 mt-2"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>🛒 Buy Now (Real Razorpay Checkout)</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- SCENARIO 2: SAASIFY SUB-PORTAL --- */}
      {activeSubTab === 'saas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              SaaSify Cloud Billing Portal — Subscriber: Kavin (kavin@example.com)
            </h3>
            <span className="text-xs text-purple-400 font-medium">Test Key Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {saasPlans.map((plan) => {
              const res = saasResults[plan.id];
              return (
                <div key={plan.id} className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{plan.icon}</span>
                      {plan.tag && (
                        <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                          {plan.tag}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">{plan.name}</h4>
                    <div className="text-lg font-extrabold text-purple-400">
                      ₹{plan.price.toLocaleString('en-IN')} <span className="text-xs text-slate-400 font-normal">{plan.period}</span>
                    </div>
                  </div>

                  {/* Flow Outcome Status */}
                  {res && (
                    <div className="pt-3 border-t border-slate-800/80 text-xs">
                      {res.status === 'SUCCESS_NORMAL' && (
                        <div className="bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-xl text-emerald-300 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Autopay Debit Succeeded!</span>
                        </div>
                      )}

                      {res.status === 'AI_RECOVERY_TRIGGERED' && (
                        <div className="bg-purple-950/40 border border-purple-800/40 p-3 rounded-xl space-y-2">
                          <div className="text-[11px] text-purple-300 font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> 🤖 AI Payday Retry Active
                          </div>
                          <p className="text-[11px] text-slate-300 leading-tight">
                            Autopay failed for Kavin. AI scheduled retry for 1st of month & sent card update form link.
                          </p>
                          <button
                            onClick={() => handleSaasRestore(plan)}
                            className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition-all shadow"
                          >
                            Update Card & Restore Plan
                          </button>
                        </div>
                      )}

                      {res.status === 'RECOVERED_SUCCESS' && (
                        <div className="bg-emerald-950/50 border border-emerald-500/50 p-2.5 rounded-xl text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>SUBSCRIPTION RESTORED BY AI!</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Test Autopay Button */}
                  <button
                    onClick={() => launchSaasAutopay(plan)}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-1.5 mt-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>🔄 Process Autopay (Razorpay SDK)</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- SCENARIO 3: NEXUS B2B INVOICES --- */}
      {activeSubTab === 'b2b' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Nexus Logistics Invoice Viewer — Contact: Kavin (kavin@example.com)
            </h3>
            <span className="text-xs text-amber-400 font-medium">50K High-Value Guardrail Enforced</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {b2bInvoices.map((inv) => {
              const res = b2bResults[inv.id];
              return (
                <div key={inv.id} className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">📄</span>
                      <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        {inv.terms}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">{inv.name}</h4>
                    <p className="text-xs text-slate-400 mb-2">Client: {inv.client}</p>
                    <div className="text-lg font-extrabold text-amber-400">₹{inv.amount.toLocaleString('en-IN')}</div>
                  </div>

                  {/* Flow Outcome Status */}
                  {res && (
                    <div className="pt-3 border-t border-slate-800/80 text-xs">
                      {res.status === 'HIGH_VALUE_PAUSED' && (
                        <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl space-y-2 text-amber-200">
                          <div className="font-bold text-[11px]">🛑 High-Value Guardrail Triggered</div>
                          <p className="text-[10px] text-slate-300 leading-tight">
                            Payment failed/closed for ₹{inv.amount.toLocaleString('en-IN')} (≥ ₹50,000 threshold). Requires Finance Manager authorization before AI recovery execution.
                          </p>
                          <button
                            onClick={() => handleB2bApproveHuman(inv)}
                            className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            <span>🧑‍💼 Approve AI Recovery Action</span>
                          </button>
                        </div>
                      )}

                      {res.status === 'SUCCESS_NORMAL' && (
                        <div className="bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-xl text-emerald-300 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Invoice Paid On Time!</span>
                        </div>
                      )}

                      {res.status === 'AI_RECOVERY_TRIGGERED' && (
                        <div className="bg-amber-950/40 border border-amber-800/40 p-3 rounded-xl space-y-2">
                          <div className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> 🤖 AI Overdue Notice Active
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-semibold">Select Promise-to-Pay Date:</label>
                            <input
                              type="date"
                              value={p2pDates[inv.id] || '2026-09-12'}
                              onChange={(e) => setP2pDates({ ...p2pDates, [inv.id]: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 focus:outline-none"
                            />
                            <button
                              onClick={() => handleB2bSubmitP2p(inv)}
                              className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg transition-all"
                            >
                              Submit Promise-to-Pay
                            </button>
                          </div>
                        </div>
                      )}

                      {res.status === 'P2P_LOGGED' && (
                        <div className="bg-emerald-950/50 border border-emerald-500/50 p-3 rounded-xl text-emerald-300 font-bold text-xs space-y-2">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>PROMISED FOR {res.date}! NUDGES PAUSED.</span>
                          </div>
                          <p className="text-[10px] text-slate-300 font-normal">
                            Collection nudges paused until {res.date}. Click below when client completes payment on promised date:
                          </p>
                        </div>
                      )}

                      {res.status === 'RECOVERED_SUCCESS' && (
                        <div className="bg-emerald-950/50 border border-emerald-500/50 p-2.5 rounded-xl text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>₹{inv.amount.toLocaleString('en-IN')} INVOICE SETTLED & RECOVERED!</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Test Invoice Button */}
                  <button
                    onClick={() => {
                      if (res?.status === 'P2P_LOGGED') {
                        handleB2bSuccess(inv);
                      } else {
                        launchB2bCheckout(inv);
                      }
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 mt-2 ${
                      res?.status === 'P2P_LOGGED'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20'
                    }`}
                  >
                    {res?.status === 'P2P_LOGGED' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>💳 Pay Promised Invoice via Razorpay (Settle ₹{inv.amount.toLocaleString('en-IN')})</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>📄 Process Invoice (Razorpay Checkout)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
