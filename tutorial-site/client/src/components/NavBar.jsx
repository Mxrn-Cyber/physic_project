import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Info,
  User,
  LogOut,
  ChevronDown,
  Menu as MenuIcon,
  X,
  Shield,
  Play,
  FileText,
  UserCog,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useDarkMode } from "../context/DarkModeContext.jsx";

// This navbar used to be built from @material-tailwind/react (Navbar,
// Collapse, Typography, Button, IconButton, Avatar, Menu...). That library
// was the single biggest dependency in the bundle and it was pulled in on
// every page load for six components used on exactly one screen. Everything
// here is now plain Tailwind, which the project already had.
//
// Note the old markup also carried `blue-gray-*` classes -- that palette
// came from Material Tailwind's own Tailwind preset, which this project
// never enabled (tailwind.config.js has no withMT wrapper), so those classes
// silently produced no colour at all. They are ordinary grays now.

function initialsFor(nameOrEmail = "") {
  const base = nameOrEmail.split("@")[0];
  const parts = base.split(/[.\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Defined at module level, not inside NavBar. When this lived inside the
// component it was a brand-new component type on every render, so React threw
// away the DOM nodes and rebuilt them each time instead of updating them.
function LangDarkToggles({ lang, toggleLang, mode, toggleMode, className = "" }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={toggleLang}
        title="Switch language"
        aria-label="Switch language"
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/10"
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
        className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/10"
      >
        {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </button>
    </div>
  );
}

const linkBase =
  "relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150";
const linkActive = "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300";
const linkIdle =
  "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5";

export default function NavBar() {
  const [openNav, setOpenNav] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const { mode, toggleMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => window.innerWidth >= 1024 && setOpenNav(false);
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // The mobile menu used to stay open after tapping a link, covering the page
  // you had just navigated to.
  useEffect(() => {
    setOpenNav(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Behaviour the Material Tailwind <Menu> gave us for free and that a plain
  // dropdown has to do itself: close on Escape, and on a click outside.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (e) => e.key === "Escape" && setMenuOpen(false);
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [menuOpen]);

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const baseNavItems = [
    { to: "/", label: t.nav.home, icon: Home },
    { to: "/videos", label: t.nav.videos, icon: Play },
    { to: "/books", label: t.nav.books, icon: FileText },
    { to: "/about", label: t.nav.about, icon: Info },
  ];
  const navItems = user?.isAdmin
    ? [...baseNavItems, { to: "/admin", label: t.nav.admin, icon: Shield }]
    : baseNavItems;

  const avatarSrc = (email) =>
    user?.photoUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}&backgroundType=gradientLinear`;

  const navList = (
    <ul className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-1">
      {navItems.map(({ to, label, icon: Icon }) => {
        const active = isActive(to);
        return (
          <li key={to} className="list-none">
            <Link
              to={to}
              aria-current={active ? "page" : undefined}
              className={`${linkBase} ${active ? linkActive : linkIdle}`}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
              {active && (
                <span className="absolute -bottom-[13px] left-3 right-3 hidden h-0.5 bg-red-600 lg:block" />
              )}
            </Link>
          </li>
        );
      })}
      {user && (
        <li className="list-none lg:hidden">
          <Link
            to="/dashboard"
            aria-current={isActive("/dashboard") ? "page" : undefined}
            className={`${linkBase} ${isActive("/dashboard") ? linkActive : linkIdle}`}
          >
            <User size={17} strokeWidth={2} />
            {t.nav.dashboard}
          </Link>
        </li>
      )}
    </ul>
  );

  const menuItemClass =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/10";

  const userArea = user ? (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3 transition-colors hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
      >
        <img
          src={avatarSrc(user.email)}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover"
        />
        <span className="hidden text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100 xl:block">
          {initialsFor(user.name || user.email)}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
        />
      </button>

      {menuOpen && (
        <div
          role="menu"
          aria-label={t.nav.profile}
          className="absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-gray-900"
        >
          <p className="truncate px-3 pb-2 pt-1 text-sm text-gray-600 dark:text-gray-300">
            {user.email}
          </p>
          <hr className="my-1 border-gray-100 dark:border-white/10" />
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => navigate("/dashboard")}
          >
            <User size={16} /> {t.nav.dashboard}
          </button>
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => navigate("/profile")}
          >
            <UserCog size={16} /> {t.nav.profile}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <LogOut size={16} /> {t.nav.logout}
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5"
      >
        {t.nav.login}
      </button>
      <button
        type="button"
        onClick={() => navigate("/register")}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
      >
        {t.nav.getStarted}
      </button>
    </div>
  );

  return (
    <nav
      className={[
        "sticky top-0 z-50 border-b border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-950",
        "transition-shadow duration-200 sm:px-6",
        scrolled ? "shadow-sm" : "shadow-none",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight"
        >
          <img
            src="/logo.png"
            alt="eTnakRean logo"
            className="h-8 w-8 rounded-lg object-contain"
          />
          <span className="text-red-600 dark:text-red-400">eTnakRean</span>
        </Link>

        <div className="hidden lg:block">{navList}</div>

        <div className="hidden items-center gap-3 lg:flex">
          <LangDarkToggles
            lang={lang}
            toggleLang={toggleLang}
            mode={mode}
            toggleMode={toggleMode}
          />
          {userArea}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <LangDarkToggles
            lang={lang}
            toggleLang={toggleLang}
            mode={mode}
            toggleMode={toggleMode}
          />
          <button
            type="button"
            onClick={() => setOpenNav((v) => !v)}
            aria-label={openNav ? "Close menu" : "Open menu"}
            aria-expanded={openNav}
            aria-controls="mobile-nav"
            className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/10"
          >
            {openNav ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {/* `invisible` when closed is doing real work: max-height alone still
          leaves these links in the keyboard tab order, so a sighted keyboard
          user would tab into a menu they cannot see. visibility:hidden
          removes them from it. */}
      <div
        id="mobile-nav"
        className={`overflow-hidden transition-all duration-300 lg:hidden ${
          openNav ? "visible max-h-[80vh]" : "invisible max-h-0"
        }`}
      >
        <div className="mx-auto max-w-6xl pb-3 pt-2">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-gray-950">
            {navList}

            <hr className="my-3 border-gray-100 dark:border-white/10" />

            {user ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-white/5">
                  <img
                    src={avatarSrc(user.email)}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {user.name || initialsFor(user.email)}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/20 dark:text-gray-100 dark:hover:bg-white/5"
                  >
                    <UserCog size={16} /> {t.nav.profile}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <LogOut size={16} /> {t.nav.logout}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/20 dark:text-gray-100 dark:hover:bg-white/5"
                >
                  {t.nav.login}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  {t.nav.getStarted}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
