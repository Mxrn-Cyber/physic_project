// Single source of truth for "is this person allowed to see this item?".
//
// This logic used to be copy-pasted into routes/videos.js, routes/books.js and
// routes/courses.js. Three copies of the rule that decides whether money has
// to change hands is three chances for them to drift -- courses.js had in fact
// already drifted once (it checked a `user.plan` field that never existed, so
// it returned "locked" even for people who had actually paid).

/**
 * Free items and items inside an active free-trial window are open to
 * everyone. Otherwise the user must appear in the matching purchase list.
 *
 * @param item  a Video or Book document (or .lean() object)
 * @param user  the authenticated user, or null/undefined for a visitor
 * @param field "purchasedVideos" | "purchasedBooks"
 */
export function isUnlocked(item, user, field) {
  if (!item) return false;
  if (item.isFree) return true;
  if (item.freeUntil && new Date(item.freeUntil) > new Date()) return true;
  if (!user) return false;
  return (user[field] || []).some((id) => String(id) === String(item._id));
}

export const isVideoUnlocked = (video, user) => isUnlocked(video, user, "purchasedVideos");
export const isBookUnlocked = (book, user) => isUnlocked(book, user, "purchasedBooks");

// Hosts that serve the video publicly themselves. For these, handing the URL
// to a non-buyer during a preview gives away nothing that wasn't already
// public -- an unlisted YouTube link is readable by anyone who has the link,
// with or without this API.
//
// For anything else (a file on our own R2 bucket, a direct .mp4), the URL *is*
// the content: whoever holds it can download the whole video forever, and no
// client-side "preview ended" timer changes that. Those must never be handed
// to someone who has not paid.
const PUBLIC_VIDEO_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
];

export function isPubliclyHostedVideo(url) {
  try {
    return PUBLIC_VIDEO_HOSTS.includes(new URL(url).hostname.toLowerCase());
  } catch {
    return false;
  }
}
