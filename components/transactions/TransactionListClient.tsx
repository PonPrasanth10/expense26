"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Trash2, Pencil, X } from "lucide-react";
import { formatINR, formatRelativeDate, formatMonthKey } from "@/lib/format";

interface Transaction {
  id: string;
  type: "expense" | "income";
  amount: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  paymentMethod: string;
  date: string;
  note: string | null;
  isExclusive?: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Props {
  transactions: Transaction[];
  categories: Category[];
  month: string;
  initialFilters?: {
    categoryId?: string;
    paymentMethod?: string;
    type?: string;
    search?: string;
  };
}

type Filters = {
  search: string;
  categoryId: string;
  paymentMethod: string;
  type: string;
};

export function TransactionListClient({
  transactions: initialTransactions,
  categories,
  month,
  initialFilters = {},
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: initialFilters.search ?? "",
    categoryId: initialFilters.categoryId ?? "",
    paymentMethod: initialFilters.paymentMethod ?? "",
    type: initialFilters.type ?? "",
  });

  const [localTransactions, setLocalTransactions] = useState(initialTransactions);

  // Client-side filter (server already filtered, this handles search box live typing)
  const filtered = useMemo(() => {
    return localTransactions.filter((t) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          t.note?.toLowerCase().includes(q) ||
          t.categoryName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [localTransactions, filters.search]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const dateKey = t.date.split("T")[0];
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [filtered]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLocalTransactions((prev) => prev.filter((t) => t.id !== id));
      startTransition(() => router.refresh());
    }
    setDeletingId(null);
  };

  const applyFilters = () => {
    const params = new URLSearchParams({ month });
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
    if (filters.type) params.set("type", filters.type);
    startTransition(() => router.push(`/transactions?${params.toString()}`));
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ search: "", categoryId: "", paymentMethod: "", type: "" });
    startTransition(() => router.push(`/transactions?month=${month}`));
  };

  const hasActiveFilters = filters.categoryId || filters.paymentMethod || filters.type;

  const dailyTotal = (txns: Transaction[]) => {
    const expenses = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    return { expenses, income };
  };

  return (
    <div className="space-y-4 animate-fade-slide-up">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          {formatMonthKey(month)}
        </span>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
            aria-hidden="true"
          />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search transactions…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            aria-label="Search transactions"
          />
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`btn-secondary px-3 relative ${hasActiveFilters ? "ring-2 ring-indigo-500" : ""}`}
          aria-expanded={showFilters}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={18} aria-hidden="true" />
          {hasActiveFilters && (
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
              style={{ background: "var(--color-primary)" }}
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 space-y-3 animate-fade-slide-up">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Filters
            </span>
            <button onClick={() => setShowFilters(false)} className="btn-ghost p-1" aria-label="Close filters">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Type */}
          <div>
            <label className="label" htmlFor="filter-type">Type</label>
            <select
              id="filter-type"
              className="input"
              style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="">All types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="label" htmlFor="filter-cat">Category</label>
            <select
              id="filter-cat"
              className="input"
              style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
              value={filters.categoryId}
              onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Payment method */}
          <div>
            <label className="label" htmlFor="filter-payment">Payment method</label>
            <select
              id="filter-payment"
              className="input"
              style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
              value={filters.paymentMethod}
              onChange={(e) => setFilters((f) => ({ ...f, paymentMethod: e.target.value }))}
            >
              <option value="">All methods</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank transfer">Bank transfer</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={clearFilters} className="btn-secondary flex-1 text-sm">
              Clear all
            </button>
            <button onClick={applyFilters} disabled={isPending} className="btn-primary flex-1 text-sm">
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Transaction groups */}
      {grouped.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-3xl mb-2">🧾</p>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            No transactions found
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {hasActiveFilters ? "Try clearing filters" : "Add your first transaction"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dateKey, txns]) => {
            const { expenses, income } = dailyTotal(txns);
            return (
              <div key={dateKey} className="card p-0 overflow-hidden">
                {/* Date header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 border-b"
                  style={{ borderColor: "var(--border-color)", background: "var(--bg-muted)" }}
                >
                  <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {formatRelativeDate(new Date(dateKey))}
                  </span>
                  <div className="flex gap-3 text-xs">
                    {income > 0 && (
                      <span style={{ color: "var(--color-success)" }}>+{formatINR(income)}</span>
                    )}
                    {expenses > 0 && (
                      <span style={{ color: "var(--color-danger)" }}>−{formatINR(expenses)}</span>
                    )}
                  </div>
                </div>

                {/* Transactions */}
                <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                  {txns.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-4 py-3 transition-colors duration-150"
                      style={{ opacity: deletingId === t.id ? 0.5 : 1 }}
                    >
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
                          {t.categoryName}{t.categoryName ? " · " : ""}{t.paymentMethod}
                          {t.isExclusive ? " · Outside budget" : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: t.type === "income" ? "var(--color-success)" : "var(--text-primary)" }}
                        >
                          {t.type === "income" ? "+" : "−"}{formatINR(t.amount)}
                        </span>
                        <button
                          onClick={() => router.push(`/add?edit=${t.id}`)}
                          className="btn-ghost p-1.5 ml-1"
                          aria-label={`Edit transaction: ${t.note ?? t.categoryName}`}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                          className="btn-ghost p-1.5"
                          aria-label={`Delete transaction: ${t.note ?? t.categoryName}`}
                          style={{ color: "var(--color-danger)" }}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
