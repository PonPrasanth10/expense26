import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | StudentSpend",
  description: "Set a new password for your StudentSpend account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="card p-8 text-center text-sm">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
