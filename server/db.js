import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { INITIAL_TRANSACTIONS } from './mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'revrecover.db');
const verboseSqlite = sqlite3.verbose();
const db = new verboseSqlite.Database(dbPath);

// Promisified DB helpers
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper to deserialize JSON fields from rows
function parseTxnRow(row) {
  if (!row) return null;
  return {
    ...row,
    optOut: Boolean(row.optOut),
    highValueApproved: Boolean(row.highValueApproved),
    diagnosis: row.diagnosis ? JSON.parse(row.diagnosis) : null,
    actionPayload: row.actionPayload ? JSON.parse(row.actionPayload) : null
  };
}

// Helper to deserialize JSON fields from audit log rows
function parseLogRow(row) {
  if (!row) return null;
  return {
    ...row,
    payload: row.payload ? JSON.parse(row.payload) : {}
  };
}

// Initialize Database Schema & Initial Seed Data
export async function initDb() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      merchantId TEXT,
      merchantName TEXT,
      customerName TEXT,
      customerEmail TEXT,
      customerPhone TEXT,
      amount INTEGER,
      failureReason TEXT,
      failureTimestamp TEXT,
      itemDescription TEXT,
      attemptsCount INTEGER DEFAULT 0,
      optOut INTEGER DEFAULT 0,
      promiseToPayDate TEXT,
      highValueApproved INTEGER DEFAULT 0,
      status TEXT,
      recoveredAmount INTEGER DEFAULT 0,
      recoveredAt TEXT,
      diagnosis TEXT,
      razorpayLink TEXT,
      razorpayLinkId TEXT,
      actionPayload TEXT,
      guardrailReason TEXT
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      txnId TEXT,
      merchantName TEXT,
      eventType TEXT,
      detail TEXT,
      actor TEXT,
      payload TEXT
    )
  `);

  // Seed initial data if empty
  const countRow = await getOne('SELECT COUNT(*) as count FROM transactions');
  if (countRow.count === 0) {
    console.log('📦 Seeding initial live database records into SQLite (revrecover.db)...');
    for (const txn of INITIAL_TRANSACTIONS) {
      await insertTransaction(txn);
    }
  }
}

// Database Operations
export async function insertTransaction(txn) {
  const sql = `
    INSERT OR REPLACE INTO transactions (
      id, merchantId, merchantName, customerName, customerEmail, customerPhone,
      amount, failureReason, failureTimestamp, itemDescription, attemptsCount,
      optOut, promiseToPayDate, highValueApproved, status, recoveredAmount,
      recoveredAt, diagnosis, razorpayLink, razorpayLinkId, actionPayload, guardrailReason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    txn.id,
    txn.merchantId || 'd2c',
    txn.merchantName || 'TechGear India',
    txn.customerName || 'Kavin',
    txn.customerEmail || 'kavin@example.com',
    txn.customerPhone || '+919876543210',
    txn.amount || 0,
    txn.failureReason || 'USER_ABANDONED',
    txn.failureTimestamp || new Date().toISOString(),
    txn.itemDescription || 'Product Purchase',
    txn.attemptsCount || 0,
    txn.optOut ? 1 : 0,
    txn.promiseToPayDate || null,
    txn.highValueApproved ? 1 : 0,
    txn.status || 'FAILED_AT_RISK',
    txn.recoveredAmount || 0,
    txn.recoveredAt || null,
    txn.diagnosis ? JSON.stringify(txn.diagnosis) : null,
    txn.razorpayLink || null,
    txn.razorpayLinkId || null,
    txn.actionPayload ? JSON.stringify(txn.actionPayload) : null,
    txn.guardrailReason || null
  ];
  await runQuery(sql, params);
  return await getTransactionById(txn.id);
}

export async function getTransactions(merchantId = null, status = null) {
  let sql = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];
  if (merchantId && merchantId !== 'all') {
    sql += ' AND merchantId = ?';
    params.push(merchantId);
  }
  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY failureTimestamp DESC';
  const rows = await getAll(sql, params);
  return rows.map(parseTxnRow);
}

export async function getTransactionById(id) {
  const row = await getOne('SELECT * FROM transactions WHERE id = ?', [id]);
  return parseTxnRow(row);
}

export async function updateTransaction(txn) {
  return await insertTransaction(txn);
}

export async function addAuditLog(logEntry) {
  const sql = `
    INSERT INTO audit_logs (id, timestamp, txnId, merchantName, eventType, detail, actor, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    logEntry.id,
    logEntry.timestamp,
    logEntry.txnId,
    logEntry.merchantName,
    logEntry.eventType,
    logEntry.detail,
    logEntry.actor || 'RevRecover AI Agent',
    logEntry.payload ? JSON.stringify(logEntry.payload) : '{}'
  ];
  await runQuery(sql, params);
  return logEntry;
}

export async function getAuditLogs(txnId = null, merchantId = null) {
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];
  if (txnId) {
    sql += ' AND txnId = ?';
    params.push(txnId);
  }
  sql += ' ORDER BY timestamp DESC';
  const rows = await getAll(sql, params);
  const logs = rows.map(parseLogRow);
  if (merchantId && merchantId !== 'all') {
    return logs.filter(l => matchesMerchant(l, merchantId));
  }
  return logs;
}

function matchesMerchant(log, merchantFilter) {
  if (!merchantFilter || merchantFilter === 'all') return true;
  
  const mId = (merchantFilter || '').toLowerCase();
  const logTxnId = (log.txnId || '').toUpperCase();
  const logMerchantName = (log.merchantName || '').toLowerCase();
  const payloadMerchantId = (log.payload?.merchantId || '').toLowerCase();

  if (mId === 'mch_d2c_01' || mId === 'd2c') {
    return (
      logTxnId.includes('D2C') ||
      logMerchantName.includes('techgear') ||
      logMerchantName.includes('d2c') ||
      payloadMerchantId === 'mch_d2c_01' ||
      payloadMerchantId === 'd2c'
    );
  }

  if (mId === 'mch_saas_02' || mId === 'saas') {
    return (
      logTxnId.includes('SAAS') ||
      logMerchantName.includes('saas') ||
      logMerchantName.includes('saasify') ||
      payloadMerchantId === 'mch_saas_02' ||
      payloadMerchantId === 'saas'
    );
  }

  if (mId === 'mch_b2b_03' || mId === 'b2b') {
    return (
      logTxnId.includes('B2B') ||
      logMerchantName.includes('nexus') ||
      logMerchantName.includes('logistics') ||
      logMerchantName.includes('b2b') ||
      payloadMerchantId === 'mch_b2b_03' ||
      payloadMerchantId === 'b2b'
    );
  }

  return (
    payloadMerchantId === mId ||
    logMerchantName.includes(mId) ||
    logTxnId.includes(mId.toUpperCase())
  );
}

export async function resetDatabase() {
  await runQuery('DELETE FROM transactions');
  await runQuery('DELETE FROM audit_logs');
  console.log('🔄 SQLite Database wiped. Reseeding baseline transactions...');
  for (const txn of INITIAL_TRANSACTIONS) {
    await insertTransaction(txn);
  }
}

export async function calculateMetrics(merchantId = null) {
  const txns = await getTransactions(merchantId);
  const totalAtRisk = txns.reduce((sum, t) => sum + t.amount, 0);
  const totalRecovered = txns
    .filter(t => t.status === 'RECOVERED')
    .reduce((sum, t) => sum + (t.recoveredAmount || t.amount), 0);
  const recoveryRate = totalAtRisk > 0 ? ((totalRecovered / totalAtRisk) * 100).toFixed(1) : 0;
  
  const statusCounts = txns.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return {
    totalAtRisk,
    totalRecovered,
    recoveryRate: Number(recoveryRate),
    activeCount: txns.length,
    statusCounts,
    hoursSaved: Math.round(txns.length * 4.5),
    roiMultiplier: '14.2x'
  };
}
