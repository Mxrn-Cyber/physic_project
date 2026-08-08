// In local dev, "/api" is proxied to localhost:4000 by vite.config.js.
// In production the client and API are on different domains (Cloudflare
// Workers vs Render), so VITE_API_URL must be set at build time to the
// deployed API's full URL, e.g. https://reanphysics-api.onrender.com/api.
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

async function request(path, { method = "GET", body, ...rest } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// Multipart upload (file), separate from request() since it must NOT set
// Content-Type: application/json.
async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/uploads`, {
    method: "POST",
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data;
}

export const api = {
  register: (name, email, password) => request("/auth/register", { method: "POST", body: { name, email, password } }),
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me"),
  updateProfile: (profile) => request("/auth/me", { method: "PATCH", body: profile }),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (email, token, newPassword) =>
    request("/auth/reset-password", { method: "POST", body: { email, token, newPassword } }),

  getVideos: (courseId) => request(courseId ? `/videos?course=${courseId}` : "/videos"),
  getVideo: (videoId) => request(`/videos/${videoId}`),
  getVideoPlayback: (videoId) => request(`/videos/${videoId}/playback`),
  markVideoComplete: (videoId) => request(`/videos/${videoId}/complete`, { method: "POST" }),

  getBooks: (courseId) => request(courseId ? `/books?course=${courseId}` : "/books"),
  getBook: (bookId) => request(`/books/${bookId}`),
  getBookView: (bookId) => request(`/books/${bookId}/view`),
  // Not a request() call -- this is a plain URL for an <iframe src>, which
  // can't attach the Authorization header. The endpoint itself is public
  // (see server routes/books.js) since it only ever serves the trimmed
  // "first N pages" sample.
  getBookPreviewPdfUrl: (bookId) => `${BASE_URL}/books/${bookId}/preview-pdf`,
  markBookComplete: (bookId) => request(`/books/${bookId}/complete`, { method: "POST" }),

  // ABA PayWay per-item purchases
  createPayment: (itemType, itemId) =>
    request("/payments/create", { method: "POST", body: { itemType, itemId } }),
  getPaymentStatus: (tranId) => request(`/payments/${tranId}/status`),

  uploadFile,

  // Admin-only (server enforces via requireAuth + requireAdmin)
  getAdminVideos: () => request("/videos/admin/all"),
  createVideo: (video) => request("/videos", { method: "POST", body: video }),
  updateVideo: (id, video) => request(`/videos/${id}`, { method: "PATCH", body: video }),
  deleteVideo: (id) => request(`/videos/${id}`, { method: "DELETE" }),

  getAdminBooks: () => request("/books/admin/all"),
  createBook: (book) => request("/books", { method: "POST", body: book }),
  updateBook: (id, book) => request(`/books/${id}`, { method: "PATCH", body: book }),
  deleteBook: (id) => request(`/books/${id}`, { method: "DELETE" }),

  // Admin-only user management
  getUsers: () => request("/users"),
  createUser: (user) => request("/users", { method: "POST", body: user }),
  setUserAdmin: (id, isAdmin) => request(`/users/${id}`, { method: "PATCH", body: { isAdmin } }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),
};
