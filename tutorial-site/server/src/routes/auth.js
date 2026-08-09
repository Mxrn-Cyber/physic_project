import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { sendOtpEmail } from "../utils/email.js";
import { sendOtpSms } from "../utils/sms.js";
import { buildOtp, canResend, emptyOtp, secondsUntilResend, verifyOtpMatch } from "../utils/otp.js";

const router = Router();

// Nothing below was rate-limited before, so an attacker (or a buggy client
// stuck retrying) could throw unlimited login/OTP guesses at any account.
// These are per-IP, in-memory limits -- fine for a single Render instance;
// swap for a shared store (e.g. Redis) if this ever runs on more than one.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});

// Set to true to require a signup OTP again -- new accounts will need to
// verify a code before they can log in, same as the reset-password flow.
// Off for now: registration verifies + logs the user in immediately, no
// code sent, and /login stops enforcing isVerified. Password reset always
// uses its OTP code regardless of this flag.
const REQUIRE_SIGNUP_VERIFICATION = false;

// otp.* fields are select:false on the schema -- opt back in explicitly
// wherever a route needs to inspect the current code.
const OTP_SELECT = "+otp.codeHash +otp.purpose +otp.channel +otp.expiresAt +otp.attempts +otp.lastSentAt";

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "7d",
    algorithm: "HS256",
  });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    isVerified: user.isVerified,
    authProvider: user.authProvider,
    photoUrl: user.photoUrl,
    phone: user.phone,
    address: user.address,
    purchasedVideos: user.purchasedVideos,
    purchasedBooks: user.purchasedBooks,
  };
}

async function issueOtp(user, purpose, channel) {
  const { otp, code } = buildOtp(purpose, channel);
  user.otp = otp;
  await user.save();

  if (channel === "phone") {
    if (!user.phone) throw new Error("No phone number on file for SMS.");
    await sendOtpSms(user.phone, code);
  } else {
    await sendOtpEmail(user.email, code, purpose);
  }
}

function recordFailedAttempt(user) {
  if (user.otp?.codeHash) {
    user.otp.attempts = (user.otp.attempts || 0) + 1;
    return user.save();
  }
  return Promise.resolve();
}

router.post("/register", loginLimiter, async (req, res) => {
  try {
    const { name, email, password, phone, channel } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const wantsPhoneChannel = channel === "phone";
    if (wantsPhoneChannel && !phone) {
      return res.status(400).json({ error: "A phone number is required to receive an SMS code" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      phone: phone || "",
      authProvider: "local",
      isVerified: !REQUIRE_SIGNUP_VERIFICATION,
    });

    if (!REQUIRE_SIGNUP_VERIFICATION) {
      const token = signToken(user);
      return res.status(201).json({ token, user: publicUser(user) });
    }

    const resolvedChannel = wantsPhoneChannel ? "phone" : "email";
    try {
      await issueOtp(user, "signup", resolvedChannel);
    } catch (otpErr) {
      console.error("Failed to send signup OTP", otpErr);
      return res.status(502).json({
        error: "Account created, but we couldn't send the verification code. Try resending it.",
        email: user.email,
        channel: resolvedChannel,
      });
    }

    res.status(201).json({
      message: "We sent a verification code -- enter it to activate your account.",
      email: user.email,
      channel: resolvedChannel,
    });
  } catch (err) {
    console.error("register error", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/verify-otp", otpLimiter, async (req, res) => {
  try {
    const { email, code, purpose = "signup" } = req.body;
    if (!email || !code) return res.status(400).json({ error: "email and code are required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(OTP_SELECT);
    if (!user) return res.status(400).json({ error: "Invalid code" });

    const result = verifyOtpMatch(user.otp, purpose, code);
    if (!result.ok) {
      await recordFailedAttempt(user);
      return res.status(400).json({ error: result.reason || "Invalid code" });
    }

    const usedChannel = user.otp.channel;

    if (purpose === "signup") {
      user.isVerified = true;
      if (usedChannel === "phone") user.phoneVerified = true;
    }
    user.otp = emptyOtp();
    await user.save();

    if (purpose === "signup") {
      const token = signToken(user);
      return res.json({ token, user: publicUser(user) });
    }

    res.json({ message: "Code verified." });
  } catch (err) {
    console.error("verify-otp error", err);
    res.status(500).json({ error: "Could not verify code" });
  }
});

router.post("/resend-otp", otpLimiter, async (req, res) => {
  try {
    const { email, purpose = "signup", channel } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(`${OTP_SELECT} +phone`);
    if (!user) return res.json({ message: "If that account exists, a new code has been sent." });

    if (purpose === "signup" && user.isVerified) {
      return res.status(400).json({ error: "This account is already verified." });
    }

    if (!canResend(user.otp)) {
      const retryAfterSeconds = secondsUntilResend(user.otp);
      return res.status(429).json({
        error: `Please wait ${retryAfterSeconds}s before requesting another code.`,
        retryAfterSeconds,
      });
    }

    const resolvedChannel = channel === "phone" && user.phone ? "phone" : user.otp.channel || "email";
    await issueOtp(user, purpose, resolvedChannel);

    res.json({ message: "A new code has been sent.", channel: resolvedChannel });
  } catch (err) {
    console.error("resend-otp error", err);
    res.status(500).json({ error: "Could not resend code" });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase().trim() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    if (REQUIRE_SIGNUP_VERIFICATION && !user.isVerified) {
      return res.status(403).json({
        error: "Please verify your account before logging in.",
        needsVerification: true,
        email: user.email,
      });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/google", async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(501).json({ error: "Google sign-in isn't configured on this server yet." });
    }
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "Missing Google credential" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(400).json({ error: "Google account has no email" });

    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email: payload.email.toLowerCase().trim() });
    }

    if (user) {
      user.googleId = user.googleId || payload.sub;
      user.isVerified = true;
      if (!user.photoUrl && payload.picture) user.photoUrl = payload.picture;
      await user.save();
    } else {
      user = await User.create({
        name: payload.name || payload.email.split("@")[0],
        email: payload.email.toLowerCase().trim(),
        passwordHash: null,
        photoUrl: payload.picture || "",
        authProvider: "google",
        googleId: payload.sub,
        isVerified: true,
      });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("google auth error", err);
    res.status(401).json({ error: "Google sign-in failed" });
  }
});

router.post("/forgot-password", otpLimiter, async (req, res) => {
  const GENERIC_OK = { message: "If that email is registered, a code has been sent." };
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(OTP_SELECT);
    if (!user) return res.json(GENERIC_OK);
    if (!canResend(user.otp)) return res.json(GENERIC_OK);

    await issueOtp(user, "reset", "email");
    res.json(GENERIC_OK);
  } catch (err) {
    console.error("forgot-password error", err);
    res.json(GENERIC_OK);
  }
});

router.post("/reset-password", otpLimiter, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "email, code and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(OTP_SELECT);
    if (!user) return res.status(400).json({ error: "Invalid or expired code" });

    const result = verifyOtpMatch(user.otp, "reset", code);
    if (!result.ok) {
      await recordFailedAttempt(user);
      return res.status(400).json({ error: result.reason || "Invalid or expired code" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.otp = emptyOtp();
    await user.save();

    res.json({ message: "Password updated. You can now log in." });
  } catch (err) {
    console.error("reset-password error", err);
    res.status(500).json({ error: "Could not reset password" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.patch("/me", requireAuth, async (req, res) => {
  const { name, phone, address, photoUrl } = req.body;

  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (address !== undefined) req.user.address = address;
  if (photoUrl !== undefined) req.user.photoUrl = photoUrl;

  try {
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
