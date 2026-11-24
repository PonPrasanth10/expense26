/**
 * GET /api/analytics?month=YYYY-MM
 * Aggregated trends, category breakdown, daily spending, and payment method statistics.
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import TransactionModel from "@/models/Transaction";
import BudgetModel from "@/models/Budget";
import CategoryModel from "@/models/Category";
import { ok, err, getAuthenticatedUserId } from "@/lib/api-helpers";
import { summaryQuerySchema } from "@/lib/validations";
import { monthKeyIST } from "@/lib/finance";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  const monthParam = req.nextUrl.searchParams.get("month") ?? monthKeyIST();
  const parsed = summaryQuerySchema.safeParse({ month: monthParam });
  if (!parsed.success) return err("Invalid month format. Use YYYY-MM", 400);

  const { month } = parsed.data;
  const [year, monthNum] = month.split("-").map(Number);

  const startDate = new Date(`${year}-${String(monthNum).padStart(2, "0")}-01T00:00:00+05:30`);
  const endDate = new Date(year, monthNum, 1); // 1st of next month

  await connectDB();
  const uid = new mongoose.Types.ObjectId(userId);

  const [budget, categories, transactions] = await Promise.all([
    BudgetModel.findOne({ userId: uid, month }).lean(),
    CategoryModel.find({ userId: uid }).lean(),
    TransactionModel.find({
      userId: uid,
      date: { $gte: startDate, $lt: endDate },
    })
      .sort({ date: 1 })
      .lean(),
  ]);

  const catMap = Object.fromEntries(categories.map((c) => [c._id.toString(), c]));

  // Calculate days in this month
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  // 1. Daily trend
  const dailySpendMap: Record<number, number> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    dailySpendMap[d] = 0;
  }

  let totalExpensesPaise = 0;
  let exclusiveExpensesPaise = 0;
  let budgetExpensesPaise = 0;
  let totalIncomePaise = 0;

  // Category totals
  const categoryTotals: Record<string, { total: number; count: number }> = {};

  // Payment methods
  const paymentTotals: Record<string, { total: number; count: number }> = {
    UPI: { total: 0, count: 0 },
    Cash: { total: 0, count: 0 },
    Card: { total: 0, count: 0 },
    "Net Banking": { total: 0, count: 0 },
    Other: { total: 0, count: 0 },
  };

  for (const t of transactions) {
    if (t.type === "expense") {
      totalExpensesPaise += t.amount;
      if (t.isExclusive) {
        exclusiveExpensesPaise += t.amount;
      } else {
        budgetExpensesPaise += t.amount;
      }
      const day = new Date(t.date).getDate();
      dailySpendMap[day] = (dailySpendMap[day] || 0) + t.amount;

      const catKey = t.categoryId ? t.categoryId.toString() : "uncategorized";
      if (!categoryTotals[catKey]) {
        categoryTotals[catKey] = { total: 0, count: 0 };
      }
      categoryTotals[catKey].total += t.amount;
      categoryTotals[catKey].count += 1;

      const pm = t.paymentMethod || "Other";
      if (!paymentTotals[pm]) {
        paymentTotals[pm] = { total: 0, count: 0 };
      }
      paymentTotals[pm].total += t.amount;
      paymentTotals[pm].count += 1;
    } else {
      totalIncomePaise += t.amount;
    }
  }

  // Daily trend array
  const dailyTrend = Object.entries(dailySpendMap).map(([day, amountPaise]) => ({
    day: Number(day),
    date: `${month}-${String(day).padStart(2, "0")}`,
    amount: amountPaise / 100,
  }));

  // Find highest spend day
  let highestDay = { day: 1, amount: 0 };
  for (const item of dailyTrend) {
    if (item.amount > highestDay.amount) {
      highestDay = { day: item.day, amount: item.amount };
    }
  }

  // Format category breakdown
  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([catId, data]) => {
      const cat = catMap[catId];
      return {
        id: catId,
        name: cat?.name ?? "Uncategorized",
        icon: cat?.icon ?? "🏷️",
        color: cat?.color ?? "#64748B",
        total: data.total / 100,
        count: data.count,
        percent: totalExpensesPaise > 0 ? (data.total / totalExpensesPaise) * 100 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Format payment method breakdown
  const paymentBreakdown = Object.entries(paymentTotals)
    .filter(([_, data]) => data.total > 0)
    .map(([method, data]) => ({
      method,
      total: data.total / 100,
      count: data.count,
      percent: totalExpensesPaise > 0 ? (data.total / totalExpensesPaise) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const allowance = (budget?.allowance ?? 0) / 100;
  const openingBalance = (budget?.openingBalance ?? 0) / 100;
  const totalAvailable = allowance + openingBalance;
  const totalSpent = totalExpensesPaise / 100;

  // Days with expenses count
  const activeDays = Object.values(dailySpendMap).filter((amt) => amt > 0).length || 1;
  const dailyAverage = totalSpent / activeDays;

  return ok({
    month,
    totalAvailable,
    totalSpent,
    budgetSpent: budgetExpensesPaise / 100,
    exclusiveSpent: exclusiveExpensesPaise / 100,
    totalIncome: totalIncomePaise > 0 ? totalIncomePaise / 100 : allowance,
    remaining: totalAvailable - (budgetExpensesPaise / 100),
    percentUsed: totalAvailable > 0 ? ((budgetExpensesPaise / 100) / totalAvailable) * 100 : 0,
    dailyAverage,
    highestDay,
    dailyTrend,
    categoryBreakdown,
    paymentBreakdown,
  });
}
