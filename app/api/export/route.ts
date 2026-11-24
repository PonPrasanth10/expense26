/**
 * GET /api/export?format=csv|json
 * Exports user transactions.
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import TransactionModel from "@/models/Transaction";
import { getAuthenticatedUserId } from "@/lib/api-helpers";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = req.nextUrl.searchParams.get("format") ?? "csv";

  await connectDB();
  const uid = new mongoose.Types.ObjectId(userId);

  const transactions = await TransactionModel.find({ userId: uid })
    .sort({ date: -1 })
    .populate("categoryId", "name")
    .lean();

  if (format === "json") {
    const data = transactions.map((t) => ({
      id: t._id.toString(),
      type: t.type,
      amountRupees: (t.amount / 100).toFixed(2),
      category: (t.categoryId as { name?: string } | null)?.name ?? "Uncategorized",
      paymentMethod: t.paymentMethod,
      isExclusive: t.isExclusive ?? false,
      date: t.date.toISOString().split("T")[0],
      note: t.note ?? "",
    }));

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="studentspend-transactions.json"',
      },
    });
  }

  // CSV format
  const rows = [
    ["Date", "Type", "Amount (INR)", "Category", "Payment Method", "Exclusive (Outside Budget)", "Note"],
    ...transactions.map((t) => [
      t.date.toISOString().split("T")[0],
      t.type,
      (t.amount / 100).toFixed(2),
      (t.categoryId as { name?: string } | null)?.name ?? "Uncategorized",
      t.paymentMethod ?? "UPI",
      t.isExclusive ? "Yes" : "No",
      `"${(t.note ?? "").replace(/"/g, '""')}"`,
    ]),
  ];

  const csvContent = rows.map((r) => r.join(",")).join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="studentspend-transactions.csv"',
    },
  });
}
