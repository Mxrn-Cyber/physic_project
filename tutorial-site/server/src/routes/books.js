import { Router } from "express";
import { PDFDocument } from "pdf-lib";
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

// A Google Drive "anyone with the link" share URL isn't directly
// fetchable as a PDF -- it 302s to an HTML viewer page. Converting it to
// the "uc?export=download" form gets the raw file bytes instead, which is
// what we need server-side to actually read/trim the PDF (this is
// different from utils/media.js's toDriveEmbedUrl, which builds an
// *embeddable* URL for the browser, not a fetchable one for the server).
function toDriveDownloadUrl(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("drive.google.com")) return null;
    const match = u.pathname.match(/\/file\/d\/([^/]+)/);
    const id = match ? match[1] : u.searchParams.get("id");
    return id ? `https://drive.google.com/uc?export=download&id=${id}` : null;
  } catch {
    return null;
  }
}

// Downloads the full PDF and cuts it down to just its first `pages`
// pages, so a non-buyer's browser only ever receives those pages -- there
// are no bytes for the rest of the book to inspect or work around.
async function buildPreviewPdf(pdfUrl, pages) {
  const fetchUrl = toDriveDownloadUrl(pdfUrl) || pdfUrl;
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch source PDF (${response.status} ${response.statusText}) from ${fetchUrl}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const sourceBytes = await response.arrayBuffer();

  // Google Drive serves an HTML "can't scan this file for viruses" warning
  // page (status 200, but content-type text/html) for PDFs it doesn't
  // recognize as small/safe -- that HTML isn't a valid PDF and PDFDocument
  // .load() below would throw a confusing parsing error, so catch it here
  // with a clearer message pointing at the actual cause.
  if (contentType.includes("text/html")) {
    throw new Error(
      `Fetched an HTML page instead of a PDF from ${fetchUrl} -- Google Drive likely served a ` +
        `warning/confirmation page instead of the file. Try re-sharing the file as "Anyone with the ` +
        `link", or upload the PDF directly instead of linking to Drive.`
    );
  }

  const sourceDoc = await PDFDocument.load(sourceBytes);

  const pageCount = Math.min(pages, sourceDoc.getPageCount());
  const previewDoc = await PDFDocument.create();
  const copiedPages = await previewDoc.copyPages(sourceDoc, [...Array(pageCount).keys()]);
  copiedPages.forEach((page) => previewDoc.addPage(page));

  return previewDoc.save();
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
    previewPages: b.previewPages || 0,
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
// the client converts it to an embeddable preview URL). For a locked book
// with previewPages set, the real pdfUrl is never handed over -- the
// client is told to load /:id/preview-pdf instead, which only ever
// contains the first N pages.
router.get("/:id/view", attachUserIfPresent, async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });

  if (isUnlocked(book, req.user)) {
    return res.json({ pdfUrl: book.pdfUrl });
  }

  if (book.previewPages > 0) {
    return res.json({ previewPages: book.previewPages, isPreview: true });
  }

  return res.status(403).json({ error: "Buy this book to view it" });
});

// GET /api/books/:id/preview-pdf -- streams a trimmed PDF containing only
// the book's first `previewPages` pages. No auth required: this is
// intentionally the shareable "sample" of a paid book, same idea as a
// public thumbnail. Locked-out visitors' browsers load this directly in
// an <iframe>, so it can't require an Authorization header.
router.get("/:id/preview-pdf", async (req, res) => {
  const book = await Book.findById(req.params.id).catch(() => null);
  if (!book) return res.status(404).json({ error: "Book not found" });
  if (!book.previewPages) return res.status(403).json({ error: "No preview available for this book" });

  try {
    const previewBytes = await buildPreviewPdf(book.pdfUrl, book.previewPages);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=preview.pdf");
    res.send(Buffer.from(previewBytes));
  } catch (err) {
    console.error("Failed to build book preview PDF", err);
    res.status(502).json({ error: "Could not generate a preview for this book right now" });
  }
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
