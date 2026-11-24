import mongoose, { Schema, model, models, type Document } from "mongoose";

export interface ICategoryLimit {
  categoryId: mongoose.Types.ObjectId;
  limit: number; // paise
}

export interface IAlertThreshold {
  level: "warning" | "critical";
  percent: number; // 0-100
}

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  month: string; // "YYYY-MM"
  openingBalance: number; // paise (carry-forward from previous month)
  allowance: number; // paise
  receivedOn: Date;
  nextAllowanceDate?: Date;
  source: "Parents" | "Scholarship" | "Part-time" | "Internship" | "Other";
  carryForward: boolean;
  alertThresholds: IAlertThreshold[];
  categoryLimits: ICategoryLimit[];
  createdAt: Date;
  updatedAt: Date;
}

const AlertThresholdSchema = new Schema<IAlertThreshold>(
  {
    level: { type: String, enum: ["warning", "critical"], required: true },
    percent: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const CategoryLimitSchema = new Schema<ICategoryLimit>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    limit: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const BudgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    openingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    allowance: {
      type: Number,
      required: true,
      min: 0,
    },
    receivedOn: {
      type: Date,
      required: true,
    },
    nextAllowanceDate: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      enum: ["Parents", "Scholarship", "Part-time", "Internship", "Other"],
      required: true,
    },
    carryForward: {
      type: Boolean,
      default: false,
    },
    alertThresholds: {
      type: [AlertThresholdSchema],
      default: [
        { level: "warning", percent: 75 },
        { level: "critical", percent: 90 },
      ],
    },
    categoryLimits: {
      type: [CategoryLimitSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "budgets",
  }
);

// Unique budget per user per month
BudgetSchema.index({ userId: 1, month: 1 }, { unique: true });

const BudgetModel = models.Budget ?? model<IBudget>("Budget", BudgetSchema);
export default BudgetModel;
