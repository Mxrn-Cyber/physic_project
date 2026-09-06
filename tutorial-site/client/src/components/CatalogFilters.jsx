import { Search, X } from "lucide-react";
import { GRADES, gradeLabel } from "../utils/grades.js";
import { useLanguage } from "../context/LanguageContext.jsx";

function ChipRow({ label, chips, value, onChange }) {
  return (
    <div>
      {label && (
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = value === chip.value;
          return (
            <button
              key={chip.value || "all"}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(chip.value)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "border-red-600 bg-red-600 text-white shadow-sm shadow-red-600/20"
                  : "border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-700 dark:border-gray-700 dark:text-gray-300 dark:hover:border-red-500 dark:hover:text-red-300"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CatalogFilters({
  query,
  onQueryChange,
  grade,
  onGradeChange,
  access,
  onAccessChange,
  placeholder,
}) {
  const { t } = useLanguage();

  const gradeChips = [
    { value: "", label: t.filters.allGrades },
    ...GRADES.map((g) => ({ value: g, label: gradeLabel(g, t) })),
  ];

  const accessChips = [
    { value: "", label: t.filters.allAccess },
    { value: "free", label: t.common.free },
    { value: "paid", label: t.filters.paid },
  ];

  return (
    <div className="mt-6 space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label={t.filters.clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <ChipRow label={t.filters.gradeLabel} chips={gradeChips} value={grade} onChange={onGradeChange} />
        <ChipRow label={t.filters.priceLabel} chips={accessChips} value={access} onChange={onAccessChange} />
      </div>
    </div>
  );
}
