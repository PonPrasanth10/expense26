/**
 * POST /api/auth/forgot-password
 * Sends a password reset email.
 */

import { NextRequest } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validations";
import { ok, err, isRateLimited } from "@/lib/api-helpers";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Simple in-memory token store (use Redis in production)
export const resetTokens = new Map<string, { userId: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(`forgot-password:${ip}`, 3, 15 * 60_000)) {
    return err("Too many requests. Please wait before trying again.", 429);
  }

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid request body", 400);

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return err("Invalid email", 400);

  const { email } = parsed.data;

  await connectDB();
  const user = await UserModel.findOne({ email }).lean();

  // Always return 200 to prevent email enumeration
  if (!user) return ok({ message: "If that email exists, a reset link was sent." });

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 60 * 60_000; // 1 hour
  resetTokens.set(token, { userId: user._id.toString(), expiresAt });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  if (resend) {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "noreply@studentspend.in",
      to: email,
      subject: "Reset your StudentSpend password",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0F172A;">Reset your password</h2>
          <p style="color: #64748B;">Hi ${user.name},</p>
          <p style="color: #64748B;">Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #94A3B8; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }

  return ok({ message: "If that email exists, a reset link was sent." });
}
