import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  BookOpen,
  Check,
  Mail,
  MapPin,
  Phone,
  PlayCircle,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { api } from "../api/client.js";
import FileOrUrlField from "../components/FileOrUrlField.jsx";

// Shared input styling. Pulled out so the four fields can't drift apart the
// way they had started to -- and so the focus ring is defined in exactly one
// place (it was missing entirely before, which made keyboard navigation on
// this form nearly invisible).
const FIELD_CLASS =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-red-500";

/** One labelled field in the edit form, with its icon sitting in the label. */
function Field({ icon: Icon, label, hint, children }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Icon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
    </label>
  );
}

/** A single number + caption tile in the identity card's stat row. */
function Stat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2.5 text-center dark:border-gray-800 dark:bg-white/5">
      <Icon className="mx-auto h-4 w-4 text-red-600 dark:text-red-400" />
      <p className="mt-1 text-lg font-bold leading-none text-gray-900 dark:text-gray-100">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function Badge({ icon: Icon, children, tone = "gray" }) {
  const tones = {
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    green:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300",
    gray: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}
    >
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    photoUrl: user?.photoUrl || "",
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      await api.updateProfile(form);
      await refreshUser();
      setStatus("saved");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  if (!user) {
    return (
      <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">{t.profile.loading}</div>
    );
  }

  const videoCount = user.purchasedVideos?.length || 0;
  const bookCount = user.purchasedBooks?.length || 0;
  const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {t.profile.title}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t.profile.subtitle}</p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        {/* Identity card. Sticks to the top on wide screens so the person
            always sees who they're editing while they scroll the form. */}
        <aside className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900/40 lg:sticky lg:top-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-red-500/10 blur-3xl dark:bg-red-500/15"
          />

          <div className="relative">
            <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg shadow-gray-900/10 ring-1 ring-gray-200 dark:border-gray-900 dark:bg-gray-800 dark:ring-gray-700">
              <img
                src={form.photoUrl || fallbackAvatar}
                alt=""
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = fallbackAvatar;
                }}
                className="h-full w-full object-cover"
              />
            </div>

            <h2 className="mt-4 truncate text-lg font-bold text-gray-900 dark:text-gray-100">
              {user.name || t.profile.nameLabel}
            </h2>
            <p className="mt-0.5 break-all text-sm text-gray-500 dark:text-gray-400">{user.email}</p>

            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {user.isAdmin && (
                <Badge icon={ShieldCheck} tone="red">
                  {t.profile.adminBadge}
                </Badge>
              )}
              {user.isVerified && (
                <Badge icon={BadgeCheck} tone="green">
                  {t.profile.verifiedBadge}
                </Badge>
              )}
              {user.authProvider === "google" && <Badge icon={Mail}>{t.profile.googleBadge}</Badge>}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Stat icon={PlayCircle} value={videoCount} label={t.profile.videosOwned} />
              <Stat icon={BookOpen} value={bookCount} label={t.profile.booksOwned} />
            </div>

            <Link
              to="/dashboard"
              className="mt-4 inline-block text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              {t.profile.viewLibrary} →
            </Link>
          </div>
        </aside>

        {/* Edit form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/40 sm:p-8"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.profile.detailsHeading}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t.profile.detailsSubtitle}</p>

          <div className="mt-6 grid gap-5">
            <Field icon={UserIcon} label={t.profile.nameLabel}>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={FIELD_CLASS}
              />
            </Field>

            <Field icon={Mail} label={t.profile.emailLabel} hint={t.profile.emailLocked}>
              <input
                value={user.email}
                readOnly
                disabled
                className={`${FIELD_CLASS} cursor-not-allowed bg-gray-50 text-gray-500 dark:bg-gray-900/60 dark:text-gray-400`}
              />
            </Field>

            <div className="block">
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                <UserIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                {t.profile.photoLabel}
              </span>
              <div className="mt-1.5">
                <FileOrUrlField
                  value={form.photoUrl}
                  onChange={(url) => setForm({ ...form, photoUrl: url })}
                  accept="image/*"
                  placeholder={t.profile.photoPlaceholder}
                  uploadFn={api.uploadAvatar}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field icon={Phone} label={t.profile.phoneLabel}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={FIELD_CLASS}
                />
              </Field>

              <Field icon={MapPin} label={t.profile.addressLabel}>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={`${FIELD_CLASS} resize-y`}
                />
              </Field>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
            <button
              type="submit"
              disabled={status === "saving"}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 disabled:opacity-60"
            >
              {status === "saving" ? t.profile.saving : t.profile.saveChanges}
            </button>

            {status === "saved" && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400"
              >
                <Check className="h-4 w-4" />
                {t.profile.saved}
              </span>
            )}
            {error && (
              <span role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
