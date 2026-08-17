import React from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";

// Vite/Cloudflare Pages hash-name every JS chunk on each build. If a visitor
// has the site open (or a cached tab) across a new deploy, a lazy import
// (Admin, BookDetail) points at a chunk file that no longer exists on the
// server. That import throws, and with nothing catching it React unmounts
// the whole tree -- the "stuck white screen" when changing screens.
//
// This boundary catches that (and any other render error), auto-reloads
// once for the known "stale chunk" case, and otherwise shows a friendly
// retry screen instead of a blank page.
const CHUNK_ERROR_PATTERN =
  /dynamically imported module|loading chunk|failed to fetch|importing a module script failed/i;

const RELOAD_FLAG_KEY = "reanphysics_chunk_reload";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    const isChunkError = CHUNK_ERROR_PATTERN.test(error?.message || "");

    if (isChunkError) {
      // Only auto-reload once per bad chunk so a real, persistent error
      // doesn't reload-loop the page forever.
      const alreadyTried = sessionStorage.getItem(RELOAD_FLAG_KEY);
      if (!alreadyTried) {
        sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
        window.location.reload();
        return;
      }
    }

    // eslint-disable-next-line no-console
    console.error("Caught by ErrorBoundary:", error);
  }

  render() {
    if (this.state.error) {
      // A successful navigation to a fresh page clears this flag so a
      // future real chunk error can still trigger one reload.
      sessionStorage.removeItem(RELOAD_FLAG_KEY);

      return (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Something went wrong loading this page
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This can happen right after the site is updated, or from a slow
            connection. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-red-500/30 transition hover:shadow-xl hover:shadow-red-500/40"
          >
            <RefreshCcw className="h-4 w-4" /> Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
