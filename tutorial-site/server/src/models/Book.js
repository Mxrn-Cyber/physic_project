import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    // Optional -- a book can belong to a course (for grouping/browsing)
    // or stand alone as its own sellable item.
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },

    title: { type: String, required: true },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    pageCount: { type: Number, default: 0, min: 0 },
    coverImageUrl: { type: String, default: "" },

    // A link to the PDF. Works with a Google Drive "anyone with the link
    // can view" share link (we convert it to an embeddable preview URL on
    // the client) or any direct URL that serves the file.
    pdfUrl: { type: String, required: true },

    isFree: { type: Boolean, default: false },
    price: { type: Number, default: 0, min: 0 },

    // Simple 3-way access model set from the admin form: permanently free
    // (isFree true), free for a limited trial window (freeUntil set to a
    // future date, price still applies once it passes), or paid (neither
    // set). Whoever views it while isFree is true OR freeUntil is still in
    // the future can view for free; everyone else must have purchased it.
    freeUntil: { type: Date, default: null },

    // Deprecated -- kept only so old documents don't lose data. Replaced by
    // previewPages below (page-based preview is generated server-side now,
    // see routes/books.js "/:id/preview-pdf", so it works for any pdfUrl,
    // including Google Drive links, without needing client-side slicing).
    previewSeconds: { type: Number, default: 0, min: 0 },

    // Only meaningful for paid (not free / not currently in free trial)
    // books: lets a non-buyer read the first N pages before being asked to
    // pay. 0 means no preview -- straight to the paywall. The server
    // fetches the real PDF, cuts it down to these first N pages with
    // pdf-lib, and serves *only* that trimmed file -- the non-buyer never
    // receives bytes for pages past the limit.
    previewPages: { type: Number, default: 0, min: 0 },

    // Independent badges/flags -- a book can be, say, both a top seller
    // AND discounted at once. isFree overrides price display to $0.
    isTopSeller: { type: Boolean, default: false },
    isMedium: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true },
);

bookSchema.virtual("isInFreeTrial").get(function () {
  return Boolean(this.freeUntil && this.freeUntil > new Date());
});

bookSchema.virtual("effectivePrice").get(function () {
  if (this.isFree || this.isInFreeTrial) return 0;
  const pct = Math.min(Math.max(this.discountPercent, 0), 100);
  return Math.round(this.price * (1 - pct / 100) * 100) / 100;
});

bookSchema.virtual("badges").get(function () {
  const list = [];
  if (this.isTopSeller) list.push("topSeller");
  if (this.isMedium) list.push("medium");
  if (this.discountPercent > 0) list.push("discount");
  if (this.isFree) list.push("free");
  else if (this.isInFreeTrial) list.push("freeTrial");
  return list;
});

bookSchema.set("toJSON", { virtuals: true });
bookSchema.set("toObject", { virtuals: true });

export default mongoose.model("Book", bookSchema);
