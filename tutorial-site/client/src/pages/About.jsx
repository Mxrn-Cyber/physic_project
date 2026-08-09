import { useLanguage } from "../context/LanguageContext.jsx";

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.about.title}</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-300">{t.about.lead}</p>

      <div className="mt-8 space-y-6">
        {t.about.sections.map((s) => (
          <div key={s.heading} className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{s.heading}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
