# 🌾 बचत गट ट्रॅकर (Bachat Ghat Tracker)

> **A mobile-first, bilingual Progressive Web App (PWA) designed specifically for village women's self-help groups (Bachat Ghats) in Maharashtra, India.**
> Replaces cumbersome paper notebooks and complex Excel files with simple phone screens, complete Devanagari support (**मराठी [Default]**, **हिन्दी**, **English**), 100% offline-first storage, automatic cloud sync, WhatsApp passbook sharing, and official Gram Panchayat / bank Excel reports.

---

## 📱 Core Features & Capabilities

### 1. Mobile-First Accessible Design
- Designed specifically for women in rural and semi-urban communities with varying literacy levels.
- Soft, non-intimidating pastel visual theme (Mint `#D6EFE3`, Peach `#FFE2D1`, Sky `#D6E9F8`, Butter `#FFF0B8`, Dark Teal `#1F5F55`, Coral `#D9694A`).
- Large touch targets (48px+) and large typography using Google Fonts (**Poppins**, **Nunito**, **Noto Sans Devanagari**).
- 3-language selector switchable anytime from the top bar.

### 2. 20-Second Fast One-Tap Entry
- Record **Monthly Savings (बचत जमा)**, **Loan Repayments (कर्ज हप्ता)**, **New Loans (नवीन कर्ज)**, **Group Expenses (खर्च)**, and **Fines (दंड)** in just 20 seconds.
- Built-in on-screen **NumberPad** with quick chips (+₹100, +₹500, +₹1,000, +₹2,000) for fast, mistake-free numeric entry.
- **Automatic Reducing-Balance Loan Calculator**: Auto-calculates monthly interest on outstanding principal, automatically splits repayments into interest and principal, and automatically closes loans when paid off.
- **10-Second Undo Bar**: Soft-delete ledger architecture with a 10-second "Undo" button on the dashboard for instant accidental entry recovery.

### 3. Full In-Browser Excel Suite (SheetJS `xlsx`)
- **Pre-formatted Excel Template**: Download blank starter templates with Marathi instructions for bulk member onboarding.
- **Multi-Language Excel Import**: Auto-detects headers in Marathi, Hindi, or English, with real-time green/red validation preview and duplicate detection before saving.
- **Multi-Sheet Monthly Reports**: Generates professional multi-sheet workbooks (Summary, Member Savings, Loan Register, Group Expenses, Cash Book).
- **Official Gram Panchayat Master Report**: Complete historical audit report formatted for bank linkages and government inspectors.
- **Individual Member Passbook (.xlsx)**: Export single-member ledgers directly to Excel.

### 4. 100% Offline-First Engine & Automatic Cloud Sync
- **Local Database (Dexie.js / IndexedDB)**: Every action works seamlessly without internet connectivity.
- **Auto-Sync Engine**: Detects connection changes. Any entry taken in a village without signal is safely queued with `is_pending_sync = true`. Once reconnected, all records automatically sync to Supabase without data collision.
- **Live Status Badges**: Top bar and dashboard indicate `All Saved`, `Offline (Pending Count)`, `Waiting to Sync`, or `Syncing...`.
- **Manual Sync**: Dedicated "Sync Now" button in Settings.

### 5. Progressive Web App (PWA) & Native Phone Install
- Full Service Worker precaching (`sw.js` + Workbox) so the app loads instantly even in Airplane mode.
- PWA Web Manifest (`manifest.webmanifest`) and SVG community icons for Android and iOS.
- Built-in installation banner and step-by-step visual install guide for Chrome (Android) and Safari (iOS).

### 6. Public Digital Passbook Link
- Route `/passbook/:token` accessible by any member on their smartphone without logging in.
- Shows total savings, loan balance, interest paid, and full statement.
- One-click **WhatsApp Share** to send members their passbook statement directly.

### 7. Gram Panchayat & Bank Officer Portal
- Dedicated interface for government and bank officials (`userRole = 'officer'`).
- Enter the 6-character Group Code (e.g. `JB0001`) to inspect self-help groups across villages.
- View group governance health, savings pool, repayment rates, and download official Master Excel reports.

### 8. Instant Demo Mode
- Click **"Try Demo" (डेमो वापरून पहा)** on the welcome screen to test the full system pre-loaded with **"जय भवानी महिला बचत गट"** (10 members, 6 months savings, 3 active loans, expenses).

---

## 🚀 Running the Project Locally

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)

### Steps
1. Open your terminal and navigate to the project directory:
   ```bash
   cd /Users/heisenberg/.gemini/antigravity/scratch/bachat-ghat-tracker
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser at **`http://localhost:5173`**.

---

## 🗄️ Supabase Cloud Setup (Configured & Ready)

The app connects to Supabase for multi-device cloud synchronization.

Create a `.env` file in the root directory (based on `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Database Tables:
- `groups`: Stores self-help group profile, rules, and unique 6-character group code.
- `profiles` & `user_roles`: Role separation for treasurers and officers.
- `members`: Member roster, phone numbers, and unique passbook tokens.
- `loans`: Active and closed loans, principal amounts, interest rates, and loan purpose.
- `transactions`: Append-only financial ledger with soft-deletion support (`deleted_at`).
- `sms_log`: Outbox logs for SMS/WhatsApp passbook links.
- `get_member_passbook(p_token)`: Secure RPC function allowing members to fetch their passbook without logging in.
- `join_group_by_code(p_code)`: RPC function for officers to inspect groups by code.

---

## 🌐 Free Deployment Guide

You can deploy this application completely free so that village women and group officers can access it from anywhere.

### Option A: Free Deployment on Vercel (Recommended)

1. **Push your code to GitHub**:
   - Create a free account at [github.com](https://github.com).
   - Create a new repository named `bachat-ghat-tracker`.
   - Push this directory to your repository:
     ```bash
     cd /Users/heisenberg/.gemini/antigravity/scratch/bachat-ghat-tracker
     git remote add origin https://github.com/YOUR_USERNAME/bachat-ghat-tracker.git
     git branch -M main
     git push -u origin main
     ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub.
   - Click **"Add New Project"** $\rightarrow$ select your `bachat-ghat-tracker` repository.
   - In **Build and Output Settings**, keep defaults:
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - In **Environment Variables**, add the two keys from your `.env`:
     - `VITE_SUPABASE_URL`: (Paste your Supabase Project URL from your `.env`)
     - `VITE_SUPABASE_ANON_KEY`: (Paste your Supabase anon public key from your `.env`)
   - Click **Deploy**!
   - In under 60 seconds, your app will be live at `https://your-app-name.vercel.app`!

---

### Option B: Free Deployment on Netlify

1. Go to [netlify.com](https://netlify.com) and sign up for a free account.
2. Click **"Add new site"** $\rightarrow$ **"Import an existing project"** $\rightarrow$ select your GitHub repository.
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Under **Environment variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Click **Deploy site**.

---

## 📲 Installing on Phones (PWA)

### Android Phones (Google Chrome):
1. Open your live deployment URL (or `http://localhost:5173`) in Google Chrome.
2. A banner **"बचत गट ट्रॅकर फोनवर इन्स्टॉल करा"** will appear at the bottom.
3. Tap **"अॅप इन्स्टॉल करा" (Install App)**, or tap the three dots (**⋮**) in the top right corner and tap **"Add to Home screen"** / **"Install app"**.
4. The Bachat Ghat Tracker icon will appear on your phone's home screen alongside regular Android apps.
5. It opens in fullscreen without browser address bars and works completely offline!

### iPhones & iPads (Safari):
1. Open your deployment URL in Safari.
2. Tap the **Share** button (**⬆**) in the bottom menu bar.
3. Scroll down and tap **"Add to Home Screen"** (**+**).
4. Tap **Add** in the top right corner.

---

## 📂 Project Architecture

```text
bachat-ghat-tracker/
├── public/
│   ├── favicon.svg               # SVG community motif & squircle icon
│   ├── icons.svg                 # SVG sprite sheet
│   ├── manifest.webmanifest      # PWA application manifest
│   └── registerSW.js             # Service worker registration script
├── src/
│   ├── types/index.ts            # TypeScript data models
│   ├── lib/
│   │   ├── i18n.ts               # Marathi, Hindi & English dictionary
│   │   ├── db.ts                 # Dexie.js IndexedDB offline database
│   │   ├── sync.ts               # Network listener & Supabase sync engine
│   │   ├── excel.ts              # In-browser Excel template, import & export
│   │   ├── calculations.ts       # INR formatting, reducing-balance interest formulas
│   │   ├── demoData.ts           # Pre-seeded Jai Bhavani Bachat Ghat demo
│   │   └── supabase.ts           # Supabase client singleton
│   ├── components/
│   │   ├── common/               # Avatar, NumberPad, LanguagePickerModal, OnboardingModal
│   │   ├── layout/               # Header, BottomNav
│   │   └── pwa/                  # InstallBanner & instructions modal
│   ├── pages/
│   │   ├── WelcomePage.tsx       # Language selection, role picker, auth, demo launcher
│   │   ├── GroupSetupPage.tsx    # 3-step first-time treasurer wizard
│   │   ├── DashboardOverview.tsx # 4 KPI cards, charts, undo bar, offline alert
│   │   ├── OneTapEntryPage.tsx   # 20-second entry flow with custom NumberPad
│   │   ├── MembersPage.tsx       # Member directory, passbook link generator
│   │   ├── LoansPage.tsx         # Active & closed loans register
│   │   ├── ReportsPage.tsx       # Monthly & all-time Excel download hub
│   │   ├── SettingsPage.tsx      # Group code, sync center, install help, tutorial
│   │   ├── PublicPassbookPage.tsx# Public member passbook statement (/passbook/:token)
│   │   └── OfficerDashboardPage.tsx # Gram Panchayat / Bank Officer inspection portal
│   ├── App.tsx                   # Main router & layout controller
│   └── main.tsx                  # Application bootstrap
├── vite.config.ts                # Vite 8 + React + VitePWA config
├── tailwind.config.js            # Custom pastel color palette & 48px touch targets
└── tsconfig.app.json             # TypeScript compiler settings
```

---

## 📜 License & Acknowledgments
Dedicated to empowering rural women's self-help groups (Bachat Ghats) across Maharashtra, India through accessible, transparent, and dignified technology.
