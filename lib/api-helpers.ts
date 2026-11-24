/**
 * lib/api-helpers.ts
 * Common utilities for API route handlers.
 */

import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { auth } from "./auth";

// ─── Response Helpers ─────────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, ...(details ? { details } : {}) },
    { status }
  );
}

// ─── Auth Guard ───────────────────────────────────────────────────────────────

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// ─── Input Validation ─────────────────────────────────────────────────────────

export function parseBody<T>(schema: ZodSchema<T>, data: unknown): { data: T } | { error: NextResponse } {
  try {
    const parsed = schema.parse(data);
    return { data: parsed };
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        error: err("Validation error", 400, e.flatten().fieldErrors),
      };
    }
    return { error: err("Invalid request body", 400) };
  }
}

// ─── Rate Limiting (simple in-memory) ─────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple IP-based rate limiter.
 * Returns true if the request should be blocked.
 */
export function isRateLimited(
  key: string,
  limit: number = 5,
  windowMs: number = 15 * 60_000 // 15 minutes
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= limit) return true;

  entry.count++;
  return false;
}
