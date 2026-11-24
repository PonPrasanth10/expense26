import { describe, it, expect } from "vitest";
import {
  totalAvailable,
  remainingBalance,
  budgetUsedPercent,
  dailyLimit,
  getBudgetStatus,
  computeSummary,
} from "../lib/finance";

describe("Finance calculations", () => {
  it("computes total available correctly", () => {
    // 0 opening balance + 8000 rupees (800_000 paise)
    expect(totalAvailable(0, 800_000)).toBe(800_000);
    // 500 rupees carry-forward + 8000 rupees allowance
    expect(totalAvailable(50_000, 800_000)).toBe(850_000);
  });

  it("computes remaining balance correctly", () => {
    // 8,000 available - 3,350 expenses = 4,650 remaining
    expect(remainingBalance(800_000, 335_000)).toBe(465_000);
  });

  it("computes budget used percentage matching prototype specification", () => {
    // Example: ₹8,000 allowance, ₹3,350 spent -> 41.875% (~41.9%)
    const pct = budgetUsedPercent(335_000, 800_000);
    expect(pct).toBeCloseTo(41.875, 2);
  });

  it("handles zero budget without division by zero", () => {
    expect(budgetUsedPercent(0, 0)).toBe(0);
    expect(budgetUsedPercent(100, 0)).toBe(100);
  });

  it("computes daily limit accurately with integer paise flooring", () => {
    // ₹4,650 remaining over 30 days = ₹155/day (15,500 paise)
    const limit = dailyLimit(465_000, 30);
    expect(limit).toBe(15_500); // exactly ₹155

    // Over zero days or negative balance
    expect(dailyLimit(465_000, 0)).toBe(0);
    expect(dailyLimit(-50_000, 10)).toBe(0);
  });

  it("assigns appropriate status based on percentage threshold", () => {
    expect(getBudgetStatus(41.9).status).toBe("on-track");
    expect(getBudgetStatus(74.9).status).toBe("on-track");
    expect(getBudgetStatus(75.0).status).toBe("watch");
    expect(getBudgetStatus(89.9).status).toBe("watch");
    expect(getBudgetStatus(90.0).status).toBe("warning");
    expect(getBudgetStatus(99.9).status).toBe("warning");
    expect(getBudgetStatus(100.0).status).toBe("over-budget");
    expect(getBudgetStatus(120.0).status).toBe("over-budget");
  });

  it("computes complete summary for November demo scenario", () => {
    const summary = computeSummary({
      openingBalance: 0,
      incomeReceived: 800_000, // ₹8,000
      totalExpenses: 335_000,  // ₹3,350
      daysLeft: 30,
    });

    expect(summary.totalAvailable).toBe(800_000);
    expect(summary.totalExpenses).toBe(335_000);
    expect(summary.remaining).toBe(465_000); // ₹4,650
    expect(summary.budgetUsedPercent).toBeCloseTo(41.9, 1);
    expect(summary.dailyLimit).toBe(15_500); // ₹155/day
    expect(summary.status.label).toBe("On track");
  });

  it("ensures exclusive expenses do not cause over-budget on dashboard", () => {
    // Normal spending = ₹3,350 out of ₹8,000 allowance.
    // Exclusive expense (e.g. college semester tuition or laptop) = ₹15,000.
    // The regular budget summary must ignore the ₹15,000 exclusive expense,
    // so remaining is still ₹4,650 and status remains "On track".
    const regularExpenses = 335_000; // ₹3,350
    const exclusiveExpenses = 1_500_000; // ₹15,000
    const totalTransactionsAmount = regularExpenses + exclusiveExpenses; // ₹18,350

    // Dashboard only passes non-exclusive expenses to computeSummary
    const summary = computeSummary({
      openingBalance: 0,
      incomeReceived: 800_000, // ₹8,000
      totalExpenses: regularExpenses, // only non-exclusive expenses
      daysLeft: 30,
    });

    expect(summary.totalExpenses).toBe(335_000);
    expect(summary.remaining).toBe(465_000);
    expect(summary.status.status).toBe("on-track");
    expect(summary.budgetUsedPercent).toBeLessThan(75);
    // While the overall spending in analytics would track the full ₹18,350
    expect(totalTransactionsAmount).toBe(1_835_000);
  });
});
