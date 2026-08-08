import { useEffect, useState } from "react";
import { toVideoEmbedUrl } from "../utils/media.js";

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

  return (<video className="h-full w-full" src={url} controls title={title} />);
}
