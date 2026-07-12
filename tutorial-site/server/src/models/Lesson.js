import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },

    // In production, don't store a raw public URL for paid videos.
    // Store a video-provider asset ID (e.g. Mux playback ID) and mint a
    // signed/expiring playback URL per-request after checking the
    // user's plan server-side.
    videoAssetId: { type: String, required: true },

    // Same idea for PDFs: store an object key in S3/R2 and generate a
    // short-lived signed URL on download, rather than a public link.
    pdfObjectKey: { type: String, required: true },

    isFree: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Lesson", lessonSchema);
