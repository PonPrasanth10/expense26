import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import BudgetModel from "@/models/Budget";
import CategoryModel from "@/models/Category";
import { monthKeyIST } from "@/lib/finance";
import { SettingsClient } from "@/components/settings/SettingsClient";
import mongoose from "mongoose";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings & Allowance | StudentSpend",
  description: "Configure your monthly student allowance, custom categories, and export data.",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const currentMonth = monthKeyIST();
  await connectDB();

  const uid = new mongoose.Types.ObjectId(session.user.id);

  const [budgetDoc, categoriesDoc] = await Promise.all([
    BudgetModel.findOne({ userId: uid, month: currentMonth }).lean(),
    CategoryModel.find({ userId: uid }).sort({ isDefault: -1, name: 1 }).lean(),
  ]);

  const initialBudget = budgetDoc
    ? {
        month: budgetDoc.month,
        allowance: budgetDoc.allowance / 100,
        openingBalance: budgetDoc.openingBalance / 100,
        receivedOn: budgetDoc.receivedOn.toISOString(),
        nextAllowanceDate: budgetDoc.nextAllowanceDate
          ? budgetDoc.nextAllowanceDate.toISOString()
          : undefined,
        source: budgetDoc.source,
        carryForward: budgetDoc.carryForward,
      }
    : null;

  const initialCategories = categoriesDoc.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    icon: c.icon,
    color: c.color,
    isDefault: c.isDefault,
  }));

  return (
    <SettingsClient
      initialBudget={initialBudget}
      initialCategories={initialCategories}
      currentMonth={currentMonth}
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? "Student"}
    />
  );
}
