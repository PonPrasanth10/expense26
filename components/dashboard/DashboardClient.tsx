"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle, TrendingUp, TrendingDown, Calendar, AlertTriangle } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatINR, formatRelativeDate } from "@/lib/format";

interface CategoryRow {
  categoryId: string | null;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
  percent: number;
  limit?: number;
}

interface Transaction {
  id: string;
  type: "expense" | "income";
  amount: number;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  paymentMethod: string;
  date: string;
  note: string | null;
  isExclusive?: boolean;
}

interface Summary {
  totalAvailable: number;
  totalExpenses: number;
  totalIncome: number;
  remaining: number;
  budgetUsedPercent: number;
  dailyLimit: number;
  daysRemaining: number;
  statusLabel: string;
  statusBadgeClass: string;
  statusColorClass: string;
  exclusiveTotal?: number;
}

interface Budget {
  allowance: number;
  source: string;
  alertThresholds: { level: string; percent: number }[];
}

interface DashboardClientProps {
  month: string;
  monthLabel: string;
  userName: string;
  summary: Summary;
  budget: Budget | null;
  categoryBreakdown: CategoryRow[];
  recentTransactions: Transaction[];
  hasBudget: boolean;
}

export function DashboardClient({
  monthLabel,
  userName,
  summary,
  budget,
  categoryBreakdown,
  recentTransactions,
  hasBudget,
}: DashboardClientProps) {
  const router = useRouter();
  const pct = summary.budgetUsedPercent;

  // Determine alert level for banners
  const showWarning = pct >= 75 && pct < 90;
  const showCritical = pct >= 90 && pct < 100;
  const showOverBudget = pct >= 100;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="page-container space-y-4 animate-fade-slide-up">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {greeting()}, {userName.split(" ")[0]} 👋
          </p>
          <h1 className="text-xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
            {monthLabel}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="btn-ghost p-2 rounded-full" aria-label="Settings">
            <Calendar size={20} aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* Budget setup CTA */}
      {!hasBudget && (
        <div
          className="card p-4 border-2 border-dashed text-center space-y-2"
          style={{ borderColor: "var(--color-primary)", background: "var(--color-primary-light)" }}
        >
          <p className="font-semibold" style={{ color: "var(--color-primary)" }}>
            Set your monthly budget
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Enter your allowance amount to start tracking
          </p>
          <Link href="/settings" className="btn-primary text-sm px-4 py-2 inline-flex">
            Set Budget →
          </Link>
        </div>
      )}

      {/* Alert banners */}
      {showOverBudget && (
        <div
          className="card p-3 flex items-start gap-2"
          style={{ background: "var(--color-danger-light)", borderColor: "var(--color-danger)" }}
        >
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-danger)" }} aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-danger)" }}>Over budget!</p>
            <p className="text-xs mt-0.5" style={{ color: "#B91C1C" }}>
              You&apos;ve spent {formatINR(summary.totalExpenses - summary.totalAvailable)} more than your budget.
            </p>
          </div>
        </div>
      )}
      {showCritical && (
        <div
          className="card p-3 flex items-start gap-2"
          style={{ background: "var(--color-warning-light)", borderColor: "var(--color-warning)" }}
        >
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-warning)" }} aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#92400E" }}>Warning: {pct.toFixed(0)}% spent</p>
            <p className="text-xs mt-0.5" style={{ color: "#78350F" }}>
              Spend carefully — only {formatINR(summary.remaining)} left.
            </p>
          </div>
        </div>
      )}
      {showWarning && (
        <div
          className="card p-3 flex items-start gap-2"
          style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}
        >
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#F59E0B" }} aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#92400E" }}>Watch your spending</p>
            <p className="text-xs mt-0.5" style={{ color: "#78350F" }}>
              You&apos;ve used {pct.toFixed(0)}% of your budget this month.
            </p>
          </div>
        </div>
      )}

      {/* Main balance card */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            Remaining Balance
          </span>
          <span className={`badge ${summary.statusBadgeClass}`}>
            {summary.statusLabel}
          </span>
        </div>

        <div>
          <p
            className="text-4xl font-bold tracking-tight"
            style={{ color: summary.remaining < 0 ? "var(--color-danger)" : "var(--text-primary)" }}
          >
            {formatINR(Math.abs(summary.remaining))}
            {summary.remaining < 0 && (
              <span className="text-base font-medium ml-1" style={{ color: "var(--color-danger)" }}>
                overdrawn
              </span>
            )}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            of {formatINR(summary.totalAvailable)} total
            {budget && (
              <span className="ml-1">· from {budget.source}</span>
            )}
          </p>
        </div>

        <ProgressBar value={pct} className="mt-2" />

        <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{pct.toFixed(1)}% spent</span>
          <span>{(100 - Math.min(pct, 100)).toFixed(1)}% remaining</span>
        </div>

        {summary.exclusiveTotal && summary.exclusiveTotal > 0 ? (
          <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: "var(--border-color)" }}>
            <span className="flex items-center gap-1.5 font-medium text-purple-600 dark:text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>
              {formatINR(summary.exclusiveTotal)} exclusive
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Outside monthly budget
            </span>
          </div>
        ) : null}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Income"
          value={formatINR(summary.totalIncome)}
          Icon={TrendingUp}
          color="var(--color-success)"
          bg="var(--color-success-light)"
        />
        <StatCard
          label="Total Spent"
          value={formatINR(summary.totalExpenses)}
          Icon={TrendingDown}
          color="var(--color-danger)"
          bg="var(--color-danger-light)"
        />
        <StatCard
          label="Daily Limit"
          value={formatINR(summary.dailyLimit)}
          subtext="/day"
          Icon={Calendar}
          color="var(--color-primary)"
          bg="var(--color-primary-light)"
        />
        <div
          className="card flex flex-col justify-between p-4"
          style={{ minHeight: 88 }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Days Left
          </span>
          <div>
            <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {summary.daysRemaining}
            </span>
            <span className="text-sm ml-1" style={{ color: "var(--text-muted)" }}>
              days
            </span>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Spending by Category
          </h2>
          <div className="space-y-3">
            {categoryBreakdown.map((cat) => (
              <div key={cat.categoryId ?? "uncategorized"}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none" aria-hidden="true">
                      {cat.icon}
                    </span>
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    {formatINR(cat.total)}
                  </span>
                </div>
                <ProgressBar value={cat.percent} color={cat.color} />
                <div className="flex justify-between mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>{cat.percent.toFixed(1)}% of expenses</span>
                  {cat.limit && (
                    <span>limit: {formatINR(cat.limit)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/analytics"
            className="text-sm font-medium block text-center pt-1 transition-colors duration-150"
            style={{ color: "var(--color-primary)" }}
          >
            View full analytics →
          </Link>
        </div>
      )}

      {/* Recent transactions */}
      <div className="card space-y-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Recent Transactions
          </h2>
          <Link
            href="/transactions"
            className="text-xs font-medium transition-colors duration-150"
            style={{ color: "var(--color-primary)" }}
          >
            View all
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🧾</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No transactions yet this month
            </p>
            <button
              onClick={() => router.push("/add")}
              className="btn-primary text-sm mt-3 px-4 py-2"
            >
              Add first transaction
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
            {recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: t.categoryColor ? `${t.categoryColor}22` : "var(--bg-muted)" }}
                  aria-hidden="true"
                >
                  {t.categoryIcon ?? "🏷️"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {t.note ?? t.categoryName ?? "Transaction"}
                    </p>
                    {t.isExclusive && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex-shrink-0">
                        Exclusive
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {t.categoryName} · {formatRelativeDate(t.date)} · {t.paymentMethod}
                    {t.isExclusive ? " · Outside budget" : ""}
                  </p>
                </div>
                <span
                  className="text-sm font-semibold flex-shrink-0"
                  style={{
                    color:
                      t.type === "income" ? "var(--color-success)" : "var(--text-primary)",
                  }}
                >
                  {t.type === "income" ? "+" : "−"}{formatINR(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/add"
        className="fab"
        aria-label="Add new transaction"
        id="fab-add-transaction"
      >
        <PlusCircle size={26} aria-hidden="true" />
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  Icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  subtext?: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="card flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-[8px] flex items-center justify-center"
          style={{ background: bg }}
          aria-hidden="true"
        >
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
      </div>
      <div>
        <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {value}
        </span>
        {subtext && (
          <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
