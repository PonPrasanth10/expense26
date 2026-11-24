import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TransactionListServer } from "@/components/transactions/TransactionListServer";
import { TransactionListSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Transactions",
  description: "View and manage your transactions",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;

  return (
    <div className="page-container">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Transactions
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Your spending history
        </p>
      </div>
      <Suspense fallback={<TransactionListSkeleton />}>
        <TransactionListServer
          userId={session.user.id!}
          month={params.month}
          categoryId={params.categoryId}
          paymentMethod={params.paymentMethod}
          type={params.type}
          search={params.search}
        />
      </Suspense>
    </div>
  );
}
