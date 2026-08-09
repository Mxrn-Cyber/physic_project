import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { fileTypeFromBuffer } from "file-type";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { putToR2, randomKey } from "../utils/r2.js";
import { renderFirstPageAsJpeg } from "../utils/pdfCover.js";

const router = Router();

// Admin content uploads: video thumbnails, book covers, book PDFs. These can
// be large, so this stays admin-only -- R2 storage isn't free.
const adminUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

router.post(
  "/",
  requireAuth,
  requireAdmin,
  adminUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const key = randomKey("", path.extname(req.file.originalname));

    let url;
    try {
      url = await putToR2(key, req.file.buffer, req.file.mimetype);
    } catch (err) {
      console.error("R2 upload failed", err);
      return res.status(500).json({ error: "Upload failed" });
    }

    const response = { url };

    // If this looks like a real PDF (checked by content, not the
    // client-supplied Content-Type), auto-generate a cover image from its
    // first page -- this is what makes book covers "just work" when an
    // admin uploads a PDF without also picking a cover image. Sniffing the
    // actual bytes (rather than trusting req.file.mimetype) means a
    // mislabeled file doesn't crash cover generation.
    const detected = await fileTypeFromBuffer(req.file.buffer).catch(() => null);
    if (detected?.mime === "application/pdf") {
      try {
        const coverBuffer = await renderFirstPageAsJpeg(req.file.buffer);
        const coverKey = randomKey("covers/", ".jpg");
        response.coverUrl = await putToR2(coverKey, coverBuffer, "image/jpeg");
      } catch (err) {
        // Best-effort only: a broken/unrenderable PDF still uploads fine,
        // it just won't get an automatic cover. The admin can still set
        // one manually.
        console.error("Auto cover generation failed", err);
      }
    }

    res.status(201).json(response);
  })
);

// Profile photo uploads: any logged-in user, not just admins. Kept small
// and image-only so a regular user can't use this to run up storage costs.
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    // This only checks the Content-Type header the browser/client claims to
    // be sending -- a cheap first filter, not a security boundary. The real
    // check (below, after the upload) looks at the file's actual bytes.
    if (!AVATAR_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Profile photos must be a JPEG, PNG, WEBP or GIF image."));
    }
    cb(null, true);
  },
});

router.post("/avatar", requireAuth, (req, res) => {
  avatarUpload.single("file")(req, res, async (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "Profile photos must be under 5MB." : err.message;
      return res.status(400).json({ error: message || "Upload failed" });
    }
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Anyone can set an arbitrary Content-Type header on a multipart upload,
    // so the fileFilter above (which only looks at that header) doesn't
    // actually guarantee the file is an image. Sniff the real file signature
    // (magic bytes) here before trusting it and pushing it to R2.
    const detected = await fileTypeFromBuffer(req.file.buffer);
    if (!detected || !AVATAR_MIME_TYPES.has(detected.mime)) {
      return res.status(400).json({ error: "Profile photos must be a real JPEG, PNG, WEBP or GIF image." });
    }

    const unique = crypto.randomBytes(8).toString("hex");
    const key = `avatars/${req.user._id}-${Date.now()}-${unique}${path.extname(req.file.originalname)}`;

    try {
      const url = await putToR2(key, req.file.buffer, detected.mime);
      res.status(201).json({ url });
    } catch (uploadErr) {
      console.error("R2 avatar upload failed", uploadErr);
      res.status(500).json({ error: "Upload failed" });
    }
  });
});

export default router;
