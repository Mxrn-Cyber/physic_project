import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, ShieldCheck, Undo2, ArrowUp, CalendarDays } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { legal } from "../i18n/legal.js";

// One icon per document, reused for both the switcher and the page's own
// header -- gives a reader a quick visual anchor for which of the three they
// are on, especially useful since the titles themselves are translated and
// won't always be recognizable at a glance.
const DOC_META = {
  terms: { icon: FileText, path: "/terms" },
  privacy: { icon: ShieldCheck, path: "/privacy" },
  refund: { icon: Undo2, path: "/refund" },
};
const DOC_ORDER = ["terms", "privacy", "refund"];

// Stable across languages on purpose: en and km sections are written in the
// same order, so an index-based id keeps a deep link (or the scroll-spy below)
// pointing at "the same" section regardless of which language a reader has
// selected, without needing to slugify non-Latin headings.
const sectionId = (i) => `section-${i}`;
const twoDigit = (i) => String(i + 1).padStart(2, "0");

/**
 * Renders one of the three legal documents (Terms, Privacy, Refund).
 *
 * Layout: a switcher across all three, a header card, then the document
 * itself as a single divided "sheet" with a sticky table of contents beside
 * it on wide screens.
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
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
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
  const HeaderIcon = DOC_META[doc].icon;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
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
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.footer[key]}
            </Link>
          );
        })}
      </nav>

      {/* Header card. The blurred red bloom is the only decorative element on
          the page -- it ties these otherwise plain documents back to the rest
          of the site without making a legal page look like a landing page. */}
      <header className="relative mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/40 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-red-500/10 blur-3xl dark:bg-red-500/15"
        />

        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/20">
            <HeaderIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              {content.title}
            </h1>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {pack.lastUpdatedLabel}: {pack.lastUpdated}
            </p>
          </div>
        </div>

        <p className="relative mt-6 max-w-3xl border-l-2 border-red-500/40 pl-4 text-base leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg">
          {content.intro}
        </p>
      </header>

      {/* Mobile / tablet: a horizontally-scrolling row of jump links instead
          of the sidebar, which has no room below lg. */}
      {sections.length > 1 && (
        <div className="mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
          {sections.map((section, i) => (
            <button
              key={section.heading}
              type="button"
              onClick={() => scrollToSection(i)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                activeSection === i
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                  : "border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-400"
              }`}
            >
              <span className="mr-1.5 tabular-nums opacity-50">{twoDigit(i)}</span>
              {section.heading}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* Desktop table of contents, sticky below the site's own nav bar.
            min-w-0 matters: a grid item defaults to min-width:auto, which lets
            a long heading blow past the 250px track and overlap the document
            beside it. The headings wrap to two lines rather than being cut
            with an ellipsis -- a legal section title is worth reading whole. */}
        {sections.length > 1 && (
          <aside className="hidden min-w-0 lg:sticky lg:top-24 lg:block">
            <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/40">
              <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t.legalPage.onThisPage}
              </p>
              <ul className="space-y-0.5">
                {sections.map((section, i) => {
                  const active = activeSection === i;
                  return (
                    <li key={section.heading}>
                      <button
                        type="button"
                        onClick={() => scrollToSection(i)}
                        className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-[13px] leading-snug transition-colors ${
                          active
                            ? "bg-red-50 font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
                        }`}
                      >
                        <span
                          className={`shrink-0 pt-px text-[10px] font-semibold tabular-nums ${
                            active
                              ? "text-red-500 dark:text-red-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        >
                          {twoDigit(i)}
                        </span>
                        <span className="min-w-0 flex-1">{section.heading}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        )}

        {/* The document itself, as one divided sheet rather than sections
            floating on the page background. */}
        <div className="min-w-0 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/40">
          {sections.map((section, i) => (
            <section
              key={section.heading}
              id={sectionId(i)}
              ref={(el) => (sectionRefs.current[i] = el)}
              className="scroll-mt-24 p-6 sm:p-8"
            >
              <div className="flex gap-4 sm:gap-5">
                <span className="hidden shrink-0 select-none pt-1 text-sm font-semibold tabular-nums text-red-500/60 dark:text-red-400/50 sm:block">
                  {twoDigit(i)}
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    <span className="mr-2 text-sm tabular-nums text-red-500/60 dark:text-red-400/50 sm:hidden">
                      {twoDigit(i)}
                    </span>
                    {section.heading}
                  </h2>
                  <p className="mt-2.5 max-w-2xl text-[15px] leading-7 text-gray-600 dark:text-gray-400">
                    {section.body}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900/40">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          {t.legalPage.alsoRead}:
          {otherDocs.map((key, i) => {
            const { icon: Icon, path } = DOC_META[key];
            return (
              <span key={key} className="contents">
                <Link
                  to={path}
                  className="inline-flex items-center gap-1.5 font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.footer[key]}
                </Link>
                {i < otherDocs.length - 1 && <span aria-hidden="true">·</span>}
              </span>
            );
          })}
        </p>
      </div>

      {/* Floating rather than pinned to the footer: on a long document the
          reader wants this the moment they're deep in it, not after they have
          already scrolled all the way to the bottom. */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={t.legalPage.backToTop}
        className={`fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-lg transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 ${
          showBackToTop
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <ArrowUp className="h-4 w-4" />
        <span className="hidden sm:inline">{t.legalPage.backToTop}</span>
      </button>
    </div>
  );
}
