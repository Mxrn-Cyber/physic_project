import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import FileOrUrlField from "../components/FileOrUrlField.jsx";

const emptyVideo = {
  title: "",
  description: "",
  order: 0,
  durationSeconds: 0,
  videoUrl: "",
  thumbnailUrl: "",
  isFree: false,
  price: 0,
  isTopSeller: false,
  isMedium: false,
  discountPercent: 0,
};

const emptyBook = {
  title: "",
  description: "",
  order: 0,
  coverImageUrl: "",
  pdfUrl: "",
  isFree: false,
  price: 0,
  isTopSeller: false,
  isMedium: false,
  discountPercent: 0,
};

function PricingFields({ form, setForm }) {
  return (
    <>
      <input
        type="number"
        step="0.01"
        placeholder="Price"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      <input
        type="number"
        placeholder="Discount %"
        value={form.discountPercent}
        onChange={(e) =>
          setForm({ ...form, discountPercent: Number(e.target.value) })
        }
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={form.isFree}
            onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
          />
          Free (also unlocks regardless of plan)
        </label>
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
    </>
  );
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
      <input
        type="number"
        placeholder="Duration (seconds)"
        value={form.durationSeconds}
        onChange={(e) => setForm({ ...form, durationSeconds: Number(e.target.value) })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      <input
        type="number"
        placeholder="Order"
        value={form.order}
        onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />

      <PricingFields form={form} setForm={setForm} />

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
      <input
        type="number"
        placeholder="Order"
        value={form.order}
        onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />

      <PricingFields form={form} setForm={setForm} />

      <p className="text-xs text-gray-500 dark:text-gray-400 sm:col-span-2">
        Tip: in Google Drive, right-click the PDF → Share → set to "Anyone
        with the link", then paste that link here. It'll show as an
        embedded reader on the site.
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
          ({item.isFree ? "free" : `$${item.price}`})
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
        <VideosSection />
        <BooksSection />
      </div>
    </div>
  );
}
