import { Link } from "react-router-dom";
import { Play, FileDown, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
        Learn by watching. <span className="text-indigo-600">Practice with PDFs.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-gray-600">
        Short, practical video tutorials paired with printable guides and worksheets.
        Start free, upgrade any time for the full library.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/courses" className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700">
          Browse free lessons
        </Link>
        <Link to="/pricing" className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50">
          See plans
        </Link>
      </div>

      <div className="mt-16 grid gap-6 text-left sm:grid-cols-3">
        {[
          { icon: Play, title: "Bite-sized videos", body: "5–20 minute lessons you can watch on any device." },
          { icon: FileDown, title: "Companion PDFs", body: "Cheat sheets and worksheets for every lesson." },
          { icon: CheckCircle2, title: "Track your progress", body: "See what you've completed and pick up where you left off." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-gray-200 p-5">
            <Icon className="h-6 w-6 text-indigo-600" />
            <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
