# ⚡ InstaBill

**The Zero-Fee, Real-Time UPI Invoicing Micro-SaaS for Indian Freelancers.**

InstaBill is a modern, lightweight invoicing application that completely bypasses traditional payment gateways (like Razorpay or Stripe). By utilizing direct UPI routing and real-time WebSocket verification, InstaBill allows freelancers to collect payments instantly with **0% transaction fees** and **zero KYC friction**, while maintaining a completely professional client experience.

---

## ✨ Key Features

* **Zero-Fee Architecture:** Direct bank-to-bank UPI routing via QR code.
* **Real-Time Sync:** Powered by Supabase WebSockets. When a client submits payment proof, your dashboard updates instantly without refreshing.
* **Trustless Verification:** Clients must provide a 12-digit UTR (Unique Transaction Reference) number to mark an invoice as paid, eliminating "who paid for what?" confusion.
* **Secure Authentication:** Passwordless "Magic Link" login system.
* **Data Privacy (RLS):** Strict Row Level Security ensures freelancers can only access their own financial data.
* **Native PDF Receipts:** Generates beautiful, print-ready PDF invoices for clients upon payment verification using native browser engines (no heavy PDF libraries).
* **Premium UI:** Crafted with Tailwind CSS and animated fluidly with Framer Motion.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js (App Router)](https://nextjs.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Animations:** [Framer Motion](https://www.framer.com/motion/)
* **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Components:** `qrcode.react`, `react-hot-toast`

---

## 🔄 The 3-Step Verification Flow

1.  **Generate & Share:** The freelancer creates an invoice. InstaBill generates a secure public link and a dynamically encoded UPI QR code.
2.  **Client Payment:** The client opens the link, scans the QR with PhonePe/GPay, and transfers the funds directly to the freelancer's bank. They enter their 12-digit UTR number as proof.
3.  **Live Approval:** The freelancer's dashboard instantly alerts them with the UTR number. The freelancer verifies the deposit in their bank app, clicks "Approve," and the client's screen live-syncs to reveal a downloadable PDF receipt.

---

## 🚀 Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/instabill.git](https://github.com/yourusername/instabill.git)
cd instabill
npm install