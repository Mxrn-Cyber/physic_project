import { loadEnv } from "vite";

// Emits robots.txt and sitemap.xml into dist/ at build time.
//
// They can't be plain files in public/ because both need the real domain
// baked in, and the sitemap needs the current list of videos and books. So
// the build asks the API for the catalogue and writes both files from it.
//
// If the API can't be reached (Render's free tier sleeps, or you're building
// offline) the build still succeeds -- you get a sitemap with the fixed
// pages only, and a warning saying so. It is never worth failing a deploy
// over a sitemap.

// Public pages worth putting in front of Google. Anything behind a login,
// and anything reached by a single-use link, is deliberately absent.
const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/videos", priority: "0.9", changefreq: "daily" },
  { path: "/books", priority: "0.9", changefreq: "daily" },
  { path: "/about", priority: "0.5", changefreq: "monthly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/refund", priority: "0.3", changefreq: "yearly" },
];

const PRIVATE_ROUTES = [
  "/admin",
  "/dashboard",
  "/profile",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
];

const kmPath = (route) => (route === "/" ? "/km" : `/km${route}`);

const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

async function fetchJson(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function urlEntry({ siteUrl, route, lastmod, priority, changefreq }) {
  const en = `${siteUrl}${route === "/" ? "/" : route}`;
  const km = `${siteUrl}${kmPath(route)}`;
  // Each language gets its own <url>, and both list the same set of
  // alternates -- that pairing is what tells Google the two are the same
  // page in two languages rather than duplicate content.
  const alternates = [
    `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}"/>`,
    `    <xhtml:link rel="alternate" hreflang="km" href="${escapeXml(km)}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(en)}"/>`,
  ].join("\n");

  return [en, km]
    .map((loc) =>
      [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        alternates,
        lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : null,
        changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
        priority ? `    <priority>${priority}</priority>` : null,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n");
}

export default function seoAssets() {
  let siteUrl = "";
  let apiUrl = "";

  return {
    name: "seo-assets",
    apply: "build",

    config(_config, { mode }) {
      const env = loadEnv(mode, process.cwd(), "");
      siteUrl = (env.VITE_SITE_URL || "https://e-tnakrean.laothomorn.workers.dev").replace(/\/+$/, "");
      apiUrl = (env.VITE_API_URL || "").replace(/\/+$/, "");
    },

    // index.html is what a scraper that doesn't run JavaScript sees, so its
    // og: tags have to be absolute and real. Rewriting the placeholder here
    // keeps the domain defined in exactly one place.
    transformIndexHtml(html) {
      return html.replaceAll("https://REPLACE-WITH-YOUR-DOMAIN", siteUrl);
    },

    async generateBundle() {
      if (siteUrl.includes(".workers.dev")) {
        this.warn(
          `SEO: building for ${siteUrl}. A *.workers.dev subdomain is shared with every other ` +
            "Cloudflare Worker, so Google will not rank it like a domain you own -- set VITE_SITE_URL " +
            "to your own domain once you have one and everything below follows automatically."
        );
      }

      let items = [];
      if (apiUrl) {
        try {
          const [videos, books] = await Promise.all([
            fetchJson(`${apiUrl}/videos`),
            fetchJson(`${apiUrl}/books`),
          ]);
          items = [
            ...(videos.videos || []).map((v) => ({
              path: `/videos/${v._id}`,
              lastmod: v.createdAt,
            })),
            ...(books.books || []).map((b) => ({
              path: `/books/${b._id}`,
              lastmod: b.createdAt,
            })),
          ];
        } catch (err) {
          this.warn(
            `SEO: couldn't reach the API for the sitemap (${err.message}). ` +
              "Writing a sitemap with the fixed pages only -- rebuild once the API is awake to include every video and book."
          );
        }
      } else {
        this.warn("SEO: VITE_API_URL is not set, so the sitemap lists the fixed pages only.");
      }

      const now = new Date().toISOString();
      const entries = [
        ...STATIC_ROUTES.map((r) =>
          urlEntry({ siteUrl, route: r.path, lastmod: now, priority: r.priority, changefreq: r.changefreq })
        ),
        ...items.map((item) =>
          urlEntry({
            siteUrl,
            route: item.path,
            lastmod: item.lastmod ? new Date(item.lastmod).toISOString() : now,
            priority: "0.7",
            changefreq: "monthly",
          })
        ),
      ];

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;

      const robots = `# ${siteUrl}
User-agent: *
Allow: /
${PRIVATE_ROUTES.map((r) => `Disallow: ${r}`).join("\n")}
${PRIVATE_ROUTES.map((r) => `Disallow: ${kmPath(r)}`).join("\n")}

Sitemap: ${siteUrl}/sitemap.xml
`;

      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots });
      this.info?.(`SEO: sitemap.xml written with ${entries.length * 2} URLs (${items.length} items).`);
    },
  };
}
