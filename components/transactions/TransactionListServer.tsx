import { connectDB } from "@/lib/db";
import TransactionModel from "@/models/Transaction";
import CategoryModel from "@/models/Category";
import { monthKeyIST } from "@/lib/finance";
import { TransactionListClient } from "./TransactionListClient";
import mongoose from "mongoose";

interface Props {
  userId: string;
  month?: string;
  categoryId?: string;
  paymentMethod?: string;
  type?: string;
  search?: string;
}

export async function TransactionListServer({
  userId,
  month,
  categoryId,
  paymentMethod,
  type,
  search,
}: Props) {
  const currentMonth = month ?? monthKeyIST();
  const [year, monthNum] = currentMonth.split("-").map(Number);

  const startDate = new Date(`${year}-${String(monthNum).padStart(2, "0")}-01T00:00:00+05:30`);
  const endDate = new Date(year, monthNum, 1);

  await connectDB();
  const uid = new mongoose.Types.ObjectId(userId);

  // Build query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {
    userId: uid,
    date: { $gte: startDate, $lt: endDate },
  };
  if (categoryId) query.categoryId = new mongoose.Types.ObjectId(categoryId);
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (type === "expense" || type === "income") query.type = type;
  if (search) query.note = { $regex: search, $options: "i" };

  const [transactions, categories] = await Promise.all([
    TransactionModel.find(query)
      .sort({ date: -1, _id: -1 })
      .limit(50)
      .populate("categoryId", "name icon color")
      .lean(),
    CategoryModel.find({ userId: uid }).lean(),
  ]);

  const serialized = transactions.map((t) => {
    const cat = t.categoryId as { _id: mongoose.Types.ObjectId; name: string; icon: string; color: string } | null;
    return {
      id: t._id.toString(),
      type: t.type as "expense" | "income",
      amount: t.amount,
      categoryId: cat?._id?.toString() ?? null,
      categoryName: cat?.name ?? null,
      categoryIcon: cat?.icon ?? null,
      categoryColor: cat?.color ?? null,
      paymentMethod: t.paymentMethod as string,
      date: t.date.toISOString(),
      note: t.note ?? null,
      isExclusive: t.isExclusive ?? false,
      createdAt: t.createdAt.toISOString(),
    };
  });

  const cats = categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    icon: c.icon,
    color: c.color,
  }));

  return (
    <TransactionListClient
      transactions={serialized}
      categories={cats}
      month={currentMonth}
      initialFilters={{ categoryId, paymentMethod, type, search }}
    />
  );
}
