import { Router } from "express";
import Video from "../models/Video.js";
import Book from "../models/Book.js";
import Purchase from "../models/Purchase.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
// The two HMAC helpers live in utils/abaSignature.js so they can be unit
// tested without booting Express or Mongoose.
import { buildPurchaseHash, verifyCallbackSignature } from "../utils/abaSignature.js";

const router = Router();

const ABA_BASE_URL = process.env.ABA_BASE_URL || "https://checkout-sandbox.payway.com.kh";
const ABA_MERCHANT_ID = process.env.ABA_MERCHANT_ID || "";
const ABA_API_KEY = process.env.ABA_API_KEY || "";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";

const ITEM_MODELS = { video: "Video", book: "Book" };
const ITEM_LOOKUP = { video: Video, book: Book };

function formatReqTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds())
  );
}

function makeTranId() {
  return `T${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    .toUpperCase()
    .slice(0, 20);
}

router.post(
  "/create",
  requireAuth,
  asyncHandler(async (req, res) => {
  const { itemType, itemId } = req.body;
  const Model = ITEM_LOOKUP[itemType];
  if (!Model) return res.status(400).json({ error: "itemType must be 'video' or 'book'" });

  const item = await Model.findById(itemId);
  if (!item) return res.status(404).json({ error: "Item not found" });
  if (item.isFree) return res.status(400).json({ error: "This item is free -- no purchase needed" });

  const alreadyOwned =
    itemType === "video"
      ? (req.user.purchasedVideos || []).some((id) => String(id) === String(item._id))
      : (req.user.purchasedBooks || []).some((id) => String(id) === String(item._id));
  if (alreadyOwned) return res.status(400).json({ error: "You already own this item" });

  const pct = Math.min(Math.max(item.discountPercent || 0, 0), 100);
  const amount = Math.round(item.price * (1 - pct / 100) * 100) / 100;

  const tranId = makeTranId();
  await Purchase.create({
    user: req.user._id,
    itemType,
    itemId: item._id,
    itemModel: ITEM_MODELS[itemType],
    tranId,
    amount,
    currency: "USD",
    status: "pending",
  });

  const [firstname, ...rest] = (req.user.name || "").split(" ");
  const fields = {
    req_time: formatReqTime(new Date()),
    merchant_id: ABA_MERCHANT_ID,
    tran_id: tranId,
    amount: amount.toFixed(2),
    items: Buffer.from(JSON.stringify([{ name: item.title, quantity: 1, price: amount }])).toString("base64"),
    firstname: firstname || req.user.name || "",
    lastname: rest.join(" "),
    email: req.user.email,
    phone: req.user.phone || "",
    payment_option: "abapay_khqr_deeplink",
    return_url: `${SERVER_URL}/api/payments/callback`,
    cancel_url: `${process.env.CLIENT_URL}/${itemType}s`,
    continue_success_url: `${process.env.CLIENT_URL}/${itemType}s`,
    currency: "USD",
    return_params: tranId,
  };
  fields.hash = buildPurchaseHash(fields);

  if (!ABA_MERCHANT_ID || !ABA_API_KEY) {
    return res.status(501).json({
      error:
        "ABA PayWay isn't configured yet -- set ABA_MERCHANT_ID and ABA_API_KEY in server/.env (see sandbox.payway.com.kh to get sandbox credentials).",
    });
  }

  try {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.append(key, value);

    const abaRes = await fetch(`${ABA_BASE_URL}/api/payment-gateway/v1/payments/purchase`, {
      method: "POST",
      body: form,
    });
    const data = await abaRes.json();

    res.json({
      tranId,
      amount,
      qrString: data.qr_string || null,
      qrImageUrl: data.checkout_qr_url || null,
      deeplink: data.abapay_deeplink || null,
      raw: data,
    });
  } catch (err) {
    res.status(502).json({ error: `Could not reach ABA PayWay: ${err.message}` });
  }
  })
);

router.get(
  "/:tranId/status",
  requireAuth,
  asyncHandler(async (req, res) => {
    const purchase = await Purchase.findOne({ tranId: req.params.tranId, user: req.user._id });
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });
    res.json({ status: purchase.status });
  })
);

export async function handleAbaCallback(req, res) {
  const signature = req.header("X-PAYWAY-HMAC-SHA512");
  if (!verifyCallbackSignature(req.body, signature)) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  const { tran_id: tranId, status } = req.body;
  const purchase = await Purchase.findOne({ tranId });
  if (!purchase) return res.status(404).json({ error: "Unknown tran_id" });

  // ABA retries a callback it doesn't get a clean answer to, so the same
  // transaction can arrive more than once. Without this, a late duplicate
  // carrying a failure status could flip an already-completed purchase to
  // "failed" and strand a student who had genuinely paid. A settled purchase
  // is final; acknowledge and stop.
  if (purchase.status === "completed") {
    return res.json({ received: true, alreadyProcessed: true });
  }

  purchase.rawCallback = req.body;

  const approved = String(status) === "0";
  purchase.status = approved ? "completed" : "failed";
  await purchase.save();

  if (approved) {
    const User = (await import("../models/User.js")).default;
    const field = purchase.itemType === "video" ? "purchasedVideos" : "purchasedBooks";
    await User.findByIdAndUpdate(purchase.user, { $addToSet: { [field]: purchase.itemId } });
  }

  res.json({ received: true });
}

router.post("/callback", asyncHandler(handleAbaCallback));

export default router;
