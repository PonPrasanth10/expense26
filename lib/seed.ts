/**
 * lib/seed.ts
 * Seeds default categories for a new user.
 * Also provides a demo data seeder for the ₹8,000 November example.
 */

import { connectDB } from "./db";
import CategoryModel from "@/models/Category";
import TransactionModel from "@/models/Transaction";
import BudgetModel from "@/models/Budget";
import mongoose from "mongoose";

// ─── Default Categories ───────────────────────────────────────────────────────

interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Food",           icon: "🍱", color: "#F59E0B" },
  { name: "Snacks",         icon: "🍕", color: "#FB923C" },
  { name: "Travel",         icon: "🚌", color: "#3B82F6" },
  { name: "Entertainment",  icon: "🎬", color: "#A855F7" },
  { name: "Recharge",       icon: "📱", color: "#06B6D4" },
  { name: "Education",      icon: "📚", color: "#4F46E5" },
  { name: "Shopping",       icon: "🛍️", color: "#EC4899" },
  { name: "Personal Care",  icon: "🧴", color: "#14B8A6" },
  { name: "Hostel & Rent",  icon: "🏠", color: "#84CC16" },
  { name: "Subscriptions",  icon: "💳", color: "#8B5CF6" },
  { name: "College Fees",   icon: "🎓", color: "#0EA5E9" },
  { name: "Emergency",      icon: "🚨", color: "#DC2626" },
  { name: "Gifts",          icon: "🎁", color: "#F43F5E" },
  { name: "Savings",        icon: "💰", color: "#16A34A" },
];

export async function seedDefaultCategories(userId: string): Promise<void> {
  await connectDB();

  const uid = new mongoose.Types.ObjectId(userId);
  const existing = await CategoryModel.countDocuments({ userId: uid });
  if (existing > 0) return; // Already seeded

  const docs = DEFAULT_CATEGORIES.map((cat) => ({
    userId: uid,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    isDefault: true,
  }));

  await CategoryModel.insertMany(docs);
}

// ─── Demo Data Seeder ─────────────────────────────────────────────────────────

/**
 * Seeds the ₹8,000 November example for a given user.
 * Creates a budget and sample transactions totaling ₹3,350 spent.
 */
export async function seedDemoData(userId: string): Promise<void> {
  await connectDB();

  const uid = new mongoose.Types.ObjectId(userId);
  const month = "2026-11";

  // Ensure categories exist
  await seedDefaultCategories(userId);

  const categories = await CategoryModel.find({ userId: uid }).lean();
  const catByName = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  // Create/update budget for November 2026
  await BudgetModel.findOneAndUpdate(
    { userId: uid, month },
    {
      userId: uid,
      month,
      openingBalance: 0,
      allowance: 800_000, // ₹8,000 in paise
      receivedOn: new Date("2026-11-01T00:00:00+05:30"),
      nextAllowanceDate: new Date("2026-12-01T00:00:00+05:30"),
      source: "Parents",
      carryForward: false,
    },
    { upsert: true, new: true }
  );

  // Sample transactions totaling ₹3,350 in regular budget expenses + 1 exclusive fee
  const demoTransactions = [
    { type: "income",  amount: 800_000, catName: null,            date: "2026-11-01", note: "Monthly allowance from parents", paymentMethod: "Bank transfer", isExclusive: false },
    { type: "expense", amount:  90_000, catName: "Food",          date: "2026-11-02", note: "Mess advance for November",       paymentMethod: "UPI",           isExclusive: false },
    { type: "expense", amount:  12_000, catName: "Travel",        date: "2026-11-03", note: "Metro & bus pass",                paymentMethod: "Cash",          isExclusive: false },
    { type: "expense", amount:  25_000, catName: "Snacks",        date: "2026-11-04", note: "Canteen and chai",                paymentMethod: "Cash",          isExclusive: false },
    { type: "expense", amount:  19_900, catName: "Recharge",      date: "2026-11-05", note: "Monthly mobile recharge",         paymentMethod: "UPI",           isExclusive: false },
    { type: "expense", amount:  35_000, catName: "Education",     date: "2026-11-06", note: "Lab manual and stationery",       paymentMethod: "Cash",          isExclusive: false },
    { type: "expense", amount:  50_000, catName: "Entertainment", date: "2026-11-08", note: "Movie with friends",              paymentMethod: "UPI",           isExclusive: false },
    { type: "expense", amount:  30_000, catName: "Shopping",      date: "2026-11-10", note: "T-shirt from Myntra",             paymentMethod: "Card",          isExclusive: false },
    { type: "expense", amount:  15_000, catName: "Personal Care", date: "2026-11-12", note: "Haircut",                        paymentMethod: "Cash",          isExclusive: false },
    { type: "expense", amount:  18_000, catName: "Subscriptions", date: "2026-11-13", note: "Spotify student combo",          paymentMethod: "UPI",           isExclusive: false },
    { type: "expense", amount:  40_100, catName: "Food",          date: "2026-11-15", note: "Weekend outing dinner",           paymentMethod: "UPI",           isExclusive: false },
    { type: "expense", amount: 150_000, catName: "College Fees",   date: "2026-11-16", note: "Semester exam fee (parent funded)",paymentMethod: "Bank transfer", isExclusive: true },
  ];

  // Clear existing demo transactions for this user/month
  await TransactionModel.deleteMany({
    userId: uid,
    date: {
      $gte: new Date("2026-11-01T00:00:00+05:30"),
      $lt: new Date("2026-12-01T00:00:00+05:30"),
    },
  });

  const docs = demoTransactions.map((t) => ({
    userId: uid,
    type: t.type,
    amount: t.amount,
    categoryId: t.catName ? catByName[t.catName] : undefined,
    date: new Date(`${t.date}T12:00:00+05:30`),
    note: t.note,
    paymentMethod: t.paymentMethod,
    isExclusive: t.isExclusive ?? false,
  }));

  await TransactionModel.insertMany(docs);
}
