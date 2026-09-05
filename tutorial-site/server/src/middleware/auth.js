import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  try {
    // Pin the accepted algorithm explicitly -- without this, jwt.verify
    // accepts whatever algorithm the token's header claims, which is the
    // root cause of the classic "alg: none" / algorithm-confusion JWT
    // attacks. Our tokens are always signed with HS256, so only accept that.
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user) return res.status(401).json({ error: "User no longer exists" });

    // Tokens issued before the user's last password reset carry a stale `tv`
    // and are refused here. Tokens minted before this field existed have no
    // `tv` at all; treat those as version 0 so nobody is logged out by the
    // deploy itself.
    if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function attachUserIfPresent(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const user = await User.findById(payload.sub).select("-passwordHash");
    // Same staleness check as requireAuth. This path is used by the public
    // catalogue routes to decide what a visitor has unlocked, so letting a
    // revoked token through here would still hand out paid content.
    if (user && (payload.tv ?? 0) === (user.tokenVersion ?? 0)) req.user = user;
  } catch {}
  next();
}
