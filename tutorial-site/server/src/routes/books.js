import { Router } from "express";
import mongoose from "mongoose";
import { PDFDocument } from "pdf-lib";
import Book from "../models/Book.js";
import { attachUserIfPresent, requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { putToR2, randomKey } from "../utils/r2.js";
import { renderFirstPageAsJpeg } from "../utils/pdfCover.js";

const router = Router();

function isUnlocked(book, user) {
  if (book.isFree) return true;
  if (book.freeUntil && new Date(book.freeUntil) > new Date()) return true;
  if (!user) return false;
  return (user.purchasedBooks || []).some((id) => String(id) === String(book._id));
}

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

async function buildPreviewPdf(pdfUrl, pages) {
  const fetchUrl = toDriveDownloadUrl(pdfUrl) || pdfUrl;
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch source PDF (${response.status} ${response.statusText}) from ${fetchUrl}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const sourceBytes = await response.arrayBuffer();

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
    pdfUrl: unlocked ? b.pdfUrl : null,
  };
}

router.get(
  "/",
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.course) {
      // Same NoSQL-operator-injection guard as videos.js -- reject anything
      // that isn't a real ObjectId instead of handing it to Mongoose as-is.
      if (!mongoose.Types.ObjectId.isValid(req.query.course)) {
        return res.status(400).json({ error: "Invalid course id" });
      }
      filter.course = req.query.course;
    }

    const books = await Book.find(filter).sort({ order: 1, createdAt: -1 }).lean();
    res.json({ books: books.map((b) => toPublic(b, isUnlocked(b, req.user))) });
  })
);

router.get(
  "/:id",
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id).lean().catch(() => null);
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json({ book: toPublic(book, isUnlocked(book, req.user)) });
  })
);

router.get(
  "/:id/view",
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    if (isUnlocked(book, req.user)) {
      return res.json({ pdfUrl: book.pdfUrl });
    }

    if (book.previewPages > 0) {
      return res.json({ previewPages: book.previewPages, isPreview: true });
    }

    return res.status(403).json({ error: "Buy this book to view it" });
  })
);

router.get(
  "/:id/preview-pdf",
  asyncHandler(async (req, res) => {
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
  })
);

router.post(
  "/:id/complete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    if (!isUnlocked(book, req.user)) {
      return res.status(403).json({ error: "Buy this book to track it" });
    }

    req.user.completedBooks.addToSet(book._id);
    await req.user.save();
    res.json({ completedBooks: req.user.completedBooks });
  })
);

router.get(
  "/admin/all",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const books = await Book.find().sort({ order: 1, createdAt: -1 });
    res.json({ books });
  })
);

// Generates a cover image from page 1 of a PDF that was linked by URL
// rather than uploaded directly (e.g. a Google Drive share link pasted
// into the admin form). Direct file uploads get their cover generated
// inline in routes/uploads.js instead, since the bytes are already in
// hand there -- this route exists to cover the "paste a URL" path too.
router.post(
  "/generate-cover",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { pdfUrl } = req.body || {};
    if (!pdfUrl) return res.status(400).json({ error: "pdfUrl is required" });

    const fetchUrl = toDriveDownloadUrl(pdfUrl) || pdfUrl;
    let response;
    try {
      response = await fetch(fetchUrl);
    } catch {
      return res.status(502).json({ error: `Could not fetch the PDF from ${fetchUrl}` });
    }
    if (!response.ok) {
      return res
        .status(502)
        .json({ error: `Could not fetch source PDF (${response.status} ${response.statusText}) from ${fetchUrl}` });
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      return res.status(400).json({
        error:
          `Fetched an HTML page instead of a PDF from ${fetchUrl} -- Google Drive likely served a ` +
          `warning/confirmation page instead of the file. Try re-sharing the file as "Anyone with the ` +
          `link", or upload the PDF directly instead of linking to Drive.`,
      });
    }

    const pdfBytes = Buffer.from(await response.arrayBuffer());

    try {
      const coverBuffer = await renderFirstPageAsJpeg(pdfBytes);
      const coverKey = randomKey("covers/", ".jpg");
      const coverUrl = await putToR2(coverKey, coverBuffer, "image/jpeg");
      res.json({ coverUrl });
    } catch (err) {
      console.error("Failed to generate book cover from URL", err);
      res.status(502).json({ error: "Could not generate a cover from this PDF" });
    }
  })
);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    try {
      const book = await Book.create(req.body);
      res.status(201).json(book);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  })
);

router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json(book);
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.status(204).send();
  })
);

export default router;
