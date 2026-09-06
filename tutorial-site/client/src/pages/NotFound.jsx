import { Link } from "react-router-dom";
import { MapPinOff } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import Seo from "../components/Seo.jsx";

// Catch-all for any URL that matches no route (App.jsx, path="*"). Without
// this, a mistyped or dead link rendered the navbar and footer with nothing
// in between, which looks like the site is broken rather than like a wrong
// address.
export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
      <Seo title={t.seo.notFound.title} description={t.seo.notFound.description} noindex />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <MapPinOff className="h-7 w-7" />
      </div>

      <p className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
        404
      </p>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        {t.notFound.title}
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t.notFound.body}
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          {t.notFound.backHome}
        </Link>
        <Link
          to="/videos"
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t.notFound.browseVideos}
        </Link>
      </div>
    </div>
  );
}
