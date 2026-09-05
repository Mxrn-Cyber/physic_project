import { useLanguage } from "../context/LanguageContext.jsx";
import { legal } from "../i18n/legal.js";

// One component renders all three legal documents (Terms, Privacy, Refund).
// The copy lives in src/i18n/legal.js so it can be edited -- and translated --
// without touching layout code. See the warning at the top of that file: the
// drafts still contain [BRACKETED] placeholders that must be filled in before
// launch.
export default function Legal({ doc }) {
  const { lang } = useLanguage();
  const pack = legal[lang] || legal.en;
  const content = pack[doc];

  if (!content) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{content.title}</h1>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
        {pack.lastUpdatedLabel}: {pack.lastUpdated}
      </p>

      <p className="mt-5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{content.intro}</p>

      <div className="mt-8 space-y-7">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-gray-100">
              {section.heading}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
