/**
 * Blocks the request unless the authenticated user is on the Paid plan.
 * Must run after requireAuth. This is the server-side enforcement point —
 * the UI hiding a "locked" button is just UX, this middleware is the
 * actual security boundary.
 */
export function requirePaid(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  if (req.user.plan !== "paid") {
    return res.status(403).json({ error: "This content requires the Paid plan" });
  }
  next();
}
