import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

process.env.ABA_API_KEY = "test-api-key";
const { buildPurchaseHash, verifyCallbackSignature, PURCHASE_HASH_FIELD_ORDER } = await import(
  "../src/utils/abaSignature.js"
);

function sign(value, key = "test-api-key") {
  return crypto.createHmac("sha512", key).update(value).digest("base64");
}

test("a callback signed with our key is accepted", () => {
  const body = { tran_id: "T123", status: "0", amount: "4.50" };
  // Keys are sorted before hashing: amount, status, tran_id.
  const expected = sign(["4.50", "0", "T123"].join(""));
  assert.equal(verifyCallbackSignature(body, expected), true);
});

test("a callback signed with the wrong key is rejected", () => {
  const body = { tran_id: "T123", status: "0" };
  const forged = sign(["0", "T123"].join(""), "attacker-key");
  assert.equal(verifyCallbackSignature(body, forged), false);
});

test("tampering with the body after signing is rejected", () => {
  const body = { tran_id: "T123", status: "1" };
  const signature = sign(["1", "T123"].join(""));
  // Attacker flips a failed payment to approved but reuses the old signature.
  assert.equal(verifyCallbackSignature({ ...body, status: "0" }, signature), false);
});

test("a missing or malformed signature is rejected, never thrown on", () => {
  const body = { tran_id: "T123" };
  assert.equal(verifyCallbackSignature(body, undefined), false);
  assert.equal(verifyCallbackSignature(body, ""), false);
  assert.equal(verifyCallbackSignature(body, "short"), false); // length mismatch
  assert.equal(verifyCallbackSignature(null, sign("x")), false);
});

test("nested objects in the callback are stringified consistently", () => {
  const body = { a: { nested: true }, b: "x" };
  const expected = sign(JSON.stringify({ nested: true }) + "x");
  assert.equal(verifyCallbackSignature(body, expected), true);
});

test("purchase hash uses PayWay's field order, not alphabetical order", () => {
  // If someone "tidies" the order into alphabetical, ABA rejects every
  // purchase request. This pins the first few fields as documented.
  assert.deepEqual(PURCHASE_HASH_FIELD_ORDER.slice(0, 4), [
    "req_time",
    "merchant_id",
    "tran_id",
    "amount",
  ]);
});

test("purchase hash treats missing optional fields as empty strings", () => {
  const hash = buildPurchaseHash({ req_time: "20260101000000", merchant_id: "M1", tran_id: "T1", amount: "1.00" });
  const expected = sign("20260101000000" + "M1" + "T1" + "1.00");
  assert.equal(hash, expected);
});
