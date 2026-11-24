"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { z } from "zod";
import { signInSchema } from "@/lib/validations";

type FormData = z.infer<typeof signInSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Invalid email or password. Please try again.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  };

  return (
    <div className="card p-6 space-y-5 animate-fade-slide-up">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Welcome back
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Sign in to your account
        </p>
      </div>

      {/* Google OAuth */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading || isSubmitting}
        className="btn-secondary w-full gap-3"
        id="btn-google-signin"
      >
        {googleLoading ? (
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
        <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Server error */}
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-[8px] p-3 text-sm"
            style={{ background: "var(--color-danger-light)", color: "var(--color-danger)" }}
          >
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
            {serverError}
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="login-email" className="label">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            className={`input ${errors.email ? "input-error" : ""}`}
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="login-email-error" role="alert" className="flex items-center gap-1 mt-1 text-xs"
               style={{ color: "var(--color-danger)" }}>
              <AlertCircle size={12} aria-hidden="true" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="label mb-0">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs transition-colors"
              style={{ color: "var(--color-primary)" }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              className={`input pr-10 ${errors.password ? "input-error" : ""}`}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "login-pass-error" : undefined}
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
          {errors.password && (
            <p id="login-pass-error" role="alert" className="flex items-center gap-1 mt-1 text-xs"
               style={{ color: "var(--color-danger)" }}>
              <AlertCircle size={12} aria-hidden="true" />
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || googleLoading}
          className="btn-primary w-full"
          id="btn-email-signin"
        >
          {isSubmitting ? (
            <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Signing in…</>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium transition-colors"
          style={{ color: "var(--color-primary)" }}
        >
          Sign up free
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
