// Which language a page is in is decided by its URL, not by a browser
// setting. English lives at the root (/videos), Khmer at a /km prefix
// (/km/videos). That is what lets Google index and rank the Khmer pages --
// a language kept only in localStorage is invisible to a crawler, which
// only ever sees whatever the default is.
//
// The prefix is read once, at load, and handed to react-router as its
// `basename`. Every <Link to="/videos"> in the app therefore keeps working
// unchanged and automatically points at the right language tree.

export const LOCALES = ["en", "km"];
export const DEFAULT_LOCALE = "en";

const PREFIX = { en: "", km: "/km" };

/** "/km/videos/1" -> "/km"   |   "/videos/1" -> "" */
export function prefixOf(pathname) {
  return /^\/km(?=\/|$)/.test(pathname) ? "/km" : "";
}

/** "/km/videos/1" -> "km"   |   "/videos/1" -> "en" */
export function localeOf(pathname) {
  return prefixOf(pathname) === "/km" ? "km" : "en";
}

/** Drops the language prefix: "/km/videos/1" -> "/videos/1", "/km" -> "/" */
export function stripPrefix(pathname) {
  const rest = pathname.replace(/^\/km(?=\/|$)/, "");
  return rest === "" ? "/" : rest;
}

/**
 * Builds the URL path for an unprefixed route in a given language.
 * pathFor("/videos", "km") -> "/km/videos"; pathFor("/", "km") -> "/km"
 */
export function pathFor(route, locale) {
  const prefix = PREFIX[locale] ?? "";
  const clean = route === "/" ? "" : route;
  return `${prefix}${clean}` || "/";
}

// Read once at startup. The prefix can't change without a page load, which
// is exactly what the language switcher does.
export const BASENAME = typeof window === "undefined" ? "" : prefixOf(window.location.pathname);
export const ACTIVE_LOCALE = BASENAME === "/km" ? "km" : "en";
