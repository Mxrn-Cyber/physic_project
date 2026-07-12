import { Router } from "express";
import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import { attachUserIfPresent, requireAuth } from "../middleware/auth.js";

const router = Router();

// List courses with lessons, but redact locked lessons' asset info for
// free/anonymous users. attachUserIfPresent lets logged-out visitors
// still browse the catalog (seeing only free previews).
router.get("/", attachUserIfPresent, async (req, res) => {
  const isPaid = req.user?.plan === "paid";
  const courses = await Course.find().sort({ order: 1 }).lean();
  const lessons = await Lesson.find().sort({ order: 1 }).lean();

  const result = courses.map((course) => ({
    ...course,
    lessons: lessons
      .filter((l) => String(l.course) === String(course._id))
      .map((l) => {
        const unlocked = isPaid || l.isFree;
        return {
          _id: l._id,
          title: l.title,
          order: l.order,
          durationSeconds: l.durationSeconds,
          isFree: l.isFree,
          unlocked,
          // Don't leak the real asset id / object key to locked-out users
          videoAssetId: unlocked ? l.videoAssetId : null,
          pdfObjectKey: unlocked ? l.pdfObjectKey : null,
        };
      }),
  }));

  res.json({ courses: result });
});

// Example of a route that hands back a real (signed, short-lived in
// production) playback URL — only reachable if requirePaid passes, or
// the lesson is free (checked inline below).
router.get("/lessons/:id/playback", attachUserIfPresent, async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });

  const isPaid = req.user?.plan === "paid";
  if (!lesson.isFree && !isPaid) {
    return res.status(403).json({ error: "Upgrade to Paid to watch this lesson" });
  }

  // In production: call your video provider's API to mint a short-lived
  // signed playback URL from lesson.videoAssetId instead of returning it raw.
  res.json({ playbackUrl: `https://video-provider.example.com/play/${lesson.videoAssetId}` });
});

// PDF download is always gated behind requirePaid unless the lesson is free.
router.get("/lessons/:id/pdf", attachUserIfPresent, async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });

  const isPaid = req.user?.plan === "paid";
  if (!lesson.isFree && !isPaid) {
    return res.status(403).json({ error: "Upgrade to Paid to download this PDF" });
  }

  // In production: generate a signed URL from S3/R2 for lesson.pdfObjectKey,
  // e.g. using @aws-sdk/s3-request-presigner, and redirect or return it.
  res.json({ downloadUrl: `https://files.example.com/${lesson.pdfObjectKey}?signed=true` });
});

router.post("/lessons/:id/complete", requireAuth, async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });

  if (!lesson.isFree && req.user.plan !== "paid") {
    return res.status(403).json({ error: "Upgrade to Paid to track this lesson" });
  }

  req.user.completedLessons.addToSet(lesson._id);
  await req.user.save();
  res.json({ completedLessons: req.user.completedLessons });
});

export default router;
