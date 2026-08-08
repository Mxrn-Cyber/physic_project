import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import FileOrUrlField from "../components/FileOrUrlField.jsx";

const emptyUser = { name: "", email: "", password: "", isAdmin: false };

function UserForm({ onSave, onCancel }) {
  const [form, setForm] = useState(emptyUser);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60 sm:grid-cols-2"
    >
      <input
        required
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      <input
        required
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      <input
        required
        type="password"
        minLength={8}
        placeholder="Temporary password (min 8 chars)"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:col-span-2"
      />
      <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
        <input
          type="checkbox"
          checked={form.isAdmin}
          onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })}
        />
        Grant admin access
      </label>

      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Create user
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function UsersSection() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    api
      .getUsers()
      .then(({ users }) => setUsers(users))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Users</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" /> Add user
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading…</p>}

      {adding && (
        <div className="mt-3">
          <UserForm onSave={create} onCancel={() => setAdding(false)} />
        </div>
      )}

      <div className="mt-3 space-y-2">
        {users.map((u) => {
          const isSelf = currentUser?.id === u.id;
          return (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800/60"
            >
              <span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{u.name}</span>{" "}
                <span className="text-gray-500 dark:text-gray-400">({u.email})</span>{" "}
                {u.isAdmin && (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    admin
                  </span>
                )}
                {isSelf && (
                  <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">(you)</span>
                )}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleAdmin(u)}
                  disabled={isSelf && u.isAdmin}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700"
                  aria-label={u.isAdmin ? "Remove admin" : "Make admin"}
                  title={u.isAdmin ? "Remove admin access" : "Grant admin access"}
                >
                  {u.isAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => remove(u)}
                  disabled={isSelf}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Delete user"
                  title="Delete user"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {!loading && users.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No users yet.</p>
        )}
      </div>
    </div>
  );
}

const emptyVideo = {
  title: "",
  description: "",
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

// Simplified 3-way choice: Free (always free), Free for 1 month (free
// until 30 days from whenever this is saved, then falls back to the
// price below), or Paid (price required, must be purchased to view).
function accessModeOf(form) {
  if (form.isFree) return "free";
  if (form.freeUntil) return "trial";
  return "paid";
}

// previewField picks which field this item type uses for its "let
// non-buyers sample it first" setting: videos use a time window
// (previewSeconds), books use a page count (previewPages) so the trimmed
// PDF served by the server (see api.getBookPreviewPdfUrl) has a matching
// admin control.
function AccessFields({ form, setForm, previewField = "previewSeconds" }) {
  const mode = accessModeOf(form);
  const isPageBased = previewField === "previewPages";

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

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
        <label className="flex items-center gap-1.5">
          <input type="radio" name="accessMode" checked={mode === "free"} onChange={() => setMode("free")} />
          Free
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" name="accessMode" checked={mode === "trial"} onChange={() => setMode("trial")} />
          Free for 1 month
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" name="accessMode" checked={mode === "paid"} onChange={() => setMode("paid")} />
          Paid
        </label>
      </div>

      {mode !== "free" && (
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Price {mode === "trial" && "(charged once the free month ends)"}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="mt-1 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
      )}

      {mode === "paid" && (
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isPageBased
              ? "Preview pages before requiring purchase (0 = no preview)"
              : "Preview length before requiring purchase (seconds, 0 = no preview)"}
          </label>
          <input
            type="number"
            min="0"
            value={form[previewField]}
            onChange={(e) => setForm({ ...form, [previewField]: Number(e.target.value) })}
            className="mt-1 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {isPageBased
              ? "Non-buyers can read this many pages from the start of the PDF before being asked to pay. We generate that trimmed sample automatically — the rest of the file is never sent to them."
              : "Non-buyers can watch for this many seconds before being asked to pay."}{" "}
            Not shown for Free or Free-for-1-month items since they're already fully viewable.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={form.isTopSeller}
            onChange={(e) => setForm({ ...form, isTopSeller: e.target.checked })}
          />
          Top seller
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={form.isMedium}
            onChange={(e) => setForm({ ...form, isMedium: e.target.checked })}
          />
          Popular / medium
        </label>
      </div>
    </div>
  );
}

// A number input with a permanent visible label above it, instead of a
// placeholder that disappears once you type a value (which made fields
// like "Order" impossible to tell apart once filled in).
function LabeledNumberField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
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

function VideoForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyVideo);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60 sm:grid-cols-2"
    >
      <input
        required
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:col-span-2"
      />
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
      <textarea
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:col-span-2"
        rows={2}
      />

      <AccessFields form={form} setForm={setForm} />

      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={!form.videoUrl}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          Save video
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function BookForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyBook);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60 sm:grid-cols-2"
    >
      <input
        required
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:col-span-2"
      />
      <div className="sm:col-span-2">
        <FileOrUrlField
          label="PDF"
          value={form.pdfUrl}
          onChange={(url) => setForm({ ...form, pdfUrl: url })}
          accept="application/pdf"
          placeholder="PDF URL (Google Drive share link, or any direct PDF link)"
        />
      </div>
      <input
        type="url"
        placeholder="Cover image URL (optional)"
        value={form.coverImageUrl}
        onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:col-span-2"
      />
      <textarea
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:col-span-2"
        rows={2}
      />
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

      <AccessFields form={form} setForm={setForm} previewField="previewPages" />

      <p className="text-xs text-gray-500 dark:text-gray-400 sm:col-span-2">
        Tip: in Google Drive, right-click the PDF → Share → set to "Anyone
        with the link", then paste that link here. It'll show as an
        embedded reader on the site, and if you set a page-limited preview
        above, non-buyers only ever get a PDF trimmed to that many pages.
      </p>

      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={!form.pdfUrl}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          Save book
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ItemRow({ item, kindLabel, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800/60">
      <span>
        <span className="font-medium text-gray-900 dark:text-gray-100">{item.title}</span>{" "}
        <span className="text-gray-500 dark:text-gray-400">
          ({priceLabel(item)})
        </span>
      </span>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label={`Edit ${kindLabel}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1.5 text-red-500 hover:bg-red-100"
          aria-label={`Delete ${kindLabel}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function VideosSection() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .getAdminVideos()
      .then(({ videos }) => setVideos(videos))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Videos</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" /> Add video
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading…</p>}

      {adding && (
        <div className="mt-3">
          <VideoForm onSave={(form) => save(form)} onCancel={() => setAdding(false)} />
        </div>
      )}

      <div className="mt-3 space-y-2">
        {videos.map((v) =>
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
              onEdit={() => setEditingId(v._id)}
              onDelete={() => remove(v._id, v.title)}
            />
          )
        )}
        {!loading && videos.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No videos yet.</p>
        )}
      </div>
    </div>
  );
}

function BooksSection() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = () =>
    api
      .getAdminBooks()
      .then(({ books }) => setBooks(books))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Books</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" /> Add book
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading…</p>}

      {adding && (
        <div className="mt-3">
          <BookForm onSave={(form) => save(form)} onCancel={() => setAdding(false)} />
        </div>
      )}

      <div className="mt-3 space-y-2">
        {books.map((b) =>
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
              onEdit={() => setEditingId(b._id)}
              onDelete={() => remove(b._id, b.title)}
            />
          )
        )}
        {!loading && books.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No books yet.</p>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();

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
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage content</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Videos and books are sold independently, each with its own price.
      </p>

      <div className="mt-8 space-y-10">
        <UsersSection />
        <VideosSection />
        <BooksSection />
      </div>
    </div>
  );
}
