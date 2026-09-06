import { Router } from "express";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import mongoose from "mongoose";
import { PDFDocument } from "pdf-lib";
import Book from "../models/Book.js";
import { attachUserIfPresent, requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isBookUnlocked as isUnlocked, isBookCompleted } from "../utils/access.js";
import { putToR2, randomKey } from "../utils/r2.js";
import { renderFirstPageAsJpeg } from "../utils/pdfCover.js";

const router = Router();

// See the note on VIDEO_WRITABLE in routes/videos.js -- same reasoning.
const BOOK_WRITABLE = [
  "course",
  "title",
  "description",
  "grades",
  "order",
  "pageCount",
  "coverImageUrl",
  "pdfUrl",
  "isFree",
  "price",
  "freeUntil",
  "previewSeconds",
  "previewPages",
  "isTopSeller",
  "isMedium",
  "discountPercent",
];

const GRADES = ["10", "11", "12"];

function normalizeGrades(value) {
  const list = Array.isArray(value) ? value : [value];
  const asStrings = list.map((v) => String(v));
  return GRADES.filter((g) => asStrings.includes(g));
}

function pickWritable(body, allowed) {
  const out = {};
  for (const key of allowed) {
    if (body?.[key] === undefined) continue;
    out[key] = key === "grades" ? normalizeGrades(body[key]) : body[key];
  }
  return out;
}

function extractDriveFileId(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("drive.google.com")) return null;
    const match = u.pathname.match(/\/file\/d\/([^/]+)/);
    return match ? match[1] : u.searchParams.get("id");
  } catch {
    return null;
  }
}

// Node's fetch (undici) exposes multiple Set-Cookie headers via
// getSetCookie(); headers.get("set-cookie") would silently join them with
// commas and corrupt cookie values that themselves contain commas (e.g.
// expiry dates). Fall back to .get() only on older runtimes that lack it.
function extractCookieHeader(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  }
  const raw = response.headers.get("set-cookie");
  return raw ? raw.split(";")[0] : "";
}

// For large or frequently-downloaded files, Drive serves an HTML "Google
// Drive can't scan this file for viruses" interstitial instead of the file,
// even for server-to-server requests with correct "Anyone with the link"
// sharing. That page contains a form (id="download-form") whose action URL
// plus hidden fields (id, export, confirm, uuid -- exact set has changed
// over the years, hence parsing them generically instead of hardcoding
// names) is the real, confirmed download URL. Returns null if the HTML
// doesn't match that shape, e.g. because it's actually a permission-denied
// page -- in which case the caller's existing error is the correct outcome.
function parseDriveConfirmUrl(html) {
  const formMatch = html.match(/<form[^>]+id="download-form"[^>]*action="([^"]+)"/);
  if (!formMatch) return null;

  const action = formMatch[1].replace(/&amp;/g, "&");
  const inputPattern = /<input[^>]+type="hidden"[^>]+name="([^"]+)"[^>]+value="([^"]*)"/g;
  const params = new URLSearchParams();
  let inputMatch;
  while ((inputMatch = inputPattern.exec(html))) {
    params.set(inputMatch[1], inputMatch[2]);
  }

  const separator = action.includes("?") ? "&" : "?";
  return `${action}${separator}${params.toString()}`;
}

// The consumer "uc?export=download" endpoint is scraped, not an official
// API -- and Google's anti-abuse system treats requests from datacenter/
// cloud IPs (Render, AWS, this kind of hosting) far more suspiciously than
// the same request from a home ISP IP. That's why this can 403 or serve a
// warning page in production while working fine from a developer's laptop
// on localhost: it's not about file size or sharing settings, it's about
// where the request is coming from. When GOOGLE_DRIVE_API_KEY is set, use
// the real Drive API instead -- it's the officially supported path, isn't
// subject to that same scraping heuristic, and acknowledgeAbuse=true is
// the documented way to still fetch a file Drive's scanner has flagged
// (large file / "can't scan for viruses") without needing to parse any
// interstitial HTML at all.
//
// Setup (one-time, in the Google Cloud project that already issues
// GOOGLE_CLIENT_ID): APIs & Services > Library > enable "Google Drive
// API", then APIs & Services > Credentials > Create Credentials > API key
// (restrict it to the Drive API). Add the key as GOOGLE_DRIVE_API_KEY in
// Render's env vars (and locally in .env) and redeploy. Only works for
// files shared as "Anyone with the link" -- same requirement as before.
async function fetchViaDriveApi(fileId) {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) return null;

  const apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&acknowledgeAbuse=true&key=${apiKey}`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Google Drive API refused file ${fileId} (${response.status} ${response.statusText}): ${body.slice(0, 300)}`
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

// Fallback for when GOOGLE_DRIVE_API_KEY isn't configured yet: scrapes the
// consumer download page, following the virus-scan warning's confirmation
// form when present. Kept as a safety net, but this is the path that's
// unreliable from cloud-hosted servers -- see fetchViaDriveApi above for
// the real fix.
async function fetchViaDriveScrape(fetchUrl) {
  let response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch source PDF (${response.status} ${response.statusText}) from ${fetchUrl}`);
  }

  let contentType = response.headers.get("content-type") || "";

  if (contentType.includes("text/html")) {
    const html = await response.text();
    const confirmUrl = parseDriveConfirmUrl(html);

    if (confirmUrl) {
      const cookie = extractCookieHeader(response);
      response = await fetch(confirmUrl, cookie ? { headers: { cookie } } : undefined);
      contentType = response.headers.get("content-type") || "";
    }

    if (!confirmUrl || !response.ok || contentType.includes("text/html")) {
      throw new Error(
        `Fetched an HTML page instead of a PDF from ${fetchUrl} -- Google Drive likely served a ` +
          `warning/confirmation page instead of the file (this is common from cloud-hosted servers, ` +
          `even when the file works fine from a developer's laptop). Set GOOGLE_DRIVE_API_KEY to use ` +
          `the real Drive API instead, re-share the file as "Anyone with the link", or upload the PDF ` +
          `directly instead of linking to Drive.`
      );
    }
  }

  return Buffer.from(await response.arrayBuffer());
}

// Fetches a book's actual PDF bytes server-side, whether it lives on our
// own storage or is a Google Drive share link. Used by every route that
// needs to hand real PDF bytes to the client (full view, preview, cover
// generation) -- fetching happens here, server-to-server, specifically so
// the browser never has to fetch cross-origin from Drive directly (which
// Drive doesn't allow via CORS, and which is also part of why the old
// iframe-based viewer had to fall back to opening a new tab on mobile).
async function fetchSourcePdfBytes(pdfUrl) {
  const driveId = extractDriveFileId(pdfUrl);
  if (!driveId) {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Could not fetch source PDF (${response.status} ${response.statusText}) from ${pdfUrl}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  const viaApi = await fetchViaDriveApi(driveId);
  if (viaApi) return viaApi;

  return fetchViaDriveScrape(`https://drive.google.com/uc?export=download&id=${driveId}`);
}

// Streams a PDF straight from its origin to the client without ever holding
// the whole file in memory. fetchSourcePdfBytes() buffers the entire document
// into a Buffer, which is fine for cover generation (one page, admin-only) but
// not for serving reads: a 30MB book requested by four students at once was
// 120MB of heap on an instance that may only have 512MB.
//
// Only used for the "unlocked, not on Drive" path. Previews must be buffered
// because pdf-lib needs the whole document to copy pages out of it, and Drive
// links need the confirmation dance in fetchViaDriveScrape().
async function streamPdfTo(res, pdfUrl) {
  const upstream = await fetch(pdfUrl);
  if (!upstream.ok || !upstream.body) {
    throw new Error(`Could not fetch source PDF (${upstream.status} ${upstream.statusText}) from ${pdfUrl}`);
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=book.pdf");
  const length = upstream.headers.get("content-length");
  // Lets the viewer show a real progress bar instead of an unknown-length
  // spinner, and lets pdf.js range-request rather than wait for everything.
  if (length) res.setHeader("Content-Length", length);

  await pipeline(Readable.fromWeb(upstream.body), res);
}

async function buildPreviewPdf(pdfUrl, pages) {
  const sourceBytes = await fetchSourcePdfBytes(pdfUrl);
  const sourceDoc = await PDFDocument.load(sourceBytes);

  const pageCount = Math.min(pages, sourceDoc.getPageCount());
  const previewDoc = await PDFDocument.create();
  const copiedPages = await previewDoc.copyPages(sourceDoc, [...Array(pageCount).keys()]);
  copiedPages.forEach((page) => previewDoc.addPage(page));

  return previewDoc.save();
}

function toPublic(b, unlocked, completed) {
  return {
    _id: b._id,
    course: b.course,
    title: b.title,
    description: b.description,
    grades: b.grades || [],
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
    // Same reasoning as routes/videos.js: only meaningful once unlocked.
    completed: unlocked && completed,
    createdAt: b.createdAt,
    // Deliberately no pdfUrl. The R2 bucket is served from a public URL, so
    // any link handed out here works forever for anyone it is forwarded to --
    // one buyer could share a permanent download link for a paid book. The
    // frontend never needed it either: BookViewer fetches bytes through
    // GET /api/books/:id/pdf, which re-checks ownership on every request.
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
    res.json({
      books: books.map((b) => toPublic(b, isUnlocked(b, req.user), isBookCompleted(b, req.user))),
    });
  })
);

router.get(
  "/:id",
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id).lean().catch(() => null);
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json({ book: toPublic(book, isUnlocked(book, req.user), isBookCompleted(book, req.user)) });
  })
);

router.get(
  "/:id/view",
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    // Returns only *whether* the book can be read and in what mode -- never
    // the underlying storage URL (see the note in toPublic above). The bytes
    // come from GET /api/books/:id/pdf.
    if (isUnlocked(book, req.user)) {
      return res.json({ unlocked: true, isPreview: false });
    }

    if (book.previewPages > 0) {
      return res.json({ unlocked: false, previewPages: book.previewPages, isPreview: true });
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

// Serves the actual PDF bytes for a book -- the full document if unlocked,
// otherwise the same page-limited preview as /preview-pdf above. This is
// what the in-page pdf.js viewer on the frontend fetches (with the user's
// auth token, so purchases are respected) instead of pointing an <iframe>
// straight at the source URL. Loading the file this way -- as bytes the
// browser's JS renders onto <canvas> -- is what keeps books readable
// inline on mobile instead of bouncing out to a new tab: mobile browsers
// generally don't have a PDF renderer available *inside* an iframe the way
// desktop browsers do, so an iframe pointed at a raw PDF (or a Google
// Drive link) is what was forcing the "open in new tab" behavior before.
router.get(
  "/:id/pdf",
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id).catch(() => null);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const unlocked = isUnlocked(book, req.user);
    if (!unlocked && !book.previewPages) {
      return res.status(403).json({ error: "Buy this book to view it" });
    }

    try {
      if (unlocked && !extractDriveFileId(book.pdfUrl)) {
        await streamPdfTo(res, book.pdfUrl);
        return;
      }

      const bytes = unlocked
        ? await fetchSourcePdfBytes(book.pdfUrl)
        : await buildPreviewPdf(book.pdfUrl, book.previewPages);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=book.pdf");
      res.send(Buffer.from(bytes));
    } catch (err) {
      console.error("Failed to serve book PDF", err);
      // Once streaming has begun the status line is already on the wire, so a
      // mid-transfer failure can only be signalled by dropping the connection
      // -- sending a JSON body here would corrupt the PDF the client is
      // already reading.
      if (res.headersSent) return res.destroy(err);
      res.status(502).json({ error: "Could not load this PDF right now" });
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

    let pdfBytes;
    try {
      pdfBytes = await fetchSourcePdfBytes(pdfUrl);
    } catch (err) {
      return res.status(502).json({ error: err.message });
    }

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
      const book = await Book.create(pickWritable(req.body, BOOK_WRITABLE));
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
    const book = await Book.findByIdAndUpdate(req.params.id, pickWritable(req.body, BOOK_WRITABLE), {
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
