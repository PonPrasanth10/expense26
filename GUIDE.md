# 🎓 StudentSpend — User & Architecture Guide

Welcome to **StudentSpend**, a smart personal budget and expense tracker designed specifically for Indian college students.

---

## 📌 1. What is StudentSpend?

College life in India comes with a fixed monthly pocket money / allowance (from parents, internships, part-time jobs, or scholarships). Most expense apps are either overly complex, require linking personal bank accounts, or fail to track the one question students ask daily:

> *"How much can I safely spend per day so my pocket money lasts until the end of the month?"*

**StudentSpend** solves this by:
- Operating 100% manually (no bank linking needed, zero privacy risk).
- Working in Indian Rupees (₹) with native payment methods (**UPI**, **Cash**, **Card**, **Bank Transfer**).
- Calculating a real-time **Safe Daily Spending Limit** (`remaining balance ÷ days remaining in the month`).
- Providing an **Exclusive** expense mode so one-off large payments (like college semester fees or a laptop) don't flag you as "Over budget".
- Working seamlessly on mobile with offline queuing via IndexedDB.

---

## 🧭 2. Page-by-Page Overview

### 🏠 **Dashboard (`/dashboard`)**
The nerve center of your monthly spending:
- **Remaining Balance Card**: Displays your current spendable balance, the total starting funds, and a live progress bar.
- **Budget Status Badge**:
  - 🟢 **On track**: < 75% of budget used.
  - 🟡 **Watch**: 75% – 89% used.
  - 🟠 **Warning**: 90% – 99% used.
  - 🔴 **Over budget**: ≥ 100% used.
- **Core Metrics Grid**:
  - **Total Income**: All allowances and top-ups received this month.
  - **Total Spent**: Regular expenses deducted from your allowance.
  - **Daily Limit**: How much you can spend per day starting today without overspending.
  - **Days Left**: Days remaining in the monthly cycle.
- **Exclusive Expenses Pill**: Shows one-off expenses outside your allowance (if any).
- **Recent Transactions**: Quick snapshot of the last 5 transactions with inline badges.
- **Quick Add Button (FAB)**: One-tap button to jump straight to expense logging.

---

### ➕ **Add / Edit Transaction (`/add`)**
- **Type Toggle**: Choose between **Expense (💸)** and **Income (💰)**.
- **Amount (₹)**: Large, high-visibility rupee input.
- **Category Picker**: Grid of 14 default student categories (Food, Snacks, Travel, Recharge, Entertainment, etc.) with custom emojis.
- **Payment Method**: Pick UPI, Cash, Card, or Bank transfer.
- **Date**: Defaults to today, customizable.
- **Exclusive Toggle**:
  - *What it is*: Check this for one-off expenses not taken from your monthly allowance (e.g. semester fees, laptop purchase, emergency hospital bill paid by parents).
  - *Effect*: Appears in **Analytics**, but **does not** reduce your allowance balance or mark you over budget on the dashboard!
- **Edit Mode**: Clicking the pencil icon on any transaction in history loads this form in edit mode (`/add?edit=ID`) with an **Update Transaction** button.

---

### 📜 **Transaction History (`/transactions`)**
- **Live Search**: Instant typing search by note or category name.
- **Filter Panel**: Filter by type (Expense / Income), category, and payment channel.
- **Date Grouping**: Transactions grouped chronologically by date with daily income/expense subtotals.
- **Actions**: One-click **Edit** (pencil) and **Delete** (trash) for every transaction.
- **Badges**: Highlights **Exclusive** entries so you always know why an entry didn't affect your allowance.

---

### 📊 **Spending Insights & Analytics (`/analytics`)**
- **Month Selector**: Easily switch between months to compare trends.
- **Key KPIs**: Total spent, daily average spending, peak spending day, and top spending category.
- **Daily Spending Curve**: Interactive bar chart showing how much you spent on each day of the month (hover to see amounts).
- **Category Distribution**: Visual stacked progress bar and list showing percentages of where your money went.
- **Payment Channels**: Breakdown of UPI vs. Cash vs. Card usage with percentage bars.
- **Smart Student Tip**: Contextual budgeting advice for college life.

---

### ⚙️ **Settings & Budget (`/settings`)**
- **Monthly Allowance Setup**:
  - **Monthly Allowance (₹)**: Fresh allowance received this month.
  - **Opening / Bank Balance (₹)**: Unspent leftover money carried forward from the previous month.
  - **Source of Allowance**: Parents, Scholarship, Part-time job, Internship, Freelancing, Savings.
  - **Received On**: Date allowance arrived.
  - **Carry Forward Toggle**: Automatically roll over unspent money into the next month.
- **Category Management**:
  - View all 14 default categories.
  - Add your own custom categories with a custom name, emoji picker, and color selector.
  - Delete custom categories with automatic unlinking.
- **Prototype Demo Data**:
  - One-click **"Load ₹8,000 November Demo Dataset"** button to instantly populate the reference student spending scenario.
- **Data Export & Danger Zone**:
  - One-click **Export to CSV (Excel)**.
  - One-click **Export to JSON**.
  - **Clear All Transactions & Data** button.

---

## 🧮 3. Financial Calculation Reference

All financial calculations live in a pure, unit-tested engine (`lib/finance.ts`) and use **integer paise** (`₹1 = 100 paise`) to prevent floating-point rounding errors.

$$\text{Total Available} = \text{Opening Balance} + \text{Monthly Allowance / Income}$$

$$\text{Total Expenses} = \sum (\text{Regular Expenses, where Exclusive is false})$$

$$\text{Remaining Balance} = \text{Total Available} - \text{Total Expenses}$$

$$\text{Budget Used \%} = \left(\frac{\text{Total Expenses}}{\text{Total Available}}\right) \times 100$$

$$\text{Safe Daily Limit} = \left\lfloor \frac{\text{Remaining Balance}}{\text{Days Remaining (inclusive of today)}} \right\rfloor$$

*If the remaining balance is negative or zero, the Daily Limit safely returns ₹0/day.*

---

## 💻 4. Technical Architecture

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript.
- **Styling**: Tailwind CSS (v3.4.17) + CSS variable tokens (Light/Dark themes).
- **Database**: MongoDB with Mongoose (cached connection pool for serverless reliability).
- **Authentication**: Auth.js (NextAuth v5) with JWT session cookies:
  - Credentials provider (Email + bcrypt password hash).
  - Google OAuth provider support.
  - Edge-compatible `auth.config.ts` separating Edge middleware from Node.js database drivers.
- **Offline / PWA**: IndexedDB queue for offline transaction creation with automatic background sync when reconnected.
- **Testing**: Vitest test suite (`npm run test`) verifying financial calculations, integer rounding, and thresholds.

---

## 🔑 5. Demo Credentials

To test the application immediately:
- **Email**: `demo@studentspend.in`
- **Password**: `DemoStudent@123`

You can also run the seed script anytime via terminal:
```bash
npm run seed
```
