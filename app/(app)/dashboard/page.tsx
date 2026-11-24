import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { monthKeyIST } from "@/lib/finance";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your monthly spending overview and remaining balance",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const month = monthKeyIST();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent
        userId={session.user.id!}
        userName={session.user.name ?? "Student"}
        month={month}
      />
    </Suspense>
  );
}
