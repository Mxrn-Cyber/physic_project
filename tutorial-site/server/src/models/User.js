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
    // Was missing from the schema while PATCH /api/auth/me and publicUser()
    // both referenced it -- Mongoose's strict mode silently dropped the
    // value on save, so a student could type an address, get a success
    // response, and find the field empty again on reload.
    address: { type: String, default: "", trim: true },
    phoneVerified: { type: Boolean, default: false },

    // Bumped whenever every existing session for this user must stop working
    // (currently: a completed password reset). The value is embedded in each
    // JWT as `tv` and re-checked on every authenticated request, which is what
    // makes a reset actually kick out whoever knew the old password -- before
    // this, a stolen 7-day token stayed valid for its full life even after the
    // real owner reset their password.
    tokenVersion: { type: Number, default: 0 },

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
