/**
 * GET /api/categories — List user categories
 * POST /api/categories — Create custom category
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import CategoryModel from "@/models/Category";
import { ok, err, getAuthenticatedUserId, parseBody } from "@/lib/api-helpers";
import { createCategorySchema } from "@/lib/validations";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  await connectDB();

  const categories = await CategoryModel.find({
    userId: new mongoose.Types.ObjectId(userId),
  })
    .sort({ isDefault: -1, name: 1 })
    .lean();

  return ok(
    categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      icon: c.icon,
      color: c.color,
      isDefault: c.isDefault,
    }))
  );
}

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid request body", 400);

  const parsed = parseBody(createCategorySchema, body);
  if ("error" in parsed) return parsed.error;

  await connectDB();

  const uid = new mongoose.Types.ObjectId(userId);

  // Check for duplicate name
  const existing = await CategoryModel.findOne({
    userId: uid,
    name: { $regex: `^${parsed.data.name}$`, $options: "i" },
  });
  if (existing) return err("A category with this name already exists", 409);

  const category = await CategoryModel.create({
    userId: uid,
    ...parsed.data,
    isDefault: false,
  });

  return ok(
    {
      id: category._id.toString(),
      name: category.name,
      icon: category.icon,
      color: category.color,
      isDefault: category.isDefault,
    },
    201
  );
}
