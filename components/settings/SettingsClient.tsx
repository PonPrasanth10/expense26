"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Calendar,
  Sparkles,
  Download,
  Trash2,
  Plus,
  Check,
  AlertCircle,
  Loader2,
  Tag,
  ShieldAlert,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
}

interface BudgetData {
  month: string;
  allowance: number; // in rupees
  openingBalance: number; // in rupees
  receivedOn: string;
  nextAllowanceDate?: string;
  source: string;
  carryForward: boolean;
}

interface SettingsClientProps {
  initialBudget: BudgetData | null;
  initialCategories: Category[];
  currentMonth: string;
  userEmail: string;
  userName: string;
}

const SOURCES = [
  "Parents",
  "Scholarship",
  "Part-time job",
  "Internship",
  "Freelancing",
  "Savings",
  "Other",
];

const POPULAR_EMOJIS = ["🍱", "🍕", "🚌", "🎬", "📱", "📚", "🛍️", "🧴", "🏠", "💳", "☕", "🏋️", "💡", "🎮", "🚲"];
const POPULAR_COLORS = ["#F59E0B", "#EF4444", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

export function SettingsClient({
  initialBudget,
  initialCategories,
  currentMonth,
  userEmail,
  userName,
}: SettingsClientProps) {
  const router = useRouter();

  // Budget form state
  const [allowance, setAllowance] = useState(initialBudget?.allowance?.toString() ?? "8000");
  const [openingBalance, setOpeningBalance] = useState(initialBudget?.openingBalance?.toString() ?? "0");
  const [source, setSource] = useState(initialBudget?.source ?? "Parents");
  const defaultReceivedOn = (() => {
    if (initialBudget?.receivedOn) {
      const d = initialBudget.receivedOn.split("T")[0];
      if (d.startsWith(currentMonth)) return d;
    }
    return `${currentMonth}-01`;
  })();

  const [receivedOn, setReceivedOn] = useState(defaultReceivedOn);
  const [nextAllowanceDate, setNextAllowanceDate] = useState(
    initialBudget?.nextAllowanceDate ? initialBudget.nextAllowanceDate.split("T")[0] : ""
  );
  const [carryForward, setCarryForward] = useState(initialBudget?.carryForward ?? false);

  const [savingBudget, setSavingBudget] = useState(false);
  const [budgetSuccess, setBudgetSuccess] = useState(false);
  const [budgetError, setBudgetError] = useState("");

  // Categories state
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🏷️");
  const [newCatColor, setNewCatColor] = useState("#F59E0B");
  const [addingCat, setAddingCat] = useState(false);
  const [catError, setCatError] = useState("");

  // Demo seed state
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // Save budget handler
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBudget(true);
    setBudgetSuccess(false);
    setBudgetError("");

    try {
      const res = await fetch("/api/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: currentMonth,
          allowance: parseFloat(allowance) || 0,
          openingBalance: parseFloat(openingBalance) || 0,
          source,
          receivedOn,
          nextAllowanceDate: nextAllowanceDate || undefined,
          carryForward,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to save budget");
      }

      setBudgetSuccess(true);
      router.refresh();
      setTimeout(() => setBudgetSuccess(false), 3000);
    } catch (err: unknown) {
      setBudgetError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSavingBudget(false);
    }
  };

  // Add custom category handler
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setAddingCat(true);
    setCatError("");

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          icon: newCatIcon,
          color: newCatColor,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to add category");
      }

      const json = await res.json();
      setCategories((prev) => [...prev, json.data]);
      setNewCatName("");
      router.refresh();
    } catch (err: unknown) {
      setCatError(err instanceof Error ? err.message : "Error adding category");
    } finally {
      setAddingCat(false);
    }
  };

  // Delete category handler
  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom category?")) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      }
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  // Seed demo data handler
  const handleSeedDemo = async () => {
    setSeeding(true);
    setActionMessage("");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        setActionMessage("Nov 2026 demo data loaded successfully! Redirecting...");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setActionMessage("Failed to seed demo data.");
    } finally {
      setSeeding(false);
    }
  };

  // Clear all data handler
  const handleClearData = async () => {
    if (!confirm("Are you sure? This will permanently delete all your transactions and monthly budgets.")) {
      return;
    }
    setClearing(true);
    setActionMessage("");
    try {
      const res = await fetch("/api/seed", { method: "DELETE" });
      if (res.ok) {
        setActionMessage("All user data cleared.");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setActionMessage("Failed to clear data.");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="page-container space-y-8 animate-fade-slide-up pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Settings & Budget
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Manage your monthly pocket money, alert thresholds, and categories
        </p>
      </div>

      {actionMessage && (
        <div className="card p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 flex items-center gap-2">
          <Check size={18} />
          <span className="text-sm font-medium">{actionMessage}</span>
        </div>
      )}

      {/* 1. Monthly Allowance Setup */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "var(--border-color)" }}>
          <Wallet size={20} className="text-primary" />
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Monthly Allowance for {currentMonth}
          </h2>
        </div>

        {budgetSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200 rounded-lg text-sm flex items-center gap-2">
            <Check size={16} /> Budget updated successfully!
          </div>
        )}

        {budgetError && (
          <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {budgetError}
          </div>
        )}

        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                Monthly Allowance (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  placeholder="8000"
                  className="input-field pl-8"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                Opening / Bank Balance (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0"
                  className="input-field pl-8"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                Source of Allowance
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="input-field"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                Allowance Received On
              </label>
              <input
                type="date"
                value={receivedOn}
                onChange={(e) => setReceivedOn(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                Next Allowance Date (Optional — for custom daily limit calculation)
              </label>
              <input
                type="date"
                value={nextAllowanceDate}
                onChange={(e) => setNextAllowanceDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="carryForward"
              checked={carryForward}
              onChange={(e) => setCarryForward(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="carryForward" className="text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}>
              Carry forward unspent balance to next month automatically
            </label>
          </div>

          <button
            type="submit"
            disabled={savingBudget}
            className="btn-primary py-2.5 px-6 text-sm flex items-center justify-center gap-2"
          >
            {savingBudget && <Loader2 size={16} className="animate-spin" />}
            Save Monthly Allowance
          </button>
        </form>
      </section>

      {/* 2. Custom Categories Management */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "var(--border-color)" }}>
          <Tag size={20} className="text-primary" />
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Spending Categories
          </h2>
        </div>

        {catError && (
          <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {catError}
          </div>
        )}

        {/* Existing Categories list */}
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium"
              style={{
                borderColor: `${c.color}40`,
                backgroundColor: `${c.color}15`,
                color: "var(--text-primary)",
              }}
            >
              <span>{c.icon}</span>
              <span>{c.name}</span>
              {!c.isDefault && (
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(c.id)}
                  className="ml-1 text-muted hover:text-red-500 transition-colors p-0.5"
                  title="Delete category"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add custom category form */}
        <form onSubmit={handleAddCategory} className="pt-3 border-t space-y-3" style={{ borderColor: "var(--border-color)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            Add Custom Category
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Emoji selector */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {POPULAR_EMOJIS.slice(0, 8).map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewCatIcon(emoji)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition-all ${
                    newCatIcon === emoji ? "border-primary ring-2 ring-primary/20 scale-105" : "border-transparent"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Color selector */}
            <div className="flex items-center gap-1">
              {POPULAR_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setNewCatColor(col)}
                  className="w-5 h-5 rounded-full transition-transform"
                  style={{
                    backgroundColor: col,
                    transform: newCatColor === col ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Gym, Library, Laundry"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="input-field text-sm"
              required
            />
            <button
              type="submit"
              disabled={addingCat || !newCatName.trim()}
              className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5 flex-shrink-0"
            >
              {addingCat ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Add
            </button>
          </div>
        </form>
      </section>

      {/* 3. Demo Data & One-Click Prototype Seeder */}
      <section className="card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "var(--border-color)" }}>
          <Sparkles size={20} className="text-amber-500" />
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Prototype Demo Data
          </h2>
        </div>

        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Load the exact reference scenario from the specification: November 2026 with ₹8,000 allowance,
          ₹3,350 across food, mess, transit, recharge, with status on track and ₹4,650 remaining.
        </p>

        <button
          onClick={handleSeedDemo}
          disabled={seeding}
          className="btn-primary py-2.5 px-4 text-sm flex items-center gap-2"
          style={{ background: "#4F46E5" }}
        >
          {seeding ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Load ₹8,000 November Demo Dataset
        </button>
      </section>

      {/* 4. Export & Preferences */}
      <section className="card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "var(--border-color)" }}>
          <Download size={20} className="text-primary" />
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Export & Backup
          </h2>
        </div>

        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Download your complete financial records for spreadsheets or tax records.
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            href="/api/export?format=csv"
            download
            className="btn-ghost border px-4 py-2 text-sm flex items-center gap-2 rounded-lg"
          >
            <Download size={16} /> Export to CSV (Excel)
          </a>
          <a
            href="/api/export?format=json"
            download
            className="btn-ghost border px-4 py-2 text-sm flex items-center gap-2 rounded-lg"
          >
            <Download size={16} /> Export to JSON
          </a>
        </div>
      </section>

      {/* 5. Danger Zone */}
      <section className="card p-6 border-rose-300 dark:border-rose-900 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-rose-200 dark:border-rose-900">
          <ShieldAlert size={20} className="text-rose-500" />
          <h2 className="text-lg font-semibold text-rose-600 dark:text-rose-400">
            Danger Zone
          </h2>
        </div>

        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Reset your account to a clean slate. This permanently clears all transactions and monthly allowances.
        </p>

        <button
          onClick={handleClearData}
          disabled={clearing}
          className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 text-sm rounded-lg flex items-center gap-2"
        >
          {clearing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          Clear All My Transactions & Data
        </button>
      </section>
    </div>
  );
}
