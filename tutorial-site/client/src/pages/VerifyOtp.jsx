import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();

  const email = location.state?.email || new URLSearchParams(location.search).get("email") || "";
  const purpose = location.state?.purpose || "signup";
  const channel = location.state?.channel || "email";

  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!email) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Verify your account</h1>
        <p className="mt-6 text-sm text-red-600">
          We couldn't tell which account to verify. Start again from{" "}
          <Link to="/register" className="font-medium text-red-600 dark:text-red-400">
            sign up
          </Link>
          .
        </p>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyOtp(email, code, purpose);
      navigate(purpose === "signup" ? "/dashboard" : "/login", { replace: true });
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
      await resendOtp(email, purpose, channel);
      setCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Verify your account</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        We sent a 6-digit code to <span className="font-medium">{email}</span>
        {channel === "phone" ? " by SMS" : " by email"}. Enter it below to continue.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Verification code</label>
          <input
            required
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg font-semibold tracking-[0.5em] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? "Verifying…" : "Verify"}
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
    </div>
  );
}
