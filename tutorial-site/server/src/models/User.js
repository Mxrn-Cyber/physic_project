import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    codeHash: { type: String, default: null, select: false },
    purpose: { type: String, default: null, select: false },
    channel: { type: String, default: null, select: false },
    expiresAt: { type: Date, default: null, select: false },
    attempts: { type: Number, default: 0, select: false },
    lastSentAt: { type: Date, default: null, select: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Google-only accounts have no local password.
    passwordHash: { type: String, default: null },

    photoUrl: { type: String, default: "" },
    phone: { type: String, default: "" },
    phoneVerified: { type: Boolean, default: false },

    isAdmin: { type: Boolean, default: false },
    // Must be true before /login will issue a session -- set once signup OTP
    // is verified, or immediately for Google sign-ins.
    isVerified: { type: Boolean, default: false },

    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: null, index: true, sparse: true, unique: true },

    purchasedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    purchasedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],

    completedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    completedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],

    // Shared by signup verification and password-reset codes (see otp.js);
    // `purpose` distinguishes which flow a given code belongs to.
    otp: { type: otpSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
