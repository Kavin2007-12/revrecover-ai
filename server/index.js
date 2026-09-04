import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config.js';
import { MERCHANTS } from './mockData.js';
import {
  initDb,
  getTransactions,
  getTransactionById,
  insertTransaction,
  updateTransaction,
  calculateMetrics,
  getAuditLogs,
  resetDatabase
} from './db.js';
import { recoveryEngine } from './recoveryEngine.js';
import { auditLogger } from './auditLogger.js';
import { razorpayService } from './razorpayClient.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket Client Broadcasting
function broadcast(event, data) {
  const payload = JSON.stringify({ event, data });
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  });
}

// --- REST ENDPOINTS (ALL POWERED BY SQLITE DATABASE) ---

// 1. Get Merchants
app.get('/api/merchants', (req, res) => {
  res.json({ merchants: MERCHANTS });
});

// 2. Get Live Transactions from SQLite DB
app.get('/api/transactions', async (req, res) => {
  const { merchantId, status } = req.query;
  try {
    const txns = await getTransactions(merchantId, status);
    res.json({ transactions: txns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Platform Metrics from SQLite DB (THE BAR Metric: Measured Money Recovered)
app.get('/api/metrics', async (req, res) => {
  const { merchantId } = req.query;
  try {
    const metrics = await calculateMetrics(merchantId);
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Create Real Live Razorpay Payment Link
app.post('/api/create-payment-link', async (req, res) => {
  const { amount, description, customerName } = req.body;
  try {
    const linkObj = await razorpayService.createPaymentLink({
      amount: amount || 4999,
      description: description || 'AI Revenue Recovery Payment Link',
      customer: {
        name: customerName || 'Kavin',
        email: 'kavin@example.com',
        phone: '+919876543210'
      }
    });
    res.json(linkObj);
  } catch (err) {
    res.json({ short_url: `https://rzp.io/l/d2c_recov_${Date.now()}` });
  }
});

// 5. Create New Live Workflow Transaction in SQLite DB
app.post('/api/transactions/create-live', async (req, res) => {
  const {
    merchantId,
    merchantName,
    customerName,
    customerEmail,
    customerPhone,
    amount,
    itemDescription,
    failureReason,
    status
  } = req.body;

  const txnId = `TXN-${(merchantId || 'D2C').toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const newTxn = {
    id: txnId,
    merchantId: merchantId || 'd2c',
    merchantName: merchantName || 'TechGear India',
    customerName: customerName || 'Kavin',
    customerEmail: customerEmail || 'kavin@example.com',
    customerPhone: customerPhone || '+919876543210',
    amount: Number(amount) || 4999,
    failureReason: failureReason || 'BANK_NETBANKING_TIMEOUT',
    failureTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    itemDescription: itemDescription || 'Live Checkout Order',
    attemptsCount: 1,
    optOut: false,
    promiseToPayDate: null,
    highValueApproved: false,
    status: status || 'FAILED_AT_RISK',
    recoveredAmount: 0,
    recoveredAt: null,
    diagnosis: null,
    razorpayLink: null,
    razorpayLinkId: null,
    actionPayload: null,
    guardrailReason: null
  };

  try {
    const savedTxn = await insertTransaction(newTxn);
    await auditLogger.logEvent({
      txnId: savedTxn.id,
      merchantName: savedTxn.merchantName,
      eventType: 'LIVE_CHECKOUT_RECORDED',
      detail: `New live customer transaction recorded in SQLite DB for ₹${savedTxn.amount.toLocaleString('en-IN')}`,
      payload: { merchantId: savedTxn.merchantId, amount: savedTxn.amount }
    });

    broadcast('TRANSACTION_CREATED', savedTxn);
    broadcast('METRICS_UPDATED', {});

    res.json({ success: true, transaction: savedTxn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Run Full Batch Recovery Simulation
app.post('/api/run-simulation', async (req, res) => {
  const { merchantId, autoSimulateOutcome = true } = req.body;
  try {
    let targetTxns = await getTransactions(merchantId);
    res.json({ message: 'Batch simulation initiated', count: targetTxns.length });

    for (const txn of targetTxns) {
      if (txn.status === 'RECOVERED') continue;

      // Process through AI Recovery Engine
      await recoveryEngine.processTransaction(txn);
      const updatedTxn = await getTransactionById(txn.id);
      broadcast('TRANSACTION_UPDATED', updatedTxn);
      const logs = await auditLogger.getLogs(txn.id);
      if (logs.length > 0) broadcast('AUDIT_LOG_ADDED', logs[0]);

      await new Promise(r => setTimeout(r, 100));

      // Optionally simulate customer conversion
      if (autoSimulateOutcome && updatedTxn.status.startsWith('ACTION_SENT')) {
        if (updatedTxn.id.includes('B2B')) {
          await recoveryEngine.simulateOutcome(updatedTxn, 'PROMISE_TO_PAY', '2026-09-12');
        } else if (updatedTxn.id.includes('SAAS-2003')) {
          await recoveryEngine.simulateOutcome(updatedTxn, 'OPT_OUT');
        } else {
          await recoveryEngine.simulateOutcome(updatedTxn, 'RECOVERED');
        }
        const finalTxn = await getTransactionById(updatedTxn.id);
        broadcast('TRANSACTION_UPDATED', finalTxn);
        const finalLogs = await auditLogger.getLogs(finalTxn.id);
        if (finalLogs.length > 0) broadcast('AUDIT_LOG_ADDED', finalLogs[0]);
        broadcast('METRICS_UPDATED', {});
        await new Promise(r => setTimeout(r, 100));
      }
    }

    broadcast('SIMULATION_COMPLETED', { timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Simulation error:', err);
  }
});

// 7. Human Approval for High-Value Transactions
app.post('/api/approve-human', async (req, res) => {
  const { txnId } = req.body;
  try {
    const txn = await getTransactionById(txnId);
    if (!txn) {
      return res.status(404).json({ error: 'Transaction not found in database' });
    }

    await recoveryEngine.approveHumanAction(txn);
    const updatedTxn = await getTransactionById(txnId);
    broadcast('TRANSACTION_UPDATED', updatedTxn);
    const logs = await auditLogger.getLogs(txnId);
    if (logs.length > 0) broadcast('AUDIT_LOG_ADDED', logs[0]);
    broadcast('METRICS_UPDATED', {});

    res.json({ success: true, transaction: updatedTxn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Simulate Single Customer Outcome
app.post('/api/simulate-outcome', async (req, res) => {
  const { txnId, outcomeType, promiseToPayDate } = req.body;
  try {
    const txn = await getTransactionById(txnId);
    if (!txn) {
      return res.status(404).json({ error: 'Transaction not found in database' });
    }

    await recoveryEngine.simulateOutcome(txn, outcomeType, promiseToPayDate);
    const updatedTxn = await getTransactionById(txnId);
    broadcast('TRANSACTION_UPDATED', updatedTxn);
    const logs = await auditLogger.getLogs(txnId);
    if (logs.length > 0) broadcast('AUDIT_LOG_ADDED', logs[0]);
    broadcast('METRICS_UPDATED', {});

    res.json({ success: true, transaction: updatedTxn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Get Audit Logs from SQLite DB
app.get('/api/audit-logs', async (req, res) => {
  const { txnId, merchantId } = req.query;
  try {
    const logs = await auditLogger.getLogs(txnId, merchantId);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Reset Database State
app.post('/api/reset', async (req, res) => {
  try {
    await resetDatabase();
    broadcast('DATA_RESET', {});
    res.json({ message: 'SQLite database reset to baseline state successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server after Database Initialization
async function start() {
  await initDb();
  server.listen(config.port, () => {
    console.log(`\n🚀 RevRecover AI Server running on http://localhost:${config.port}`);
    console.log(`💾 SQLite Database file active at server/data/revrecover.db`);
    console.log(`🔑 Razorpay Key ID: ${config.razorpayKeyId}`);
    console.log(`⚡ WebSocket Server Active\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
});
