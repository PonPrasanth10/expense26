"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { AlertCircle, CheckCircle, Loader2, Mail } from "lucide-react";
import { z } from "zod";
import { forgotPasswordSchema } from "@/lib/validations";

type FormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    // Always show success to prevent email enumeration
    if (res.ok || res.status === 404) {
      setSubmitted(true);
      return;
    }

    setServerError("Something went wrong. Please try again.");
  };

  if (submitted) {
    return (
      <div className="text-center space-y-3 py-4" aria-live="polite">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
             style={{ background: "var(--color-success-light)" }}>
          <Mail size={26} style={{ color: "var(--color-success)" }} aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Check your inbox
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            If an account exists for <strong>{getValues("email")}</strong>, you&apos;ll receive a reset link shortly.
          </p>
        </div>
        <Link href="/login" className="btn-secondary inline-flex text-sm px-4 py-2">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div role="alert" className="flex items-start gap-2 rounded-[8px] p-3 text-sm"
             style={{ background: "var(--color-danger-light)", color: "var(--color-danger)" }}>
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="forgot-email" className="label">Email address</label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          className={`input ${errors.email ? "input-error" : ""}`}
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p role="alert" className="flex items-center gap-1 mt-1 text-xs"
             style={{ color: "var(--color-danger)" }}>
            <AlertCircle size={12} aria-hidden="true" />{errors.email.message}
          </p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full" id="btn-send-reset">
        {isSubmitting
          ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Sending…</>
          : "Send reset link"
        }
      </button>

      <p className="text-center text-sm">
        <Link href="/login" className="font-medium" style={{ color: "var(--color-primary)" }}>
          ← Back to sign in
        </Link>
      </p>
    </form>
  );
}
