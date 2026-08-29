import { Link } from "react-router-dom";
import { Sparkles, BookMarked, QrCode, HelpCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

// One icon per entry in t.about.sections, matched by position rather than
// by heading text so it keeps working no matter which language is active.
const SECTION_ICONS = [BookMarked, QrCode, HelpCircle];

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      {/* Hero */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <Sparkles className="h-3.5 w-3.5" />
          E-TnakRean
        </span>

        <h1 className="mt-4 bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
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
              className="group rounded-2xl border border-gray-200 bg-white/60 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/10 dark:border-gray-800 dark:bg-gray-900/40 dark:hover:border-red-500/40"
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

      {/* Closing CTA banner -- reuses the same hero tagline from the home
          page so it stays fully translated without adding new i18n keys. */}
      <div className="relative mt-16 overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 px-6 py-12 text-center shadow-xl shadow-red-500/20 sm:px-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {t.home.heroTitle1} {t.home.heroTitle2}
          </h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/videos"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 font-semibold text-red-600 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              {t.home.browse}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/books"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-white/10 px-5 py-2.5 font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
            >
              {t.nav.books}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
