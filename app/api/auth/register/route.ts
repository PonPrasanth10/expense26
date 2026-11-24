/**
 * POST /api/auth/register
 * Creates a new user account with email + password.
 * Rate-limited to 5 attempts per IP per 15 minutes.
 */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { signUpSchema } from "@/lib/validations";
import { ok, err, parseBody, isRateLimited } from "@/lib/api-helpers";
import { seedDefaultCategories } from "@/lib/seed";

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(`register:${ip}`, 5, 15 * 60_000)) {
    return err("Too many attempts. Please try again later.", 429);
  }

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid request body", 400);

  const parsed = parseBody(signUpSchema, body);
  if ("error" in parsed) return parsed.error;

  const { name, email, password } = parsed.data;

  await connectDB();

  // Check if user already exists
  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    // Return same message to avoid email enumeration
    return err("An account with this email already exists.", 409);
  }

  // Hash password with bcrypt (cost factor 12)
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await UserModel.create({
    name,
    email,
    passwordHash,
  });

  // Seed default categories for the new user
  await seedDefaultCategories(user._id.toString());

  return ok(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    201
  );
}
