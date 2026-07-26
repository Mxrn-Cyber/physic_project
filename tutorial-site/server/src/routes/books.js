import { Router } from "express";
import Book from "../models/Book.js";
import { attachUserIfPresent, requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

function isUnlocked(book, user) {
  if (book.isFree) return true;
  if (book.freeUntil && new Date(book.freeUntil) > new Date()) return true;
  if (!user) return false;
  return (user.purchasedBooks || []).some((id) => String(id) === String(book._id));
}

function toPublic(b, unlocked) {
  return {
    _id: b._id,
    course: b.course,
    title: b.title,
    description: b.description,
    order: b.order,
    coverImageUrl: b.coverImageUrl,
    pageCount: b.pageCount || 0,
    isFree: b.isFree,
    price: b.price,
    freeUntil: b.freeUntil,
    discountPercent: b.discountPercent || 0,
    effectivePrice:
      b.isFree || (b.freeUntil && new Date(b.freeUntil) > new Date())
        ? 0
        : Math.round(b.price * (1 - Math.min(Math.max(b.discountPercent || 0, 0), 100) / 100) * 100) / 100,
    badges: [
      b.isTopSeller && "topSeller",
      b.isMedium && "medium",
      (b.discountPercent || 0) > 0 && "discount",
      b.isFree && "free",
      !b.isFree && b.freeUntil && new Date(b.freeUntil) > new Date() && "freeTrial",
    ].filter(Boolean),
    unlocked,
    createdAt: b.createdAt,
    // Don't leak the real PDF URL to locked-out users
    pdfUrl: unlocked ? b.pdfUrl : null,
  };
}

// GET /api/books?course=<id> -- public catalog (attachUserIfPresent lets
// logged-out visitors browse and see free previews unlocked).
router.get("/", attachUserIfPresent, async (req, res) => {
  const filter = {};
  if (req.query.course) filter.course = req.query.course;

  const books = await Book.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  res.json({ books: books.map((b) => toPublic(b, isUnlocked(b, req.user))) });
});

// GET /api/books/:id -- single book's public detail (for the dedicated
// book detail/product page).
router.get("/:id", attachUserIfPresent, async (req, res) => {
  const book = await Book.findById(req.params.id).lean().catch(() => null);
  if (!book) return res.status(404).json({ error: "Book not found" });
  res.json({ book: toPublic(book, isUnlocked(book, req.user)) });
});

// Returns the PDF URL to view/embed (e.g. a Google Drive share link --
// the client converts it to an embeddable preview URL).
router.get("/:id/view", attachUserIfPresent, async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });

  if (!isUnlocked(book, req.user)) {
    return res.status(403).json({ error: "Buy this book to view it" });
  }

  res.json({ pdfUrl: book.pdfUrl });
});

router.post("/:id/complete", requireAuth, async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });

  if (!isUnlocked(book, req.user)) {
    return res.status(403).json({ error: "Buy this book to track it" });
  }

  req.user.completedBooks.addToSet(book._id);
  await req.user.save();
  res.json({ completedBooks: req.user.completedBooks });
});

// ---- Admin-only management ----

router.get("/admin/all", requireAuth, requireAdmin, async (_req, res) => {
  const books = await Book.find().sort({ order: 1, createdAt: -1 });
  res.json({ books });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!book) return res.status(404).json({ error: "Book not found" });
  res.json(book);
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });
  res.status(204).send();
});

export default router;
