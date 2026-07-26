import { Router } from "express";
import Video from "../models/Video.js";
import { attachUserIfPresent, requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

function isUnlocked(video, user) {
  if (video.isFree) return true;
  if (video.freeUntil && new Date(video.freeUntil) > new Date()) return true;
  if (!user) return false;
  return (user.purchasedVideos || []).some((id) => String(id) === String(video._id));
}

// Derives a thumbnail from a YouTube URL when the admin hasn't set one
// explicitly. Returns null for Vimeo/direct-file links since there's no
// reliable way to get a thumbnail from those without an extra API call.
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
    // A thumbnail is just a preview image, not the gated content, so it's
    // shown even for locked videos (matches Udemy-style browsing).
    thumbnailUrl: v.thumbnailUrl || youTubeThumbnail(v.videoUrl) || "",
    // Don't leak the real video URL to locked-out users
    videoUrl: unlocked ? v.videoUrl : null,
  };
}

// GET /api/videos?course=<id> -- public catalog (attachUserIfPresent lets
// logged-out visitors browse and see free previews unlocked).
router.get("/", attachUserIfPresent, async (req, res) => {
  const filter = {};
  if (req.query.course) filter.course = req.query.course;

  const videos = await Video.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  res.json({ videos: videos.map((v) => toPublic(v, isUnlocked(v, req.user))) });
});

// GET /api/videos/:id -- single video's public detail (for the dedicated
// video detail/product page). Placed before /:id/playback etc. only for
// readability -- Express doesn't care about order here since the path
// shapes don't overlap.
router.get("/:id", attachUserIfPresent, async (req, res) => {
  const video = await Video.findById(req.params.id).lean().catch(() => null);
  if (!video) return res.status(404).json({ error: "Video not found" });
  res.json({ video: toPublic(video, isUnlocked(video, req.user)) });
});

router.get("/:id/playback", attachUserIfPresent, async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ error: "Video not found" });

  if (!isUnlocked(video, req.user)) {
    return res.status(403).json({ error: "Buy this video to watch it" });
  }

  res.json({ playbackUrl: video.videoUrl });
});

router.post("/:id/complete", requireAuth, async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ error: "Video not found" });

  if (!isUnlocked(video, req.user)) {
    return res.status(403).json({ error: "Buy this video to track it" });
  }

  req.user.completedVideos.addToSet(video._id);
  await req.user.save();
  res.json({ completedVideos: req.user.completedVideos });
});

// ---- Admin-only management ----

router.get("/admin/all", requireAuth, requireAdmin, async (_req, res) => {
  const videos = await Video.find().sort({ order: 1, createdAt: -1 });
  res.json({ videos });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const video = await Video.create(req.body);
    res.status(201).json(video);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const video = await Video.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!video) return res.status(404).json({ error: "Video not found" });
  res.json(video);
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const video = await Video.findByIdAndDelete(req.params.id);
  if (!video) return res.status(404).json({ error: "Video not found" });
  res.status(204).send();
});

export default router;
