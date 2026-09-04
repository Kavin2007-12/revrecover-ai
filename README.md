# RevRecover AI — Multi-Merchant AI Revenue Recovery Platform
> Built for **Razorpay Buildathon Track 03 (AI Revenue Recovery)**

RevRecover AI is an autonomous, multi-tenant revenue recovery agent that detects payment failures, abandoned checkouts, failed subscriptions, and overdue invoices; diagnoses root causes; executes targeted bounded recovery workflows; and tracks **Measured Money Recovered** with strict compliance guardrails and a full audit trail.

---

## 🌟 Key Features

1. **Multi-Merchant Tenant Architecture**:
   - **D2C E-Commerce**: Recovers abandoned checkouts via WhatsApp & instant Razorpay payment links.
   - **SaaS Subscriptions**: Autopay / Mandate failure smart retry sequencer.
   - **B2B Enterprises**: Overdue invoice chaser & **Promise-to-Pay (P2P)** tracking.
2. **"THE BAR" Requirements Satisfied**:
   - **Measured Money Recovered (₹)**: Live counters tracking revenue recovered across batches.
   - **Root Cause Diagnosis**: Diagnostic engine powered by Google Gemini AI & heuristics.
   - **Compliance & Stopping Rules**: Max contact caps (`max_attempts = 3`), opt-out respect, P2P locks.
   - **Complete Audit Trail**: Immutable event logs for every recovery step.
3. **Razorpay Live API Integration**:
   - Integrated with official Razorpay Node SDK using test API credentials (`rzp_test_...`) to generate real Razorpay Payment Links (`https://rzp.io/l/...`).
4. **Sleek Animated Dark Dashboard**:
   - Framer Motion card animations, 3-step color coding (🔴 At Risk → 🟡 AI Action → 🟢 Recovered), and an interactive **"Try-It-Yourself" Customer View Simulator**.

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18+) & npm

### Setup & Launch

1. **Backend Server Setup**:
   ```bash
   # In root folder (d:\RAZORPAY TEST)
   npm install
   node server/index.js
   ```
   *Backend runs on `http://localhost:5000` with WebSocket support.*

2. **Frontend Client Setup**:
   ```bash
   # In client folder (d:\RAZORPAY TEST\client)
   npm install
   npm run dev
   ```
   *Frontend opens on `http://localhost:3000`.*

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Razorpay SDK (`razorpay`), Google Gemini AI (`@google/generative-ai`), WebSockets (`ws`).
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Recharts.
- **Database / State**: In-memory multi-tenant batch simulator with audit logger.
