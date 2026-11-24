"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { z } from "zod";
import { createTransactionSchema } from "@/lib/validations";

type FormData = z.infer<typeof createTransactionSchema>;

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface InitialTransaction {
  id: string;
  type: "expense" | "income";
  amount: number;
  categoryId: string | null;
  paymentMethod: "UPI" | "Cash" | "Card" | "Bank transfer";
  date: string;
  note?: string;
  isExclusive?: boolean;
}

interface Props {
  categories: Category[];
  defaultDate?: string;
  initialTransaction?: InitialTransaction | null;
}

const PAYMENT_METHODS = ["UPI", "Cash", "Card", "Bank transfer"] as const;
const TYPES = [
  { value: "expense", label: "Expense", emoji: "💸" },
  { value: "income",  label: "Income",  emoji: "💰" },
] as const;

export function AddTransactionForm({ categories, defaultDate, initialTransaction }: Props) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const today = defaultDate ?? new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: initialTransaction?.type ?? "expense",
      amount: initialTransaction?.amount ?? undefined,
      categoryId: initialTransaction?.categoryId ?? null,
      paymentMethod: initialTransaction?.paymentMethod ?? "UPI",
      date: initialTransaction?.date ?? today,
      note: initialTransaction?.note ?? "",
      isExclusive: initialTransaction?.isExclusive ?? false,
    },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: FormData) => {
    setServerError(null);

    // Try offline queue if no network (only for new entries)
    if (!navigator.onLine && !initialTransaction) {
      await queueOffline(data);
      setSuccess(true);
      setTimeout(() => { reset(); setSuccess(false); }, 2000);
      return;
    }

    const isEditing = Boolean(initialTransaction?.id);
    const url = isEditing
      ? `/api/transactions/${initialTransaction!.id}`
      : "/api/transactions";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Failed to save transaction. Please try again.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      if (isEditing) {
        router.push("/transactions");
      } else {
        reset({ type: "expense", paymentMethod: "UPI", date: today, isExclusive: false });
        setSuccess(false);
      }
      router.refresh();
    }, 1200);
  };

  if (success) {
    return (
      <div className="card p-8 text-center space-y-3 animate-fade-slide-up">
        <CheckCircle size={48} className="mx-auto" style={{ color: "var(--color-success)" }} aria-hidden="true" />
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
          {initialTransaction ? "Transaction updated!" : "Transaction saved!"}
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {initialTransaction ? "Redirecting to history…" : "Adding another one…"}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div role="alert" className="flex items-start gap-2 rounded-[8px] p-3 text-sm"
             style={{ background: "var(--color-danger-light)", color: "var(--color-danger)" }}>
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          {serverError}
        </div>
      )}

      {/* Type toggle */}
      <div>
        <fieldset>
          <legend className="label">Type</legend>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(({ value, label, emoji }) => (
              <label
                key={value}
                className="flex items-center justify-center gap-2 rounded-[8px] border-2 py-3 cursor-pointer
                           transition-all duration-150 font-medium text-sm"
                style={{
                  borderColor: selectedType === value ? "var(--color-primary)" : "var(--border-color)",
                  background: selectedType === value ? "var(--color-primary-light)" : "var(--bg-card)",
                  color: selectedType === value ? "var(--color-primary)" : "var(--text-secondary)",
                }}
              >
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...register("type")}
                />
                <span aria-hidden="true">{emoji}</span>
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="txn-amount" className="label">
          Amount (₹)
        </label>
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-lg"
            style={{ color: "var(--text-muted)" }}
            aria-hidden="true"
          >₹</span>
          <input
            id="txn-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            className={`input pl-8 text-lg font-semibold ${errors.amount ? "input-error" : ""}`}
            placeholder="0.00"
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? "txn-amount-error" : undefined}
            {...register("amount", { valueAsNumber: true })}
          />
        </div>
        {errors.amount && (
          <p id="txn-amount-error" role="alert" className="flex items-center gap-1 mt-1 text-xs"
             style={{ color: "var(--color-danger)" }}>
            <AlertCircle size={12} aria-hidden="true" />{errors.amount.message}
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="txn-category" className="label">Category</label>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => field.onChange(field.value === cat.id ? null : cat.id)}
                  className="flex flex-col items-center gap-1 p-2 rounded-[8px] border-2 text-center
                             transition-all duration-150"
                  style={{
                    borderColor: field.value === cat.id ? cat.color : "var(--border-color)",
                    background: field.value === cat.id ? `${cat.color}18` : "var(--bg-card)",
                  }}
                  aria-pressed={field.value === cat.id}
                  aria-label={cat.name}
                >
                  <span className="text-xl leading-none" aria-hidden="true">{cat.icon}</span>
                  <span className="text-[10px] font-medium leading-tight truncate w-full"
                        style={{ color: field.value === cat.id ? cat.color : "var(--text-muted)" }}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Date */}
      <div>
        <label htmlFor="txn-date" className="label">Date</label>
        <input
          id="txn-date"
          type="date"
          className={`input ${errors.date ? "input-error" : ""}`}
          max={today}
          aria-invalid={!!errors.date}
          {...register("date")}
        />
      </div>

      {/* Payment method */}
      <div>
        <label htmlFor="txn-payment" className="label">Payment method</label>
        <select
          id="txn-payment"
          className="input"
          style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
          {...register("paymentMethod")}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Note */}
      <div>
        <label htmlFor="txn-note" className="label">
          Note <span style={{ color: "var(--text-muted)" }}>(optional)</span>
        </label>
        <input
          id="txn-note"
          type="text"
          className="input"
          placeholder="e.g. Lunch at canteen"
          maxLength={200}
          {...register("note")}
        />
      </div>

      {/* Exclusive (Outside Monthly Budget) */}
      {selectedType === "expense" && (
        <div
          className="rounded-[10px] p-3.5 border transition-all duration-150"
          style={{
            borderColor: watch("isExclusive") ? "var(--color-primary)" : "var(--border-color)",
            backgroundColor: watch("isExclusive") ? "var(--color-primary-light)" : "var(--bg-muted)",
          }}
        >
          <label htmlFor="txn-exclusive" className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="txn-exclusive"
              className="mt-1 h-4 w-4 rounded accent-indigo-600 cursor-pointer"
              {...register("isExclusive")}
            />
            <div className="flex-1 select-none">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Exclusive (Outside Monthly Budget)
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  Special
                </span>
              </div>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Enable for one-off expenses not taken from your monthly allowance (e.g. college fees, laptop, medical emergency). It will appear in Analytics but will <strong>not</strong> reduce your monthly balance or show you overspent on Dashboard.
              </p>
            </div>
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full text-base"
        id="btn-save-transaction"
      >
        {isSubmitting
          ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Saving…</>
          : initialTransaction ? "Update Transaction" : "Save Transaction"
        }
      </button>
    </form>
  );
}

// ─── Offline queue ────────────────────────────────────────────────────────────

async function queueOffline(data: FormData) {
  if (!("indexedDB" in window)) return;
  const dbReq = indexedDB.open("studentspend-offline", 1);
  dbReq.onupgradeneeded = (e) => {
    const db = (e.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains("pending")) {
      db.createObjectStore("pending", { autoIncrement: true });
    }
  };
  await new Promise<void>((resolve, reject) => {
    dbReq.onsuccess = () => {
      const db = dbReq.result;
      const tx = db.transaction("pending", "readwrite");
      tx.objectStore("pending").add({ ...data, _queuedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = reject;
    };
    dbReq.onerror = reject;
  });
}
