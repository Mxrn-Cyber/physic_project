import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { sendPasswordResetEmail } from "../utils/email.js";

const router = Router();

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    photoUrl: user.photoUrl,
    phone: user.phone,
    address: user.address,
    purchasedVideos: user.purchasedVideos,
    purchasedBooks: user.purchasedBooks,
  };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Request a reset link. Always responds the same way whether or not the
// email exists, so this endpoint can't be used to check which emails are
// registered.
router.post("/forgot-password", async (req, res) => {
  const GENERIC_OK = { message: "If that email is registered, a reset link has been sent." };
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.json(GENERIC_OK);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    res.json(GENERIC_OK);
  } catch (err) {
    console.error("forgot-password error", err);
    // Still return the generic message -- don't leak whether email sending
    // failed vs. the account not existing.
    res.json(GENERIC_OK);
  }
});

// Complete the reset using the token emailed above.
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: "email, token and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordTokenHash +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ error: "Reset link is invalid or has expired" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
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

// Self-service profile update -- name/phone/address/photoUrl only.
// Email, password, plan, and isAdmin are not editable through this route.
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
