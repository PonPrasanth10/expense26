/**
 * GET /api/summary?month=YYYY-MM
 * Returns aggregated dashboard numbers for a given month.
 * All math is done in the DB via aggregation pipeline.
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import TransactionModel from "@/models/Transaction";
import BudgetModel from "@/models/Budget";
import CategoryModel from "@/models/Category";
import { ok, err, getAuthenticatedUserId } from "@/lib/api-helpers";
import { summaryQuerySchema } from "@/lib/validations";
import { computeSummary, daysRemainingInMonth, todayIST, monthKeyIST } from "@/lib/finance";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  const { searchParams } = req.nextUrl;
  const monthParam = searchParams.get("month") ?? monthKeyIST();

  const parsed = summaryQuerySchema.safeParse({ month: monthParam });
  if (!parsed.success) return err("Invalid month format. Use YYYY-MM", 400);

  const { month } = parsed.data;
  const [year, monthNum] = month.split("-").map(Number);

  // Date range for the month (IST-aware)
  const startDate = new Date(`${year}-${String(monthNum).padStart(2, "0")}-01T00:00:00+05:30`);
  const endDate = new Date(year, monthNum, 1); // First day of next month UTC

  await connectDB();

  const uid = new mongoose.Types.ObjectId(userId);

  // Run aggregation + budget fetch in parallel
  const [aggResult, budget, categories] = await Promise.all([
    // Aggregate total income and expenses for the month
    TransactionModel.aggregate([
      {
        $match: {
          userId: uid,
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: {
            type: "$type",
            isExclusive: { $ifNull: ["$isExclusive", false] },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),

    // Get the budget for the month
    BudgetModel.findOne({ userId: uid, month }).lean(),

    // Get categories for the user
    CategoryModel.find({ userId: uid }).lean(),
  ]);

  // Category breakdown aggregation
  const catBreakdown = await TransactionModel.aggregate([
    {
      $match: {
        userId: uid,
        type: "expense",
        date: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: "$categoryId",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  // Recent transactions (last 5)
  const recentTransactions = await TransactionModel.find({
    userId: uid,
    date: { $gte: startDate, $lt: endDate },
  })
    .sort({ date: -1, createdAt: -1 })
    .limit(5)
    .populate("categoryId", "name icon color")
    .lean();

  // Build totals map
  const totals = { income: 0, expense: 0, exclusiveExpense: 0 };
  for (const row of aggResult) {
    if (row._id.type === "income") totals.income += row.total;
    if (row._id.type === "expense") {
      if (row._id.isExclusive) {
        totals.exclusiveExpense += row.total;
      } else {
        totals.expense += row.total;
      }
    }
  }

  // Compute finance summary
  const openingBalance = budget?.openingBalance ?? 0;
  const today = todayIST();
  const nextAllowanceDate = budget?.nextAllowanceDate
    ? new Date(budget.nextAllowanceDate)
    : undefined;

  // Only count days remaining if we're in the current month
  const currentMonth = monthKeyIST();
  const isCurrentMonth = month === currentMonth;
  const daysLeft = isCurrentMonth
    ? daysRemainingInMonth(today, nextAllowanceDate)
    : 0;

  // If no income transaction exists yet, fall back to the configured monthly allowance
  const effectiveIncome = totals.income > 0 ? totals.income : (budget?.allowance ?? 0);

  const summary = computeSummary({
    openingBalance,
    incomeReceived: effectiveIncome,
    totalExpenses: totals.expense,
    daysLeft,
  });

  // Build category map
  const catMap = Object.fromEntries(
    categories.map((c) => [c._id.toString(), c])
  );

  const categoryBreakdown = catBreakdown.map((row) => {
    const cat = row._id ? catMap[row._id.toString()] : null;
    return {
      categoryId: row._id?.toString() ?? null,
      name: cat?.name ?? "Uncategorized",
      icon: cat?.icon ?? "🏷️",
      color: cat?.color ?? "#64748B",
      total: row.total,
      count: row.count,
      percent: summary.totalExpenses > 0 ? (row.total / summary.totalExpenses) * 100 : 0,
    };
  });

  return ok({
    month,
    budget: budget
      ? {
          id: budget._id.toString(),
          allowance: budget.allowance,
          openingBalance: budget.openingBalance,
          source: budget.source,
          receivedOn: budget.receivedOn,
          nextAllowanceDate: budget.nextAllowanceDate,
          carryForward: budget.carryForward,
          alertThresholds: budget.alertThresholds,
          categoryLimits: budget.categoryLimits,
        }
      : null,
    summary: {
      ...summary,
      status: summary.status,
      exclusiveTotal: totals.exclusiveExpense,
    },
    categoryBreakdown,
    recentTransactions: recentTransactions.map((t) => ({
      id: t._id.toString(),
      type: t.type,
      amount: t.amount,
      category: t.categoryId,
      paymentMethod: t.paymentMethod,
      date: t.date,
      note: t.note,
      isExclusive: t.isExclusive ?? false,
    })),
  });
}
