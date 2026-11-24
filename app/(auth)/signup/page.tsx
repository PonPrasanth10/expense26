import { SignUpForm } from "@/components/auth/SignUpForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your free StudentSpend account",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
