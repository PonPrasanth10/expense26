import mongoose, { Schema, model, models, type Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  emailVerified?: Date;
  passwordHash?: string;
  image?: string;
  theme?: "light" | "dark" | "system";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    passwordHash: {
      type: String,
      select: false, // Never returned by default
    },
    image: {
      type: String,
      default: null,
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// Auth.js MongoDB adapter expects these fields
UserSchema.index({ email: 1 }, { unique: true });

const UserModel = models.User ?? model<IUser>("User", UserSchema);
export default UserModel;
