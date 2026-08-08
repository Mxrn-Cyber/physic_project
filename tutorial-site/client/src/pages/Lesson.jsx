import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Play, FileText, Lock } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import VideoPlayer from "../components/VideoPlayer.jsx";
import BookViewer from "../components/BookViewer.jsx";

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getCourses().then(({ courses }) => {
      const found = courses.find((c) => c._id === courseId);
      setCourse(found || null);
    });
  }, [courseId]);

  async function openVideo(video) {
    setActiveType("video");
    setActiveItem(video);
    setMediaUrl(null);
    setError(null);
    if (!video.unlocked) return;
    try {
      const { playbackUrl } = await api.getVideoPlayback(video._id);
      setMediaUrl(playbackUrl);
    } catch (err) {
      setError(err.message);
    }
  }

  async function openBook(book) {
    setActiveType("book");
    setActiveItem(book);
    setMediaUrl(null);
    setError(null);
    if (!book.unlocked) return;
    try {
      const { pdfUrl } = await api.getBookView(book._id);
      setMediaUrl(pdfUrl);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!course)
    return <div className="p-10 text-center text-sm text-gray-500">Loading…</div>;

  const hasContent = course.videos.length > 0 || course.books.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/courses" className="text-sm font-medium text-red-600 hover:underline">
        ← Back to courses
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">{course.title}</h1>

      {!hasContent && (
        <p className="mt-6 text-sm text-gray-500">No videos or books in this course yet.</p>
      )}

      {activeItem && (
        <div className="mt-6">
          <div
            className={`overflow-hidden rounded-xl bg-gray-900 ${
              activeType === "book" ? "aspect-[3/4] max-w-md" : "aspect-video"
            }`}
          >
            {!activeItem.unlocked ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-white">
                <Lock className="h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-300">
                  Upgrade to Paid to {activeType === "book" ? "view this book" : "watch this video"}
                </p>
                <button
                  onClick={() => navigate("/pricing")}
                  className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  View plans
                </button>
              </div>
            ) : mediaUrl ? (
              activeType === "book" ? (
                <BookViewer url={mediaUrl} title={activeItem.title} />
              ) : (
                <VideoPlayer url={mediaUrl} title={activeItem.title} />
              )
            ) : (
              <p className="p-4 text-sm text-gray-300">{error || "Loading…"}</p>
            )}
          </div>
          <p className="mt-2 font-medium text-gray-900">{activeItem.title}</p>
        </div>
      )}

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Videos
          </h2>
          <ul className="mt-3 space-y-1.5">
            {course.videos.map((v) => (
              <li key={v._id}>
                <button
                  onClick={() => openVideo(v)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                    activeItem?._id === v._id ? "bg-red-50 text-red-700" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {v.unlocked ? <Play className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5 text-gray-400" />}
                    {v.title}
                  </span>
                  <span className="text-xs text-gray-500">
                    {v.isFree ? "Free" : `$${v.effectivePrice}`}
                  </span>
                </button>
              </li>
            ))}
            {course.videos.length === 0 && (
              <li className="text-sm text-gray-400">No videos yet.</li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Books
          </h2>
          <ul className="mt-3 space-y-1.5">
            {course.books.map((b) => (
              <li key={b._id}>
                <button
                  onClick={() => openBook(b)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                    activeItem?._id === b._id ? "bg-red-50 text-red-700" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {b.unlocked ? <FileText className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5 text-gray-400" />}
                    {b.title}
                  </span>
                  <span className="text-xs text-gray-500">
                    {b.isFree ? "Free" : `$${b.effectivePrice}`}
                  </span>
                </button>
              </li>
            ))}
            {course.books.length === 0 && (
              <li className="text-sm text-gray-400">No books yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
