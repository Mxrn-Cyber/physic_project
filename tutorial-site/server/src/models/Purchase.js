import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    itemType: { type: String, enum: ["video", "book"], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "itemModel" },
    itemModel: { type: String, required: true, enum: ["Video", "Book"] },

    // ABA PayWay's transaction id -- unique per purchase attempt, max 20
    // chars per their spec. Used to look the purchase up again in the
    // callback and for status polling from the client.
    tranId: { type: String, required: true, unique: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },

    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },

    // Raw callback payload from ABA, kept for debugging/audit.
    rawCallback: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);
