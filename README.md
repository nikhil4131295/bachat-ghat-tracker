# 🌾 बचत गट ट्रॅकर (Bachat Ghat Tracker)

> **A simple, mobile-first Progressive Web App (PWA) for village women's self-help groups (Bachat Ghats) in Maharashtra, India.**
> Replaces paper notebooks and complicated Excel sheets with easy phone screens, bilingual Devanagari support (मराठी, हिन्दी, English), offline-first storage, and bank/Gram Panchayat export reports.

---

## 📱 Features (Phase 1 Implemented)

- **Language Picker:** 3 large cards on startup for **Marathi (मराठी - Default)**, **Hindi (हिन्दी)**, and **English**, switchable anytime from the header.
- **Design System:** Mobile-first (360px layout), soft pastel color palette (mint `#D6EFE3`, peach `#FFE2D1`, sky `#D6E9F8`, butter `#FFF0B8`, dark teal `#1F5F55`, coral `#D9694A`), 48px+ tap targets, Google Fonts (Poppins, Nunito, Noto Sans Devanagari).
- **Try Demo Button:** Immediate 1-tap exploration with pre-seeded demo group **"जय भवानी महिला बचत गट (Jai Bhavani Mahila Bachat Ghat)"**, 10 Marathi members, 6 months of savings, 3 active loans, and group expenses.
- **First-Time Treasurer Group Setup:** 3-step wizard with big inputs to configure group name, village, meeting date, monthly saving (default ₹100), interest rate (default 2%), late fine, and initial members, generating a 6-character Group Code.
- **Visual Dashboard:** 4 big summary cards (Total Savings, Loans Outstanding, Expenses, Cash in Hand) + Recharts (Savings vs. Loans vs. Expenses, Loan payoff donut, 6-month savings trend) + "How was this calculated?" transparency modal.
- **Member Directory & Digital Passbook:** Member cards with avatars, search by name/phone, total savings, pending loan tags, and secret passbook link sharing via WhatsApp and SMS.
- **Offline Storage (Dexie.js / IndexedDB):** 100% of the app works without active internet connectivity.
- **Database & RLS Ready:** Full PostgreSQL schema with Row Level Security policies and RPC functions saved in `supabase_schema_and_seed.sql`.

---

## 🚀 Quick Start (Run Locally)

### 1. Prerequisites
- **Node.js** (v18+ or v20+)
- **npm** (comes with Node.js)

### 2. Run the Development Server
Open your terminal inside the project folder:
```bash
cd /Users/heisenberg/.gemini/antigravity/scratch/bachat-ghat-tracker
npm run dev
```

You will see output like:
```text
  VITE v6.x / v8.x  ready in 200 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```
Click or open **`http://localhost:5173/`** in your browser!

---

## 🗄️ Supabase Cloud Database Setup (Optional for Demo, Required for Multi-Device Sync)

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New project** (name it `bachat-ghat-tracker`, choose Singapore or Mumbai region).
3. Open **SQL Editor** on the left menu, click **New query**, paste the entire contents of [`supabase_schema_and_seed.sql`](../supabase_schema_and_seed.sql) and click **Run**.
4. In Supabase, go to **Project Settings** (gear icon) -> **API**.
5. Copy the **Project URL** and **anon public key**.
6. In this folder, create/update `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

---

## 📁 Project Structure

```text
bachat-ghat-tracker/
├── src/
│   ├── types/index.ts            # TypeScript definitions (Group, Member, Loan, Transaction)
│   ├── lib/
│   │   ├── i18n.ts               # Marathi, Hindi, and English translations
│   │   ├── db.ts                 # Dexie.js IndexedDB schema & offline store
│   │   ├── supabase.ts           # Supabase client setup
│   │   ├── calculations.ts       # Pure financial formulas (INR format, reducing balance)
│   │   └── demoData.ts           # Demo group, members, loans, and ledger entries
│   ├── components/
│   │   ├── common/               # Avatar, LanguagePickerModal
│   │   └── layout/               # Header, BottomNav
│   ├── pages/
│   │   ├── WelcomePage.tsx       # Language selection, role picker, auth, Try Demo
│   │   ├── GroupSetupPage.tsx    # 3-step wizard for first-time treasurers
│   │   ├── DashboardOverview.tsx # 4 summary cards, Recharts, recent 5 entries
│   │   ├── MembersPage.tsx       # Member directory, passbook share links
│   │   ├── OneTapEntryPage.tsx   # Fast 20-second entry flow
│   │   ├── LoansPage.tsx         # Active loans list & status
│   │   ├── ReportsPage.tsx       # Excel report center preview
│   │   └── SettingsPage.tsx      # Group code, rules, language, demo reset
│   ├── App.tsx                   # Main app controller & routing
│   └── main.tsx                  # Entry point
```

---

## 🛠️ Build for Production

```bash
npm run build
```
The compiled, optimized production files will be in the `dist/` folder, ready for free hosting on Vercel or Netlify.
