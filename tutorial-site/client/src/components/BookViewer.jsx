import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDocument, PDFWorker } from "pdfjs-dist";
// Not pdfjs-dist's worker file directly: utils/pdf-worker.js wraps it so the
// polyfills load inside the worker's realm too. See utils/polyfills.js.
import PdfWorker from "../utils/pdf-worker.js?worker";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Lock,
  Maximize2,
  Minus,
  Plus,
  ShoppingCart,
  X,
} from "lucide-react";
import { getAuthToken } from "../api/client.js";
import { useLanguage } from "../context/LanguageContext.jsx";

// How many pages either side of the visible one are kept drawn. Pages
// outside this window have their canvas thrown away and are redrawn if you
// scroll back -- the placeholder keeps its exact height either way, so the
// scrollbar never jumps. Without this a 200-page book would hold 200
// full-resolution canvases in memory at once, which is what the previous
// version did and why opening a book was slow.
const KEEP_WINDOW = 3;

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

/**
 * Reads a PDF the way a reading app does: pages stacked in a scrollable
 * column, drawn only as they come into view.
 *
 * This renders the pages itself rather than using <iframe src="...">.
 * Desktop browsers ship a PDF renderer that works in an iframe; most mobile
 * browsers don't, and would bounce the reader out to a new tab instead of
 * showing the book. Rendering with pdf.js means one code path everywhere.
 */
export default function BookViewer({
  url,
  title,
  isPreview,
  onBuyClick,
  // Buyers only. A preview is a server-trimmed file, and offering to save it
  // would imply the whole book is in hand.
  allowDownload = false,
}) {
  const { t } = useLanguage();

  const scrollRef = useRef(null);
  const pageElsRef = useRef([]);
  // Which pages are drawn is read from the DOM, not tracked alongside it.
  // An earlier version kept a Map of page -> canvas and evicted from that;
  // the two drifted apart (4 entries in the Map, 22 canvases on screen) and
  // eviction silently stopped happening. Each page host carries the width it
  // was drawn at in data-rendered, so "is this page drawn, and still at the
  // right size?" has exactly one answer.
  const tasksRef = useRef(new Map()); // page number -> in-flight render task
  const docRef = useRef(null);
  const widthRef = useRef(0);

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [sizes, setSizes] = useState([]); // unscaled {width,height} per page
  const [page, setPage] = useState(1);
  // Mirrors `page` for the zoom effect, which must read the current page
  // without taking a dependency on it.
  const pageRef = useRef(1);
  const [pageDraft, setPageDraft] = useState("1");
  const [zoom, setZoom] = useState(1); // 1 = fit the column's width
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const total = sizes.length;

  /* ------------------------------------------------------------------ *
   * Load: page count and page dimensions only. Measuring every page is
   * cheap (no rasterising), and it lets every placeholder get its real
   * height up front, so the scrollbar is honest before anything is drawn.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!url) return undefined;

    let cancelled = false;
    let loadingTask = null;
    let pdfWorker = null;
    setStatus("loading");
    setErrorMessage("");
    setSizes([]);
    setPage(1);
    setPageDraft("1");

    (async () => {
      try {
        const token = getAuthToken();
        // One worker per document, wrapped so the polyfills load inside it.
        pdfWorker = new PDFWorker({ port: new PdfWorker() });
        loadingTask = getDocument({
          url,
          worker: pdfWorker,
          // Sent with the user's token so the server can tell whether they
          // bought this book (see GET /api/books/:id/pdf) -- otherwise the
          // request looks anonymous even when they are signed in.
          httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const doc = await loadingTask.promise;
        if (cancelled) return;
        docRef.current = doc;

        const measured = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const p = await doc.getPage(n);
          const v = p.getViewport({ scale: 1 });
          measured.push({ width: v.width, height: v.height });
          if (cancelled) return;
        }
        setSizes(measured);
        setStatus("ready");
      } catch (err) {
        console.error("Failed to open PDF", err);
        if (!cancelled) {
          setErrorMessage(err?.message || "");
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      tasksRef.current.forEach((task) => task.cancel?.());
      tasksRef.current.clear();
      docRef.current = null;
      // pdfjs-dist v6 removed `.destroy()` from the resolved document object,
      // and calling it there threw on every unmount -- during unmount, so it
      // slipped past ErrorBoundary and blanked the app. The loadingTask still
      // has `.destroy()`, and destroying it tears down the document and
      // worker too.
      loadingTask?.destroy();
      pdfWorker?.destroy();
    };
  }, [url]);

  /* ------------------------------------------------------------------ *
   * Track the column's width so pages can be laid out to fit it, and
   * redraw when it changes (window resize, phone rotation, entering or
   * leaving full screen).
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [status, expanded]);

  // Width one page is drawn at. Padding keeps the page off the edges.
  const pageWidth = useMemo(() => {
    const available = Math.max((containerWidth || widthRef.current || 320) - 24, 160);
    widthRef.current = available;
    return available * zoom;
  }, [containerWidth, zoom]);

  const drawPage = useCallback(
    async (n) => {
      const doc = docRef.current;
      const host = pageElsRef.current[n - 1];
      if (!doc || !host) return;

      const stamp = String(Math.round(pageWidth));
      if (host.dataset.rendered === stamp || host.dataset.rendering === stamp) return;

      host.dataset.rendering = stamp;
      try {
        const p = await doc.getPage(n);
        // The column may have been resized or zoomed while this was waiting,
        // in which case another draw has already claimed the page.
        if (host.dataset.rendering !== stamp) return;

        const dpr = window.devicePixelRatio || 1;
        const base = p.getViewport({ scale: 1 });
        const viewport = p.getViewport({ scale: (pageWidth / base.width) * dpr });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = "block h-full w-full";
        host.replaceChildren(canvas);

        const task = p.render({ canvasContext: canvas.getContext("2d"), viewport });
        tasksRef.current.set(n, task);
        await task.promise;
        tasksRef.current.delete(n);

        if (host.dataset.rendering === stamp) {
          host.dataset.rendered = stamp;
          delete host.dataset.rendering;
        }
      } catch (err) {
        // A cancelled render is the normal result of scrolling past a page
        // while it was still drawing -- not an error worth surfacing.
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Failed to render page ${n}`, err);
        }
        if (host.dataset.rendering === stamp) delete host.dataset.rendering;
      }
    },
    [pageWidth]
  );

  const clearPage = useCallback((n) => {
    tasksRef.current.get(n)?.cancel?.();
    tasksRef.current.delete(n);
    const host = pageElsRef.current[n - 1];
    if (!host) return;
    host.replaceChildren();
    delete host.dataset.rendered;
    delete host.dataset.rendering;
  }, []);

  // Every page currently holding a canvas, straight from the DOM.
  const drawnPages = useCallback(
    () =>
      pageElsRef.current.reduce((acc, host, i) => {
        if (host && (host.dataset.rendered || host.dataset.rendering)) acc.push(i + 1);
        return acc;
      }, []),
    []
  );

  /* ------------------------------------------------------------------ *
   * Draw what's near the viewport, drop what isn't, and keep the page
   * counter honest -- all from one observer.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (status !== "ready" || !total) return undefined;

    const root = scrollRef.current;
    if (!root) return undefined;

    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const n = Number(entry.target.dataset.page);
          if (entry.isIntersecting) visible.add(n);
          else visible.delete(n);
        }
        if (visible.size) {
          const top = Math.min(...visible);
          setPage(top);
          for (let n = Math.max(1, top - KEEP_WINDOW); n <= Math.min(total, top + KEEP_WINDOW); n++) {
            drawPage(n);
          }
          for (const n of drawnPages()) {
            if (Math.abs(n - top) > KEEP_WINDOW + 2) clearPage(n);
          }
        }
      },
      { root, rootMargin: "200px 0px", threshold: 0 }
    );

    pageElsRef.current.slice(0, total).forEach((el) => el && observer.observe(el));
    // Nothing has scrolled yet, so seed the first screenful by hand.
    for (let n = 1; n <= Math.min(total, KEEP_WINDOW); n++) drawPage(n);

    return () => observer.disconnect();
  }, [status, total, drawPage, clearPage, drawnPages]);

  // Zoom or width changed: every drawn canvas is now the wrong resolution,
  // and every page a different height -- so the scroll position no longer
  // points where the reader was looking.
  useEffect(() => {
    if (status !== "ready") return;
    const anchor = pageRef.current;
    for (const n of drawnPages()) clearPage(n);
    for (let n = Math.max(1, anchor - KEEP_WINDOW); n <= Math.min(total, anchor + KEEP_WINDOW); n++) {
      drawPage(n);
    }
    pageElsRef.current[anchor - 1]?.scrollIntoView({ behavior: "auto", block: "start" });
    // Deliberately keyed on pageWidth only: re-running this whenever `page`
    // changes would wipe and redraw the whole window on every scroll, which
    // is why the current page is read from a ref rather than the dep array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageWidth]);

  useEffect(() => {
    pageRef.current = page;
    setPageDraft(String(page));
  }, [page]);

  const goToPage = useCallback(
    (n) => {
      const el = pageElsRef.current[n - 1];
      if (!el) return;
      // Smooth is nice for a step of a page or two. Over a longer jump it
      // drags every page in between through the viewport, so each one gets
      // drawn and immediately thrown away -- the exact work lazy rendering
      // exists to avoid. Long jumps land instantly instead.
      const behavior = Math.abs(n - page) <= 2 ? "smooth" : "auto";
      el.scrollIntoView({ behavior, block: "start" });
    },
    [page]
  );

  const clampPage = (n) => Math.min(Math.max(n, 1), total || 1);

  /* ------------------------------------------------------------------ *
   * Keyboard. Only while expanded, so these keys keep their normal
   * meaning when the reader is one panel among others on the page.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!expanded) return undefined;
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement) return;
      const keys = ["ArrowRight", "PageDown", "ArrowLeft", "PageUp", "Home", "End", "Escape"];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      if (e.key === "Escape") setExpanded(false);
      else if (e.key === "Home") goToPage(1);
      else if (e.key === "End") goToPage(total);
      else if (e.key === "ArrowRight" || e.key === "PageDown") goToPage(clampPage(page + 1));
      else goToPage(clampPage(page - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, page, total, goToPage]);

  // Stop the page behind the reader scrolling while it's open.
  useEffect(() => {
    if (!expanded) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  /* ------------------------------------------------------------------ *
   * Download reuses the bytes pdf.js already holds, so saving a book costs
   * no second request and cannot get a different file than the one on
   * screen.
   * ------------------------------------------------------------------ */
  const download = useCallback(async () => {
    const doc = docRef.current;
    if (!doc || downloading) return;
    setDownloading(true);
    try {
      const data = await doc.getData();
      const href = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = href;
      a.download = `${(title || "book").replace(/[\\/:*?"<>|]/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 10000);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloading(false);
    }
  }, [downloading, title]);

  /* ------------------------------------------------------------------ *
   * Chrome
   * ------------------------------------------------------------------ */
  const ToolButton = ({ onClick, disabled, label, children }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      {children}
    </button>
  );

  const toolbar = (
    <div className="flex shrink-0 items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900">
      {expanded && (
        <p className="mr-1 hidden min-w-0 flex-1 truncate px-1 text-sm font-semibold text-gray-900 dark:text-gray-100 sm:block">
          {title}
        </p>
      )}

      <div className="flex items-center gap-0.5">
        <ToolButton onClick={() => goToPage(clampPage(page - 1))} disabled={page <= 1} label={t.reader.previousPage}>
          <ChevronUp className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => goToPage(clampPage(page + 1))} disabled={page >= total} label={t.reader.nextPage}>
          <ChevronDown className="h-4 w-4" />
        </ToolButton>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = clampPage(parseInt(pageDraft, 10) || 1);
          setPageDraft(String(n));
          goToPage(n);
        }}
        className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300"
      >
        <input
          value={pageDraft}
          onChange={(e) => setPageDraft(e.target.value.replace(/\D/g, ""))}
          onBlur={() => setPageDraft(String(page))}
          inputMode="numeric"
          aria-label={t.reader.goToPage}
          className="w-10 rounded-md border border-gray-300 bg-white px-1 py-1 text-center text-xs text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <span className="whitespace-nowrap">/ {total || "–"}</span>
      </form>

      <div className="ml-auto flex items-center gap-0.5">
        <ToolButton onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))} disabled={zoom <= ZOOM_MIN} label={t.reader.zoomOut}>
          <Minus className="h-4 w-4" />
        </ToolButton>
        <button
          type="button"
          onClick={() => setZoom(1)}
          title={t.reader.fitWidth}
          className="hidden w-12 rounded-lg px-1 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 sm:block"
        >
          {Math.round(zoom * 100)}%
        </button>
        <ToolButton onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))} disabled={zoom >= ZOOM_MAX} label={t.reader.zoomIn}>
          <Plus className="h-4 w-4" />
        </ToolButton>

        {allowDownload && (
          <ToolButton onClick={download} disabled={downloading || status !== "ready"} label={t.reader.download}>
            <Download className="h-4 w-4" />
          </ToolButton>
        )}

        <ToolButton
          onClick={() => setExpanded((v) => !v)}
          label={expanded ? t.reader.exitFullscreen : t.reader.fullscreen}
        >
          {expanded ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </ToolButton>
      </div>
    </div>
  );

  const body = (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/80 dark:bg-gray-800/80">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-red-600 dark:border-gray-600" />
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-100 px-4 text-center dark:bg-gray-800">
          <AlertTriangle className="h-6 w-6 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.player.pdfError} {errorMessage}
          </p>
        </div>
      )}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto overscroll-contain bg-gray-200 px-3 py-3 dark:bg-gray-950"
      >
        {sizes.map((size, i) => (
          <div
            key={i}
            data-page={i + 1}
            ref={(el) => {
              pageElsRef.current[i] = el;
            }}
            aria-label={`${t.reader.page} ${i + 1}`}
            style={{ width: pageWidth, height: (pageWidth * size.height) / size.width }}
            className="mx-auto mb-3 bg-white shadow-md last:mb-0 dark:bg-gray-100"
          />
        ))}
      </div>

      {isPreview && status === "ready" && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-gray-900/95 via-gray-900/80 to-transparent px-3 pb-3 pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-white sm:text-sm">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            {t.player.previewOnly}
          </span>
          <button
            type="button"
            onClick={onBuyClick}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95 sm:text-sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {t.player.buyNow}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={
        expanded
          ? "fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900"
          : "flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700"
      }
      role="document"
      aria-label={title}
    >
      {toolbar}
      {body}
    </div>
  );
}
