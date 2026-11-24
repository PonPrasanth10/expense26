# StudentSpend 🎓 ₹

> **Production-grade personal expense & allowance tracker designed for Indian college students.**

Built with Next.js (App Router), TypeScript, Tailwind CSS, Auth.js (v5), and MongoDB with Mongoose.

---

## 🌟 Key Features

- **India-First Student Experience**:
  - All amounts in Indian Rupees (₹) with Indian numbering format (e.g., `₹8,000`, `₹1,50,000`).
  - Native payment channels: **UPI**, **Cash**, **Card**, and **Bank Transfer**.
  - Student categories: Mess/Food, Canteen snacks, Bus/Metro transit, Mobile recharge, Lab manual/books, Subscriptions, Hostel rent, and more.
- **Allowance & Burn Rate Math**:
  - Handles allowances from Parents, Scholarships, Part-time jobs, Internships, or Savings.
  - Automatic calculation of:
    - **Remaining balance**
    - **Budget utilization %**
    - **Safe Daily Spending Limit** (`remaining ÷ days left in month`)
    - **Dynamic health status badge** (*On track*, *Watch*, *Warning*, *Over budget*).
  - Handles the reference prototype: ₹8,000 November allowance, ₹3,350 spent ➔ ₹4,650 remaining, 41.9% spent, ₹155/day daily limit, "On track".
- **Visual Analytics & Spending Insights**:
  - Interactive daily spending curve bar chart.
  - Category breakdown with visual distribution bar and percentage share.
  - Payment channel breakdown (UPI vs Cash vs Card).
  - Key spending metrics: Peak spend day, Daily average, Top category.
- **Comprehensive Settings**:
  - Update monthly allowance, opening balance, allowance source, and cycle dates.
  - Custom category creator (custom emoji picker + color palette).
  - One-click **Load November Demo Data** button.
  - Export transactions to **CSV** or **JSON**.
  - Reset / Clear user data.
- **Offline & PWA Ready**:
  - IndexedDB offline queue for adding transactions when connectivity drops.
  - Mobile bottom navigation bar + desktop responsive sidebar.
  - Dark / Light / System theme toggle with zero-flicker script.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **MongoDB** instance running locally (`mongodb://localhost:27017/studentspend`) or MongoDB Atlas URI.

### 2. Environment Setup
Copy the environment variables:
```bash
cp .env.example .env.local
```
Ensure `MONGODB_URI` and `AUTH_SECRET` are set.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the pure finance calculation and status threshold tests:
```bash
npm run test
```
All 7 unit tests covering integer-paise math, daily limits, budget percentages, and status thresholds run via Vitest.

To run TypeScript verification:
```bash
npm run type-check
```

---

## 📊 Pre-Populated Demo Account

You can seed the database with the specification demo scenario:
```bash
npm run seed
```
Demo credentials:
- **Email**: `demo@studentspend.in`
- **Password**: `DemoStudent@123`

Or alternatively, sign up with any email, go to **Settings**, and click **"Load ₹8,000 November Demo Dataset"**.

---

## 📁 Architecture & File Layout

```
Expensetracker/
├── app/
│   ├── (app)/
│   │   ├── dashboard/page.tsx      # Main allowance overview & balance card
│   │   ├── transactions/page.tsx   # Transaction list with live search & filters
│   │   ├── add/page.tsx            # Add expense/income form with quick category picker
│   │   ├── analytics/page.tsx      # Trend charts & spending insights
│   │   ├── settings/page.tsx       # Allowance configuration & category management
│   │   └── layout.tsx              # Shell layout with Sidebar and Mobile BottomNav
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login with email/password and OAuth
│   │   ├── signup/page.tsx         # Sign up with strength meter
│   │   ├── forgot-password/page.tsx# Forgot password
│   │   └── reset-password/page.tsx # Password reset with token
│   ├── api/                        # REST API routes (budget, transactions, categories, analytics)
│   ├── globals.css                 # Custom CSS tokens, glassmorphism, responsive styles
│   └── page.tsx                    # Root redirect
├── components/
│   ├── dashboard/                  # DashboardClient & DashboardContent
│   ├── transactions/               # AddTransactionForm, TransactionListClient/Server
│   ├── analytics/                  # AnalyticsClient (interactive daily spend charts)
│   ├── settings/                   # SettingsClient
│   ├── layout/                     # Sidebar & BottomNav
│   └── ui/                         # ThemeToggle, ProgressBar, Skeleton
├── lib/
│   ├── db.ts                       # MongoDB cached connection pool
│   ├── finance.ts                  # Pure finance calculation engine (paise integer arithmetic)
│   ├── format.ts                   # INR formatting & date helpers
│   ├── validations.ts              # Zod schemas for forms and API routes
│   └── seed.ts                     # Category & demo dataset seeding
└── tests/
    └── finance.test.ts             # Vitest test suite
```

---

## 🔒 Security & Precision

- **No Floating Point Drift**: All monetary amounts are stored as integer **paise** (`₹1.00 = 100 paise`) in MongoDB and converted to rupees only for UI presentation.
- **IST-Aware Date Range**: Daily limits and monthly filters are calculated using Indian Standard Time (`Asia/Kolkata`, UTC+5:30) to avoid timezone discrepancies.
- **Authentication**: Secured with Auth.js (NextAuth v5) using JWT sessions and bcrypt password hashing (12 salt rounds).
