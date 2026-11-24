"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Missing or invalid reset token");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="card p-6 text-center space-y-4">
        <AlertCircle size={32} className="mx-auto text-rose-500" />
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Invalid Reset Link
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          This link is invalid or has expired. Please request a new password reset link.
        </p>
        <Link href="/forgot-password" className="btn-primary inline-flex text-sm py-2 px-4">
          Request New Link
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Set New Password
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Enter a strong new password for your account
        </p>
      </div>

      {success ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={18} /> Password updated successfully! Redirecting to sign in...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-200 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
              New Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="input-field pl-9 pr-9"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="input-field pl-9"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Reset Password
          </button>
        </form>
      )}
    </div>
  );
}
