import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";

export default function Register() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [channel, setChannel] = useState("email");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleError, setGoogleError] = useState(null);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const resolvedChannel = form.phone ? channel : "email";
      const result = await register(form.name, form.email, form.password, {
        phone: form.phone || undefined,
        channel: resolvedChannel,
      });
      navigate("/verify-otp", {
        state: { email: result.email, purpose: "signup", channel: result.channel },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle(credential) {
    setGoogleError(null);
    try {
      await googleLogin(credential);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setGoogleError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create an account</h1>

      <div className="mt-6">
        <GoogleAuthButton onCredential={handleGoogle} text="signup_with" />
        {googleError && <p className="mt-2 text-center text-sm text-red-600">{googleError}</p>}
      </div>

      <div className="mt-6 flex items-center gap-3 text-xs uppercase text-gray-400">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        or sign up with email
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            required
            value={form.name}
            onChange={update("name")}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={update("password")}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <p className="mt-1 text-xs text-gray-400">At least 8 characters.</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone (optional)</label>
          <input
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            placeholder="+855 12 345 678"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Send my verification code by
          </span>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setChannel("email")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                channel === "email"
                  ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  : "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              disabled={!form.phone}
              onClick={() => setChannel("phone")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                channel === "phone"
                  ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  : "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              SMS
            </button>
          </div>
          {!form.phone && (
            <p className="mt-1 text-xs text-gray-400">Add a phone number above to unlock SMS codes.</p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-red-600 dark:text-red-400">
          Log in
        </Link>
      </p>
    </div>
  );
}
