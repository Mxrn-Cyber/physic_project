const BASE_URL = "/api";

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

export const api = {
  register: (name, email, password) => request("/auth/register", { method: "POST", body: { name, email, password } }),
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me"),

  getCourses: () => request("/courses"),
  getPlaybackUrl: (lessonId) => request(`/courses/lessons/${lessonId}/playback`),
  getPdfUrl: (lessonId) => request(`/courses/lessons/${lessonId}/pdf`),
  markComplete: (lessonId) => request(`/courses/lessons/${lessonId}/complete`, { method: "POST" }),

  startCheckout: () => request("/billing/create-checkout-session", { method: "POST" }),
  openBillingPortal: () => request("/billing/create-portal-session", { method: "POST" }),
};
