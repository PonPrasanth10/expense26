"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { z } from "zod";
import { signUpSchema } from "@/lib/validations";

type FormData = z.infer<typeof signUpSchema>;

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "var(--color-danger)" };
  if (score <= 2) return { score, label: "Fair", color: "var(--color-warning)" };
  if (score <= 3) return { score, label: "Good", color: "#3B82F6" };
  return { score, label: "Strong", color: "var(--color-success)" };
}

export function SignUpForm() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(signUpSchema) });

  const password = watch("password", "");
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login?registered=1"), 1500);
  };

  if (success) {
    return (
      <div className="card p-8 text-center space-y-3 animate-fade-slide-up">
        <CheckCircle size={48} className="mx-auto" style={{ color: "var(--color-success)" }} aria-hidden="true" />
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Account created!
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Redirecting you to sign in…
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-5 animate-fade-slide-up">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Create account
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Start tracking your expenses today — free forever
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div role="alert" className="flex items-start gap-2 rounded-[8px] p-3 text-sm"
               style={{ background: "var(--color-danger-light)", color: "var(--color-danger)" }}>
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
            {serverError}
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="signup-name" className="label">Full name</label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            className={`input ${errors.name ? "input-error" : ""}`}
            placeholder="Priya Sharma"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "signup-name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p id="signup-name-error" role="alert" className="flex items-center gap-1 mt-1 text-xs"
               style={{ color: "var(--color-danger)" }}>
              <AlertCircle size={12} aria-hidden="true" />{errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="signup-email" className="label">Email address</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            className={`input ${errors.email ? "input-error" : ""}`}
            placeholder="priya@college.edu"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="signup-email-error" role="alert" className="flex items-center gap-1 mt-1 text-xs"
               style={{ color: "var(--color-danger)" }}>
              <AlertCircle size={12} aria-hidden="true" />{errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="signup-password" className="label">Password</label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              className={`input pr-10 ${errors.password ? "input-error" : ""}`}
              placeholder="Min. 8 characters"
              aria-invalid={!!errors.password}
              aria-describedby="signup-pass-strength"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
              style={{ color: "var(--text-muted)" }}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
          {/* Strength bar */}
          {password && (
            <div id="signup-pass-strength" className="mt-2 space-y-1" aria-live="polite">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{
                      background: i <= strength.score ? strength.color : "var(--bg-muted)",
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: strength.color }}>
                Password strength: {strength.label}
              </p>
            </div>
          )}
          {errors.password && (
            <p role="alert" className="flex items-center gap-1 mt-1 text-xs"
               style={{ color: "var(--color-danger)" }}>
              <AlertCircle size={12} aria-hidden="true" />{errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full"
          id="btn-create-account"
        >
          {isSubmitting ? (
            <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Creating account…</>
          ) : (
            "Create free account"
          )}
        </button>

        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          By signing up you agree to our terms of service.
        </p>
      </form>

      <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-medium transition-colors" style={{ color: "var(--color-primary)" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
