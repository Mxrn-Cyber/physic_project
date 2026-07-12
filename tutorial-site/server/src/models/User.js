import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    // "free" until Stripe webhook confirms an active subscription
    plan: { type: String, enum: ["free", "paid"], default: "free" },

    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },

    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
