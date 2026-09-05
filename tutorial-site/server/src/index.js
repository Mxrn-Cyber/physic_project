import "dotenv/config";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/videos.js";
import bookRoutes from "./routes/books.js";
import paymentRoutes from "./routes/payments.js";
import uploadRoutes from "./routes/uploads.js";
import userRoutes from "./routes/users.js";

const app = express();

// Render (like most hosting) puts a reverse proxy in front of this app, so
// every request arrives from the proxy's IP and req.ip is that proxy unless
// we say otherwise. Without this, express-rate-limit buckets ALL traffic
// under one IP: the 20-attempts-per-15-minutes login limit becomes a global
// limit shared by every real student, while a distributed attacker isn't
// slowed down at all. Trust exactly one proxy hop (Render's) -- not `true`,
// which would trust a client-supplied X-Forwarded-For and let anyone forge
// their way around the limiter.
app.set("trust proxy", 1);

// Baseline security headers (HSTS, X-Content-Type-Options, frame denial,
// referrer policy...). crossOriginResourcePolicy is relaxed because the
// client is served from a different origin and needs to read uploaded
// covers and PDFs from this API.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// process.env.CLIENT_URL is easy to mis-set with a trailing slash (e.g.
// copy-pasted from a browser address bar), but a browser's Origin header
// never has one -- CORS does an exact string match, so passing CLIENT_URL
// straight to `origin` meant a stray "/" silently broke every request from
// the frontend with a CORS error that gave no hint the trailing slash was
// the cause. Support a comma-separated list too, so both a prod and a
// preview/staging URL can be allowed at once.
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header at all (curl, server-to-server calls, some mobile
      // clients) -- nothing to check against, let it through.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin.replace(/\/+$/, ""))) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json());

const dbReady = () => mongoose.connection.readyState === 1;

// Deliberately declared before the guard below so uptime checks still get an
// answer while the database is down.
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, db: dbReady() ? "connected" : "disconnected" })
);

// Without this, requests that arrive while the database is unreachable just
// hang on Mongoose's buffer until it times out. A clear 503 lets the client
// show "try again later" straight away.
app.use("/api", (req, res, next) => {
  if (dbReady()) return next();
  res.status(503).json({
    error: "The service is starting up or the database is unavailable. Please try again shortly.",
  });
});
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

// Config problems used to surface as confusing runtime failures: a missing
// JWT_SECRET meant jwt.sign threw on the first login attempt, and leaving the
// PayWay sandbox URL in place meant the site took "payments" that were never
// real money. Check what we can at boot instead, while someone is watching
// the deploy log.
function checkConfig() {
  const fatal = [];
  if (!process.env.MONGO_URI) fatal.push("MONGO_URI is not set.");
  if (!process.env.JWT_SECRET) {
    fatal.push("JWT_SECRET is not set.");
  } else if (process.env.JWT_SECRET.length < 32) {
    fatal.push("JWT_SECRET is shorter than 32 characters -- use a long random string.");
  } else if (process.env.JWT_SECRET === "replace-with-a-long-random-string") {
    fatal.push("JWT_SECRET is still the placeholder from .env.example.");
  }

  if (fatal.length) {
    console.error("[config] Refusing to start:");
    for (const line of fatal) console.error(`  - ${line}`);
    process.exit(1);
  }

  // Not fatal -- a staging deploy may legitimately want these -- but loud, so
  // nobody discovers them by wondering why real money never arrived.
  const warnings = [];
  if (!process.env.CLIENT_URL) {
    warnings.push("CLIENT_URL is empty: every browser request will be rejected by CORS.");
  }
  if (process.env.NODE_ENV === "production") {
    if ((process.env.ABA_BASE_URL || "").includes("sandbox")) {
      warnings.push("ABA_BASE_URL still points at the PayWay SANDBOX -- purchases will not take real money.");
    }
    if ((process.env.RESET_EMAIL_FROM || "").includes("resend.dev")) {
      warnings.push(
        "RESET_EMAIL_FROM still uses Resend's shared onboarding address -- verify your own domain or password-reset codes may not reach students."
      );
    }
  }
  for (const line of warnings) console.warn(`[config] WARNING: ${line}`);
}

checkConfig();

const PORT = process.env.PORT || 4000;

// The server used to call process.exit(1) if the very first DB connection
// failed, so a brief network blip at the database took the whole API down
// and it never came back on its own. Now we always listen, and keep retrying
// the connection in the background; the guard above answers 503 until it
// succeeds.
app.listen(PORT, () => console.log(`API listening on :${PORT}`));

const RETRY_MS = 5000;

async function connectWithRetry() {
  try {
    await connectDB();
  } catch (err) {
    console.error(`[db] connection failed, retrying in ${RETRY_MS}ms:`, err.message);
    setTimeout(connectWithRetry, RETRY_MS);
  }
}

connectWithRetry();
