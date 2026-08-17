import { Suspense, lazy } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { BookOpen, Mail, Phone, Send, Facebook, Sun, Moon } from "lucide-react";
import NavBar from "./components/NavBar.jsx";
import BackgroundDecor from "./components/BackgroundDecor.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
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

export default function App() {
  const { lang, toggleLang } = useLanguage();
  const { mode, toggleMode } = useDarkMode();
  const location = useLocation();

  return (
    <div className="relative isolate min-h-screen bg-gray-50 font-sans dark:bg-gray-950">
      <BackgroundDecor />
      <NavBar />
      {/*
        `key={location.pathname}` forces this whole block to remount on every
        route change. Two things ride on that remount:
        1. ErrorBoundary's caught-error state resets automatically, so a
           crash on one page (e.g. a stale lazy chunk after a deploy) no
           longer leaves every later navigation stuck on a blank screen.
        2. The fresh DOM node re-triggers the `animate-page-in` CSS
           animation (defined in tailwind.config.js), giving every screen
           change a smooth fade/slide-in instead of an instant hard cut.
      */}
      <ErrorBoundary key={location.pathname}>
        <div className="animate-page-in">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/videos/:id" element={<VideoDetail />} />
            <Route path="/books" element={<Books />} />
            <Route
              path="/books/:id"
              element={
                <Suspense
                  fallback={
                    <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</div>
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
                      <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</div>
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
          </Routes>
        </div>
      </ErrorBoundary>
      {/*
        Single-section footer: one flex row (stacks on mobile) with the
        brand mark, page links, contact icons, and the language/dark-mode
        toggle -- no internal divider splitting it into separate blocks.
        The copyright line at the bottom is still part of this same block,
        not a separate bordered section.

        PLACEHOLDER CONTACT DETAILS -- replace every href/title below with
        your real ones before this goes live. Each is marked so they're easy
        to find (search this file for "REPLACE").
      */}
      <footer className="relative mt-16 overflow-hidden border-t border-gray-200 bg-white/60 backdrop-blur dark:border-gray-800 dark:bg-gray-950/60">
        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400" />

        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
            <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-md shadow-red-500/30">
                <BookOpen size={16} />
              </span>
              <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                ReanPhysics
              </span>
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <Link to="/videos" className="hover:text-red-600 dark:hover:text-red-400">
                Videos
              </Link>
              <Link to="/books" className="hover:text-red-600 dark:hover:text-red-400">
                Books
              </Link>
              <Link to="/about" className="hover:text-red-600 dark:hover:text-red-400">
                About
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <a
                  href="mailto:REPLACE_EMAIL@example.com"
                  title="REPLACE_EMAIL@example.com"
                  aria-label="Email"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600 hover:shadow-sm dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                >
                  <Mail className="h-4 w-4" />
                </a>
                <a
                  href="tel:+855XXXXXXXX"
                  title="+855 XX XXX XXX (REPLACE)"
                  aria-label="Phone"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600 hover:shadow-sm dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                >
                  <Phone className="h-4 w-4" />
                </a>
                <a
                  href="https://t.me/REPLACE_TELEGRAM"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Telegram (REPLACE)"
                  aria-label="Telegram"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600 hover:shadow-sm dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                >
                  <Send className="h-4 w-4" />
                </a>
                <a
                  href="https://facebook.com/REPLACE_FACEBOOK_PAGE"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook (REPLACE)"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600 hover:shadow-sm dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </div>

              {/* Same language/dark-mode toggle as NavBar.jsx, mirrored here
                  so it's reachable from the bottom of long pages too. */}
              <span className="hidden h-6 w-px bg-gray-200 dark:bg-gray-800 lg:block" aria-hidden="true" />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleLang}
                  title="Switch language"
                  aria-label="Switch language"
                  className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1.5 text-sm font-semibold text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600 hover:shadow-sm dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-red-950/60 dark:hover:text-red-400"
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
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600 hover:shadow-sm dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                >
                  {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} ReanPhysics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
