import crypto from "crypto";

// The two HMACs the ABA PayWay integration depends on. Pulled out of
// routes/payments.js so they can be tested without standing up Express or
// Mongoose -- these functions decide whether money is real, and they were the
// only part of the payment flow with no way to exercise them.
//
// The key is read at call time (not module load) so tests can set it, and so a
// deploy that adds ABA_API_KEY without restarting cleanly isn't stuck with an
// empty key baked in.
function apiKey() {
  return process.env.ABA_API_KEY || "";
}

// Field order is defined by PayWay and is NOT alphabetical -- it is the order
// their docs list for the purchase request. Changing it silently produces a
// hash ABA rejects, so leave it alone unless their spec changes.
export const PURCHASE_HASH_FIELD_ORDER = [
  "req_time",
  "merchant_id",
  "tran_id",
  "amount",
  "items",
  "shipping",
  "firstname",
  "lastname",
  "email",
  "phone",
  "type",
  "payment_option",
  "return_url",
  "cancel_url",
  "continue_success_url",
  "return_deeplink",
  "currency",
  "custom_fields",
  "return_params",
  "payout",
  "lifetime",
  "additional_params",
  "google_pay_token",
  "skip_success_page",
];

export function buildPurchaseHash(fields) {
  const concatenated = PURCHASE_HASH_FIELD_ORDER.map((key) => fields[key] ?? "").join("");
  return crypto.createHmac("sha512", apiKey()).update(concatenated).digest("base64");
}

/**
 * Verifies the HMAC ABA sends with a payment callback. Returns false rather
 * than throwing on anything malformed -- a callback we can't verify is simply
 * not trusted.
 */
export function verifyCallbackSignature(body, headerSignature) {
  if (!headerSignature) return false;
  if (!body || typeof body !== "object") return false;

  const concatenated = Object.keys(body)
    .sort()
    .map((key) => {
      const value = body[key];
      return typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
    })
    .join("");
  const expected = crypto.createHmac("sha512", apiKey()).update(concatenated).digest("base64");

  try {
    // timingSafeEqual throws on a length mismatch, which is itself a
    // non-match; the catch below turns that into a plain false.
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(headerSignature));
  } catch {
    return false;
  }
}
