import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import FileOrUrlField from "../components/FileOrUrlField.jsx";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    photoUrl: user?.photoUrl || "",
  });
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
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
    return <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</div>;
  }

  const ownedCount = (user.purchasedVideos?.length || 0) + (user.purchasedBooks?.length || 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Profile</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Update your contact details. Email and password are managed elsewhere.
      </p>

      <div className="mt-6 flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-gray-700">
          <img
            src={
              form.photoUrl ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email)}`
            }
            alt="Profile"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {ownedCount} item{ownedCount === 1 ? "" : "s"} owned
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        <div className="block">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile photo</span>
          <div className="mt-1">
            <FileOrUrlField
              value={form.photoUrl}
              onChange={(url) => setForm({ ...form, photoUrl: url })}
              accept="image/*"
              placeholder="https://… (link to your photo)"
            />
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone number</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</span>
          <textarea
            rows={3}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {status === "saved" && (
          <p className="text-sm text-green-700 dark:text-green-400">Profile updated.</p>
        )}

        <button
          type="submit"
          disabled={status === "saving"}
          className="w-fit rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
