import test from "node:test";
import assert from "node:assert/strict";
import { isVideoUnlocked, isBookUnlocked, isPubliclyHostedVideo } from "../src/utils/access.js";

const ID = "651111111111111111111111";
const OTHER_ID = "652222222222222222222222";

const paidVideo = { _id: ID, isFree: false, freeUntil: null };
const buyer = { purchasedVideos: [ID], purchasedBooks: [ID] };

test("free items are open to everyone, including logged-out visitors", () => {
  assert.equal(isVideoUnlocked({ _id: ID, isFree: true }, null), true);
  assert.equal(isBookUnlocked({ _id: ID, isFree: true }, null), true);
});

test("paid items are locked for visitors and for logged-in non-buyers", () => {
  assert.equal(isVideoUnlocked(paidVideo, null), false);
  assert.equal(isVideoUnlocked(paidVideo, { purchasedVideos: [] }), false);
  assert.equal(isVideoUnlocked(paidVideo, { purchasedVideos: [OTHER_ID] }), false);
});

test("a buyer unlocks the item they bought, and only that one", () => {
  assert.equal(isVideoUnlocked(paidVideo, buyer), true);
  assert.equal(isVideoUnlocked({ _id: OTHER_ID, isFree: false }, buyer), false);
});

test("purchase ids match whether stored as strings or ObjectId-like objects", () => {
  const objectIdLike = { toString: () => ID };
  assert.equal(isVideoUnlocked(paidVideo, { purchasedVideos: [objectIdLike] }), true);
});

test("videos and books do not unlock each other", () => {
  const onlyBoughtBook = { purchasedVideos: [], purchasedBooks: [ID] };
  assert.equal(isVideoUnlocked(paidVideo, onlyBoughtBook), false);
  assert.equal(isBookUnlocked({ _id: ID, isFree: false }, onlyBoughtBook), true);
});

test("an active free-trial window unlocks, an expired one does not", () => {
  const future = new Date(Date.now() + 60 * 60 * 1000);
  const past = new Date(Date.now() - 60 * 60 * 1000);
  assert.equal(isVideoUnlocked({ _id: ID, isFree: false, freeUntil: future }, null), true);
  assert.equal(isVideoUnlocked({ _id: ID, isFree: false, freeUntil: past }, null), false);
});

test("a missing item is never unlocked", () => {
  assert.equal(isVideoUnlocked(null, buyer), false);
  assert.equal(isVideoUnlocked(undefined, buyer), false);
});

test("only known public video hosts count as publicly hosted", () => {
  assert.equal(isPubliclyHostedVideo("https://www.youtube.com/watch?v=abc123"), true);
  assert.equal(isPubliclyHostedVideo("https://youtu.be/abc123"), true);
  assert.equal(isPubliclyHostedVideo("https://vimeo.com/123456"), true);

  // Self-hosted files: handing these URLs to a non-buyer gives away the video.
  assert.equal(isPubliclyHostedVideo("https://pub-abc.r2.dev/lesson-01.mp4"), false);
  assert.equal(isPubliclyHostedVideo("https://cdn.example.com/paid.mp4"), false);

  // A lookalike hostname must not slip through a substring check.
  assert.equal(isPubliclyHostedVideo("https://youtube.com.evil.example/x"), false);
  assert.equal(isPubliclyHostedVideo("not a url"), false);
  assert.equal(isPubliclyHostedVideo(""), false);
});
