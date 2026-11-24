/**
 * GET /api/budget?month=YYYY-MM — Get budget for a month
 * PUT /api/budget — Create or update budget for a month
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import BudgetModel from "@/models/Budget";
import TransactionModel from "@/models/Transaction";
import { ok, err, getAuthenticatedUserId, parseBody } from "@/lib/api-helpers";
import { createBudgetSchema } from "@/lib/validations";
import { monthKeyIST } from "@/lib/finance";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  const month = req.nextUrl.searchParams.get("month") ?? monthKeyIST();

  await connectDB();

  const budget = await BudgetModel.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    month,
  }).lean();

  if (!budget) return ok(null);

  return ok({
    id: budget._id.toString(),
    month: budget.month,
    allowance: budget.allowance,
    openingBalance: budget.openingBalance,
    receivedOn: budget.receivedOn,
    nextAllowanceDate: budget.nextAllowanceDate,
    source: budget.source,
    carryForward: budget.carryForward,
    alertThresholds: budget.alertThresholds,
    categoryLimits: budget.categoryLimits,
  });
}

export async function PUT(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid request body", 400);

  const parsed = parseBody(createBudgetSchema, body);
  if ("error" in parsed) return parsed.error;

  const { month, allowance, receivedOn, nextAllowanceDate, source, carryForward, openingBalance } =
    parsed.data;

  // Convert rupees to paise
  const allowancePaise = Math.round(allowance * 100);
  const openingPaise = Math.round(openingBalance * 100);

  await connectDB();

  const uid = new mongoose.Types.ObjectId(userId);

  const budget = await BudgetModel.findOneAndUpdate(
    { userId: uid, month },
    {
      $set: {
        userId: uid,
        month,
        allowance: allowancePaise,
        openingBalance: openingPaise,
        receivedOn: new Date(`${receivedOn}T00:00:00+05:30`),
        nextAllowanceDate: nextAllowanceDate
          ? new Date(`${nextAllowanceDate}T00:00:00+05:30`)
          : null,
        source,
        carryForward,
      },
    },
    { upsert: true, new: true }
  );

  // Synchronize or create the allowance Income transaction for this month
  if (allowancePaise > 0) {
    const [yearStr, monthStr] = month.split("-");
    const monthStart = new Date(`${yearStr}-${monthStr}-01T00:00:00+05:30`);
    const monthEnd = new Date(Number(yearStr), Number(monthStr), 1);

    let txnDate = new Date(`${receivedOn}T12:00:00+05:30`);
    if (isNaN(txnDate.getTime()) || txnDate < monthStart || txnDate >= monthEnd) {
      txnDate = new Date(`${month}-01T12:00:00+05:30`);
    }

    await TransactionModel.findOneAndUpdate(
      {
        userId: uid,
        type: "income",
        date: { $gte: monthStart, $lt: monthEnd },
        note: { $regex: /allowance/i },
      },
      {
        $set: {
          userId: uid,
          type: "income",
          amount: allowancePaise,
          date: txnDate,
          paymentMethod: "Bank transfer",
          note: `Monthly allowance from ${source}`,
        },
      },
      { upsert: true, new: true }
    );
  }

  return ok({
    id: budget._id.toString(),
    month: budget.month,
    allowance: budget.allowance,
    openingBalance: budget.openingBalance,
    source: budget.source,
    carryForward: budget.carryForward,
  });
}
