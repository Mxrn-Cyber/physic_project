import { useState } from "react";
import {
  Play, FileDown, Lock, CheckCircle2, Home as HomeIcon,
  BookOpen, CreditCard, User, Star, Menu, X
} from "lucide-react";

/**
 * Sample front-end demo for a video-tutorial + PDF learning website
 * with Free / Paid plans, as brainstormed earlier.
 *
 * This is a UI/UX prototype only:
 * - No real auth, payments, or video hosting are wired up.
 * - "isPaid" is a local toggle standing in for real subscription status
 *   (in production this would come from your auth/billing backend,
 *   e.g. Stripe subscription status).
 * - Swap the COURSES data below for real content, and connect
 *   handleUpgrade()/video src/pdf links to your actual backend.
 */

const COURSES = [
  {
    id: "c1",
    title: "Getting Started: Foundations",
    level: "Beginner",
    free: true,
    lessons: [
      { id: "l1", title: "Welcome & Overview", duration: "4:12", free: true, pdf: "welcome-overview.pdf" },
      { id: "l2", title: "Setting Up Your Tools", duration: "9:45", free: true, pdf: "setup-checklist.pdf" },
      { id: "l3", title: "Your First Project", duration: "12:30", free: false, pdf: "first-project-workbook.pdf" },
    ],
  },
  {
    id: "c2",
    title: "Intermediate Techniques",
    level: "Intermediate",
    free: false,
    lessons: [
      { id: "l4", title: "Core Concepts Deep Dive", duration: "15:02", free: false, pdf: "core-concepts.pdf" },
      { id: "l5", title: "Common Mistakes to Avoid", duration: "8:20", free: false, pdf: "mistakes-cheatsheet.pdf" },
      { id: "l6", title: "Practice Exercises", duration: "11:15", free: false, pdf: "practice-worksheet.pdf" },
    ],
  },
  {
    id: "c3",
    title: "Advanced Mastery",
    level: "Advanced",
    free: false,
    lessons: [
      { id: "l7", title: "Advanced Workflow", duration: "18:40", free: false, pdf: "advanced-workflow.pdf" },
      { id: "l8", title: "Real-World Case Study", duration: "22:05", free: false, pdf: "case-study.pdf" },
    ],
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Sample lessons in every course",
      "1–2 PDF guides per course",
      "Standard video quality",
      "Community forum (read-only)",
    ],
    cta: "Current plan",
  },
  {
    name: "Paid",
    price: "$12",
    period: "/month",
    highlighted: true,
    features: [
      "Full access to every course & lesson",
      "All PDF guides, worksheets & workbooks",
      "HD, ad-free video, downloadable offline",
      "Progress tracking & certificates",
      "Full community + comments/Q&A",
    ],
    cta: "Upgrade to Paid",
  },
];

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function NavBar({ page, setPage, isPaid, setIsPaid, mobileOpen, setMobileOpen }) {
  const items = [
    { key: "home", label: "Home", icon: HomeIcon },
    { key: "courses", label: "Courses", icon: BookOpen },
    { key: "pricing", label: "Pricing", icon: CreditCard },
    { key: "dashboard", label: "Dashboard", icon: User },
  ];
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <button onClick={() => setPage("home")} className="flex items-center gap-2 font-bold text-gray-900">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          TutorHub
        </button>

        <nav className="hidden gap-1 sm:flex">
          {items.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setPage(key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                page === key ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <Badge tone={isPaid ? "green" : "gray"}>{isPaid ? "Paid member" : "Free member"}</Badge>
          <button
            onClick={() => setIsPaid((v) => !v)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Demo: switch to {isPaid ? "Free" : "Paid"}
          </button>
        </div>

        <button className="sm:hidden" onClick={() => setMobileOpen((v) => !v)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 px-4 py-2 sm:hidden">
          {items.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setPage(key); setMobileOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                page === key ? "bg-indigo-50 text-indigo-700" : "text-gray-600"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
          <button
            onClick={() => setIsPaid((v) => !v)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700"
          >
            Demo: switch to {isPaid ? "Free" : "Paid"}
          </button>
        </div>
      )}
    </header>
  );
}

function HomePage({ setPage }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <Badge tone="blue">Video lessons + downloadable PDFs</Badge>
      <h1 className="mt-4 text-4xl font-extrabold text-gray-900 sm:text-5xl">
        Learn by watching. <span className="text-indigo-600">Practice with PDFs.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-gray-600">
        Short, practical video tutorials paired with printable guides and worksheets.
        Start free, upgrade any time for the full library.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setPage("courses")}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
        >
          Browse free lessons
        </button>
        <button
          onClick={() => setPage("pricing")}
          className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
        >
          See plans
        </button>
      </div>

      <div className="mt-16 grid gap-6 text-left sm:grid-cols-3">
        {[
          { icon: Play, title: "Bite-sized videos", body: "5–20 minute lessons you can watch on any device." },
          { icon: FileDown, title: "Companion PDFs", body: "Cheat sheets and worksheets for every lesson." },
          { icon: CheckCircle2, title: "Track your progress", body: "See what you've completed and pick up where you left off." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-gray-200 p-5">
            <Icon className="h-6 w-6 text-indigo-600" />
            <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoursesPage({ isPaid, setPage, setActiveCourseId }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Course Library</h1>
      <p className="mt-1 text-sm text-gray-600">
        {isPaid ? "You have full access to every course." : "Free preview lessons are unlocked. Upgrade for full access."}
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {COURSES.map((course) => {
          const unlocked = isPaid || course.free;
          return (
            <button
              key={course.id}
              onClick={() => { setActiveCourseId(course.id); setPage("lesson"); }}
              className="flex flex-col rounded-xl border border-gray-200 p-5 text-left transition hover:border-indigo-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <Badge tone="amber">{course.level}</Badge>
                {unlocked ? <Badge tone="green">Unlocked</Badge> : <Badge>Locked</Badge>}
              </div>
              <h3 className="mt-3 font-semibold text-gray-900">{course.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{course.lessons.length} lessons</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
                {unlocked ? <Play className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {unlocked ? "Start course" : "Preview / Upgrade"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LessonPage({ isPaid, activeCourseId, setPage }) {
  const course = COURSES.find((c) => c.id === activeCourseId) || COURSES[0];
  const [activeLessonId, setActiveLessonId] = useState(course.lessons[0].id);
  const lesson = course.lessons.find((l) => l.id === activeLessonId);
  const unlocked = isPaid || lesson.free;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <button onClick={() => setPage("courses")} className="text-sm font-medium text-indigo-600 hover:underline">
        ← Back to courses
      </button>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">{course.title}</h1>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <div className="flex aspect-video items-center justify-center rounded-xl bg-gray-900 text-white">
            {unlocked ? (
              <div className="text-center">
                <Play className="mx-auto h-12 w-12" />
                <p className="mt-2 text-sm text-gray-300">Playing: {lesson.title} ({lesson.duration})</p>
              </div>
            ) : (
              <div className="text-center">
                <Lock className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-300">Upgrade to Paid to watch this lesson</p>
                <button
                  onClick={() => setPage("pricing")}
                  className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  View plans
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="font-medium text-gray-900">{lesson.title}</p>
              <p className="text-sm text-gray-500">{lesson.duration}</p>
            </div>
            <button
              disabled={!unlocked}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                unlocked ? "bg-gray-900 text-white hover:bg-gray-800" : "cursor-not-allowed bg-gray-100 text-gray-400"
              }`}
            >
              <FileDown className="h-4 w-4" />
              {unlocked ? `Download ${lesson.pdf}` : "PDF locked"}
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Lessons</h2>
          <ul className="mt-3 space-y-1.5">
            {course.lessons.map((l) => {
              const lUnlocked = isPaid || l.free;
              return (
                <li key={l.id}>
                  <button
                    onClick={() => setActiveLessonId(l.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                      l.id === activeLessonId ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {lUnlocked ? <Play className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5 text-gray-400" />}
                      {l.title}
                    </span>
                    <span className="text-xs text-gray-400">{l.duration}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PricingPage({ isPaid, setIsPaid }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Choose your plan</h1>
        <p className="mt-1 text-sm text-gray-600">Start free. Upgrade any time, cancel any time.</p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = (plan.name === "Paid") === isPaid;
          return (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.highlighted ? "border-indigo-300 shadow-md" : "border-gray-200"
              }`}
            >
              {plan.highlighted && (
                <Badge tone="blue">
                  <Star className="h-3 w-3" /> Most popular
                </Badge>
              )}
              <h2 className="mt-3 text-lg font-bold text-gray-900">{plan.name}</h2>
              <p className="mt-1">
                <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-500"> {plan.period}</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setIsPaid(plan.name === "Paid")}
                disabled={isCurrent}
                className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold ${
                  isCurrent
                    ? "cursor-default bg-gray-100 text-gray-400"
                    : plan.highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isCurrent ? "Current plan" : plan.cta}
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-gray-400">
        Demo only — the buttons above just flip local state. Wire this up to Stripe/PayPal in production.
      </p>
    </div>
  );
}

function DashboardPage({ isPaid, setPage }) {
  const allLessons = COURSES.flatMap((c) => c.lessons.map((l) => ({ ...l, course: c.title })));
  const unlockedCount = allLessons.filter((l) => isPaid || l.free).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Plan</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{isPaid ? "Paid" : "Free"}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Lessons unlocked</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{unlockedCount} / {allLessons.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Courses</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{COURSES.length}</p>
        </div>
      </div>

      {!isPaid && (
        <div className="mt-6 flex items-center justify-between rounded-xl bg-indigo-50 p-5">
          <p className="text-sm text-indigo-900">Unlock every lesson and PDF with the Paid plan.</p>
          <button
            onClick={() => setPage("pricing")}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Upgrade
          </button>
        </div>
      )}
    </div>
  );
}

export default function TutorialSite() {
  const [page, setPage] = useState("home");
  const [isPaid, setIsPaid] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState(COURSES[0].id);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavBar
        page={page}
        setPage={setPage}
        isPaid={isPaid}
        setIsPaid={setIsPaid}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {page === "home" && <HomePage setPage={setPage} />}
      {page === "courses" && (
        <CoursesPage isPaid={isPaid} setPage={setPage} setActiveCourseId={setActiveCourseId} />
      )}
      {page === "lesson" && (
        <LessonPage isPaid={isPaid} activeCourseId={activeCourseId} setPage={setPage} />
      )}
      {page === "pricing" && <PricingPage isPaid={isPaid} setIsPaid={setIsPaid} />}
      {page === "dashboard" && <DashboardPage isPaid={isPaid} setPage={setPage} />}

      <footer className="mt-16 border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        TutorHub demo — front-end prototype only, no real backend.
      </footer>
    </div>
  );
}
