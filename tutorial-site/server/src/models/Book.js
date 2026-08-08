import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
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

    pdfUrl: { type: String, required: true },

    isFree: { type: Boolean, default: false },
    price: { type: Number, default: 0, min: 0 },

    freeUntil: { type: Date, default: null },

    previewSeconds: { type: Number, default: 0, min: 0 },

    previewPages: { type: Number, default: 0, min: 0 },

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
