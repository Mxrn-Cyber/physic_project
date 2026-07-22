import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

// Files (video thumbnails, book covers, PDFs) are uploaded straight to
// Cloudflare R2 (S3-compatible object storage) instead of this server's
// local disk. That's required for hosts like Render, whose filesystem is
// wiped on every redeploy/restart -- R2 keeps files persistent regardless
// of where or how many times the API gets redeployed.
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Buffer the file in memory (no local disk write) then hand it to R2.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB, generous for video files
});

// POST /api/uploads -- multipart/form-data with a single "file" field.
// Admin-only: this is meant for the admin panel's "upload from this
// device" option when adding a video or book.
router.post("/", requireAuth, requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const unique = crypto.randomBytes(8).toString("hex");
  const key = `${Date.now()}-${unique}${path.extname(req.file.originalname)}`;

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );
  } catch (err) {
    console.error("R2 upload failed", err);
    return res.status(500).json({ error: "Upload failed" });
  }

  // R2_PUBLIC_URL is either the bucket's public dev URL
  // (https://pub-xxxx.r2.dev) or a custom domain you've mapped to the
  // bucket -- set in the environment, no trailing slash.
  res.status(201).json({ url: `${process.env.R2_PUBLIC_URL}/${key}` });
});

export default router;
