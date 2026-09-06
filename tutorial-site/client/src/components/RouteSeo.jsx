import { useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Seo from "./Seo.jsx";

// Metadata for the routes whose text never depends on loaded data. Pages
// that describe a specific video, book or document render their own <Seo>
// instead, so nothing here ever competes with them -- a path missing from
// this table renders nothing at all.
//
// Everything a signed-in person sees, and every screen reached by a
// single-use link (password reset, OTP), is noindex: those URLs carry
// tokens, and an indexed /dashboard would just be an empty page in Google's
// results.
const ROUTES = {
  "/about": (seo) => ({ ...seo.about }),
  "/login": (seo) => ({ ...seo.login, noindex: true }),
  "/register": (seo) => ({ ...seo.register, noindex: true }),
  "/forgot-password": (seo) => ({ ...seo.forgotPassword, noindex: true }),
  "/reset-password": (seo) => ({ ...seo.forgotPassword, noindex: true }),
  "/verify-otp": (seo) => ({ ...seo.register, noindex: true }),
  "/dashboard": (seo) => ({ ...seo.dashboard, noindex: true }),
  "/profile": (seo) => ({ ...seo.profile, noindex: true }),
  "/admin": (seo) => ({ ...seo.admin, noindex: true }),
};

export default function RouteSeo() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const build = ROUTES[pathname.replace(/\/+$/, "") || "/"];
  if (!build) return null;
  return <Seo {...build(t.seo)} />;
}
