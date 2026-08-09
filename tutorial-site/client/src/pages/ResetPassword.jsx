import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const email = location.state?.email || searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!email) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reset password</h1>
        <p className="mt-6 text-sm text-red-600">
          We don't know which account to reset. Start again from{" "}
          <Link to="/forgot-password" className="font-medium text-red-600 dark:text-red-400">
            forgot password
          </Link>
          .
        </p>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    try {
      await api.resetPassword(email, code, newPassword);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    setResending(true);
    try {
      await api.forgotPassword(email);
      setCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reset password</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Enter the 6-digit code we sent to <span className="font-medium">{email}</span>, then choose a
        new password.
      </p>

      {done ? (
        <p className="mt-6 text-sm text-green-600">Password updated. Redirecting you to log in…</p>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Verification code
              </label>
              <input
                required
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg font-semibold tracking-[0.5em] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm new password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Updating…" : "Update password"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="mt-4 w-full text-center text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline dark:text-red-400"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? "Sending…" : "Resend code"}
          </button>
        </>
      )}
    </div>
  );
}
