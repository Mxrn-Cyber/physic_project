import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

// Every route here is admin-only.
router.use(requireAuth, requireAdmin);

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
  };
}

// GET /api/users -- list everyone, for the admin panel's user table.
router.get("/", async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map(publicUser) });
});

// POST /api/users -- admin creates an account directly (no email
// verification step, unlike self-service /api/auth/register).
router.post("/", async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, isAdmin: Boolean(isAdmin) });
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/users/:id -- currently only used to promote/demote admin
// status from the admin panel toggle.
router.patch("/:id", async (req, res) => {
  if (req.params.id === String(req.user._id) && req.body.isAdmin === false) {
    return res.status(400).json({ error: "You can't remove your own admin access" });
  }

  const update = {};
  if (typeof req.body.isAdmin === "boolean") update.isAdmin = req.body.isAdmin;

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    return res.status(400).json({ error: "You can't delete your own account while logged in as it" });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(204).send();
});

export default router;
