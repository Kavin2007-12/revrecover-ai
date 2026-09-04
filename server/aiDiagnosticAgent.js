import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';

class AIDiagnosticAgent {
  constructor() {
    if (config.geminiApiKey) {
      const genAI = new GoogleGenerativeAI(config.geminiApiKey);
      this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.hasGemini = true;
      console.log('🤖 Gemini AI Engine initialized for Root Cause Diagnosis.');
    } else {
      this.hasGemini = false;
      console.log('💡 Using Intelligent Rule-Based Diagnostic Engine (Gemini fallback mode).');
    }
  }

  /**
   * Diagnose transaction failure and determine optimal intervention strategy
   */
  async diagnoseTransaction(txn) {
    const defaultDiagnosis = this.heuristicDiagnosis(txn);

    if (!this.hasGemini) {
      return defaultDiagnosis;
    }

    try {
      const prompt = `
You are RevRecover AI, an expert payment recovery diagnostic agent for Razorpay.
Analyze this payment failure and recommend the optimal recovery strategy.

Transaction Details:
- Merchant: ${txn.merchantName} (${txn.category})
- Customer: ${txn.customerName}
- Amount: ₹${txn.amount}
- Item: ${txn.itemDescription}
- Failure Reason: ${txn.failureReason}
- Failure Detail: ${txn.failureDetail}

Respond ONLY with a valid JSON object matching this schema:
{
  "category": "TECHNICAL_GATEWAY" | "CUSTOMER_FINANCIAL" | "PRICE_FRICTION" | "INVOICE_OVERDUE",
  "rootCauseSummary": "Clear, concise 1-sentence plain-English explanation of why this payment failed.",
  "recommendedAction": "WHATSAPP_NUDGE_LINK" | "SMART_MANDATE_RETRY" | "B2B_PROMISE_TO_PAY_CHASER",
  "incentiveOffered": "None" | "5% Instant Discount" | "Free Express Shipping" | "Payday Staggered Retry",
  "confidenceScore": 0.95,
  "personalizedMessage": "Contextual message text to be delivered via WhatsApp/Email/SMS to the customer"
}
`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleanedJson = text.replace(/```json|```/g, '').trim();
      const aiResponse = JSON.parse(cleanedJson);

      return {
        ...defaultDiagnosis,
        ...aiResponse,
        diagnosticSource: 'Gemini 1.5 Flash'
      };
    } catch (err) {
      console.warn('Gemini diagnosis fallback:', err.message);
      return defaultDiagnosis;
    }
  }

  /**
   * Rule-based fallback diagnosis
   */
  heuristicDiagnosis(txn) {
    const reason = txn.failureReason;
    const category = txn.category;

    if (reason.includes('TIMED_OUT') || reason.includes('SERVER_DOWN')) {
      return {
        category: 'TECHNICAL_GATEWAY',
        rootCauseSummary: `Bank payment gateway (${txn.failureDetail.split(' ')[0]}) suffered a temporary network timeout during authentication.`,
        recommendedAction: 'WHATSAPP_NUDGE_LINK',
        incentiveOffered: 'Instant UPI Intent Link (Skip Bank NetBanking)',
        confidenceScore: 0.96,
        personalizedMessage: `Hi ${txn.customerName}, we noticed your payment of ₹${txn.amount} for ${txn.itemDescription} encountered a bank server timeout. Click here to complete instantly via UPI: `,
        diagnosticSource: 'Diagnostic Heuristics Engine'
      };
    }

    if (reason.includes('PRICE_HESITATION') || reason.includes('ABANDONED')) {
      return {
        category: 'PRICE_FRICTION',
        rootCauseSummary: `Customer hesitated on the final checkout screen. High intent detected without technical block.`,
        recommendedAction: 'WHATSAPP_NUDGE_LINK',
        incentiveOffered: '5% Instant Coupon Applied',
        confidenceScore: 0.92,
        personalizedMessage: `Hi ${txn.customerName}, your cart for ${txn.itemDescription} is reserved! Complete your order now and enjoy an instant 5% coupon code: `,
        diagnosticSource: 'Diagnostic Heuristics Engine'
      };
    }

    if (reason.includes('INSUFFICIENT_FUNDS') || reason.includes('EXPIRED_CREDIT_CARD') || reason.includes('MANDATE')) {
      return {
        category: 'CUSTOMER_FINANCIAL',
        rootCauseSummary: reason.includes('EXPIRED')
          ? `Card on file for Autopay recurring mandate expired.`
          : `UPI Autopay mandate debit failed due to temporary insufficient funds prior to month-end salary.`,
        recommendedAction: 'SMART_MANDATE_RETRY',
        incentiveOffered: 'Scheduled Payday Retry (1st of Month) + Self-Serve Card Update',
        confidenceScore: 0.94,
        personalizedMessage: `Hi ${txn.customerName}, your recurring subscription of ₹${txn.amount} for ${txn.itemDescription} failed. Update your card or schedule retry: `,
        diagnosticSource: 'Diagnostic Heuristics Engine'
      };
    }

    // Default B2B invoice case
    return {
      category: 'INVOICE_OVERDUE',
      rootCauseSummary: `B2B invoice #${txn.id} is past due date. Accounts team requires vendor PO confirmation and payment terms alignment.`,
      recommendedAction: 'B2B_PROMISE_TO_PAY_CHASER',
      incentiveOffered: 'Promise-to-Pay (P2P) Flexible Schedule',
      confidenceScore: 0.98,
      personalizedMessage: `Dear ${txn.customerName} Finance Team, Invoice #${txn.id} (₹${txn.amount}) for ${txn.itemDescription} is currently overdue. Select a Promise-to-Pay date to pause automated notices: `,
      diagnosticSource: 'Diagnostic Heuristics Engine'
    };
  }
}

export const aiDiagnosticAgent = new AIDiagnosticAgent();
