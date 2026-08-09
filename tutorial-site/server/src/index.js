import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/videos.js";
import bookRoutes from "./routes/books.js";
import paymentRoutes from "./routes/payments.js";
import uploadRoutes from "./routes/uploads.js";
import userRoutes from "./routes/users.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/users", userRoutes);

app.use((err, _req, res, _next) => {
  // Routes are now wrapped in asyncHandler (see utils/asyncHandler.js), so
  // errors that used to be unhandled promise rejections -- e.g. a malformed
  // id like GET /api/videos/not-an-id -- land here instead of crashing or
  // hanging the request. Give the two common Mongoose cases a real 4xx
  // instead of a generic 500.
  if (err?.name === "CastError") {
    return res.status(400).json({ error: `Invalid ${err.path}: "${err.value}"` });
  }
  if (err?.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`API listening on :${PORT}`)))
  .catch((err) => {
    console.error("Failed to connect to DB", err);
    process.exit(1);
  });
