import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import Course from "./models/Course.js";
import Video from "./models/Video.js";
import Book from "./models/Book.js";
import User from "./models/User.js";

const COURSES = [
  {
    title: "Getting Started: Foundations",
    slug: "getting-started",
    level: "Beginner",
    isFree: true,
  },
  {
    title: "Intermediate Techniques",
    slug: "intermediate-techniques",
    level: "Intermediate",
    isFree: false,
  },
  {
    title: "Advanced Mastery",
    slug: "advanced-mastery",
    level: "Advanced",
    isFree: false,
  },
];

const SAMPLE_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const SAMPLE_PDF_URL = "https://example.com/sample.pdf";

async function seed() {
  await connectDB();
  await Course.deleteMany({});
  await Video.deleteMany({});
  await Book.deleteMany({});

  const courses = [];
  for (const [i, data] of COURSES.entries()) {
    courses.push(await Course.create({ ...data, order: i }));
  }
  const [foundations, intermediate, advanced] = courses;

  await Video.insertMany([
    {
      course: foundations._id,
      title: "Welcome & Overview",
      order: 0,
      durationSeconds: 252,
      isFree: true,
      videoUrl: SAMPLE_VIDEO_URL,
    },
    {
      course: foundations._id,
      title: "Your First Project",
      order: 1,
      durationSeconds: 750,
      isFree: false,
      price: 15,
      isTopSeller: true,
      videoUrl: SAMPLE_VIDEO_URL,
    },
    {
      course: intermediate._id,
      title: "Core Concepts Deep Dive",
      order: 0,
      durationSeconds: 902,
      isFree: false,
      price: 25,
      isMedium: true,
      videoUrl: SAMPLE_VIDEO_URL,
    },
    {
      course: advanced._id,
      title: "Advanced Workflow",
      order: 0,
      durationSeconds: 1120,
      isFree: false,
      price: 35,
      isTopSeller: true,
      videoUrl: SAMPLE_VIDEO_URL,
    },
  ]);

  await Book.insertMany([
    {
      course: foundations._id,
      title: "Setup Checklist (PDF)",
      order: 0,
      isFree: true,
      pdfUrl: SAMPLE_PDF_URL,
    },
    {
      course: foundations._id,
      title: "First Project Workbook",
      order: 1,
      isFree: false,
      price: 12,
      discountPercent: 25,
      pdfUrl: SAMPLE_PDF_URL,
    },
    {
      course: intermediate._id,
      title: "Common Mistakes Cheatsheet",
      order: 0,
      isFree: false,
      price: 20,
      discountPercent: 30,
      pdfUrl: SAMPLE_PDF_URL,
    },
    {
      course: advanced._id,
      title: "Real-World Case Study Book",
      order: 0,
      isFree: false,
      price: 30,
      isMedium: true,
      pdfUrl: SAMPLE_PDF_URL,
    },
  ]);

  // A fixed, published email/password ("admin@example.com" / "ChangeMe123!")
  // used to be created here unconditionally. If this script is ever run
  // against a real deployment (even by accident, e.g. copy-pasting a Render
  // shell command), that's a live, publicly-guessable admin account. Now:
  // the email/password can be overridden via env vars, the password is
  // randomly generated if not supplied, and seeding an admin in production
  // requires an explicit opt-in.
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_SEED !== "true") {
      console.warn(
        "Skipping admin seed: NODE_ENV=production and ALLOW_PROD_SEED is not 'true'. " +
          "If you really want to seed an admin account on this database, set " +
          "ALLOW_PROD_SEED=true and SEED_ADMIN_PASSWORD explicitly and re-run.",
      );
    } else {
      const adminPassword = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await User.create({
        name: "Admin",
        email: adminEmail,
        passwordHash,
        isAdmin: true,
      });
      console.log(
        `Seeded admin user: ${adminEmail} / ${adminPassword} -- log in once and change this password immediately.`,
      );
    }
  }

  console.log("Seed complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
