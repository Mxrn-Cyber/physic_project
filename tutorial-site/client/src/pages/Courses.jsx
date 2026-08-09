import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Lock } from "lucide-react";
import { api } from "../api/client.js";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function Courses() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    api
      .getCourses()
      .then(({ courses }) => {
        setCourses(courses);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return <div className="p-10 text-center text-sm text-gray-500">{t.courses.loading}</div>;
  }
  if (status === "error") {
    return <div className="p-10 text-center text-sm text-red-600">{t.courses.loadError}</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">{t.courses.title}</h1>
      {/* Each video/book below carries its own real `unlocked` flag from the
          server (free items, active free-trial windows, or something this
          user actually bought) -- there's no separate subscription "plan"
          in this app, every item is bought individually. */}
      <p className="mt-1 text-sm text-gray-600">{t.courses.subtitle}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {courses.map((course) => {
          const items = [...course.videos, ...course.books];
          const anyUnlocked = items.some((i) => i.unlocked);
          return (
            <Link
              key={course._id}
              to={`/courses/${course._id}`}
              className="flex flex-col rounded-xl border border-gray-200 p-5 transition hover:border-red-300 hover:shadow-sm"
            >
              <span className="text-xs font-medium text-amber-700">{course.level}</span>
              <h3 className="mt-2 font-semibold text-gray-900">{course.title}</h3>
              <p className="mt-1 text-sm text-gray-600">
                {course.videos.length} {t.courses.videosLabel} · {course.books.length} {t.courses.booksLabel}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-red-600">
                {anyUnlocked ? <Play className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {anyUnlocked ? t.courses.startCourse : t.courses.previewCourse}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
