import { connectDB } from "@/lib/db";
import TransactionModel from "@/models/Transaction";
import BudgetModel from "@/models/Budget";
import CategoryModel from "@/models/Category";
import { computeSummary, daysRemainingInMonth, todayIST, monthKeyIST } from "@/lib/finance";
import { formatINR, formatMonth } from "@/lib/format";
import { DashboardClient } from "./DashboardClient";
import mongoose from "mongoose";

interface Props {
  userId: string;
  userName: string;
  month: string;
}

export async function DashboardContent({ userId, userName, month }: Props) {
  await connectDB();

  const uid = new mongoose.Types.ObjectId(userId);
  const [year, monthNum] = month.split("-").map(Number);

  const startDate = new Date(`${year}-${String(monthNum).padStart(2, "0")}-01T00:00:00+05:30`);
  const endDate = new Date(year, monthNum, 1);

  // Parallel DB queries
  const [aggResult, budget, categories, catBreakdown, recentTxns] = await Promise.all([
    TransactionModel.aggregate([
      { $match: { userId: uid, date: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: {
            type: "$type",
            isExclusive: { $ifNull: ["$isExclusive", false] },
          },
          total: { $sum: "$amount" },
        },
      },
    ]),
    BudgetModel.findOne({ userId: uid, month }).lean(),
    CategoryModel.find({ userId: uid }).lean(),
    TransactionModel.aggregate([
      { $match: { userId: uid, type: "expense", date: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 6 },
    ]),
    TransactionModel.find({ userId: uid, date: { $gte: startDate, $lt: endDate } })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .populate("categoryId", "name icon color")
      .lean(),
  ]);

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

  const openingBalance = budget?.openingBalance ?? 0;
  const today = todayIST();
  const currentMonth = monthKeyIST();
  const isCurrentMonth = month === currentMonth;
  const nextAllowanceDate = budget?.nextAllowanceDate
    ? new Date(budget.nextAllowanceDate)
    : undefined;
  const daysLeft = isCurrentMonth ? daysRemainingInMonth(today, nextAllowanceDate) : 0;

  // If no income transaction exists yet, fall back to the configured monthly allowance
  const effectiveIncome = totals.income > 0 ? totals.income : (budget?.allowance ?? 0);

  const summary = computeSummary({
    openingBalance,
    incomeReceived: effectiveIncome,
    totalExpenses: totals.expense,
    daysLeft,
  });

  const catMap = Object.fromEntries(categories.map((c) => [c._id.toString(), c]));

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
      limit: budget?.categoryLimits?.find(
        (l: { categoryId: { toString(): string }; limit: number }) =>
          l.categoryId.toString() === row._id?.toString()
      )?.limit,
    };
  });

  const serializedTransactions = recentTxns.map((t) => {
    const cat = t.categoryId as { name: string; icon: string; color: string } | null;
    return {
      id: t._id.toString(),
      type: t.type as "expense" | "income",
      amount: t.amount,
      categoryName: cat?.name ?? null,
      categoryIcon: cat?.icon ?? null,
      categoryColor: cat?.color ?? null,
      paymentMethod: t.paymentMethod as string,
      date: t.date.toISOString(),
      note: t.note ?? null,
      isExclusive: t.isExclusive ?? false,
    };
  });

  return (
    <DashboardClient
      month={month}
      monthLabel={formatMonth(new Date(year, monthNum - 1, 1))}
      userName={userName}
      summary={{
        totalAvailable: summary.totalAvailable,
        totalExpenses: summary.totalExpenses,
        totalIncome: summary.totalIncome,
        remaining: summary.remaining,
        budgetUsedPercent: summary.budgetUsedPercent,
        dailyLimit: summary.dailyLimit,
        daysRemaining: summary.daysRemaining,
        statusLabel: summary.status.label,
        statusBadgeClass: summary.status.badgeClass,
        statusColorClass: summary.status.colorClass,
        exclusiveTotal: totals.exclusiveExpense,
      }}
      budget={
        budget
          ? {
              allowance: budget.allowance,
              source: budget.source,
              alertThresholds: (budget.alertThresholds as Array<{ level: string; percent: number }>).map(
                (t: { level: string; percent: number }) => ({
                  level: t.level,
                  percent: t.percent,
                })
              ),
            }
          : null
      }
      categoryBreakdown={categoryBreakdown}
      recentTransactions={serializedTransactions}
      hasBudget={!!budget}
    />
  );
}
