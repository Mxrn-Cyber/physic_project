import { Router } from "express";
import mongoose from "mongoose";
import Video from "../models/Video.js";
import { attachUserIfPresent, requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

function isUnlocked(video, user) {
  if (video.isFree) return true;
  if (video.freeUntil && new Date(video.freeUntil) > new Date()) return true;
  if (!user) return false;
  return (user.purchasedVideos || []).some((id) => String(id) === String(video._id));
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

function toPublic(v, unlocked) {
  return {
    _id: v._id,
    course: v.course,
    title: v.title,
    description: v.description,
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
    res.json({ videos: videos.map((v) => toPublic(v, isUnlocked(v, req.user))) });
  })
);

router.get(
  "/:id",
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params.id).lean().catch(() => null);
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json({ video: toPublic(video, isUnlocked(video, req.user)) });
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

    if (video.previewSeconds > 0) {
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
      const video = await Video.create(req.body);
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
    const video = await Video.findByIdAndUpdate(req.params.id, req.body, {
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
