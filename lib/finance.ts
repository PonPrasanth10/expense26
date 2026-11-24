/**
 * lib/finance.ts
 * Pure, unit-tested financial calculation functions for StudentSpend.
 * All monetary values are stored and handled as integers in PAISE (₹1 = 100 paise).
 * All date operations use IST (Asia/Kolkata, UTC+5:30).
 */

// ─── IST Utilities ────────────────────────────────────────────────────────────

const IST_OFFSET_MINUTES = 330; // UTC+5:30

/** Returns today's date in IST as a Date object (midnight UTC) */
export function todayIST(): Date {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MINUTES * 60_000);
  // Zero out time portion
  return new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate())
  );
}

/** Returns a "YYYY-MM" string for a given date in IST */
export function monthKeyIST(date: Date = new Date()): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Returns the number of days remaining in the month from today (IST), inclusive of today */
export function daysRemainingInMonth(
  today: Date = todayIST(),
  nextAllowanceDate?: Date
): number {
  if (nextAllowanceDate) {
    // Days until next allowance date (exclusive: today is day 1)
    const msPerDay = 86_400_000;
    const diff = nextAllowanceDate.getTime() - today.getTime();
    const days = Math.ceil(diff / msPerDay);
    return Math.max(days, 0);
  }

  // Default: days until end of calendar month (inclusive of today)
  const ist = new Date(today.getTime() + IST_OFFSET_MINUTES * 60_000);
  const lastDay = new Date(
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() + 1, 0)
  );
  const msPerDay = 86_400_000;
  const days = Math.ceil((lastDay.getTime() - today.getTime()) / msPerDay) + 1;
  return Math.max(days, 1); // At least 1 to avoid division by zero
}

// ─── Core Financial Calculations ─────────────────────────────────────────────

/**
 * Total available funds for the period.
 * opening balance (carry-forward) + all income received
 */
export function totalAvailable(openingBalance: number, incomeReceived: number): number {
  return openingBalance + incomeReceived;
}

/**
 * Remaining balance after expenses.
 */
export function remainingBalance(available: number, totalExpenses: number): number {
  return available - totalExpenses;
}

/**
 * Budget utilization as a percentage (0–100+).
 * Returns 0 if totalAvailable is 0 (guard against division by zero).
 */
export function budgetUsedPercent(
  totalExpenses: number,
  available: number
): number {
  if (available <= 0) return totalExpenses > 0 ? 100 : 0;
  return (totalExpenses / available) * 100;
}

/**
 * Daily spending limit = (remaining − reserved for upcoming bills) / days remaining.
 * Returns 0 if days remaining is 0 or remaining is negative.
 */
export function dailyLimit(
  remaining: number,
  daysLeft: number,
  reservedForBills: number = 0
): number {
  if (daysLeft <= 0) return 0;
  const spendable = remaining - reservedForBills;
  if (spendable <= 0) return 0;
  return Math.floor(spendable / daysLeft); // Floor in paise to be conservative
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

export type BudgetStatus = "on-track" | "watch" | "warning" | "over-budget";

export interface StatusInfo {
  status: BudgetStatus;
  label: string;
  colorClass: string;
  badgeClass: string;
}

/**
 * Derives the status badge from the budget utilization percentage.
 *   < 75%  → On track (green)
 * 75–89%   → Watch    (amber)
 * 90–99%   → Warning  (orange/red)
 *  ≥ 100%  → Over budget (red)
 */
export function getBudgetStatus(usedPercent: number): StatusInfo {
  if (usedPercent >= 100) {
    return {
      status: "over-budget",
      label: "Over budget",
      colorClass: "text-red-600 dark:text-red-400",
      badgeClass: "badge-danger",
    };
  }
  if (usedPercent >= 90) {
    return {
      status: "warning",
      label: "Warning",
      colorClass: "text-orange-600 dark:text-orange-400",
      badgeClass: "badge-danger",
    };
  }
  if (usedPercent >= 75) {
    return {
      status: "watch",
      label: "Watch",
      colorClass: "text-amber-600 dark:text-amber-400",
      badgeClass: "badge-warning",
    };
  }
  return {
    status: "on-track",
    label: "On track",
    colorClass: "text-green-600 dark:text-green-400",
    badgeClass: "badge-success",
  };
}

// ─── Summary Object ───────────────────────────────────────────────────────────

export interface FinanceSummary {
  totalAvailable: number;       // paise
  totalExpenses: number;        // paise
  totalIncome: number;          // paise
  remaining: number;            // paise
  budgetUsedPercent: number;    // 0–100+
  dailyLimit: number;           // paise/day
  daysRemaining: number;
  status: StatusInfo;
}

export function computeSummary(params: {
  openingBalance: number;       // paise
  incomeReceived: number;       // paise (sum of all income transactions)
  totalExpenses: number;        // paise (sum of all expense transactions)
  daysLeft: number;
  reservedForBills?: number;    // paise
}): FinanceSummary {
  const { openingBalance, incomeReceived, totalExpenses, daysLeft, reservedForBills = 0 } = params;

  const available = totalAvailable(openingBalance, incomeReceived);
  const remaining = remainingBalance(available, totalExpenses);
  const usedPct = budgetUsedPercent(totalExpenses, available);
  const limit = dailyLimit(remaining, daysLeft, reservedForBills);
  const status = getBudgetStatus(usedPct);

  return {
    totalAvailable: available,
    totalExpenses,
    totalIncome: incomeReceived,
    remaining,
    budgetUsedPercent: usedPct,
    dailyLimit: limit,
    daysRemaining: daysLeft,
    status,
  };
}

// ─── Category Budget Alert Thresholds ────────────────────────────────────────

export type AlertLevel = "none" | "warning" | "critical" | "exceeded";

export interface AlertThresholds {
  warning: number;   // default 75
  critical: number;  // default 90
}

export function getCategoryAlertLevel(
  spent: number,
  limit: number,
  thresholds: AlertThresholds = { warning: 75, critical: 90 }
): AlertLevel {
  if (limit <= 0) return "none";
  const pct = (spent / limit) * 100;
  if (pct >= 100) return "exceeded";
  if (pct >= thresholds.critical) return "critical";
  if (pct >= thresholds.warning) return "warning";
  return "none";
}

// ─── Projected Run-Out Date ───────────────────────────────────────────────────

/**
 * Projects the date when the remaining balance will run out,
 * based on average daily spending.
 * Returns null if balance is already exhausted or no spending has occurred.
 */
export function projectedRunOutDate(
  remaining: number,
  averageDailySpend: number,
  fromDate: Date = todayIST()
): Date | null {
  if (remaining <= 0 || averageDailySpend <= 0) return null;
  const daysLeft = Math.floor(remaining / averageDailySpend);
  const result = new Date(fromDate.getTime() + daysLeft * 86_400_000);
  return result;
}

/**
 * Computes average daily spend from total expenses and number of days elapsed.
 */
export function averageDailySpend(totalExpenses: number, daysElapsed: number): number {
  if (daysElapsed <= 0) return 0;
  return Math.floor(totalExpenses / daysElapsed);
}
