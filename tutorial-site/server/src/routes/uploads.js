import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function putToR2(key, buffer, mimetype) {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

// Admin content uploads: video thumbnails, book covers, book PDFs. These can
// be large, so this stays admin-only -- R2 storage isn't free.
const adminUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

router.post("/", requireAuth, requireAdmin, adminUpload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const unique = crypto.randomBytes(8).toString("hex");
  const key = `${Date.now()}-${unique}${path.extname(req.file.originalname)}`;

  try {
    const url = await putToR2(key, req.file.buffer, req.file.mimetype);
    res.status(201).json({ url });
  } catch (err) {
    console.error("R2 upload failed", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Profile photo uploads: any logged-in user, not just admins. Kept small
// and image-only so a regular user can't use this to run up storage costs.
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
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

    const unique = crypto.randomBytes(8).toString("hex");
    const key = `avatars/${req.user._id}-${Date.now()}-${unique}${path.extname(req.file.originalname)}`;

    try {
      const url = await putToR2(key, req.file.buffer, req.file.mimetype);
      res.status(201).json({ url });
    } catch (uploadErr) {
      console.error("R2 avatar upload failed", uploadErr);
      res.status(500).json({ error: "Upload failed" });
    }
  });
});

export default router;
