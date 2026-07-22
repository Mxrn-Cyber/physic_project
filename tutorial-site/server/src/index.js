import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
// Courses are disabled for now -- only Videos and Books are sold directly,
// each with its own price. routes/courses.js and models/Course.js are left
// in place so course grouping can be turned back on later; just re-add the
// import and app.use("/api/courses", courseRoutes) line below.
import videoRoutes from "./routes/videos.js";
import bookRoutes from "./routes/books.js";
import paymentRoutes from "./routes/payments.js";
import uploadRoutes from "./routes/uploads.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// ABA PayWay's callback is regular JSON, so express.json() below covers it
// too -- no special raw-body handling needed (unlike Stripe's signed
// webhooks, which this project no longer uses).
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/uploads", uploadRoutes);

// Centralized error handler
app.use((err, _req, res, _next) => {
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
