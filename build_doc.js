const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, numbering
} = require("docx");

const H1 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } });
const H2 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 250, after: 120 } });
const P = (t, opts = {}) => new Paragraph({ children: [new TextRun({ text: t, ...opts })], spacing: { after: 120 } });
const Bullet = (t, bold=false) => new Paragraph({
  children: [new TextRun({ text: t, bold })],
  numbering: { reference: "bullets", level: 0 },
  spacing: { after: 60 },
});

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: "2E4057" } : undefined,
    children: [new Paragraph({
      children: [new TextRun({ text, bold: !!opts.header, color: opts.header ? "FFFFFF" : undefined })],
    })],
  });
}

function pricingTable() {
  const colWidths = [2200, 3600, 3600];
  const header = new TableRow({
    children: [
      cell("Feature", { header: true, width: colWidths[0] }),
      cell("Free Plan", { header: true, width: colWidths[1] }),
      cell("Paid Plan", { header: true, width: colWidths[2] }),
    ],
  });
  const rows = [
    ["Video tutorials", "Limited selection (intro / sample lessons)", "Full library, all courses"],
    ["PDF guides / worksheets", "1–2 sample PDFs", "Full set, downloadable + printable"],
    ["Video quality / length", "Standard, may include ads or watermark", "HD, ad-free, full-length"],
    ["Progress tracking", "Basic (course completion only)", "Detailed (per-lesson, quizzes, streaks)"],
    ["Certificates", "Not included", "Certificate of completion"],
    ["Community / support", "Public forum access (read-only or limited posts)", "Full community + Q&A / comments on lessons"],
    ["Downloads for offline use", "No", "Yes"],
    ["New content", "Delayed access (e.g. released after 30 days)", "Early / immediate access"],
    ["Price", "$0", "Monthly or annual subscription, or one-time per course"],
  ];
  const trs = rows.map(r => new TableRow({
    children: [cell(r[0], { width: colWidths[0] }), cell(r[1], { width: colWidths[1] }), cell(r[2], { width: colWidths[2] })],
  }));
  return new Table({
    width: { size: 9400, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [header, ...trs],
  });
}

const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: "bullet", text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 260 } } } }],
    }],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 } } }, // US Letter
    children: [
      new Paragraph({
        children: [new TextRun({ text: "Tutorial Website Brainstorm", bold: true, size: 48 })],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Video + PDF learning platform — free & paid plan concept", italics: true, size: 24, color: "555555" })],
        spacing: { after: 300 },
      }),

      H1("1. Concept Overview"),
      P("A website where learners watch step-by-step video tutorials and download companion PDF guides (cheat sheets, worksheets, checklists) for a specific topic. Content is split into a Free plan (to attract and demonstrate value) and a Paid plan (full access, subscription or one-time purchase)."),
      P("Before building, pick the topic/niche — the structure below works for any subject (tech skills, business, crafts, language, fitness, etc.). Fill in the bracketed placeholders once the niche is decided."),

      H1("2. Target Audience"),
      Bullet("Who are they? (e.g. beginners wanting a practical skill, students, professionals upskilling)"),
      Bullet("What problem does the tutorial solve for them?"),
      Bullet("Where do they currently learn this — YouTube, other paid courses, in-person classes?"),
      Bullet("What would make them pay instead of using free YouTube content? (structure, PDFs, progress tracking, support, certificate)"),

      H1("3. Content Format"),
      H2("Video Tutorials"),
      Bullet("Short lessons (5–15 min) grouped into modules/courses"),
      Bullet("Hosted on Vimeo/YouTube (unlisted) or a video platform (Bunny.net, Mux, Cloudflare Stream) — avoid self-hosting large video files"),
      Bullet("Include captions/subtitles for accessibility"),
      H2("PDF Materials"),
      Bullet("Companion guide per lesson (summary, steps, screenshots)"),
      Bullet("Worksheets / templates / checklists learners can print or fill in"),
      Bullet("A combined \"full course workbook\" PDF as a paid bonus"),

      H1("4. Site Structure (Pages)"),
      Bullet("Home — value proposition, preview video, plan comparison, testimonials"),
      Bullet("Course catalog / library — browse by category"),
      Bullet("Course/lesson page — video player, PDF download button, progress marker, comments"),
      Bullet("Pricing page — Free vs Paid comparison (see table below)"),
      Bullet("Account / dashboard — enrolled courses, downloads, progress, certificates"),
      Bullet("Blog / resources (optional) — SEO traffic driver, free tips"),
      Bullet("Login / Sign up, Checkout, Contact / Support"),

      H1("5. Free Plan vs Paid Plan"),
      pricingTable(),
      new Paragraph({ text: "", spacing: { after: 200 } }),

      H1("6. Monetization Models to Consider"),
      Bullet("Monthly/annual subscription — simplest for ongoing new content", true),
      Bullet("One-time purchase per course — good if content is finite (e.g. a single skill)", true),
      Bullet("Freemium + upsell — free intro course, paid for advanced modules", true),
      Bullet("Tiered plans — e.g. Free / Basic / Pro, with Pro adding 1-on-1 support or downloadable source files", true),
      Bullet("Bundles — group several courses/PDFs at a discount", true),

      H1("7. Core Features / Functionality"),
      Bullet("User accounts with login (email/password, Google login)"),
      Bullet("Payment processing (Stripe / PayPal) with subscription billing"),
      Bullet("Video hosting with access control (free vs paid videos)"),
      Bullet("PDF file storage with gated downloads for paid users"),
      Bullet("Progress tracking / completion checkmarks"),
      Bullet("Search and filter by topic/level"),
      Bullet("Email notifications (new lesson, renewal reminder)"),
      Bullet("Optional: certificates, quizzes, community/discussion forum"),

      H1("8. Build Options"),
      H2("Option A — No-code / low-code course platforms"),
      Bullet("Teachable, Thinkific, Kajabi, Podia — fastest to launch, built-in payments, hosting, and free/paid gating; less design flexibility, monthly platform fee"),
      H2("Option B — WordPress + LMS plugin"),
      Bullet("WordPress + LearnDash / Sensei + WooCommerce or Stripe — more customizable, still moderate setup effort, one-time + hosting costs"),
      H2("Option C — Custom-built website"),
      Bullet("Full control over design and features; higher dev cost/time; suitable if this becomes a long-term product with unique needs"),

      H1("9. Suggested Next Steps"),
      Bullet("1. Pick the niche/topic and validate demand (are people searching for this? competitor check)"),
      Bullet("2. Outline the first course — modules, lesson list, matching PDFs"),
      Bullet("3. Decide plan structure and pricing (start simple: Free + one Paid tier)"),
      Bullet("4. Choose a build option (start with no-code platform to test the idea cheaply)"),
      Bullet("5. Record a small pilot course, launch, and gather feedback before scaling"),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  require("fs").writeFileSync("Tutorial_Website_Brainstorm.docx", buf);
  console.log("done");
});
