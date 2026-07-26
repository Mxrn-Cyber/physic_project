import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    // Standard profile fields, editable by the user themselves on /profile.
    photoUrl: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },

    // Grants access to the /admin panel (video/book management).
    // Set manually in the DB or via the seed script -- there's no
    // self-service way to become an admin from the UI.
    isAdmin: { type: Boolean, default: false },

    // Access is per-item (bought via ABA PayWay -- see routes/payments.js),
    // not a site-wide subscription plan. A video/book is unlocked if it's
    // marked isFree OR its id is in the matching array below.
    purchasedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    purchasedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],

    completedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    completedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],

    // Password reset -- a random token is generated on /forgot-password,
    // only its SHA-256 hash is stored here (so a leaked DB doesn't hand out
    // usable tokens), and it expires after 1 hour.
    resetPasswordTokenHash: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
