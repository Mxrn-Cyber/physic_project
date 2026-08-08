import { useEffect, useState } from "react";
import { toVideoEmbedUrl } from "../utils/media.js";

// previewSeconds/isPreview come from the server (see routes/videos.js) --
// they're only set when the viewer hasn't bought this video but a preview
// window is configured. After that many seconds we cover the player with
// a "buy to keep watching" prompt instead of relying on the client alone
// to hide the real URL (which is already handed over at this point).
export default function VideoPlayer({ url, title, previewSeconds, isPreview, onBuyClick }) {
  const [previewEnded, setPreviewEnded] = useState(false);
  const embedUrl = toVideoEmbedUrl(url);

  useEffect(() => {
    setPreviewEnded(false);
    if (!isPreview || !previewSeconds) return undefined;
    const timer = setTimeout(() => setPreviewEnded(true), previewSeconds * 1000);
    return () => clearTimeout(timer);
  }, [url, isPreview, previewSeconds]);

  if (previewEnded) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black/90 p-6 text-center text-white">
        <p className="text-sm">Preview ended.</p>
        <button
          type="button"
          onClick={onBuyClick}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
        >
          Buy to keep watching
        </button>
      </div>
    );
  }

  if (embedUrl) {
    return (
      <iframe
        className="h-full w-full"
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Fall back to a direct <video> tag for plain .mp4/.webm links.
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video className="h-full w-full" src={url} controls title={title} />
  );
}
