import { toDriveEmbedUrl } from "../utils/media.js";

// When isPreview is true, `url` already points at the server's
// preview-pdf endpoint (see api.getBookPreviewPdfUrl), which physically
// only contains the book's first N pages -- there's nothing to time out
// or hide, the file itself just ends there. We just show a persistent
// "buy to keep reading" strip under the reader instead of blocking it.
export default function BookViewer({ url, title, isPreview, onBuyClick }) {
  const embedUrl = toDriveEmbedUrl(url) || url;

  return (
    <div className="relative h-full w-full">
      <iframe
        className="h-full w-full bg-white"
        src={embedUrl}
        title={title}
        allow="autoplay"
      />
      {isPreview && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gray-900/90 px-4 py-2 text-sm text-white">
          <span>Preview only — buy to read the rest of the book.</span>
          <button
            type="button"
            onClick={onBuyClick}
            className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-red-700"
          >
            Buy now
          </button>
        </div>
      )}
    </div>
  );
}
