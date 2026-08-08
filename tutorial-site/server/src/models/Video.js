import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },

    title: { type: String, required: true },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },

    videoUrl: { type: String, required: true },

    thumbnailUrl: { type: String, default: "" },

    isFree: { type: Boolean, default: false },
    price: { type: Number, default: 0, min: 0 },

    freeUntil: { type: Date, default: null },

    previewSeconds: { type: Number, default: 0, min: 0 },

    isTopSeller: { type: Boolean, default: false },
    isMedium: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

videoSchema.virtual("isInFreeTrial").get(function () {
  return Boolean(this.freeUntil && this.freeUntil > new Date());
});

videoSchema.virtual("effectivePrice").get(function () {
  if (this.isFree || this.isInFreeTrial) return 0;
  const pct = Math.min(Math.max(this.discountPercent, 0), 100);
  return Math.round(this.price * (1 - pct / 100) * 100) / 100;
});

videoSchema.virtual("badges").get(function () {
  const list = [];
  if (this.isTopSeller) list.push("topSeller");
  if (this.isMedium) list.push("medium");
  if (this.discountPercent > 0) list.push("discount");
  if (this.isFree) list.push("free");
  else if (this.isInFreeTrial) list.push("freeTrial");
  return list;
});

videoSchema.set("toJSON", { virtuals: true });
videoSchema.set("toObject", { virtuals: true });

export default mongoose.model("Video", videoSchema);
