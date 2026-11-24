import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics & Insights | StudentSpend",
  description: "Detailed analytics of student expenses, category breakdowns, and spending trends.",
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <AnalyticsClient />;
}
