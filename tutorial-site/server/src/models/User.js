import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    photoUrl: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },

    isAdmin: { type: Boolean, default: false },

    purchasedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    purchasedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],

    completedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    completedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],

    resetPasswordTokenHash: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
