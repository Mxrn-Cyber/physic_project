import { Link } from "react-router-dom";
import {
  Sparkles,
  BookMarked,
  QrCode,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

const SECTION_ICONS = [BookMarked, QrCode, HelpCircle];

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      {/* Hero */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <Sparkles className="h-3.5 w-3.5" />
          eTnakRean
        </span>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
          {t.about.title}
        </h1>

        <p className="mx-auto mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">
          {t.about.lead}
        </p>
      </div>

      {/* Section cards */}
      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {t.about.sections.map((s, i) => {
          const Icon = SECTION_ICONS[i % SECTION_ICONS.length];
          return (
            <div
              key={s.heading}
              className="group rounded-xl border border-gray-200 bg-white p-6 transition-colors hover:border-red-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-red-500/40"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white dark:bg-red-500/10 dark:text-red-400">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">
                {s.heading}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {s.body}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-16 rounded-2xl bg-red-600 px-6 py-12 text-center sm:px-12">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {t.home.heroTitle1} {t.home.heroTitle2}
        </h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/videos"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            {t.home.browse}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/books"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/50 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t.nav.books}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
