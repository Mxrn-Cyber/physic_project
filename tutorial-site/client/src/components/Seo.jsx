import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_URL, SITE_NAME, SITE_IMAGE } from "../config/site.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { pathFor } from "../i18n/locale.js";

// Tags this component owns get marked so they can be told apart from the
// ones hard-coded in index.html (which act as the fallback a crawler sees
// before any JavaScript runs).
const OWNED = "data-seo";

function upsertMeta(attr, key, content) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (content == null || content === "") {
    if (el?.hasAttribute(OWNED)) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute(OWNED, "");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href, hreflang) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    el.setAttribute(OWNED, "");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data) {
  document.head.querySelectorAll(`script[type="application/ld+json"][${OWNED}]`).forEach((n) => n.remove());
  const blocks = (Array.isArray(data) ? data : [data]).filter(Boolean);
  for (const block of blocks) {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute(OWNED, "");
    // Closing-tag sequences inside a string value would end the script early.
    el.textContent = JSON.stringify(block).replace(/</g, "\\u003c");
    document.head.appendChild(el);
  }
}

/** Trims a description to something a search result will actually show. */
export function clamp(text, max = 158) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/[\s,;:.-]+\S*$/, "")}…`;
}

/** Fills "{title}" style placeholders in a translated string. */
export function fill(template, values) {
  return String(template || "").replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m));
}

export function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/**
 * Sets everything in <head> that a search engine or a link preview reads.
 *
 * Drop one of these into each page. It is render-free -- it only writes to
 * document.head -- so it can sit anywhere in the page's JSX.
 *
 * `noindex` is for pages that must never appear in search results: the admin
 * area, someone's dashboard or profile, and the password/OTP screens, whose
 * URLs carry single-use tokens.
 */
export default function Seo({
  title,
  description,
  image,
  type = "website",
  noindex = false,
  jsonLd = null,
}) {
  const { lang } = useLanguage();
  const location = useLocation();
  // Inside the router, pathname already has the /km basename stripped, so
  // this is the language-neutral route -- exactly what the alternates need.
  const route = location.pathname || "/";
  const serialized = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const canonical = `${SITE_URL}${pathFor(route, lang)}`;
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Learn Anytime, Anywhere`;
    const desc = clamp(description);
    const img = absoluteUrl(image || SITE_IMAGE);

    document.title = fullTitle;
    upsertMeta("name", "description", desc);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    upsertLink("canonical", canonical);

    // hreflang: tells Google these two URLs are the same page in two
    // languages, so a Khmer search can surface /km/... instead of the
    // English page, and neither is treated as duplicate content.
    upsertLink("alternate", `${SITE_URL}${pathFor(route, "en")}`, "en");
    upsertLink("alternate", `${SITE_URL}${pathFor(route, "km")}`, "km");
    upsertLink("alternate", `${SITE_URL}${pathFor(route, "en")}`, "x-default");

    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", img);
    upsertMeta("property", "og:locale", lang === "km" ? "km_KH" : "en_US");
    upsertMeta("property", "og:locale:alternate", lang === "km" ? "en_US" : "km_KH");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:image", img);

    setJsonLd(serialized ? JSON.parse(serialized) : null);
  }, [title, description, image, type, noindex, serialized, route, lang]);

  return null;
}
