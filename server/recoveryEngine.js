import { razorpayService } from './razorpayClient.js';
import { aiDiagnosticAgent } from './aiDiagnosticAgent.js';
import { complianceGuardrails } from './complianceGuardrails.js';
import { auditLogger } from './auditLogger.js';
import { updateTransaction } from './db.js';

class RecoveryEngine {
  /**
   * Process a single transaction through the AI recovery pipeline
   */
  async processTransaction(txn) {
    // Step 1: Log Detection Event
    await auditLogger.logEvent({
      txnId: txn.id,
      merchantName: txn.merchantName,
      eventType: 'TRANSACTION_DETECTED',
      detail: `Payment failure detected (${txn.failureReason}). Amount at risk: ₹${txn.amount}`,
      payload: { merchantId: txn.merchantId, amount: txn.amount }
    });

    // Step 2: AI Root Cause Diagnosis
    const diagnosis = await aiDiagnosticAgent.diagnoseTransaction(txn);
    txn.diagnosis = diagnosis;
    txn.status = 'DIAGNOSED';
    await updateTransaction(txn);

    await auditLogger.logEvent({
      txnId: txn.id,
      merchantName: txn.merchantName,
      eventType: 'AI_DIAGNOSIS_COMPLETED',
      detail: `Root Cause: ${diagnosis.rootCauseSummary} Strategy: ${diagnosis.recommendedAction}`,
      payload: { diagnosis }
    });

    // Step 3: Validate Compliance Guardrails
    const compliance = complianceGuardrails.validateCompliance(txn);
    if (!compliance.isAllowed) {
      if (compliance.ruleTriggered === 'REQUIRES_HUMAN_APPROVAL') {
        txn.status = 'PAUSED_HUMAN_APPROVAL';
      } else if (compliance.ruleTriggered === 'PROMISE_TO_PAY_ACTIVE') {
        txn.status = 'PAUSED_P2P';
      } else {
        txn.status = 'STOPPED_GUARDRAIL';
      }
      txn.guardrailReason = compliance.reason;
      await updateTransaction(txn);

      await auditLogger.logEvent({
        txnId: txn.id,
        merchantName: txn.merchantName,
        eventType: 'GUARDRAIL_TRIGGERED',
        detail: compliance.reason,
        payload: { compliance }
      });

      return { txn, success: false, reason: compliance.reason };
    }

    // Step 4: Generate Real Razorpay Payment Link
    const razorpayLink = await razorpayService.createPaymentLink({
      amount: txn.amount,
      description: `Recovery: ${txn.itemDescription} (${txn.merchantName})`,
      customer: {
        name: txn.customerName,
        email: txn.customerEmail,
        phone: txn.customerPhone
      },
      reference_id: `recov_${txn.id}_${Date.now()}`
    });

    txn.razorpayLink = razorpayLink.short_url;
    txn.razorpayLinkId = razorpayLink.id;
    txn.attemptsCount += 1;

    // Step 5: Execute Bounded Recovery Action
    let actionPayload = {};
    if (diagnosis.recommendedAction === 'WHATSAPP_NUDGE_LINK') {
      actionPayload = {
        channel: 'WhatsApp',
        recipient: txn.customerPhone,
        message: `${diagnosis.personalizedMessage} ${txn.razorpayLink}`,
        discountApplied: diagnosis.incentiveOffered
      };
      txn.status = 'ACTION_SENT_NUDGE';
    } else if (diagnosis.recommendedAction === 'SMART_MANDATE_RETRY') {
      actionPayload = {
        channel: 'Autopay Retry Sequencer',
        recipient: txn.customerEmail,
        message: `Autopay scheduled for salary date (1st of Month). Update billing method link: ${txn.razorpayLink}`,
        scheduledDate: '2026-09-05'
      };
      txn.status = 'ACTION_SENT_RETRY';
    } else {
      actionPayload = {
        channel: 'Promise-to-Pay Invoice Chaser',
        recipient: txn.customerEmail,
        message: `Overdue Invoice #${txn.id}. Pay online: ${txn.razorpayLink} or submit Promise-to-Pay date.`,
        invoiceId: txn.id
      };
      txn.status = 'ACTION_SENT_P2P';
    }

    txn.actionPayload = actionPayload;
    await updateTransaction(txn);

    await auditLogger.logEvent({
      txnId: txn.id,
      merchantName: txn.merchantName,
      eventType: 'RECOVERY_ACTION_EXECUTED',
      detail: `Executed ${actionPayload.channel} action. Payment Link: ${txn.razorpayLink}`,
      payload: { actionPayload, linkId: razorpayLink.id }
    });

    return { txn, success: true };
  }

  /**
   * Human Finance Manager approves high-value transaction action
   */
  async approveHumanAction(txn) {
    complianceGuardrails.approveHighValue(txn.id);

    await auditLogger.logEvent({
      txnId: txn.id,
      merchantName: txn.merchantName,
      eventType: 'HUMAN_APPROVAL_GRANTED',
      detail: `HUMAN AUTHORIZATION GRANTED by Finance Manager for ₹${txn.amount.toLocaleString('en-IN')}. Proceeding with AI recovery action.`,
      actor: 'Human Finance Manager',
      payload: { amount: txn.amount }
    });

    return await this.processTransaction(txn);
  }

  /**
   * Simulate customer payment completion or Promise-to-Pay commitment
   */
  async simulateOutcome(txn, outcomeType, p2pDate = null) {
    if (outcomeType === 'RECOVERED') {
      txn.status = 'RECOVERED';
      txn.recoveredAmount = txn.amount;
      txn.recoveredAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

      await auditLogger.logEvent({
        txnId: txn.id,
        merchantName: txn.merchantName,
        eventType: 'MONEY_RECOVERED',
        detail: `SUCCESS! Customer completed payment via Razorpay. ₹${txn.amount.toLocaleString('en-IN')} RECOVERED!`,
        actor: 'Customer Action',
        payload: { amount: txn.amount, razorpayLinkId: txn.razorpayLinkId }
      });
    } else if (outcomeType === 'PROMISE_TO_PAY') {
      txn.status = 'PAUSED_P2P';
      txn.promiseToPayDate = p2pDate || '2026-09-12';

      await auditLogger.logEvent({
        txnId: txn.id,
        merchantName: txn.merchantName,
        eventType: 'PROMISE_TO_PAY_LOGGED',
        detail: `Client accounts team logged Promise-to-Pay commitment for ${txn.promiseToPayDate}. Automated nudges paused.`,
        actor: 'Client Accounts Team',
        payload: { promiseToPayDate: txn.promiseToPayDate }
      });
    } else if (outcomeType === 'OPT_OUT') {
      txn.status = 'STOPPED_GUARDRAIL';
      txn.optOut = true;
      complianceGuardrails.addOptOut(txn.customerEmail);

      await auditLogger.logEvent({
        txnId: txn.id,
        merchantName: txn.merchantName,
        eventType: 'CUSTOMER_OPT_OUT',
        detail: `Customer requested DNC / opt-out. Future nudges permanently blocked.`,
        actor: 'Customer Action',
        payload: { customerEmail: txn.customerEmail }
      });
    }

    await updateTransaction(txn);
    return txn;
  }
}

export const recoveryEngine = new RecoveryEngine();
