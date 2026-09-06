import { Router } from "express";
import mongoose from "mongoose";
import Video from "../models/Video.js";
import { attachUserIfPresent, requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isVideoUnlocked as isUnlocked, isVideoCompleted, isPubliclyHostedVideo } from "../utils/access.js";

const router = Router();

// Only these may be set from an admin request body. Previously req.body was
// handed straight to Mongoose: a typo'd field name silently wrote nothing,
// and anything the schema later gains (say an internal flag) would have been
// writable from the browser the moment it was added.
const VIDEO_WRITABLE = [
  "course",
  "title",
  "description",
  "grades",
  "order",
  "durationSeconds",
  "videoUrl",
  "thumbnailUrl",
  "isFree",
  "price",
  "freeUntil",
  "previewSeconds",
  "isTopSeller",
  "isMedium",
  "discountPercent",
];

const GRADES = ["10", "11", "12"];

function normalizeGrades(value) {
  const list = Array.isArray(value) ? value : [value];
  const asStrings = list.map((v) => String(v));
  return GRADES.filter((g) => asStrings.includes(g));
}

function pickWritable(body, allowed) {
  const out = {};
  for (const key of allowed) {
    if (body?.[key] === undefined) continue;
    out[key] = key === "grades" ? normalizeGrades(body[key]) : body[key];
  }
  return out;
}

function youTubeThumbnail(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    let id = null;
    if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v") || u.pathname.match(/\/embed\/([^/?]+)/)?.[1] || null;
    } else if (u.hostname === "youtu.be") {
      id = u.pathname.slice(1);
    }
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

function toPublic(v, unlocked, completed) {
  return {
    _id: v._id,
    course: v.course,
    title: v.title,
    description: v.description,
    grades: v.grades || [],
    order: v.order,
    durationSeconds: v.durationSeconds,
    isFree: v.isFree,
    price: v.price,
    freeUntil: v.freeUntil,
    discountPercent: v.discountPercent || 0,
    effectivePrice:
      v.isFree || (v.freeUntil && new Date(v.freeUntil) > new Date())
        ? 0
        : Math.round(v.price * (1 - Math.min(Math.max(v.discountPercent || 0, 0), 100) / 100) * 100) / 100,
    badges: [
      v.isTopSeller && "topSeller",
      v.isMedium && "medium",
      (v.discountPercent || 0) > 0 && "discount",
      v.isFree && "free",
      !v.isFree && v.freeUntil && new Date(v.freeUntil) > new Date() && "freeTrial",
    ].filter(Boolean),
    unlocked,
    // Only meaningful once unlocked -- completedVideos can technically contain
    // an id the user no longer owns (e.g. content changed hands), so this is
    // deliberately AND-ed with unlocked rather than trusted on its own.
    completed: unlocked && completed,
    createdAt: v.createdAt,
    thumbnailUrl: v.thumbnailUrl || youTubeThumbnail(v.videoUrl) || "",
    videoUrl: unlocked ? v.videoUrl : null,
  };
}

router.get(
  "/",
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.course) {
      // req.query.course comes straight from the URL. Without this check,
      // something like ?course[$ne]=null would pass an object into the
      // Mongoose filter instead of a string, letting a caller craft a
      // NoSQL query operator instead of filtering by a real course id.
      if (!mongoose.Types.ObjectId.isValid(req.query.course)) {
        return res.status(400).json({ error: "Invalid course id" });
      }
      filter.course = req.query.course;
    }

    const videos = await Video.find(filter).sort({ order: 1, createdAt: -1 }).lean();
    res.json({
      videos: videos.map((v) => toPublic(v, isUnlocked(v, req.user), isVideoCompleted(v, req.user))),
    });
  })
);

router.get(
  "/:id",
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params.id).lean().catch(() => null);
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json({ video: toPublic(video, isUnlocked(video, req.user), isVideoCompleted(video, req.user)) });
  })
);

router.get(
  "/:id/playback",
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    if (isUnlocked(video, req.user)) {
      return res.json({ playbackUrl: video.videoUrl });
    }

    // A preview used to hand back the FULL video URL and rely on a
    // setTimeout in VideoPlayer.jsx to stop playback. That is not a lock --
    // the URL is sitting in the network tab, and once someone has it they
    // have the whole video forever.
    //
    // It is only acceptable when the host is already serving the video
    // publicly (YouTube/Vimeo), where the link leaks nothing the platform
    // wasn't leaking anyway. For a self-hosted file the URL is the content,
    // so we refuse rather than pretend the timer protected anything.
    if (video.previewSeconds > 0 && isPubliclyHostedVideo(video.videoUrl)) {
      return res.json({ playbackUrl: video.videoUrl, previewSeconds: video.previewSeconds, isPreview: true });
    }

    return res.status(403).json({ error: "Buy this video to watch it" });
  })
);

router.post(
  "/:id/complete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    if (!isUnlocked(video, req.user)) {
      return res.status(403).json({ error: "Buy this video to track it" });
    }

    req.user.completedVideos.addToSet(video._id);
    await req.user.save();
    res.json({ completedVideos: req.user.completedVideos });
  })
);

router.get(
  "/admin/all",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const videos = await Video.find().sort({ order: 1, createdAt: -1 });
    res.json({ videos });
  })
);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    try {
      const video = await Video.create(pickWritable(req.body, VIDEO_WRITABLE));
      res.status(201).json(video);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  })
);

router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const video = await Video.findByIdAndUpdate(req.params.id, pickWritable(req.body, VIDEO_WRITABLE), {
      new: true,
      runValidators: true,
    });
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json(video);
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.status(204).send();
  })
);

export default router;
