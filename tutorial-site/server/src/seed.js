import "dotenv/config";
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

  const adminEmail = "admin@example.com";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
    await User.create({
      name: "Admin",
      email: adminEmail,
      passwordHash,
      plan: "paid",
      isAdmin: true,
    });
    console.log(
      `Seeded admin user: ${adminEmail} / ChangeMe123! (change this password)`,
    );
  }

  console.log("Seed complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
