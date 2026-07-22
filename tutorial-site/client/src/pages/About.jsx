import { useLanguage } from "../context/LanguageContext.jsx";

const COPY = {
  en: {
    title: "About Us",
    lead:
      "ReanPhysics is a small library of practical video lessons and PDF books. Each item is sold on its own, so you only pay for what you actually want to learn.",
    sections: [
      {
        heading: "What we make",
        body: "Short, focused videos and printable PDF guides, built to be practical rather than exhaustive -- you can watch or read one in a single sitting.",
      },
      {
        heading: "How buying works",
        body: "Every video and book has its own price. Pay securely with ABA PayWay by scanning a KHQR code with your banking app, and the item unlocks right away.",
      },
      {
        heading: "Questions?",
        body: "Reach out any time -- we're happy to help you find the right video or book, or to sort out a purchase issue.",
      },
    ],
  },
  km: {
    title: "អំពីយើង",
    lead:
      "ReanPhysics គឺជាបណ្ណាល័យតូចមួយដែលមានវីដេអូមេរៀន និងសៀវភៅ PDF ជាក់ស្តែង។ ធាតុនីមួយៗត្រូវបានលក់ដោយឡែកៗពីគ្នា ដូច្នេះអ្នកបង់ថ្លៃតែសម្រាប់អ្វីដែលអ្នកចង់រៀនប៉ុណ្ណោះ។",
    sections: [
      {
        heading: "អ្វីដែលយើងបង្កើត",
        body: "វីដេអូខ្លីៗ ផ្តោតសំខាន់ និងសៀវភៅណែនាំ PDF សម្រាប់បោះពុម្ព ត្រូវបានរចនាឡើងឲ្យអនុវត្តជាក់ស្តែង។",
      },
      {
        heading: "របៀបទិញ",
        body: "វីដេអូ និងសៀវភៅនីមួយៗមានតម្លៃផ្ទាល់ខ្លួន។ បង់ប្រាក់ដោយសុវត្ថិភាពជាមួយ ABA PayWay ដោយស្កេន KHQR ជាមួយកម្មវិធីធនាគាររបស់អ្នក ហើយធាតុនោះនឹងបើកភ្លាមៗ។",
      },
      {
        heading: "មានសំណួរ?",
        body: "ទាក់ទងមកយើងបានគ្រប់ពេល -- យើងរីករាយក្នុងការជួយអ្នករកវីដេអូ ឬសៀវភៅត្រឹមត្រូវ ឬដោះស្រាយបញ្ហាទាក់ទងនឹងការទិញ។",
      },
    ],
  },
};

export default function About() {
  const { lang } = useLanguage();
  const t = COPY[lang] || COPY.en;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.title}</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-300">{t.lead}</p>

      <div className="mt-8 space-y-6">
        {t.sections.map((s) => (
          <div key={s.heading} className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{s.heading}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
