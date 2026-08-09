import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, FileText } from "lucide-react";
import { api } from "../api/client.js";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function Dashboard() {
  const { t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    Promise.all([api.getVideos(), api.getBooks()])
      .then(([{ videos }, { books }]) => {
        setVideos(videos);
        setBooks(books);
        setStatus("ready");
      })
      // This used to have no .catch at all -- a failed/slow request would
      // silently leave `loading` stuck at true forever, or (once loading
      // flipped off via a stray re-render) render "0 owned" everywhere with
      // no indication anything went wrong.
      .catch(() => setStatus("error"));
  }, []);

  const ownedVideos = videos.filter((v) => v.unlocked && !v.isFree);
  const ownedBooks = books.filter((b) => b.unlocked && !b.isFree);
  const totalUnlocked = videos.filter((v) => v.unlocked).length + books.filter((b) => b.unlocked).length;

  if (status === "loading") {
    return <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">{t.common.loading}</div>;
  }

  if (status === "error") {
    return <div className="p-10 text-center text-sm text-red-600">{t.dashboard.loadError}</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.dashboard.title}</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.dashboard.videosOwned}</p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">{ownedVideos.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.dashboard.booksOwned}</p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">{ownedBooks.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.dashboard.totalUnlocked}</p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">{totalUnlocked}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t.dashboard.yourVideos}
          </h2>
          <ul className="mt-3 space-y-1.5">
            {ownedVideos.map((v) => (
              <li key={v._id}>
                <Link
                  to="/videos"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Play className="h-3.5 w-3.5 text-red-600" /> {v.title}
                </Link>
              </li>
            ))}
            {ownedVideos.length === 0 && (
              <li className="px-3 text-sm text-gray-400">
                {t.dashboard.noVideosYet}{" "}
                <Link to="/videos" className="text-red-600 hover:underline">
                  {t.dashboard.browseVideos}
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t.dashboard.yourBooks}
          </h2>
          <ul className="mt-3 space-y-1.5">
            {ownedBooks.map((b) => (
              <li key={b._id}>
                <Link
                  to="/books"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <FileText className="h-3.5 w-3.5 text-red-600" /> {b.title}
                </Link>
              </li>
            ))}
            {ownedBooks.length === 0 && (
              <li className="px-3 text-sm text-gray-400">
                {t.dashboard.noBooksYet}{" "}
                <Link to="/books" className="text-red-600 hover:underline">
                  {t.dashboard.browseBooks}
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
