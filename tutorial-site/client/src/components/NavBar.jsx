import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Navbar,
  Collapse,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import {
  BookOpen,
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

function initialsFor(nameOrEmail = "") {
  const base = nameOrEmail.split("@")[0];
  const parts = base.split(/[.\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function NavBar() {
  const [openNav, setOpenNav] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { user, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const { mode, toggleMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const handleResize = () => window.innerWidth >= 960 && setOpenNav(false);
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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

  const LangDarkToggles = ({ className = "" }) => (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={toggleLang}
        title="Switch language"
        aria-label="Switch language"
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-black hover:bg-red-50/60 dark:text-gray-100 dark:hover:bg-white/10"
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
        className="rounded-lg p-2 text-black hover:bg-red-50/60 dark:text-gray-100 dark:hover:bg-white/10"
      >
        {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </button>
    </div>
  );

  const navList = (
    <ul className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-1">
      {navItems.map(({ to, label, icon: Icon }) => {
        const active = isActive(to);
        return (
          <Typography
            key={to}
            as="li"
            variant="small"
            className="font-medium list-none"
          >
            <Link
              to={to}
              className={[
                "relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors duration-200",
                active
                  ? "bg-red-50 text-black dark:bg-white/10 dark:text-white"
                  : "text-black hover:bg-red-50/60 hover:text-black dark:text-gray-100 dark:hover:bg-white/10",
              ].join(" ")}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
              {active && (
                <span className="absolute -bottom-[13px] left-3 right-3 hidden h-0.5 rounded-full bg-red-600 lg:block" />
              )}
            </Link>
          </Typography>
        );
      })}
      {user && (
        <Typography
          as="li"
          variant="small"
          className="font-medium list-none lg:hidden"
        >
          <Link
            to="/dashboard"
            className={[
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors duration-200",
              isActive("/dashboard")
                ? "bg-red-50 text-red-700 dark:bg-white/10 dark:text-white"
                : "text-blue-gray-600 hover:bg-red-50/60 hover:text-red-600 dark:text-gray-300 dark:hover:bg-white/10",
            ].join(" ")}
          >
            <User size={17} strokeWidth={2} />
            {t.nav.dashboard}
          </Link>
        </Typography>
      )}
    </ul>
  );

  const UserMenu = () =>
    user ? (
      <Menu placement="bottom-end">
        <MenuHandler>
          <button className="flex items-center gap-2 rounded-full border border-blue-gray-100 py-1 pl-1 pr-3 transition hover:border-red-200 hover:bg-red-50/60 dark:border-white/10 dark:hover:bg-white/10">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-white shadow dark:border-gray-800">
              <Avatar
                size="sm"
                className="h-full w-full object-cover"
                alt={user.email}
                src={avatarSrc(user.email)}
              />
            </div>
            <span className="hidden text-left leading-tight xl:block">
              <Typography
                variant="small"
                className="font-semibold text-black dark:text-gray-100"
              >
                {initialsFor(user.name || user.email)}
              </Typography>
            </span>
            <ChevronDown size={14} className="text-blue-gray-400" />
          </button>
        </MenuHandler>
        <MenuList className="min-w-[220px] p-2 dark:border-white/10 dark:bg-gray-900">
          <div className="flex items-center gap-2 px-2 pb-2 pt-1">
            <Typography
              variant="small"
              className="truncate text-blue-gray-700 dark:text-gray-300"
            >
              {user.email}
            </Typography>
          </div>
          <hr className="my-1 border-blue-gray-50 dark:border-white/10" />
          <MenuItem
            className="flex items-center gap-2 dark:text-gray-100 dark:hover:bg-white/10"
            onClick={() => navigate("/dashboard")}
          >
            <User size={16} /> {t.nav.dashboard}
          </MenuItem>
          <MenuItem
            className="flex items-center gap-2 dark:text-gray-100 dark:hover:bg-white/10"
            onClick={() => navigate("/profile")}
          >
            <UserCog size={16} /> {t.nav.profile}
          </MenuItem>
          <MenuItem
            className="flex items-center gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <LogOut size={16} /> {t.nav.logout}
          </MenuItem>
        </MenuList>
      </Menu>
    ) : (
      <div className="flex items-center gap-2">
        <Button
          variant="outlined"
          size="sm"
          className="border border-black text-black hover:bg-black hover:text-white transition-all duration-300 dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
          onClick={() => navigate("/login")}
        >
          {t.nav.login}
        </Button>
        <Button
          size="sm"
          className="bg-gradient-to-tr from-red-600 to-rose-500 shadow-md shadow-red-500/20"
          onClick={() => navigate("/register")}
        >
          {t.nav.getStarted}
        </Button>
      </div>
    );

  return (
    <Navbar
      fullWidth
      shadow={false}
      className={[
        "sticky top-0 z-50 rounded-none border-0 bg-black/5 px-4 py-2.5 dark:bg-gray-950/70",
        "backdrop-blur-lg backdrop-saturate-150 transition-shadow duration-300 sm:px-6",
        scrolled ? "shadow-md shadow-blue-gray-900/5" : "shadow-none",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-md shadow-red-500/30">
            <BookOpen size={18} />
          </span>
          <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
            ReanPhysics
          </span>
        </Link>

        <div className="hidden lg:block">{navList}</div>

        <div className="hidden items-center gap-3 lg:flex">
          <LangDarkToggles />
          <UserMenu />
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <LangDarkToggles />
          <IconButton
            variant="text"
            className="text-blue-gray-700 dark:text-gray-100"
            ripple={false}
            onClick={() => setOpenNav((v) => !v)}
          >
            {openNav ? <X size={22} /> : <MenuIcon size={22} />}
          </IconButton>
        </div>
      </div>

      <Collapse open={openNav} className="overflow-hidden lg:hidden">
        <div className="mx-auto max-w-6xl pb-3 pt-2">
          <div className="rounded-2xl border border-black/5 bg-white/95 p-3 shadow-lg shadow-black/5 backdrop-blur-lg backdrop-saturate-150 dark:border-white/10 dark:bg-gray-950/95">
            {navList}

            <hr className="my-3 border-blue-gray-50 dark:border-white/10" />

            {user ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-3 rounded-xl bg-blue-gray-50/60 px-3 py-2.5 dark:bg-white/5">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-gray-800">
                    <Avatar
                      size="sm"
                      alt={user.email}
                      src={avatarSrc(user.email)}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Typography
                      variant="small"
                      className="truncate font-semibold text-blue-gray-800 dark:text-gray-100"
                    >
                      {user.name || initialsFor(user.email)}
                    </Typography>
                    <Typography
                      variant="small"
                      className="truncate text-xs text-blue-gray-500 dark:text-gray-400"
                    >
                      {user.email}
                    </Typography>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    size="sm"
                    variant="outlined"
                    className="flex items-center justify-center gap-1.5 border-blue-gray-200 text-blue-gray-700 dark:border-white/20 dark:text-gray-100"
                    onClick={() => navigate("/profile")}
                  >
                    <UserCog size={16} /> {t.nav.profile}
                  </Button>
                  <Button
                    size="sm"
                    variant="outlined"
                    className="flex items-center justify-center gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                  >
                    <LogOut size={16} /> {t.nav.logout}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  size="sm"
                  variant="outlined"
                  className="dark:border-white/20 dark:text-gray-100"
                  onClick={() => navigate("/login")}
                >
                  {t.nav.login}
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-tr from-red-600 to-rose-500"
                  onClick={() => navigate("/register")}
                >
                  {t.nav.getStarted}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Collapse>
    </Navbar>
  );
}
