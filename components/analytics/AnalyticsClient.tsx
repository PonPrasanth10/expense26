"use client";

import { useState, useEffect, useCallback } from "react";
import { formatINR } from "@/lib/format";
import { monthKeyIST } from "@/lib/finance";
import {
  TrendingUp,
  CreditCard,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Zap,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

interface DailyItem {
  day: number;
  date: string;
  amount: number;
}

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
  percent: number;
}

interface PaymentItem {
  method: string;
  total: number;
  count: number;
  percent: number;
}

interface AnalyticsData {
  month: string;
  totalAvailable: number;
  totalSpent: number;
  budgetSpent?: number;
  exclusiveSpent?: number;
  totalIncome: number;
  remaining: number;
  percentUsed: number;
  dailyAverage: number;
  highestDay: { day: number; amount: number };
  dailyTrend: DailyItem[];
  categoryBreakdown: CategoryItem[];
  paymentBreakdown: PaymentItem[];
}

export function AnalyticsClient() {
  const [month, setMonth] = useState(monthKeyIST());
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (selectedMonth: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?month=${selectedMonth}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(month);
  }, [month, fetchAnalytics]);

  // Calculate max daily spend for bar scaling
  const maxDaily = data?.dailyTrend
    ? Math.max(...data.dailyTrend.map((d) => d.amount), 100)
    : 100;

  return (
    <div className="page-container space-y-6 animate-fade-slide-up pb-12">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Spending Insights
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Visual analysis of your college expenses & trends
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={18} style={{ color: "var(--text-muted)" }} />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input-field text-sm font-medium py-1.5 px-3 rounded-lg border w-auto"
          />
        </div>
      </div>

      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Calculating statistics...
          </p>
        </div>
      ) : !data || data.totalSpent === 0 ? (
        <div className="card p-8 text-center space-y-3">
          <div className="text-4xl">📊</div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            No expenses recorded yet
          </h3>
          <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
            Start logging your daily tea, mess, snacks, or transit to see your breakdown and spending health.
          </p>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4 space-y-1">
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <TrendingUp size={14} /> Total Spent
              </span>
              <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {formatINR(data.totalSpent * 100)}
              </p>
              <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                <span>{data.percentUsed.toFixed(1)}% of allowance</span>
                {data.exclusiveSpent && data.exclusiveSpent > 0 ? (
                  <span className="block text-purple-600 dark:text-purple-400 font-medium">
                    incl. {formatINR(data.exclusiveSpent * 100)} exclusive
                  </span>
                ) : null}
              </div>
            </div>

            <div className="card p-4 space-y-1">
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <Zap size={14} /> Daily Average
              </span>
              <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {formatINR(data.dailyAverage * 100)}
              </p>
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                per active day
              </span>
            </div>

            <div className="card p-4 space-y-1">
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <ArrowUpRight size={14} /> Peak Spend Day
              </span>
              <p className="text-xl font-bold" style={{ color: "var(--color-danger)" }}>
                {formatINR(data.highestDay.amount * 100)}
              </p>
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                on Day {data.highestDay.day}
              </span>
            </div>

            <div className="card p-4 space-y-1">
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <PieIcon size={14} /> Top Category
              </span>
              <p className="text-xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {data.categoryBreakdown[0]?.name ?? "—"}
              </p>
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {data.categoryBreakdown[0]?.percent.toFixed(0)}% of total
              </span>
            </div>
          </div>

          {/* Daily Spending Trend Chart */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                  Daily Spending Curve
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Hover over bars to inspect daily ₹ amount
                </p>
              </div>
              <BarChart3 size={20} style={{ color: "var(--text-muted)" }} />
            </div>

            {/* Custom Interactive SVG / Flex Bar Chart */}
            <div className="pt-4">
              <div className="flex items-end gap-1 sm:gap-2 h-44 border-b pb-1" style={{ borderColor: "var(--border-color)" }}>
                {data.dailyTrend.map((item) => {
                  const heightPct = (item.amount / maxDaily) * 100;
                  const isPeak = item.day === data.highestDay.day && item.amount > 0;
                  return (
                    <div
                      key={item.day}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="bg-neutral-900 text-white text-[10px] px-2 py-1 rounded shadow whitespace-nowrap">
                          Day {item.day}: {formatINR(item.amount * 100)}
                        </div>
                        <div className="w-1.5 h-1.5 bg-neutral-900 rotate-45 -mt-0.5"></div>
                      </div>

                      {/* Bar */}
                      <div
                        className="w-full rounded-t-sm transition-all duration-300 hover:brightness-110"
                        style={{
                          height: item.amount > 0 ? `${Math.max(heightPct, 6)}%` : "2px",
                          backgroundColor: isPeak
                            ? "var(--color-danger)"
                            : item.amount > 0
                            ? "var(--color-primary)"
                            : "var(--border-color)",
                          opacity: item.amount > 0 ? 1 : 0.4,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Day Labels */}
              <div className="flex justify-between text-[10px] pt-2 font-mono" style={{ color: "var(--text-muted)" }}>
                <span>1</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span>20</span>
                <span>25</span>
                <span>{data.dailyTrend.length}</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown & Payment Methods Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Breakdown Card */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                  Where Your Money Went
                </h3>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {data.categoryBreakdown.length} Categories
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="h-3 rounded-full overflow-hidden flex w-full">
                {data.categoryBreakdown.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      width: `${c.percent}%`,
                      backgroundColor: c.color,
                    }}
                    title={`${c.name}: ${c.percent.toFixed(1)}%`}
                  />
                ))}
              </div>

              {/* Category rows */}
              <div className="space-y-3 pt-2">
                {data.categoryBreakdown.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        {cat.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {cat.name}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {cat.count} transaction{cat.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {formatINR(cat.total * 100)}
                      </p>
                      <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
                        {cat.percent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods Card */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                  Payment Channels
                </h3>
                <CreditCard size={18} style={{ color: "var(--text-muted)" }} />
              </div>

              <div className="space-y-4 pt-1">
                {data.paymentBreakdown.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    No payment data available.
                  </p>
                ) : (
                  data.paymentBreakdown.map((pm) => (
                    <div key={pm.method} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {pm.method}
                        </span>
                        <div className="space-x-2">
                          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                            {formatINR(pm.total * 100)}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            ({pm.percent.toFixed(0)}%)
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pm.percent}%`,
                            backgroundColor:
                              pm.method === "UPI"
                                ? "#06B6D4"
                                : pm.method === "Cash"
                                ? "#10B981"
                                : pm.method === "Card"
                                ? "#6366F1"
                                : "#8B5CF6",
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Student Advice / Tip */}
              <div
                className="mt-6 p-4 rounded-xl border space-y-1"
                style={{
                  backgroundColor: "var(--color-primary-light)",
                  borderColor: "var(--color-primary)",
                }}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-primary">
                  <Zap size={14} /> Smart Tip
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Small daily UPI spends (chai, snacks, photocopy) add up fast! Setting a daily budget cap
                  keeps you stress-free during exam week.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
