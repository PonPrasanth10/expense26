/**
 * lib/format.ts
 * Formatting helpers for currency, dates, and percentages.
 * India-first: uses en-IN locale, IST timezone, ₹ symbol.
 */

// ─── Currency ─────────────────────────────────────────────────────────────────

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const INR_FORMATTER_DECIMAL = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats paise (integer) as Indian Rupee string.
 * e.g. 125050 paise → "₹1,251" (no decimals by default)
 */
export function formatINR(paise: number, showDecimal = false): string {
  const rupees = paise / 100;
  return showDecimal ? INR_FORMATTER_DECIMAL.format(rupees) : INR_FORMATTER.format(rupees);
}

/**
 * Parses a rupee string or number to paise (integer).
 * Strips currency symbol, commas etc.
 */
export function parseToPane(value: string | number): number {
  if (typeof value === "number") {
    return Math.round(value * 100);
  }
  const cleaned = value.replace(/[₹,\s]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

// ─── Date Formatting ──────────────────────────────────────────────────────────

const IST_TZ = "Asia/Kolkata";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST_TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_SHORT_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST_TZ,
  day: "numeric",
  month: "short",
});

const DATE_MONTH_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST_TZ,
  month: "long",
  year: "numeric",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST_TZ,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "27 Oct 2026" */
export function formatDate(date: Date | string): string {
  return DATE_FORMATTER.format(new Date(date));
}

/** "27 Oct" */
export function formatDateShort(date: Date | string): string {
  return DATE_SHORT_FORMATTER.format(new Date(date));
}

/** "October 2026" */
export function formatMonth(date: Date | string): string {
  return DATE_MONTH_FORMATTER.format(new Date(date));
}

/** "2026-10" → "October 2026" */
export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return DATE_MONTH_FORMATTER.format(new Date(year, month - 1, 1));
}

/** "3:45 PM" */
export function formatTime(date: Date | string): string {
  return TIME_FORMATTER.format(new Date(date));
}

/** "Today", "Yesterday", or "27 Oct" */
export function formatRelativeDate(date: Date | string, today?: Date): string {
  const d = new Date(date);
  const t = today ?? new Date();

  // Normalize to date-only comparison in IST
  const toDateStr = (dt: Date) => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: IST_TZ }).format(dt);
  };

  const dateStr = toDateStr(d);
  const todayStr = toDateStr(t);

  if (dateStr === todayStr) return "Today";

  const yesterday = new Date(t);
  yesterday.setDate(t.getDate() - 1);
  if (dateStr === toDateStr(yesterday)) return "Yesterday";

  return formatDateShort(d);
}

// ─── Percentage ───────────────────────────────────────────────────────────────

/** "41.9%" — rounds to 1 decimal */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ─── Number ───────────────────────────────────────────────────────────────────

const NUMBER_FORMATTER = new Intl.NumberFormat("en-IN");

export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

// ─── Compact Currency (for small spaces) ─────────────────────────────────────

/** "₹8K", "₹1.2L" */
export function formatINRCompact(paise: number): string {
  const rupees = paise / 100;
  if (Math.abs(rupees) >= 100_000) {
    return `₹${(rupees / 100_000).toFixed(1)}L`;
  }
  if (Math.abs(rupees) >= 1_000) {
    return `₹${(rupees / 1_000).toFixed(1)}K`;
  }
  return `₹${rupees.toFixed(0)}`;
}

// ─── Month key helpers ────────────────────────────────────────────────────────

/** "2026-10" → { year: 2026, month: 10 } */
export function parseMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

/** Get previous month key: "2026-10" → "2026-09" */
export function prevMonthKey(key: string): string {
  const { year, month } = parseMonthKey(key);
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${String(month - 1).padStart(2, "0")}`;
}

/** Get next month key: "2026-10" → "2026-11" */
export function nextMonthKey(key: string): string {
  const { year, month } = parseMonthKey(key);
  if (month === 12) return `${year + 1}-01`;
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
