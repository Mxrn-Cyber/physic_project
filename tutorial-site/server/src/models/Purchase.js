import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    itemType: { type: String, enum: ["video", "book"], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "itemModel" },
    itemModel: { type: String, required: true, enum: ["Video", "Book"] },

    tranId: { type: String, required: true, unique: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },

    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },

    rawCallback: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);
