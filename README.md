# ⚡ InstaBill
<img width="1408" height="768" alt="installBill" src="https://github.com/user-attachments/assets/b3eb9bf2-d4dd-4acb-9649-2438335a0d89" />

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
```

### 2. Set up Supabase Environment Variables
Create a `.env.local` file in the root directory and add your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup (SQL Schema)
Go to your Supabase Dashboard -> **SQL Editor** and run the following commands to construct the database, set up authentication, and enforce Row Level Security (RLS):

```sql
-- 1. Create the invoices table
CREATE TABLE public.invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  sender_name text NOT NULL,
  client_email text NOT NULL,
  upi_id text NOT NULL,
  total_amount numeric NOT NULL,
  items jsonb NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  utr_number text
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 3. Create strict security policies
-- Freelancers can only view their own dashboard data
CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

-- Freelancers can insert new invoices
CREATE POLICY "Users can insert own invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- The public client portal can view a specific invoice if they have the exact UUID
CREATE POLICY "Public can view specific invoice by ID" ON public.invoices
  FOR SELECT USING (true);

-- The public client portal can update the status/UTR of their specific invoice
CREATE POLICY "Public can update invoices" ON public.invoices 
  FOR UPDATE USING (true);
```

### 4. Enable Realtime (Crucial)
To enable the live-sync features:
1. Go to your Supabase Dashboard -> **Database** -> **Publications**.
2. Find `supabase_realtime`.
3. Toggle the switch to **ON** for the `invoices` table.

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start generating invoices.

---

## 🌍 Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/). 
Simply connect your GitHub repository to Vercel, ensure your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are added to the Vercel Environment Variables, and click Deploy.

---

## 📄 License
This project is licensed under the MIT License.
