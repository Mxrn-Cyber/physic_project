import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { BookOpen, Mail, Phone, Send, Facebook, Sun, Moon } from "lucide-react";
import NavBar from "./components/NavBar.jsx";
import BackgroundDecor from "./components/BackgroundDecor.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useLanguage } from "./context/LanguageContext.jsx";
import { useDarkMode } from "./context/DarkModeContext.jsx";
import Home from "./pages/Home.jsx";
import Videos from "./pages/Videos.jsx";
import Books from "./pages/Books.jsx";
import VideoDetail from "./pages/VideoDetail.jsx";
import About from "./pages/About.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import NotFound from "./pages/NotFound.jsx";
import { CONTACT } from "./config/site.js";

// Admin ships a large CRUD dashboard (users/videos/books management) that
// only admins ever use, but it used to be bundled into every visitor's
// initial page load regardless of role. Loading it lazily means a regular
// student on a slow connection no longer downloads admin-only code.
const Admin = lazy(() => import("./pages/Admin.jsx"));

// BookDetail pulls in pdf.js (the in-page PDF renderer used by
// BookViewer.jsx) which is a large library on its own. Lazy-loading this
// page keeps pdf.js out of the bundle every other page pays for -- it only
// downloads when someone actually opens a book.
const BookDetail = lazy(() => import("./pages/BookDetail.jsx"));

// Compare the part of the URL that decides which page is shown. Using this
// instead of `location.key` means a click on the link you're already on
// doesn't replay the whole transition.
// Footer contact icons. Every icon is always rendered so the footer design
// stays complete while the real details are still missing. An entry whose
// value is blank in src/config/site.js renders as a dimmed, non-clickable
// placeholder rather than a link to nowhere -- fill the value in and it
// turns into a real link automatically, no markup change needed.
const SOCIAL_LINKS = [
  {
    key: "email",
    href: CONTACT.email ? `mailto:${CONTACT.email}` : "",
    title: CONTACT.email,
    label: "Email",
    Icon: Mail,
  },
  {
    key: "phone",
    href: CONTACT.phone ? `tel:${CONTACT.phone.replace(/\s+/g, "")}` : "",
    title: CONTACT.phone,
    label: "Phone",
    Icon: Phone,
  },
  {
    key: "telegram",
    href: CONTACT.telegram,
    title: "Telegram",
    label: "Telegram",
    Icon: Send,
    external: true,
  },
  {
    key: "facebook",
    href: CONTACT.facebook,
    title: "Facebook",
    label: "Facebook",
    Icon: Facebook,
    external: true,
  },
];

const routeHrefOf = (loc) => `${loc.pathname}${loc.search}`;

// Longest the exit animation is ever allowed to hold the old page on screen.
// Comfortably longer than the 150ms `page-out` animation, short enough that
// nobody perceives it as a hang. See the failsafe timer below.
const EXIT_TIMEOUT_MS = 260;

export default function App() {
  const { user } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const { mode, toggleMode } = useDarkMode();
  const location = useLocation();

  // Cross-fade between pages instead of the instant cut React Router does by
  // default: `Routes` below renders `displayLocation` (frozen during the
  // swap), not the live `location`. A URL change first plays a quick
  // fade/slide-out of the page still on screen, then we adopt the new
  // location and fade the new page in.
  //
  // The important part is that "adopt the new location" can NEVER be missed.
  // An earlier version only committed from onAnimationEnd, which meant any
  // browser that didn't deliver that event -- reduced-motion turning the
  // animation off, a backgrounded tab, the element not being laid out --
  // left the site frozen on the previous page with every further click doing
  // nothing. Now a timer commits the swap regardless, and the animation event
  // is only an optimisation that commits it sooner.
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("in");

  // Read inside commit() so we always land on the newest URL, even if the
  // person clicked two links faster than one animation.
  const locationRef = useRef(location);
  locationRef.current = location;
  const exitTimerRef = useRef(null);

  const commit = useCallback(() => {
    clearTimeout(exitTimerRef.current);
    // Leaving a long, scrolled-down page for a short one otherwise drops you
    // below the new page's content -- it reads as a page that failed to load.
    window.scrollTo(0, 0);
    setDisplayLocation(locationRef.current);
    setTransitionStage("in");
  }, []);

  useEffect(() => {
    if (routeHrefOf(location) === routeHrefOf(displayLocation)) return;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) commit();
    else setTransitionStage("out");
  }, [location, displayLocation, commit]);

  // The failsafe described above: once the exit starts, the swap happens on
  // its own even if no animationend ever arrives.
  useEffect(() => {
    if (transitionStage !== "out") return undefined;
    exitTimerRef.current = setTimeout(commit, EXIT_TIMEOUT_MS);
    return () => clearTimeout(exitTimerRef.current);
  }, [transitionStage, commit]);

  return (
    <div className="relative isolate min-h-screen bg-gray-50 font-sans dark:bg-gray-950">
      <BackgroundDecor />
      <NavBar />

      <ErrorBoundary key={displayLocation.pathname}>
        <div
          className={transitionStage === "out" ? "animate-page-out" : "animate-page-in"}
          onAnimationEnd={(e) => {
            // animationend bubbles, so a spinner or any animated element
            // *inside* the page would otherwise end the transition early and
            // swap the content mid-exit. Only this wrapper's own animation
            // counts.
            if (e.target !== e.currentTarget) return;
            if (transitionStage !== "out") return;
            commit();
          }}
        >
          <Routes location={displayLocation}>
            <Route path="/" element={<Home />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/videos/:id" element={<VideoDetail />} />
            <Route path="/books" element={<Books />} />
            <Route
              path="/books/:id"
              element={
                <Suspense
                  fallback={
                    <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading…
                    </div>
                  }
                >
                  <BookDetail />
                </Suspense>
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Suspense
                    fallback={
                      <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        Loading…
                      </div>
                    }
                  >
                    <Admin />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </ErrorBoundary>

      <footer className="mt-16 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link
                to="/"
                className="flex items-center gap-2 text-lg font-extrabold tracking-tight"
              >
                <img
                  src="/logo.png"
                  alt="eTnakRean logo"
                  loading="lazy"
                  className="h-8 w-8 rounded-lg object-contain"
                />
                <span className="text-red-600 dark:text-red-400">eTnakRean</span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t.footer.tagline}
              </p>
            </div>

            {/* Explore */}
            <nav aria-label={t.footer.explore}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                {t.footer.explore}
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { to: "/", label: t.nav.home },
                  { to: "/videos", label: t.nav.videos },
                  { to: "/books", label: t.nav.books },
                  { to: "/about", label: t.nav.about },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-gray-600 transition-colors hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Account */}
            <nav aria-label={t.footer.account}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                {t.footer.account}
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {(user
                  ? [
                      { to: "/dashboard", label: t.nav.dashboard },
                      { to: "/profile", label: t.nav.profile },
                    ]
                  : [
                      { to: "/login", label: t.nav.login },
                      { to: "/register", label: t.nav.getStarted },
                    ]
                ).map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-gray-600 transition-colors hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Connect */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                {t.footer.connect}
              </h2>
              <div className="mt-4 flex items-center gap-2">
                {SOCIAL_LINKS.map(({ key, href, title, label, Icon, external }) =>
                  href ? (
                    <a
                      key={key}
                      href={href}
                      title={title || label}
                      aria-label={label}
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-red-600 hover:text-white dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-600 dark:hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ) : (
                    <span
                      key={key}
                      title={`${label} — ${t.footer.linkNotSet}`}
                      aria-hidden="true"
                      className="flex h-9 w-9 cursor-default items-center justify-center rounded-full bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col-reverse items-center gap-4 border-t border-gray-200 pt-6 dark:border-gray-800 sm:flex-row sm:justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              © {new Date().getFullYear()} eTnakRean. {t.footer.rights}
            </p>

            {/* Mirrored from NavBar so the toggles are reachable from the
                bottom of long pages too. */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleLang}
                title="Switch language"
                aria-label="Switch language"
                className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <span className="text-base leading-none" aria-hidden="true">
                  {lang === "en" ? "🇰🇭" : "🇬🇧"}
                </span>
                {lang === "en" ? "KH" : "ENG"}
              </button>
              <button
                type="button"
                onClick={toggleMode}
                title="Toggle dark mode"
                aria-label="Toggle dark mode"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                {mode === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
