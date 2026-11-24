/**
 * POST /api/seed — Loads demo dataset for the authenticated user
 * DELETE /api/seed — Clears all transactions and budget for the authenticated user
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { seedDemoData } from "@/lib/seed";
import TransactionModel from "@/models/Transaction";
import BudgetModel from "@/models/Budget";
import { ok, err, getAuthenticatedUserId } from "@/lib/api-helpers";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  await connectDB();
  await seedDemoData(userId);

  return ok({ message: "Demo data loaded successfully for November 2026!" });
}

export async function DELETE(_req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  await connectDB();
  const uid = new mongoose.Types.ObjectId(userId);

  await Promise.all([
    TransactionModel.deleteMany({ userId: uid }),
    BudgetModel.deleteMany({ userId: uid }),
  ]);

  return ok({ message: "All transactions and budget data cleared." });
}
