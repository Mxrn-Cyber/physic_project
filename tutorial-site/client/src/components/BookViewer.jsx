import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
// Vite's `?url` suffix gives us the built URL of the worker file instead of
// trying to bundle/execute it inline -- this is the standard way to wire
// pdfjs-dist's worker up under a bundler.
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Lock, ShoppingCart, AlertTriangle } from "lucide-react";
import { getAuthToken } from "../api/client.js";

GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// Renders every page of a PDF onto its own <canvas>, stacked in a
// scrollable column -- like a normal reading app, not an embedded browser
// plugin. This replaced an <iframe src="..."> that pointed straight at the
// PDF (or, for Google Drive books, Drive's own preview page). Desktop
// browsers ship a PDF renderer that works inside an iframe, but most mobile
// browsers don't, so on phones that iframe would bounce out to a new tab
// instead of showing the book. Rendering the pages ourselves with pdf.js
// means the exact same code path runs everywhere.
export default function BookViewer({ url, title, isPreview, onBuyClick }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!url) return undefined;

    let cancelled = false;
    let loadingTask = null;
    let pdfDoc = null;
    setStatus("loading");
    setErrorMessage("");

    async function render() {
      try {
        const token = getAuthToken();
        loadingTask = getDocument({
          url,
          // Fetched with the user's token so the server can tell whether
          // they've bought this book (see GET /api/books/:id/pdf) --
          // otherwise this request would look anonymous even when logged in.
          httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        pdfDoc = await loadingTask.promise;
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";

        const containerWidth = container.clientWidth || 320;
        const dpr = window.devicePixelRatio || 1;

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (cancelled) return;

          const page = await pdfDoc.getPage(pageNum);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const cssScale = containerWidth / unscaledViewport.width;
          // Render at device-pixel resolution so the page stays sharp on
          // retina phone screens, then scale the canvas back down with CSS.
          const renderViewport = page.getViewport({ scale: cssScale * dpr });

          const canvas = document.createElement("canvas");
          canvas.className = "mb-2 block w-full shadow-sm last:mb-0";
          canvas.width = renderViewport.width;
          canvas.height = renderViewport.height;
          canvas.style.width = `${renderViewport.width / dpr}px`;
          canvas.style.height = `${renderViewport.height / dpr}px`;
          container.appendChild(canvas);

          const context = canvas.getContext("2d");
          await page.render({ canvasContext: context, viewport: renderViewport }).promise;
        }

        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("Failed to render PDF", err);
        if (!cancelled) {
          setErrorMessage(err?.message || "Could not load this PDF.");
          setStatus("error");
        }
      }
    }

    render();

    return () => {
      cancelled = true;
      // pdfjs-dist v6 removed `.destroy()` from the resolved document
      // object returned by `loadingTask.promise` -- calling it here threw a
      // TypeError on every unmount, and because it happened during unmount
      // it slipped past ErrorBoundary and blanked the whole app. The
      // loadingTask (from getDocument()) still exposes `.destroy()` in v6,
      // and destroying it also cleans up the underlying document/worker, so
      // we destroy that instead.
      loadingTask?.destroy();
    };
  }, [url]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/80 dark:bg-gray-800/80">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-red-600 dark:border-gray-600" />
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-100 px-4 text-center dark:bg-gray-800">
          <AlertTriangle className="h-6 w-6 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Couldn't load this PDF. {errorMessage}
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        role="img"
        aria-label={title}
        className="h-full w-full overflow-y-auto overscroll-contain bg-white p-2"
      />

      {isPreview && status === "ready" && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-gray-900/95 via-gray-900/80 to-transparent px-3 pb-3 pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
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
