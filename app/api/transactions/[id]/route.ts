/**
 * GET /api/transactions/[id] — Get single transaction
 * PATCH /api/transactions/[id] — Update transaction
 * DELETE /api/transactions/[id] — Delete transaction
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import TransactionModel from "@/models/Transaction";
import { ok, err, getAuthenticatedUserId, parseBody } from "@/lib/api-helpers";
import { createTransactionSchema } from "@/lib/validations";
import mongoose from "mongoose";

// ─── GET /api/transactions/[id] ───────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return err("Invalid ID", 400);

  await connectDB();

  const transaction = await TransactionModel.findOne({
    _id: id,
    userId: new mongoose.Types.ObjectId(userId),
  })
    .populate("categoryId", "name icon color")
    .lean();

  if (!transaction) return err("Transaction not found", 404);

  return ok({
    id: transaction._id.toString(),
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.categoryId,
    paymentMethod: transaction.paymentMethod,
    date: transaction.date,
    note: transaction.note,
    isExclusive: transaction.isExclusive ?? false,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  });
}

// ─── PATCH /api/transactions/[id] ────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return err("Invalid ID", 400);

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid request body", 400);

  const parsed = parseBody(createTransactionSchema.partial(), body);
  if ("error" in parsed) return parsed.error;

  const { type, amount, categoryId, paymentMethod, date, note, isExclusive } = parsed.data;

  await connectDB();

  const uid = new mongoose.Types.ObjectId(userId);

  const updates: Record<string, unknown> = {};
  if (type !== undefined) updates.type = type;
  if (amount !== undefined) updates.amount = Math.round(amount * 100);
  if (categoryId !== undefined) updates.categoryId = categoryId ? new mongoose.Types.ObjectId(categoryId) : null;
  if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
  if (date !== undefined) updates.date = new Date(`${date}T12:00:00+05:30`);
  if (note !== undefined) updates.note = note ?? null;
  if (isExclusive !== undefined) updates.isExclusive = Boolean(isExclusive);

  const updated = await TransactionModel.findOneAndUpdate(
    { _id: id, userId: uid },
    { $set: updates },
    { new: true }
  )
    .populate("categoryId", "name icon color")
    .lean();

  if (!updated) return err("Transaction not found", 404);

  return ok({
    id: updated._id.toString(),
    type: updated.type,
    amount: updated.amount,
    category: updated.categoryId,
    paymentMethod: updated.paymentMethod,
    date: updated.date,
    note: updated.note,
    isExclusive: updated.isExclusive ?? false,
  });
}

// ─── DELETE /api/transactions/[id] ───────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return err("Invalid ID", 400);

  await connectDB();

  const deleted = await TransactionModel.findOneAndDelete({
    _id: id,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!deleted) return err("Transaction not found", 404);

  return ok({ deleted: true });
}
