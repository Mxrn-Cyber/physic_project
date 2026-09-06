import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  BookOpen,
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users as UsersIcon,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import FileOrUrlField from "../components/FileOrUrlField.jsx";
import { GRADES, matchesQuery } from "../utils/grades.js";

/* ------------------------------------------------------------------ *
 * Shared styling
 *
 * Every input on this page used to repeat the same nine Tailwind classes,
 * which is how they had started to drift (some had a dark background, some
 * didn't). One constant instead, plus a focus ring that was missing before.
 * ------------------------------------------------------------------ */
const INPUT_CLASS =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";

const PRIMARY_BTN =
  "inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700 disabled:opacity-50";

const GHOST_BTN =
  "inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800";

const FORM_CARD =
  "grid gap-4 rounded-2xl border border-red-200 bg-red-50/40 p-5 dark:border-red-500/30 dark:bg-red-500/5 sm:grid-cols-2";

/** Small round icon button used for the row actions (edit / delete / admin). */
function IconButton({ tone = "gray", ...props }) {
  const tones = {
    gray: "text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200",
    red: "text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-500/15 dark:hover:text-red-300",
  };
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    />
  );
}

function Pill({ tone = "gray", children }) {
  const tones = {
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    green:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    gray: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * The card each section lives in: title row with icon and count, an optional
 * "Add" button, a search box, then the caller's rows.
 */
function SectionCard({ icon: Icon, title, description, count, actionLabel, onAction, actionHidden, search, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/40">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 p-5 dark:border-gray-800 sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/20">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
              {title}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
                {count}
              </span>
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>

        {!actionHidden && (
          <button type="button" onClick={onAction} className={PRIMARY_BTN}>
            <Plus className="h-4 w-4" /> {actionLabel}
          </button>
        )}
      </header>

      <div className="p-5 sm:p-6">
        {search}
        {children}
      </div>
    </section>
  );
}

/** Client-side filter box. Purely cosmetic -- it never touches the API. */
function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative mb-4">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT_CLASS} pl-9 pr-9`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <p className="rounded-xl border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
      {children}
    </p>
  );
}

function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {children}
    </p>
  );
}

function LoadingNote() {
  return <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</p>;
}

/* ------------------------------------------------------------------ *
 * Users
 * ------------------------------------------------------------------ */

const emptyUser = { name: "", email: "", password: "", isAdmin: false };

function UserForm({ onSave, onCancel }) {
  const [form, setForm] = useState(emptyUser);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className={FORM_CARD}
    >
      <input
        required
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className={INPUT_CLASS}
      />
      <input
        required
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className={INPUT_CLASS}
      />
      <div className="sm:col-span-2">
        <input
          required
          type="password"
          minLength={8}
          placeholder="Temporary password (min 8 chars)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className={INPUT_CLASS}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
        <input
          type="checkbox"
          className="h-4 w-4 accent-red-600"
          checked={form.isAdmin}
          onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })}
        />
        Grant admin access
      </label>

      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button type="submit" className={PRIMARY_BTN}>
          Create user
        </button>
        <button type="button" onClick={onCancel} className={GHOST_BTN}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function initialsOf(name, email) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

function UserRow({ user, isSelf, onToggleAdmin, onDelete }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3 transition hover:border-gray-300 dark:border-gray-800 dark:bg-white/5 dark:hover:border-gray-700">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-100 text-xs font-bold text-red-700 dark:bg-red-500/15 dark:text-red-300">
        {user.photoUrl ? (
          <img src={user.photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          initialsOf(user.name, user.email)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
          <span className="truncate">{user.name}</span>
          {user.isAdmin && <Pill tone="red">admin</Pill>}
          {isSelf && <Pill>you</Pill>}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
      </div>

      <div className="flex shrink-0 gap-1">
        <IconButton
          onClick={onToggleAdmin}
          disabled={isSelf && user.isAdmin}
          aria-label={user.isAdmin ? "Remove admin" : "Make admin"}
          title={user.isAdmin ? "Remove admin access" : "Grant admin access"}
        >
          {user.isAdmin ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
        </IconButton>
        <IconButton tone="red" onClick={onDelete} disabled={isSelf} aria-label="Delete user" title="Delete user">
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}

function UsersSection({ onCount }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = () =>
    api
      .getUsers()
      .then(({ users }) => setUsers(users))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    onCount("users", users.length);
  }, [users.length, onCount]);

  const create = async (form) => {
    try {
      await api.createUser(form);
      setAdding(false);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const toggleAdmin = async (u) => {
    try {
      await api.setUserAdmin(u.id, !u.isAdmin);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (u) => {
    if (!confirm(`Delete account "${u.email}"? This can't be undone.`)) return;
    try {
      await api.deleteUser(u.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q));
  }, [users, query]);

  return (
    <SectionCard
      icon={UsersIcon}
      title="Users"
      description="Accounts that can sign in, and who has admin access."
      count={users.length}
      actionLabel="Add user"
      onAction={() => setAdding(true)}
      actionHidden={adding}
      search={users.length > 0 && <SearchBox value={query} onChange={setQuery} placeholder="Search by name or email…" />}
    >
      <ErrorNote>{error}</ErrorNote>

      {adding && (
        <div className="mb-4">
          <UserForm onSave={create} onCancel={() => setAdding(false)} />
        </div>
      )}

      {loading && <LoadingNote />}

      <div className="space-y-2">
        {shown.map((u) => (
          <UserRow
            key={u.id}
            user={u}
            isSelf={currentUser?.id === u.id}
            onToggleAdmin={() => toggleAdmin(u)}
            onDelete={() => remove(u)}
          />
        ))}
      </div>

      {!loading && users.length === 0 && <EmptyState>No users yet.</EmptyState>}
      {!loading && users.length > 0 && shown.length === 0 && (
        <EmptyState>No user matches “{query}”.</EmptyState>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ *
 * Shared video/book form pieces
 * ------------------------------------------------------------------ */

const emptyVideo = {
  title: "",
  description: "",
  grades: [],
  order: 0,
  durationSeconds: 0,
  videoUrl: "",
  thumbnailUrl: "",
  isFree: false,
  price: 0,
  freeUntil: null,
  previewSeconds: 0,
  isTopSeller: false,
  isMedium: false,
  discountPercent: 0,
};

const emptyBook = {
  title: "",
  description: "",
  grades: [],
  order: 0,
  pageCount: 0,
  coverImageUrl: "",
  pdfUrl: "",
  isFree: false,
  price: 0,
  freeUntil: null,
  previewPages: 0,
  isTopSeller: false,
  isMedium: false,
  discountPercent: 0,
};

function accessModeOf(form) {
  if (form.isFree) return "free";
  if (form.freeUntil) return "trial";
  return "paid";
}

function AccessFields({ form, setForm, previewField = "previewSeconds" }) {
  const mode = accessModeOf(form);
  const isPageBased = previewField === "previewPages";
  // Unique per mounted form: all three sections stay mounted now, so a
  // shared radio-group name would let an open book form steal the
  // selection from an open video form.
  const groupName = `accessMode-${useId()}`;

  function setMode(nextMode) {
    if (nextMode === "free") {
      setForm({ ...form, isFree: true, freeUntil: null });
    } else if (nextMode === "trial") {
      const untilDate = new Date();
      untilDate.setMonth(untilDate.getMonth() + 1);
      setForm({ ...form, isFree: false, freeUntil: untilDate.toISOString() });
    } else {
      setForm({ ...form, isFree: false, freeUntil: null });
    }
  }

  const MODES = [
    { key: "free", label: "Free" },
    { key: "trial", label: "Free for 1 month" },
    { key: "paid", label: "Paid" },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/50 sm:col-span-2">
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Access</p>
        {/* Segmented control -- same three radio inputs as before, just
            styled as buttons so the selected mode is obvious at a glance. */}
        <div className="mt-2 inline-flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {MODES.map((m) => (
            <label
              key={m.key}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                mode === m.key
                  ? "bg-white text-red-700 shadow-sm dark:bg-gray-900 dark:text-red-300"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <input
                type="radio"
                name={groupName}
                className="sr-only"
                checked={mode === m.key}
                onChange={() => setMode(m.key)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>

      {mode !== "free" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Price {mode === "trial" && "(charged once the free month ends)"}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className={`${INPUT_CLASS} mt-1.5 max-w-xs`}
          />
        </div>
      )}

      {mode === "paid" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {isPageBased
              ? "Preview pages before requiring purchase (0 = no preview)"
              : "Preview length before requiring purchase (seconds, 0 = no preview)"}
          </label>
          <input
            type="number"
            min="0"
            value={form[previewField]}
            onChange={(e) => setForm({ ...form, [previewField]: Number(e.target.value) })}
            className={`${INPUT_CLASS} mt-1.5 max-w-xs`}
          />
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {isPageBased
              ? "Non-buyers can read this many pages from the start of the PDF before being asked to pay. We generate that trimmed sample automatically — the rest of the file is never sent to them."
              : "Non-buyers can watch for this many seconds before being asked to pay."}{" "}
            Not shown for Free or Free-for-1-month items since they're already fully viewable.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-5 border-t border-gray-200 pt-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-red-600"
            checked={form.isTopSeller}
            onChange={(e) => setForm({ ...form, isTopSeller: e.target.checked })}
          />
          Top seller
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-red-600"
            checked={form.isMedium}
            onChange={(e) => setForm({ ...form, isMedium: e.target.checked })}
          />
          Popular / medium
        </label>
      </div>
    </div>
  );
}

function GradeField({ form, setForm, hint }) {
  const selected = form.grades || [];

  const toggle = (grade) => {
    const next = selected.includes(grade)
      ? selected.filter((g) => g !== grade)
      : [...selected, grade];
    setForm({ ...form, grades: GRADES.filter((g) => next.includes(g)) });
  };

  return (
    <div className="sm:col-span-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Grade</label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {GRADES.map((grade) => {
          const active = selected.includes(grade);
          return (
            <label
              key={grade}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "border-red-600 bg-red-600 text-white shadow-sm shadow-red-600/20"
                  : "border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-700 dark:border-gray-700 dark:text-gray-300 dark:hover:border-red-500 dark:hover:text-red-300"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={active}
                onChange={() => toggle(grade)}
              />
              Grade {grade}
            </label>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
    </div>
  );
}

function LabeledNumberField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${INPUT_CLASS} mt-1.5`}
      />
    </div>
  );
}

function priceLabel(item) {
  if (item.isFree) return "free";
  if (item.freeUntil && new Date(item.freeUntil) > new Date()) {
    return `free until ${new Date(item.freeUntil).toLocaleDateString()}`;
  }
  return `$${item.price}`;
}

function priceTone(item) {
  if (item.isFree) return "green";
  if (item.freeUntil && new Date(item.freeUntil) > new Date()) return "amber";
  return "gray";
}

/* ------------------------------------------------------------------ *
 * Videos
 * ------------------------------------------------------------------ */

function VideoForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyVideo);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className={FORM_CARD}
    >
      <div className="sm:col-span-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={`${INPUT_CLASS} mt-1.5`}
        />
      </div>
      <div className="sm:col-span-2">
        <FileOrUrlField
          label="Video"
          value={form.videoUrl}
          onChange={(url) => setForm({ ...form, videoUrl: url })}
          accept="video/*"
          placeholder="Video URL (YouTube, Vimeo, or direct .mp4 link)"
          onDurationDetected={(seconds) => setForm((f) => ({ ...f, durationSeconds: seconds }))}
        />
      </div>
      <div className="sm:col-span-2">
        <FileOrUrlField
          label="Thumbnail (optional)"
          value={form.thumbnailUrl}
          onChange={(url) => setForm({ ...form, thumbnailUrl: url })}
          accept="image/*"
          placeholder="Thumbnail image URL"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Leave blank for a YouTube link and we'll pull its thumbnail automatically.
        </p>
      </div>
      <div className="sm:col-span-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
        <textarea
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={`${INPUT_CLASS} mt-1.5`}
          rows={2}
        />
      </div>

      <GradeField
        form={form}
        setForm={setForm}
        hint="Tick every grade this video suits. Students use these to filter the video list. Leave all unticked if it is not tied to a grade."
      />

      <AccessFields form={form} setForm={setForm} />

      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button type="submit" disabled={!form.videoUrl} className={PRIMARY_BTN}>
          Save video
        </button>
        <button type="button" onClick={onCancel} className={GHOST_BTN}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ *
 * Books
 * ------------------------------------------------------------------ */

function BookForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyBook);
  const [coverStatus, setCoverStatus] = useState("");
  const [coverError, setCoverError] = useState("");

  // Generates a cover from page 1 of the given PDF URL. By default it only
  // fills in coverImageUrl if it's still blank (so a pasted/uploaded PDF
  // doesn't clobber a cover the admin already picked); pass force:true for
  // the explicit "use the PDF's first page" button, which always overwrites.
  async function generateCoverFrom(pdfUrl, { force = false } = {}) {
    if (!pdfUrl) return;
    setCoverStatus("generating");
    setCoverError("");
    try {
      const { coverUrl } = await api.generateBookCover(pdfUrl);
      setForm((f) => (force || !f.coverImageUrl ? { ...f, coverImageUrl: coverUrl } : f));
    } catch (err) {
      setCoverError(err.message);
    } finally {
      setCoverStatus("");
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className={FORM_CARD}
    >
      <div className="sm:col-span-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={`${INPUT_CLASS} mt-1.5`}
        />
      </div>
      <div className="sm:col-span-2">
        <FileOrUrlField
          label="PDF"
          value={form.pdfUrl}
          onChange={(url) => setForm({ ...form, pdfUrl: url })}
          accept="application/pdf"
          placeholder="PDF URL (Google Drive share link, or any direct PDF link)"
          // Direct uploads: the server already renders page 1 and returns
          // it as coverUrl in the same response, so no extra request.
          onUploadMeta={(data) => {
            if (data.coverUrl) {
              setForm((f) => (f.coverImageUrl ? f : { ...f, coverImageUrl: data.coverUrl }));
            }
          }}
          // Pasted URL (e.g. Google Drive link): fetch it server-side and
          // render page 1 the same way.
          onUrlBlur={(url) => generateCoverFrom(url)}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cover image</label>
        <div className="mt-1.5 flex items-start gap-3">
          {form.coverImageUrl ? (
            <img
              src={form.coverImageUrl}
              alt="Cover preview"
              className="h-28 w-20 flex-shrink-0 rounded-lg border border-gray-200 object-cover shadow-sm dark:border-gray-700"
            />
          ) : (
            <div className="flex h-28 w-20 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-center text-[10px] text-gray-400 dark:border-gray-700 dark:text-gray-600">
              <ImageIcon className="h-4 w-4" />
              No cover
            </div>
          )}
          <div className="flex-1 space-y-2">
            <input
              type="url"
              placeholder="Cover image URL (auto-filled from the PDF's first page, or set your own)"
              value={form.coverImageUrl}
              onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
              className={INPUT_CLASS}
            />
            <button
              type="button"
              onClick={() => generateCoverFrom(form.pdfUrl, { force: true })}
              disabled={!form.pdfUrl || coverStatus === "generating"}
              className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-400 dark:disabled:text-gray-600"
            >
              {coverStatus === "generating" ? "Generating…" : "Use the PDF's first page as the cover"}
            </button>
            {coverError && <p className="text-xs text-red-600">{coverError}</p>}
          </div>
        </div>
      </div>
      <div className="sm:col-span-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
        <textarea
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={`${INPUT_CLASS} mt-1.5`}
          rows={2}
        />
      </div>
      <LabeledNumberField
        label="Number of pages — shown to readers"
        value={form.pageCount}
        onChange={(v) => setForm({ ...form, pageCount: v })}
      />
      <LabeledNumberField
        label="Order (lower numbers show first in the list)"
        value={form.order}
        onChange={(v) => setForm({ ...form, order: v })}
      />

      <GradeField
        form={form}
        setForm={setForm}
        hint="Tick every grade this book suits. Students use these to filter the book list. Leave all unticked if it is not tied to a grade."
      />

      <AccessFields form={form} setForm={setForm} previewField="previewPages" />

      <p className="rounded-xl bg-white/70 p-3 text-xs text-gray-500 dark:bg-gray-900/50 dark:text-gray-400 sm:col-span-2">
        Tip: in Google Drive, right-click the PDF → Share → set to "Anyone
        with the link", then paste that link here. It'll show as an
        embedded reader on the site, and if you set a page-limited preview
        above, non-buyers only ever get a PDF trimmed to that many pages.
      </p>

      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button type="submit" disabled={!form.pdfUrl} className={PRIMARY_BTN}>
          Save book
        </button>
        <button type="button" onClick={onCancel} className={GHOST_BTN}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ *
 * Content rows (videos + books share one row component)
 * ------------------------------------------------------------------ */

function ItemRow({ item, kindLabel, media, meta, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3 transition hover:border-gray-300 dark:border-gray-800 dark:bg-white/5 dark:hover:border-gray-700">
      {media}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Pill tone={priceTone(item)}>{priceLabel(item)}</Pill>
          {item.isTopSeller && <Pill tone="red">top seller</Pill>}
          {item.isMedium && <Pill tone="amber">popular</Pill>}
          {(item.grades || []).map((g) => (
            <Pill key={g}>Grade {g}</Pill>
          ))}
          {meta}
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        <IconButton onClick={onEdit} aria-label={`Edit ${kindLabel}`} title={`Edit ${kindLabel}`}>
          <Pencil className="h-4 w-4" />
        </IconButton>
        <IconButton tone="red" onClick={onDelete} aria-label={`Delete ${kindLabel}`} title={`Delete ${kindLabel}`}>
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}

function Thumb({ src, alt, className, fallbackIcon: Icon }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700 ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400 dark:border-gray-700 dark:text-gray-600 ${className}`}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

function VideosSection({ onCount }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = () =>
    api
      .getAdminVideos()
      .then(({ videos }) => setVideos(videos))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    onCount("videos", videos.length);
  }, [videos.length, onCount]);

  const save = async (form, id) => {
    try {
      if (id) await api.updateVideo(id, form);
      else await api.createVideo(form);
      setAdding(false);
      setEditingId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await api.deleteVideo(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const shown = useMemo(() => videos.filter((v) => matchesQuery(v, query)), [videos, query]);

  return (
    <SectionCard
      icon={VideoIcon}
      title="Videos"
      description="Each video is sold on its own, with its own price."
      count={videos.length}
      actionLabel="Add video"
      onAction={() => setAdding(true)}
      actionHidden={adding}
      search={videos.length > 0 && <SearchBox value={query} onChange={setQuery} placeholder="Search videos by title, description, or grade…" />}
    >
      <ErrorNote>{error}</ErrorNote>

      {adding && (
        <div className="mb-4">
          <VideoForm onSave={(form) => save(form)} onCancel={() => setAdding(false)} />
        </div>
      )}

      {loading && <LoadingNote />}

      <div className="space-y-2">
        {shown.map((v) =>
          editingId === v._id ? (
            <VideoForm
              key={v._id}
              initial={v}
              onSave={(form) => save(form, v._id)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <ItemRow
              key={v._id}
              item={v}
              kindLabel="video"
              media={
                <Thumb
                  src={v.thumbnailUrl}
                  alt=""
                  className="h-12 w-20"
                  fallbackIcon={VideoIcon}
                />
              }
              onEdit={() => setEditingId(v._id)}
              onDelete={() => remove(v._id, v.title)}
            />
          )
        )}
      </div>

      {!loading && videos.length === 0 && <EmptyState>No videos yet.</EmptyState>}
      {!loading && videos.length > 0 && shown.length === 0 && (
        <EmptyState>No video matches “{query}”.</EmptyState>
      )}
    </SectionCard>
  );
}

function BooksSection({ onCount }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = () =>
    api
      .getAdminBooks()
      .then(({ books }) => setBooks(books))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    onCount("books", books.length);
  }, [books.length, onCount]);

  const save = async (form, id) => {
    try {
      if (id) await api.updateBook(id, form);
      else await api.createBook(form);
      setAdding(false);
      setEditingId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await api.deleteBook(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const shown = useMemo(() => books.filter((b) => matchesQuery(b, query)), [books, query]);

  return (
    <SectionCard
      icon={BookOpen}
      title="Books"
      description="PDF guides, each sold on its own with its own price."
      count={books.length}
      actionLabel="Add book"
      onAction={() => setAdding(true)}
      actionHidden={adding}
      search={books.length > 0 && <SearchBox value={query} onChange={setQuery} placeholder="Search books by title, description, or grade…" />}
    >
      <ErrorNote>{error}</ErrorNote>

      {adding && (
        <div className="mb-4">
          <BookForm onSave={(form) => save(form)} onCancel={() => setAdding(false)} />
        </div>
      )}

      {loading && <LoadingNote />}

      <div className="space-y-2">
        {shown.map((b) =>
          editingId === b._id ? (
            <BookForm
              key={b._id}
              initial={b}
              onSave={(form) => save(form, b._id)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <ItemRow
              key={b._id}
              item={b}
              kindLabel="book"
              media={
                <Thumb src={b.coverImageUrl} alt="" className="h-14 w-10" fallbackIcon={BookOpen} />
              }
              meta={b.pageCount ? <Pill>{b.pageCount} pages</Pill> : null}
              onEdit={() => setEditingId(b._id)}
              onDelete={() => remove(b._id, b.title)}
            />
          )
        )}
      </div>

      {!loading && books.length === 0 && <EmptyState>No books yet.</EmptyState>}
      {!loading && books.length > 0 && shown.length === 0 && (
        <EmptyState>No book matches “{query}”.</EmptyState>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ *
 * Page shell
 * ------------------------------------------------------------------ */

const NAV = [
  { key: "users", label: "Users", icon: UsersIcon },
  { key: "videos", label: "Videos", icon: VideoIcon },
  { key: "books", label: "Books", icon: BookOpen },
];

export default function Admin() {
  const { user } = useAuth();
  const [active, setActive] = useState("users");
  const [counts, setCounts] = useState({});

  // Sections report their own row count up so the sidebar can show it.
  // Kept stable with useCallback because each section calls it from an
  // effect -- an inline arrow here would re-fire that effect every render.
  const report = useCallback((key, n) => {
    setCounts((prev) => (prev[key] === n ? prev : { ...prev, [key]: n }));
  }, []);

  if (!user?.isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin access required</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your account doesn't have admin access. Ask an existing admin to
          flip <code>isAdmin</code> on your user, or use the account created
          by the seed script.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/40 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-red-500/10 blur-3xl dark:bg-red-500/15"
        />
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Manage content
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Videos and books are sold independently, each with its own price.
          </p>
        </div>
      </header>

      <div className="mt-6 gap-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        {/* Sidebar on wide screens; a horizontal, scrollable pill row on
            phones, where a 15rem column would eat the whole viewport. */}
        <nav
          aria-label="Admin sections"
          className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:mb-0 lg:flex-col lg:overflow-visible lg:rounded-2xl lg:border lg:border-gray-200 lg:bg-white lg:p-2 lg:pb-2 lg:dark:border-gray-800 lg:dark:bg-gray-900/40"
        >
          {NAV.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                aria-current={isActive ? "true" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition lg:w-full lg:border-transparent ${
                  isActive
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="lg:flex-1 lg:text-left">{label}</span>
                {counts[key] !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      isActive
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                    }`}
                  >
                    {counts[key]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* All three stay mounted and only visibility changes: switching
            sections mustn't throw away a half-filled add/edit form, and it
            keeps the sidebar counts populated without three extra fetches. */}
        <div className="min-w-0">
          <div className={active === "users" ? "" : "hidden"}>
            <UsersSection onCount={report} />
          </div>
          <div className={active === "videos" ? "" : "hidden"}>
            <VideosSection onCount={report} />
          </div>
          <div className={active === "books" ? "" : "hidden"}>
            <BooksSection onCount={report} />
          </div>
        </div>
      </div>
    </div>
  );
}
