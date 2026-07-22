import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    // Optional -- a book can belong to a course (for grouping/browsing)
    // or stand alone as its own sellable item.
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },

    title: { type: String, required: true },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    coverImageUrl: { type: String, default: "" },

    // A link to the PDF. Works with a Google Drive "anyone with the link
    // can view" share link (we convert it to an embeddable preview URL on
    // the client) or any direct URL that serves the file.
    pdfUrl: { type: String, required: true },

    isFree: { type: Boolean, default: false },
    price: { type: Number, default: 0, min: 0 },

    // Independent badges/flags -- a book can be, say, both a top seller
    // AND discounted at once. isFree overrides price display to $0.
    isTopSeller: { type: Boolean, default: false },
    isMedium: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

bookSchema.virtual("effectivePrice").get(function () {
  if (this.isFree) return 0;
  const pct = Math.min(Math.max(this.discountPercent, 0), 100);
  return Math.round(this.price * (1 - pct / 100) * 100) / 100;
});

bookSchema.virtual("badges").get(function () {
  const list = [];
  if (this.isTopSeller) list.push("topSeller");
  if (this.isMedium) list.push("medium");
  if (this.discountPercent > 0) list.push("discount");
  if (this.isFree) list.push("free");
  return list;
});

bookSchema.set("toJSON", { virtuals: true });
bookSchema.set("toObject", { virtuals: true });

export default mongoose.model("Book", bookSchema);
