import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, FileText } from "lucide-react";
import { api } from "../api/client.js";

export default function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getVideos(), api.getBooks()])
      .then(([{ videos }, { books }]) => {
        setVideos(videos);
        setBooks(books);
      })
      .finally(() => setLoading(false));
  }, []);

  const ownedVideos = videos.filter((v) => v.unlocked && !v.isFree);
  const ownedBooks = books.filter((b) => b.unlocked && !b.isFree);
  const totalUnlocked = videos.filter((v) => v.unlocked).length + books.filter((b) => b.unlocked).length;

  if (loading) {
    return <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Videos owned</p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">{ownedVideos.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Books owned</p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">{ownedBooks.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total unlocked</p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">{totalUnlocked}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Your videos
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
                No purchased videos yet. <Link to="/videos" className="text-red-600 hover:underline">Browse videos</Link>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Your books
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
                No purchased books yet. <Link to="/books" className="text-red-600 hover:underline">Browse books</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
