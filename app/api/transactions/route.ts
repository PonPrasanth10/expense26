/**
 * GET /api/transactions — List with cursor pagination, search, filters
 * POST /api/transactions — Create new transaction
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import TransactionModel from "@/models/Transaction";
import { ok, err, getAuthenticatedUserId, parseBody } from "@/lib/api-helpers";
import { createTransactionSchema, listTransactionsSchema } from "@/lib/validations";
import { monthKeyIST } from "@/lib/finance";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// ─── GET /api/transactions ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  const sp = req.nextUrl.searchParams;
  const queryParsed = listTransactionsSchema.safeParse({
    month: sp.get("month") ?? monthKeyIST(),
    categoryId: sp.get("categoryId") ?? undefined,
    paymentMethod: sp.get("paymentMethod") ?? undefined,
    type: sp.get("type") ?? undefined,
    search: sp.get("search") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    limit: sp.get("limit") ? Number(sp.get("limit")) : 30,
  });

  if (!queryParsed.success) return err("Invalid query params", 400, queryParsed.error.flatten());

  const { month, categoryId, paymentMethod, type, search, cursor, limit } = queryParsed.data;
  const [year, monthNum] = month!.split("-").map(Number);

  await connectDB();

  const uid = new mongoose.Types.ObjectId(userId);

  // Build date range
  const startDate = new Date(`${year}-${String(monthNum).padStart(2, "0")}-01T00:00:00+05:30`);
  const endDate = new Date(year, monthNum, 1);

  // Build query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {
    userId: uid,
    date: { $gte: startDate, $lt: endDate },
  };

  if (categoryId) query.categoryId = new mongoose.Types.ObjectId(categoryId);
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (type) query.type = type;
  if (search) {
    query.note = { $regex: search, $options: "i" };
  }
  if (cursor) {
    query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  const transactions = await TransactionModel.find(query)
    .sort({ date: -1, _id: -1 })
    .limit(limit + 1)
    .populate("categoryId", "name icon color")
    .lean();

  const hasMore = transactions.length > limit;
  const items = hasMore ? transactions.slice(0, limit) : transactions;
  const nextCursor = hasMore ? items[items.length - 1]._id.toString() : null;

  return ok({
    items: items.map((t) => ({
      id: t._id.toString(),
      type: t.type,
      amount: t.amount,
      category: t.categoryId,
      paymentMethod: t.paymentMethod,
      date: t.date,
      note: t.note,
      isExclusive: t.isExclusive ?? false,
      createdAt: t.createdAt,
    })),
    nextCursor,
    hasMore,
  });
}

// ─── POST /api/transactions ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid request body", 400);

  const parsed = parseBody(createTransactionSchema, body);
  if ("error" in parsed) return parsed.error;

  const { type, amount, categoryId, paymentMethod, date, note, isExclusive } = parsed.data;

  // Convert rupees to paise
  const amountPaise = Math.round(amount * 100);

  await connectDB();

  const uid = new mongoose.Types.ObjectId(userId);

  const transaction = await TransactionModel.create({
    userId: uid,
    type,
    amount: amountPaise,
    categoryId: categoryId ? new mongoose.Types.ObjectId(categoryId) : null,
    paymentMethod,
    date: new Date(`${date}T12:00:00+05:30`),
    note: note ?? null,
    isExclusive: type === "expense" ? Boolean(isExclusive) : false,
  });

  const populated = await transaction.populate("categoryId", "name icon color");

  return ok(
    {
      id: populated._id.toString(),
      type: populated.type,
      amount: populated.amount,
      category: populated.categoryId,
      paymentMethod: populated.paymentMethod,
      date: populated.date,
      note: populated.note,
      isExclusive: populated.isExclusive ?? false,
    },
    201
  );
}
