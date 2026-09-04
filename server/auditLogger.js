import { addAuditLog, getAuditLogs, resetDatabase } from './db.js';

class AuditLogger {
  /**
   * Log an audit event to SQLite DB
   */
  async logEvent({ txnId, merchantName, eventType, detail, actor = 'RevRecover AI Agent', payload = {} }) {
    let merchantId = payload.merchantId;
    if (!merchantId) {
      if ((txnId && txnId.includes('D2C')) || (merchantName && merchantName.toLowerCase().includes('techgear'))) {
        merchantId = 'mch_d2c_01';
      } else if ((txnId && txnId.includes('SAAS')) || (merchantName && merchantName.toLowerCase().includes('saas'))) {
        merchantId = 'mch_saas_02';
      } else if ((txnId && txnId.includes('B2B')) || (merchantName && merchantName.toLowerCase().includes('nexus'))) {
        merchantId = 'mch_b2b_03';
      }
    }

    const updatedPayload = { ...payload, merchantId };

    const logEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      txnId,
      merchantName: merchantName || (merchantId === 'mch_d2c_01' ? 'TechGear India' : merchantId === 'mch_saas_02' ? 'SaaSify Cloud' : 'Nexus Logistics'),
      eventType,
      detail,
      actor,
      payload: updatedPayload
    };

    try {
      await addAuditLog(logEntry);
    } catch (err) {
      console.error('[AUDIT DB ERROR]', err);
    }
    console.log(`[AUDIT LOG] [${logEntry.timestamp}] [${txnId}] ${eventType}: ${detail}`);
    return logEntry;
  }

  /**
   * Get all logs from SQLite DB, optionally filtered by transaction ID or merchant
   */
  async getLogs(txnId = null, merchantId = null) {
    try {
      return await getAuditLogs(txnId, merchantId);
    } catch (err) {
      console.error('[AUDIT GET ERROR]', err);
      return [];
    }
  }

  /**
   * Clear logs
   */
  async clear() {
    // Handled in db reset
  }
}

export const auditLogger = new AuditLogger();
