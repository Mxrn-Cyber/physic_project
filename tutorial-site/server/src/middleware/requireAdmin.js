/**
 * Blocks the request unless the authenticated user is an admin.
 * Must run after requireAuth (which attaches req.user from a verified JWT).
 */
export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
