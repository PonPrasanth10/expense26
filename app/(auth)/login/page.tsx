import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your StudentSpend account",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card p-8 text-center text-sm">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
