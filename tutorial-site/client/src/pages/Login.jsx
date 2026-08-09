import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";

export default function Login() {
  const { login, googleLogin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleError, setGoogleError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      if (err.data?.needsVerification) {
        navigate("/verify-otp", { state: { email: err.data.email || email, purpose: "signup" } });
        return;
      }
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle(credential) {
    setGoogleError(null);
    try {
      await googleLogin(credential);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setGoogleError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.auth.loginTitle}</h1>

      <div className="mt-6">
        <GoogleAuthButton onCredential={handleGoogle} text="signin_with" />
        {googleError && <p className="mt-2 text-center text-sm text-red-600">{googleError}</p>}
      </div>

      <div className="mt-6 flex items-center gap-3 text-xs uppercase text-gray-400">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        {t.auth.orLoginWithEmail}
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.auth.emailLabel}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.auth.passwordLabel}</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? t.auth.loggingIn : t.auth.loginButton}
        </button>
      </form>
      <p className="mt-3 text-center text-sm">
        <Link to="/forgot-password" className="font-medium text-red-600 dark:text-red-400">
          {t.auth.forgotPassword}
        </Link>
      </p>
      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {t.auth.noAccount}{" "}
        <Link to="/register" className="font-medium text-red-600 dark:text-red-400">
          {t.auth.registerLink}
        </Link>
      </p>
    </div>
  );
}
