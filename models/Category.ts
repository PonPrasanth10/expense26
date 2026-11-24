import mongoose, { Schema, model, models, type Document } from "mongoose";

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    icon: {
      type: String,
      required: true,
      default: "🏷️",
    },
    color: {
      type: String,
      required: true,
      default: "#64748B",
      match: /^#[0-9A-Fa-f]{6}$/,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "categories",
  }
);

// Unique category name per user
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

const CategoryModel = models.Category ?? model<ICategory>("Category", CategorySchema);
export default CategoryModel;
