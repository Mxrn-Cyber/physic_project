import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Lock } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getCourses()
      .then(({ courses }) => setCourses(courses))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const isPaid = user?.plan === "paid";

  if (loading)
    return (
      <div className="p-10 text-center text-sm text-gray-500">
        Loading courses…
      </div>
    );
  if (error)
    return <div className="p-10 text-center text-sm text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Course Library</h1>
      <p className="mt-1 text-sm text-gray-600">
        {isPaid
          ? "You have full access to every course."
          : "Free preview lessons are unlocked. Upgrade for full access."}
      </p>

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
              <span className="text-xs font-medium text-amber-700">
                {course.level}
              </span>
              <h3 className="mt-2 font-semibold text-gray-900">
                {course.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {course.videos.length} videos · {course.books.length} books
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-red-600">
                {anyUnlocked ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {anyUnlocked ? "Start course" : "Preview / Upgrade"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
