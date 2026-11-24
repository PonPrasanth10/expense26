/**
 * PATCH /api/categories/[id] — Update custom category
 * DELETE /api/categories/[id] — Delete custom category
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import CategoryModel from "@/models/Category";
import TransactionModel from "@/models/Transaction";
import { ok, err, getAuthenticatedUserId, parseBody } from "@/lib/api-helpers";
import { createCategorySchema } from "@/lib/validations";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return err("Invalid category ID", 400);

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid request body", 400);

  const parsed = parseBody(createCategorySchema.partial(), body);
  if ("error" in parsed) return parsed.error;

  await connectDB();

  const uid = new mongoose.Types.ObjectId(userId);

  const category = await CategoryModel.findOne({ _id: id, userId: uid });
  if (!category) return err("Category not found", 404);
  if (category.isDefault) return err("Default categories cannot be edited", 403);

  if (parsed.data.name) category.name = parsed.data.name;
  if (parsed.data.icon) category.icon = parsed.data.icon;
  if (parsed.data.color) category.color = parsed.data.color;

  await category.save();

  return ok({
    id: category._id.toString(),
    name: category.name,
    icon: category.icon,
    color: category.color,
    isDefault: category.isDefault,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return err("Unauthorized", 401);

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return err("Invalid category ID", 400);

  await connectDB();

  const uid = new mongoose.Types.ObjectId(userId);

  const category = await CategoryModel.findOne({ _id: id, userId: uid });
  if (!category) return err("Category not found", 404);
  if (category.isDefault) return err("Default categories cannot be deleted", 403);

  // Unlink transactions with this category
  await TransactionModel.updateMany(
    { userId: uid, categoryId: new mongoose.Types.ObjectId(id) },
    { $unset: { categoryId: "" } }
  );

  await CategoryModel.deleteOne({ _id: id, userId: uid });

  return ok({ deleted: true });
}
