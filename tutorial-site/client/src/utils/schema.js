// JSON-LD builders.
//
// This is the structured data Google reads to understand what a page *is*,
// rather than guessing from the text: that the site is an organisation, that
// /videos/:id is a video with a length and a price, that /books/:id is a
// book with a page count. It's what makes a result eligible for the richer
// listings (thumbnail, duration, price) instead of a plain blue link.
//
// Every builder returns a plain object. `undefined` fields disappear on
// JSON.stringify, so an item that's missing a thumbnail or a duration simply
// omits that property rather than publishing an empty one, which Google
// flags as an error.

import { SITE_URL, SITE_NAME, SITE_IMAGE, CONTACT } from "../config/site.js";
import { pathFor } from "../i18n/locale.js";

const abs = (p) =>
  !p ? undefined : /^https?:\/\//i.test(p) ? p : `${SITE_URL}${p.startsWith("/") ? "" : "/"}${p}`;

const urlFor = (route, lang) => `${SITE_URL}${pathFor(route, lang)}`;

const bcp47 = (lang) => (lang === "km" ? "km-KH" : "en");

const publisher = () => ({
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: abs(SITE_IMAGE),
});

/** ISO 8601 duration, which is the only format VideoObject.duration accepts. */
export function isoDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (!total) return undefined;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s ? `${s}S` : ""}`;
}

function priceOf(item) {
  const price = item.isFree ? 0 : item.effectivePrice ?? item.price ?? 0;
  return Number(price) || 0;
}

function offersFor(item, url) {
  const price = priceOf(item);
  if (price <= 0) return undefined;
  return {
    "@type": "Offer",
    url,
    price: price.toFixed(2),
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  };
}

export function organizationSchema({ description }) {
  const sameAs = [CONTACT.facebook, CONTACT.telegram].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: abs(SITE_IMAGE),
    description,
    sameAs: sameAs.length ? sameAs : undefined,
    email: CONTACT.email || undefined,
    telephone: CONTACT.phone || undefined,
  };
}

export function webSiteSchema({ lang }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: urlFor("/", lang),
    inLanguage: bcp47(lang),
    publisher: publisher(),
  };
}

/** items: [{ name, path }] -- path is the language-neutral route. */
export function breadcrumbSchema(items, lang) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: urlFor(item.path, lang),
    })),
  };
}

export function itemListSchema({ name, items, basePath, lang }) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 100).map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.title,
      url: urlFor(`${basePath}/${item._id}`, lang),
    })),
  };
}

export function videoSchema(video, { description, lang }) {
  const url = urlFor(`/videos/${video._id}`, lang);
  const free = priceOf(video) <= 0;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: description || video.description || video.title,
    thumbnailUrl: video.thumbnailUrl ? [abs(video.thumbnailUrl)] : undefined,
    uploadDate: video.createdAt || undefined,
    duration: isoDuration(video.durationSeconds),
    url,
    inLanguage: bcp47(lang),
    isAccessibleForFree: free,
    publisher: publisher(),
    offers: offersFor(video, url),
  };
}

export function bookSchema(book, { description, lang }) {
  const url = urlFor(`/books/${book._id}`, lang);
  const free = priceOf(book) <= 0;
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    description: description || book.description || book.title,
    url,
    bookFormat: "https://schema.org/EBook",
    numberOfPages: book.pageCount || undefined,
    image: abs(book.coverImageUrl) || undefined,
    inLanguage: bcp47(lang),
    isAccessibleForFree: free,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: publisher(),
    offers: offersFor(book, url),
  };
}
