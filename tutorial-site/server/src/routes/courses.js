import { Router } from "express";
import Course from "../models/Course.js";
import Video from "../models/Video.js";
import Book from "../models/Book.js";
import { attachUserIfPresent, requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

function publicVideo(v, unlocked) {
  return {
    _id: v._id,
    title: v.title,
    order: v.order,
    durationSeconds: v.durationSeconds,
    isFree: v.isFree,
    price: v.price,
    discountPercent: v.discountPercent || 0,
    effectivePrice: v.isFree
      ? 0
      : Math.round(v.price * (1 - Math.min(Math.max(v.discountPercent || 0, 0), 100) / 100) * 100) / 100,
    badges: [
      v.isTopSeller && "topSeller",
      v.isMedium && "medium",
      (v.discountPercent || 0) > 0 && "discount",
      v.isFree && "free",
    ].filter(Boolean),
    unlocked,
    videoUrl: unlocked ? v.videoUrl : null,
  };
}

function publicBook(b, unlocked) {
  return {
    _id: b._id,
    title: b.title,
    order: b.order,
    coverImageUrl: b.coverImageUrl,
    isFree: b.isFree,
    price: b.price,
    discountPercent: b.discountPercent || 0,
    effectivePrice: b.isFree
      ? 0
      : Math.round(b.price * (1 - Math.min(Math.max(b.discountPercent || 0, 0), 100) / 100) * 100) / 100,
    badges: [
      b.isTopSeller && "topSeller",
      b.isMedium && "medium",
      (b.discountPercent || 0) > 0 && "discount",
      b.isFree && "free",
    ].filter(Boolean),
    unlocked,
    pdfUrl: unlocked ? b.pdfUrl : null,
  };
}

// List courses with their videos + books, redacting locked items' URLs for
// free/anonymous users. Price/badge info is shown regardless of unlock
// status so shoppers can decide to upgrade or buy.
router.get("/", attachUserIfPresent, async (req, res) => {
  const isPaid = req.user?.plan === "paid";
  const courses = await Course.find().sort({ order: 1 }).lean();
  const videos = await Video.find().sort({ order: 1 }).lean();
  const books = await Book.find().sort({ order: 1 }).lean();

  const result = courses.map((course) => ({
    ...course,
    videos: videos
      .filter((v) => String(v.course) === String(course._id))
      .map((v) => publicVideo(v, isPaid || v.isFree)),
    books: books
      .filter((b) => String(b.course) === String(course._id))
      .map((b) => publicBook(b, isPaid || b.isFree)),
  }));

  res.json({ courses: result });
});

// ---- Admin-only course management ----

// Unredacted listing for the admin panel -- the public GET / above hides
// videoUrl/pdfUrl for locked items, which would let an admin's edit form
// accidentally null those fields out on save. Admins always see the real
// values here regardless of their own plan.
router.get("/admin/all", requireAuth, requireAdmin, async (_req, res) => {
  const courses = await Course.find().sort({ order: 1 }).lean();
  const videos = await Video.find().sort({ order: 1 }).lean();
  const books = await Book.find().sort({ order: 1 }).lean();

  const result = courses.map((course) => ({
    ...course,
    videos: videos.filter((v) => String(v.course) === String(course._id)),
    books: books.filter((b) => String(b.course) === String(course._id)),
  }));

  res.json({ courses: result });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json(course);
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) return res.status(404).json({ error: "Course not found" });
  await Video.deleteMany({ course: course._id });
  await Book.deleteMany({ course: course._id });
  res.status(204).send();
});

export default router;
