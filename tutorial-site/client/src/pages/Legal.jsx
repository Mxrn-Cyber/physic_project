import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, ShieldCheck, Undo2, ArrowUp } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { legal } from "../i18n/legal.js";

// One icon per document, reused for both the tab switcher and the page's
// own header -- gives a reader a quick visual anchor for which of the three
// they're on, especially useful since the titles themselves are translated
// and won't always be recognizable at a glance.
const DOC_META = {
  terms: { icon: FileText, path: "/terms" },
  privacy: { icon: ShieldCheck, path: "/privacy" },
  refund: { icon: Undo2, path: "/refund" },
};
const DOC_ORDER = ["terms", "privacy", "refund"];

// Stable across languages on purpose: en and km sections are written in the
// same order, so an index-based id keeps a deep link (or the scroll-spy
// below) pointing at "the same" section regardless of which language a
// reader has selected, without needing to slugify non-Latin headings.
const sectionId = (i) => `section-${i}`;

/**
 * Renders one of the three legal documents (Terms, Privacy, Refund) with a
 * shared layout: a switcher to jump between all three, a sticky
 * table-of-contents on wide screens that tracks scroll position, and a
 * "back to top" affordance once the reader has scrolled past the header.
 */
export default function Legal({ doc }) {
  const { t, lang } = useLanguage();
  const pack = legal[lang] || legal.en;
  const content = pack[doc];

  const sectionRefs = useRef([]);
  const [activeSection, setActiveSection] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const sections = useMemo(() => content?.sections || [], [content]);

  useEffect(() => {
    sectionRefs.current = sectionRefs.current.slice(0, sections.length);
  }, [sections.length]);

  useEffect(() => {
    if (!sections.length) return undefined;

    // Tracks whichever section is closest to the top of the viewport rather
    // than "first one currently visible", so the highlight doesn't jump
    // between two sections both partly on screen at once.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        const index = sectionRefs.current.indexOf(top.target);
        if (index !== -1) setActiveSection(index);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!content) return null;

  const scrollToSection = (index) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const otherDocs = DOC_ORDER.filter((key) => key !== doc);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      {/* Switcher: reads which of the three you're on and lets you jump to
          the others without going back to the footer. */}
      <nav aria-label={t.footer.legal} className="flex flex-wrap gap-2">
        {DOC_ORDER.map((key) => {
          const { icon: Icon, path } = DOC_META[key];
          const active = key === doc;
          return (
            <Link
              key={key}
              to={path}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.footer[key]}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex items-start gap-3 border-b border-gray-200 pb-6 dark:border-gray-800">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {(() => {
            const Icon = DOC_META[doc].icon;
            return <Icon className="h-5 w-5" />;
          })()}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
            {content.title}
          </h1>
          <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500 dark:bg-white/5 dark:text-gray-400">
            {pack.lastUpdatedLabel}: {pack.lastUpdated}
          </p>
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-base leading-relaxed text-gray-600 dark:text-gray-400">
        {content.intro}
      </p>

      {/* Mobile / tablet: a horizontally-scrolling row of jump links instead
          of the sidebar, which has no room below lg. */}
      {sections.length > 1 && (
        <div className="mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
          {sections.map((section, i) => (
            <button
              key={section.heading}
              type="button"
              onClick={() => scrollToSection(i)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSection === i
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                  : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
              }`}
            >
              {section.heading}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        {/* Desktop table of contents, sticky below the site's own nav bar. */}
        {sections.length > 1 && (
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t.legalPage.onThisPage}
            </p>
            <ul className="mt-3 space-y-0.5 border-l border-gray-200 dark:border-gray-800">
              {sections.map((section, i) => (
                <li key={section.heading}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(i)}
                    className={`-ml-px block truncate border-l-2 py-1.5 pl-3 text-left text-sm transition-colors ${
                      activeSection === i
                        ? "border-red-600 font-medium text-red-700 dark:border-red-400 dark:text-red-300"
                        : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-200"
                    }`}
                  >
                    {section.heading}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <div className="min-w-0 space-y-9">
          {sections.map((section, i) => (
            <section
              key={section.heading}
              id={sectionId(i)}
              ref={(el) => (sectionRefs.current[i] = el)}
              className="scroll-mt-28"
            >
              <h2 className="flex items-baseline gap-2.5 text-base font-semibold text-gray-900 dark:text-gray-100">
                <span className="text-sm font-normal tabular-nums text-gray-300 dark:text-gray-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h2>
              <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>

      <div className="mt-14 flex flex-col gap-2 border-t border-gray-200 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          {t.legalPage.alsoRead}:
          {otherDocs.map((key, i) => (
            <span key={key} className="contents">
              <Link
                to={DOC_META[key].path}
                className="font-medium text-red-600 hover:underline dark:text-red-400"
              >
                {t.footer[key]}
              </Link>
              {i < otherDocs.length - 1 && <span aria-hidden="true">·</span>}
            </span>
          ))}
        </p>

        {showBackToTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            {t.legalPage.backToTop}
          </button>
        )}
      </div>
    </div>
  );
}
