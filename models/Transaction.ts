import mongoose, { Schema, model, models, type Document } from "mongoose";

export type TransactionType = "expense" | "income";
export type PaymentMethod = "UPI" | "Cash" | "Card" | "Bank transfer";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number; // paise (always positive)
  categoryId?: mongoose.Types.ObjectId;
  paymentMethod: PaymentMethod;
  date: Date;
  note?: string;
  isExclusive?: boolean; // When true: not deducted from monthly allowance/budget
  isOfflineSynced?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["expense", "income"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1, // At least 1 paise
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Cash", "Card", "Bank transfer"],
      required: true,
      default: "Cash",
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },
    isExclusive: {
      type: Boolean,
      default: false,
      index: true,
    },
    isOfflineSynced: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "transactions",
  }
);

// Indexes for dashboard queries
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, isExclusive: 1, date: -1 });
TransactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });

const TransactionModel =
  models.Transaction ?? model<ITransaction>("Transaction", TransactionSchema);
export default TransactionModel;
