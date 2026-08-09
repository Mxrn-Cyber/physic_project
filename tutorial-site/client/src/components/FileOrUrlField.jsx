import { useState } from "react";
import { api } from "../api/client.js";
import {
  detectDurationFromFile,
  detectDurationFromUrl,
} from "../utils/detectVideoDuration.js";

export default function FileOrUrlField({
  label,
  value,
  onChange,
  accept,
  placeholder,
  onDurationDetected,
  // Defaults to the admin-only uploader (used for video/book content).
  // Pass api.uploadAvatar here for profile photos, which any logged-in
  // user is allowed to use.
  uploadFn = api.uploadFile,
}) {
  const [mode, setMode] = useState(value ? "url" : "upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    if (onDurationDetected) {
      detectDurationFromFile(file).then((seconds) => {
        if (seconds) onDurationDetected(seconds);
      });
    }
    try {
      const { url } = await uploadFn(file);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlBlur = (e) => {
    const url = e.target.value.trim();
    if (!onDurationDetected || !url) return;
    detectDurationFromUrl(url).then((seconds) => {
      if (seconds) onDurationDetected(seconds);
    });
  };

  return (
    <div>
      <div className="mb-1 flex items-center gap-3 text-xs">
        {label && (
          <span className="font-medium text-gray-600 dark:text-gray-400">
            {label}
          </span>
        )}
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={
            mode === "upload"
              ? "font-semibold text-red-600"
              : "text-gray-500 dark:text-gray-400"
          }
        >
          Upload from this device (recommended)
        </button>
        <span className="text-gray-300">|</span>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={
            mode === "url"
              ? "font-semibold text-red-600"
              : "text-gray-500 dark:text-gray-400"
          }
        >
          Paste URL instead
        </button>
      </div>

      {mode === "upload" ? (
        <div>
          <input
            type="file"
            accept={accept}
            onChange={handleFile}
            className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-red-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-red-700 dark:file:bg-red-500 dark:hover:file:bg-red-400"
          />
          {uploading && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Uploading…
            </p>
          )}
          {value && !uploading && (
            <p className="mt-1 truncate text-xs text-green-700 dark:text-green-400">
              Uploaded ✓ {value}
            </p>
          )}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        <input
          type="url"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleUrlBlur}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      )}
    </div>
  );
}
