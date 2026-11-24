/**
 * lib/validations.ts
 * Zod schemas for all API inputs and form validation.
 */

import { z } from "zod";

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .trim(),
  email: z.string().email("Please enter a valid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

// ─── Transaction Schemas ──────────────────────────────────────────────────────

const PAYMENT_METHODS = ["UPI", "Cash", "Card", "Bank transfer"] as const;
const TRANSACTION_TYPES = ["expense", "income"] as const;

export const createTransactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(100_000_000, "Amount is too large"), // ₹10L max
  categoryId: z.string().optional().nullable(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  note: z.string().max(200, "Note is too long").optional().nullable(),
  isExclusive: z.boolean().default(false).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  id: z.string().min(1, "Transaction ID is required"),
});

export const deleteTransactionSchema = z.object({
  id: z.string().min(1, "Transaction ID is required"),
});

export const listTransactionsSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM")
    .optional(),
  categoryId: z.string().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  search: z.string().max(100).optional(),
  cursor: z.string().optional(), // Last transaction _id for cursor pagination
  limit: z.number().min(1).max(100).default(30),
});

// ─── Budget Schemas ───────────────────────────────────────────────────────────

const BUDGET_SOURCES = [
  "Parents",
  "Scholarship",
  "Part-time",
  "Part-time job",
  "Internship",
  "Freelancing",
  "Savings",
  "Other",
] as const;

export const createBudgetSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM"),
  allowance: z
    .number()
    .positive("Allowance must be greater than 0")
    .max(10_000_000, "Allowance seems too large"), // ₹1L max
  receivedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  nextAllowanceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional()
    .nullable(),
  source: z.enum(BUDGET_SOURCES),
  carryForward: z.boolean().default(false),
  openingBalance: z.number().min(0).default(0),
});

export const updateBudgetSchema = createBudgetSchema.partial().extend({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});

// ─── Category Schemas ─────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  icon: z.string().min(1).max(10),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex code like #4F46E5"),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().min(1),
});

// ─── Settings / Profile Schemas ───────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

export const updateCategoryLimitSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  categoryId: z.string().min(1),
  limit: z.number().min(0).max(10_000_000),
});

export const updateAlertThresholdsSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  thresholds: z.array(
    z.object({
      level: z.enum(["warning", "critical"]),
      percent: z.number().min(0).max(100),
    })
  ),
});

// ─── Summary Schema ───────────────────────────────────────────────────────────

export const summaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM"),
});
