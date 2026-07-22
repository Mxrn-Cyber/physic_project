import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

const UPLOAD_DIR = "uploads";
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Stored locally on this server's disk for now (fine for a single normal
// server; if you later move to a serverless/multi-instance host, swap this
// storage engine for an S3/Cloudinary one -- the /api/uploads contract
// (POST a file, get back { url }) can stay the same).
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB, generous for video files
});

// POST /api/uploads -- multipart/form-data with a single "file" field.
// Admin-only: this is meant for the admin panel's "upload from this
// device" option when adding a video or book.
router.post("/", requireAuth, requireAdmin, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  // Absolute URL to this server (not the Vite dev client), since /uploads
  // isn't behind the client's /api proxy.
  const serverUrl = process.env.SERVER_URL || "http://localhost:4000";
  res.status(201).json({ url: `${serverUrl}/uploads/${req.file.filename}` });
});

export default router;
