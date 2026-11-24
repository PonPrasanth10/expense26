/**
 * lib/auth.ts
 * Auth.js (NextAuth v5) full configuration with Node.js adapters & providers.
 * Runs in the Node.js runtime (API routes, Server Components, Server Actions).
 */

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "./db";
import UserModel from "@/models/User";

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/studentspend";
const client = new MongoClient(mongoUri);
const clientPromise = client.connect();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: "studentspend",
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        await connectDB();
        const user = await UserModel.findOne({ email: email.toLowerCase() })
          .select("+passwordHash")
          .lean();

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image ?? null,
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (user.id) {
        const { seedDefaultCategories } = await import("./seed");
        await seedDefaultCategories(user.id);
      }
    },
  },
});
