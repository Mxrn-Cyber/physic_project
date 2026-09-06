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

// 1200x630 is the size Facebook, Telegram and Twitter crop to. logo.png is
// square (512x512), which those scrapers letterbox -- fine for now, but a
// proper 1200x630 banner at /og-image.png would look better in a shared link.
export const SITE_IMAGE = "/logo.png";

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
