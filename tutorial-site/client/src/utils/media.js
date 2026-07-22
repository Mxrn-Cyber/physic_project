// Converts a YouTube/Vimeo share link into its embeddable player URL.
// Returns null if the URL isn't one of those (caller should fall back to
// a plain <video> tag for direct .mp4/.webm links).
export function toVideoEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    // not a valid absolute URL -- fall through to null
  }
  return null;
}

// Converts a Google Drive "anyone with the link can view" share link
// (.../file/d/<ID>/view?usp=sharing or ...?id=<ID>) into its embeddable
// preview URL. Returns null if it's not a Drive link (caller should fall
// back to loading the URL directly, which works for any URL that serves
// a PDF with the right headers).
export function toDriveEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("drive.google.com")) return null;
    const match = u.pathname.match(/\/file\/d\/([^/]+)/);
    const id = match ? match[1] : u.searchParams.get("id");
    return id ? `https://drive.google.com/file/d/${id}/preview` : null;
  } catch {
    return null;
  }
}
