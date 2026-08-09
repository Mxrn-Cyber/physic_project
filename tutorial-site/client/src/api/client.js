const BASE_URL = import.meta.env.VITE_API_URL || "/api";

let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}
// Exposed so the in-page PDF viewer (BookViewer.jsx) can attach the current
// user's token to its own PDF fetches -- it doesn't go through request()
// above, since pdf.js does its own fetching internally.
export function getAuthToken() {
  return authToken;
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
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function uploadTo(path, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data;
}

const uploadFile = (file) => uploadTo("/uploads", file);
// Any logged-in user can use this one (not just admins) -- the server keeps
// it locked to small image files so it can't be used to run up storage costs.
const uploadAvatar = (file) => uploadTo("/uploads/avatar", file);

export const api = {
  register: (name, email, password, { phone, channel } = {}) =>
    request("/auth/register", { method: "POST", body: { name, email, password, phone, channel } }),
  verifyOtp: (email, code, purpose = "signup") =>
    request("/auth/verify-otp", { method: "POST", body: { email, code, purpose } }),
  resendOtp: (email, purpose = "signup", channel) =>
    request("/auth/resend-otp", { method: "POST", body: { email, purpose, channel } }),
  googleAuth: (credential) => request("/auth/google", { method: "POST", body: { credential } }),
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me"),
  updateProfile: (profile) => request("/auth/me", { method: "PATCH", body: profile }),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (email, code, newPassword) =>
    request("/auth/reset-password", { method: "POST", body: { email, code, newPassword } }),

  getCourses: () => request("/courses"),

  getVideos: (courseId) => request(courseId ? `/videos?course=${courseId}` : "/videos"),
  getVideo: (videoId) => request(`/videos/${videoId}`),
  getVideoPlayback: (videoId) => request(`/videos/${videoId}/playback`),
  markVideoComplete: (videoId) => request(`/videos/${videoId}/complete`, { method: "POST" }),

  getBooks: (courseId) => request(courseId ? `/books?course=${courseId}` : "/books"),
  getBook: (bookId) => request(`/books/${bookId}`),
  getBookView: (bookId) => request(`/books/${bookId}/view`),
  getBookPreviewPdfUrl: (bookId) => `${BASE_URL}/books/${bookId}/preview-pdf`,
  // The single URL the in-page PDF viewer fetches from: the server decides
  // whether to hand back the full document or a page-limited preview based
  // on whether the requesting user (via their auth token) owns the book.
  getBookPdfUrl: (bookId) => `${BASE_URL}/books/${bookId}/pdf`,
  markBookComplete: (bookId) => request(`/books/${bookId}/complete`, { method: "POST" }),
  // Renders page 1 of a PDF (fetched from the given URL) into a cover image
  // and returns { coverUrl }. Used when an admin pastes a PDF URL instead
  // of uploading the file directly -- uploaded files get their cover
  // generated automatically as part of the upload response instead.
  generateBookCover: (pdfUrl) => request("/books/generate-cover", { method: "POST", body: { pdfUrl } }),

  createPayment: (itemType, itemId) =>
    request("/payments/create", { method: "POST", body: { itemType, itemId } }),
  getPaymentStatus: (tranId) => request(`/payments/${tranId}/status`),

  uploadFile,
  uploadAvatar,

  getAdminVideos: () => request("/videos/admin/all"),
  createVideo: (video) => request("/videos", { method: "POST", body: video }),
  updateVideo: (id, video) => request(`/videos/${id}`, { method: "PATCH", body: video }),
  deleteVideo: (id) => request(`/videos/${id}`, { method: "DELETE" }),

  getAdminBooks: () => request("/books/admin/all"),
  createBook: (book) => request("/books", { method: "POST", body: book }),
  updateBook: (id, book) => request(`/books/${id}`, { method: "PATCH", body: book }),
  deleteBook: (id) => request(`/books/${id}`, { method: "DELETE" }),

  getUsers: () => request("/users"),
  createUser: (user) => request("/users", { method: "POST", body: user }),
  setUserAdmin: (id, isAdmin) => request(`/users/${id}`, { method: "PATCH", body: { isAdmin } }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),
};
