import { createContext, useContext, useEffect } from "react";
import { translations } from "../i18n/translations";
import { ACTIVE_LOCALE, pathFor, stripPrefix } from "../i18n/locale.js";

const LanguageContext = createContext(null);
const STORAGE_KEY = "tutorhub_lang";
const REDIRECT_GUARD = "tutorhub_lang_redirected";

export function LanguageProvider({ children }) {
  // The URL decides the language now -- see i18n/locale.js for why.
  const lang = ACTIVE_LOCALE;

  // One effect, and the order inside it matters: the stored preference has
  // to be READ before this page's own language is written over it, or a
  // returning Khmer visitor's choice is erased a moment before it is checked.
  useEffect(() => {
    document.documentElement.lang = lang;

    let stored = null;
    let alreadyRedirected = true;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
      alreadyRedirected = Boolean(sessionStorage.getItem(REDIRECT_GUARD));
      sessionStorage.setItem(REDIRECT_GUARD, "1");
    } catch {
      /* private browsing: skip the redirect, the URL is still authoritative */
    }

    // A visitor who last chose Khmer and arrives on an unprefixed English URL
    // is moved to the Khmer mirror -- once per visit only, so the switcher
    // still works and there is no redirect loop. Googlebot has no
    // localStorage, so a crawler always gets the language its URL names and
    // /videos never quietly redirects to /km/videos in the index.
    if (lang === "en" && !alreadyRedirected && stored === "km") {
      const { pathname, search, hash } = window.location;
      window.location.replace(pathFor(stripPrefix(pathname), "km") + search + hash);
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore -- the URL already carries the language */
    }
  }, [lang]);

  // Switching language is a real navigation, not a state change: the whole
  // app is mounted under a router basename fixed at load, so the new
  // language tree needs a fresh page.
  const setLang = (next) => {
    if (next === lang || !translations[next]) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
      sessionStorage.setItem(REDIRECT_GUARD, "1");
    } catch {
      /* ignore -- the URL below still carries the choice */
    }
    const { pathname, search, hash } = window.location;
    window.location.assign(pathFor(stripPrefix(pathname), next) + search + hash);
  };

  const toggleLang = () => setLang(lang === "en" ? "km" : "en");

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);

  if (!ctx) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return ctx;
}
