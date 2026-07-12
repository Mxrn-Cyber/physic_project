import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Play, FileDown, Lock } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Lesson() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [playback, setPlayback] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getCourses().then(({ courses }) => {
      const found = courses.find((c) => c._id === courseId);
      setCourse(found || null);
      if (found?.lessons?.length) setActiveLessonId(found.lessons[0]._id);
    });
  }, [courseId]);

  const lesson = course?.lessons.find((l) => l._id === activeLessonId);

  useEffect(() => {
    setPlayback(null);
    setError(null);
    if (!lesson?.unlocked) return;
    api
      .getPlaybackUrl(lesson._id)
      .then((data) => setPlayback(data.playbackUrl))
      .catch((err) => setError(err.message));
  }, [lesson]);

  async function handleDownloadPdf() {
    try {
      const { downloadUrl } = await api.getPdfUrl(lesson._id);
      window.open(downloadUrl, "_blank");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!course) return <div className="p-10 text-center text-sm text-gray-500">Loading…</div>;
  if (!lesson) return <div className="p-10 text-center text-sm text-gray-500">No lessons in this course yet.</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/courses" className="text-sm font-medium text-indigo-600 hover:underline">
        ← Back to courses
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">{course.title}</h1>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <div className="flex aspect-video items-center justify-center rounded-xl bg-gray-900 text-white">
            {lesson.unlocked ? (
              <div className="text-center">
                <Play className="mx-auto h-12 w-12" />
                <p className="mt-2 text-sm text-gray-300">
                  {playback ? `Playing: ${lesson.title}` : error || "Loading video…"}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <Lock className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-300">Upgrade to Paid to watch this lesson</p>
                <button
                  onClick={() => navigate("/pricing")}
                  className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  View plans
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <p className="font-medium text-gray-900">{lesson.title}</p>
            <button
              onClick={handleDownloadPdf}
              disabled={!lesson.unlocked}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                lesson.unlocked ? "bg-gray-900 text-white hover:bg-gray-800" : "cursor-not-allowed bg-gray-100 text-gray-400"
              }`}
            >
              <FileDown className="h-4 w-4" />
              {lesson.unlocked ? "Download PDF" : "PDF locked"}
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Lessons</h2>
          <ul className="mt-3 space-y-1.5">
            {course.lessons.map((l) => (
              <li key={l._id}>
                <button
                  onClick={() => setActiveLessonId(l._id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                    l._id === activeLessonId ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {l.unlocked ? <Play className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5 text-gray-400" />}
                    {l.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
