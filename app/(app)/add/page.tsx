import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AddTransactionForm } from "@/components/transactions/AddTransactionForm";
import { connectDB } from "@/lib/db";
import CategoryModel from "@/models/Category";
import TransactionModel from "@/models/Transaction";
import mongoose from "mongoose";

export const metadata: Metadata = {
  title: "Add / Edit Transaction",
  description: "Record or update an expense or income entry",
};

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  await connectDB();
  const uid = new mongoose.Types.ObjectId(session.user.id);

  const categories = await CategoryModel.find({ userId: uid })
    .sort({ isDefault: -1, name: 1 })
    .lean();

  const cats = categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    icon: c.icon,
    color: c.color,
  }));

  // Check if editing an existing transaction
  let initialTransaction = null;
  if (params?.edit && mongoose.isValidObjectId(params.edit)) {
    const txn = await TransactionModel.findOne({
      _id: new mongoose.Types.ObjectId(params.edit),
      userId: uid,
    }).lean();

    if (txn) {
      initialTransaction = {
        id: txn._id.toString(),
        type: txn.type,
        amount: txn.amount / 100, // convert paise to rupees for input
        categoryId: txn.categoryId ? txn.categoryId.toString() : null,
        paymentMethod: txn.paymentMethod,
        date: txn.date.toISOString().split("T")[0],
        note: txn.note ?? "",
        isExclusive: txn.isExclusive ?? false,
      };
    }
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {initialTransaction ? "Edit Transaction" : "Add Transaction"}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          {initialTransaction
            ? "Modify your recorded transaction details"
            : "Record a new expense or income"}
        </p>
      </div>
      <AddTransactionForm
        categories={cats}
        initialTransaction={initialTransaction}
      />
    </div>
  );
}
