/**
 * One-off script to grant admin access to an existing user by email.
 * Needed because there's no self-service way to become an admin from the
 * UI (see models/User.js) -- the /api/uploads route (and other admin
 * panel actions) return 403 for any account with isAdmin: false.
 *
 * Run from the server/ directory (uses the same .env as the app):
 *   node src/promoteAdmin.js you@example.com
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node src/promoteAdmin.js <email>");
  process.exit(1);
}

async function main() {
  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    console.error("Register that account in the app first, then re-run this.");
    await mongoose.disconnect();
    process.exit(1);
  }

  if (user.isAdmin) {
    console.log(`${email} is already an admin. Nothing to do.`);
  } else {
    user.isAdmin = true;
    await user.save();
    console.log(`Done: ${email} is now an admin.`);
    console.log("Log out and back in (or refresh) so a fresh JWT/user doc is used.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
