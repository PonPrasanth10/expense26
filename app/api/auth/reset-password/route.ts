/**
 * POST /api/auth/reset-password
 * Validates reset token and updates password.
 */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { ok, err } from "@/lib/api-helpers";
import { resetPasswordSchema } from "@/lib/validations";
import { resetTokens } from "../forgot-password/route";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid request body", 400);

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { token, password } = parsed.data;

  const record = resetTokens.get(token);
  if (!record || record.expiresAt < Date.now()) {
    resetTokens.delete(token);
    return err("Reset link has expired or is invalid.", 400);
  }

  await connectDB();
  const hashedPassword = await bcrypt.hash(password, 12);

  await UserModel.findByIdAndUpdate(
    new mongoose.Types.ObjectId(record.userId),
    { password: hashedPassword }
  );

  resetTokens.delete(token);

  return ok({ message: "Password updated successfully! You can now sign in." });
}
