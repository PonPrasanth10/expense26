import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import UserModel from "../models/User";
import { seedDemoData } from "../lib/seed";

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/studentspend";
  console.log(`Connecting to MongoDB at ${uri}...`);
  await mongoose.connect(uri);

  const demoEmail = "demo@studentspend.in";
  let user = await UserModel.findOne({ email: demoEmail });

  if (!user) {
    console.log("Creating demo student user...");
    const hashedPassword = await bcrypt.hash("DemoStudent@123", 12);
    user = await UserModel.create({
      name: "Aarav Sharma",
      email: demoEmail,
      password: hashedPassword,
    });
    console.log(`Created user: ${user.name} (${user.email})`);
  } else {
    console.log(`Found existing user: ${user.name} (${user.email})`);
  }

  console.log("Seeding demo transactions & November 2026 budget...");
  await seedDemoData(user._id.toString());

  console.log("✅ Demo seed completed!");
  console.log("You can log in with:");
  console.log("  Email: demo@studentspend.in");
  console.log("  Password: DemoStudent@123");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
