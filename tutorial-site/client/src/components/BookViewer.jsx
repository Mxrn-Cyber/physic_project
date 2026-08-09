import { useState } from "react";
import { Lock, ShoppingCart } from "lucide-react";
import { toDriveEmbedUrl } from "../utils/media.js";

export default function BookViewer({ url, title, isPreview, onBuyClick }) {
  const [loaded, setLoaded] = useState(false);
  const embedUrl = toDriveEmbedUrl(url) || url;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-red-600 dark:border-gray-600" />
        </div>
      )}

      <iframe
        className={`h-full w-full bg-white transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        src={embedUrl}
        title={title}
        allow="autoplay"
        onLoad={() => setLoaded(true)}
      />

      {isPreview && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-gray-900/95 via-gray-900/80 to-transparent px-3 pb-3 pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-white sm:text-sm">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            Preview only — buy to read the rest of the book.
          </span>
          <button
            type="button"
            onClick={onBuyClick}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95 sm:text-sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Buy now
          </button>
        </div>
      )}
    </div>
  );
}
