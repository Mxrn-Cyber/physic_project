export const BADGE_STYLES = {
  topSeller: "bg-red-600 text-white",
  medium: "bg-amber-100 text-amber-800",
  discount: "bg-red-100 text-red-700",
  free: "bg-green-100 text-green-700",
  freeTrial: "bg-blue-100 text-blue-700",
};

// Badge text used to be a fixed English-only lookup (BADGE_LABELS). Since
// every other visible page is translated, badges were the one thing that
// stayed English even when a visitor switched to Khmer. Callers now pass
// the current `t` (from useLanguage()) so the label follows the site's
// language -- falls back to the raw key if a translation is ever missing.
export function badgeLabel(key, t) {
  return t?.badges?.[key] || key;
}
