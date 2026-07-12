/**
 * One-off script to populate sample courses/lessons for local development.
 * Run with: node src/seed.js
 */
import "dotenv/config";
import { connectDB } from "./config/db.js";
import Course from "./models/Course.js";
import Lesson from "./models/Lesson.js";
import mongoose from "mongoose";

const DATA = [
  {
    title: "Getting Started: Foundations",
    slug: "getting-started",
    level: "Beginner",
    isFree: true,
    lessons: [
      { title: "Welcome & Overview", durationSeconds: 252, isFree: true, videoAssetId: "asset_welcome", pdfObjectKey: "pdfs/welcome-overview.pdf" },
      { title: "Setting Up Your Tools", durationSeconds: 585, isFree: true, videoAssetId: "asset_setup", pdfObjectKey: "pdfs/setup-checklist.pdf" },
      { title: "Your First Project", durationSeconds: 750, isFree: false, videoAssetId: "asset_first_project", pdfObjectKey: "pdfs/first-project-workbook.pdf" },
    ],
  },
  {
    title: "Intermediate Techniques",
    slug: "intermediate-techniques",
    level: "Intermediate",
    isFree: false,
    lessons: [
      { title: "Core Concepts Deep Dive", durationSeconds: 902, isFree: false, videoAssetId: "asset_core_concepts", pdfObjectKey: "pdfs/core-concepts.pdf" },
      { title: "Common Mistakes to Avoid", durationSeconds: 500, isFree: false, videoAssetId: "asset_mistakes", pdfObjectKey: "pdfs/mistakes-cheatsheet.pdf" },
    ],
  },
  {
    title: "Advanced Mastery",
    slug: "advanced-mastery",
    level: "Advanced",
    isFree: false,
    lessons: [
      { title: "Advanced Workflow", durationSeconds: 1120, isFree: false, videoAssetId: "asset_advanced_workflow", pdfObjectKey: "pdfs/advanced-workflow.pdf" },
      { title: "Real-World Case Study", durationSeconds: 1325, isFree: false, videoAssetId: "asset_case_study", pdfObjectKey: "pdfs/case-study.pdf" },
    ],
  },
];

async function seed() {
  await connectDB();
  await Course.deleteMany({});
  await Lesson.deleteMany({});

  for (const [i, courseData] of DATA.entries()) {
    const { lessons, ...courseFields } = courseData;
    const course = await Course.create({ ...courseFields, order: i });
    await Lesson.insertMany(lessons.map((l, j) => ({ ...l, course: course._id, order: j })));
  }

  console.log("Seed complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
