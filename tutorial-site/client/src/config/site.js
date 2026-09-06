// The public origin of the site, with no trailing slash.
//
// Everything Google needs is built from this one value: the canonical URL on
// every page, the hreflang alternates, the sitemap, robots.txt, and the
// absolute og:image/og:url used by Facebook, Telegram and Messenger link
// previews. Change it here and the whole site follows.
//
// It can also be overridden at build time with VITE_SITE_URL, which is what
// the Cloudflare build environment should set once the real domain is live.
export const SITE_URL = (
  import.meta.env?.VITE_SITE_URL || "https://e-tnakrean.laothomorn.workers.dev"
).replace(/\/+$/, "");

export const SITE_NAME = "E-TnakRean";

// The picture Facebook, Telegram and Messenger show on a shared link.
// 1200x630 is the shape they crop to -- the square logo.png used to be
// letterboxed into a small thumbnail here, which made every shared link
// look like an afterthought. public/og-image.png is built for that shape.
export const SITE_IMAGE = "/og-image.png";

// Every public contact detail for the site lives here, in one place.
//
// Fill in the ones you have and leave the rest as empty strings.
//
// All four icons always appear in the footer so the design stays complete
// while you are still collecting the details. An entry left empty renders as
// a dimmed, non-clickable placeholder -- it will not send a visitor to a
// dead page. The moment you paste a real value in here, that icon turns into
// a working link on its own; there is nothing else to change.
export const CONTACT = {
  // e.g. "info@etnakrean.com"
  email: "",
  // e.g. "+855 12 345 678"
  phone: "",
  // Full URL, e.g. "https://t.me/etnakrean"
  telegram: "",
  // Full URL, e.g. "https://facebook.com/etnakrean"
  facebook: "",
};
