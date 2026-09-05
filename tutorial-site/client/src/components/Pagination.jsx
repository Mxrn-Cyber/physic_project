import { ChevronLeft, ChevronRight } from "lucide-react";

// Collapses the page-number buttons to a constant width no matter how many
// pages there are: first, last, current +/- 1, with a single "…" standing in
// for whatever got skipped. Without this, a course that grows to 40 pages of
// videos would print 40 buttons in a row instead of a handful.
function pageNumbers(current, total) {
  const delta = 1;
  const pages = [];
  for (let i = 1; i <= total; i += 1) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      pages.push(i);
    }
  }

  const withGaps = [];
  let previous;
  for (const page of pages) {
    if (previous !== undefined) {
      if (page - previous === 2) withGaps.push(previous + 1);
      else if (page - previous > 2) withGaps.push("…");
    }
    withGaps.push(page);
    previous = page;
  }
  return withGaps;
}

/**
 * Prev/next + numbered page buttons, used by both the Videos and Books list
 * pages so the two never drift apart the way the unlock logic once did
 * (see utils/access.js). Renders nothing for a single page.
 */
export default function Pagination({ page, totalPages, onChange, previousLabel, nextLabel }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{previousLabel}</span>
      </button>

      <div className="flex items-center gap-1">
        {pageNumbers(page, totalPages).map((n, i) =>
          n === "…" ? (
            <span key={`gap-${i}`} className="px-1.5 text-sm text-gray-400 dark:text-gray-600">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-current={n === page ? "page" : undefined}
              className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                n === page
                  ? "bg-red-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
              }`}
            >
              {n}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
      >
        <span className="hidden sm:inline">{nextLabel}</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
