import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    // Optional -- a video can belong to a course (for grouping/browsing)
    // or stand alone as its own sellable item.
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },

    title: { type: String, required: true },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },

    // A direct link to the video (YouTube/Vimeo share link, or a direct
    // .mp4 URL). Redacted from the public API response for locked videos.
    videoUrl: { type: String, required: true },

    // Optional thumbnail (uploaded, or a pasted image link). If left blank,
    // the API auto-derives one from a YouTube URL when possible. Shown even
    // for locked videos (like Udemy course thumbnails) -- it's just a
    // preview image, not the gated content itself.
    thumbnailUrl: { type: String, default: "" },

    isFree: { type: Boolean, default: false },
    price: { type: Number, default: 0, min: 0 },

    // Simple 3-way access model set from the admin form: permanently free
    // (isFree true), free for a limited trial window (freeUntil set to a
    // future date, price still applies once it passes), or paid (neither
    // set). Whoever views it while isFree is true OR freeUntil is still in
    // the future can watch for free; everyone else must have purchased it.
    freeUntil: { type: Date, default: null },

    // Independent badges/flags -- a video can be, say, both a top seller
    // AND discounted at once. isFree overrides price display to $0.
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
