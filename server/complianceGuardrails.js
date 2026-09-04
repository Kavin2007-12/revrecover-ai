class ComplianceGuardrailsEngine {
  constructor() {
    this.optOutList = new Set();
    this.highValueThreshold = 50000; // ₹50,000 (50K) threshold for human approval
    this.approvedTransactions = new Set(); // Approved high-value transaction IDs
  }

  /**
   * Validate whether an action is compliant and permitted to execute
   */
  validateCompliance(txn) {
    // 1. Opt-Out Guardrail
    if (txn.optOut || this.optOutList.has(txn.customerEmail) || this.optOutList.has(txn.customerPhone)) {
      return {
        isAllowed: false,
        reason: 'STOP: Customer has explicitly opted out of recovery communications.',
        ruleTriggered: 'OPT_OUT_RESPECTED'
      };
    }

    // 2. Max Contact Attempts Guardrail
    if (txn.attemptsCount >= txn.maxAttemptsAllowed) {
      return {
        isAllowed: false,
        reason: `STOP: Maximum allowed contact attempts (${txn.maxAttemptsAllowed}) reached. Escalating to Human Finance Handoff.`,
        ruleTriggered: 'MAX_ATTEMPTS_EXCEEDED'
      };
    }

    // 3. Promise-to-Pay (P2P) Active Lock Guardrail
    if (txn.promiseToPayDate) {
      const p2pDate = new Date(txn.promiseToPayDate);
      const now = new Date();
      if (p2pDate > now) {
        return {
          isAllowed: false,
          reason: `PAUSE: Active Promise-to-Pay commitment logged for ${txn.promiseToPayDate}. Automated nudges suspended until due date.`,
          ruleTriggered: 'PROMISE_TO_PAY_ACTIVE'
        };
      }
    }

    // 4. High-Value Human Approval Guardrail (Amount >= ₹50,000 / 50K)
    if (txn.amount >= this.highValueThreshold && !this.approvedTransactions.has(txn.id)) {
      return {
        isAllowed: false,
        reason: `PAUSE: High-Value transaction (₹${txn.amount.toLocaleString('en-IN')} >= ₹50,000 threshold) requires Human Finance Manager approval.`,
        ruleTriggered: 'REQUIRES_HUMAN_APPROVAL'
      };
    }

    // 5. Compliance Passed
    return {
      isAllowed: true,
      reason: 'Compliant action validated against merchant policies & anti-spam regulations.',
      ruleTriggered: 'ALL_GUARDRAILS_PASSED'
    };
  }

  /**
   * Human Finance Manager approves high-value transaction action
   */
  approveHighValue(txnId) {
    this.approvedTransactions.add(txnId);
  }

  /**
   * Register customer opt-out
   */
  addOptOut(identifier) {
    this.optOutList.add(identifier);
  }
}

export const complianceGuardrails = new ComplianceGuardrailsEngine();
