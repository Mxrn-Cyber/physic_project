import { useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { useNavigate } from "react-router-dom";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Sample lessons in every course",
      "1–2 PDF guides per course",
      "Standard video quality",
      "Community forum (read-only)",
    ],
  },
  {
    name: "Paid",
    price: "$12",
    period: "/month",
    highlighted: true,
    features: [
      "Full access to every course & lesson",
      "All PDF guides, worksheets & workbooks",
      "HD, ad-free video, downloadable offline",
      "Progress tracking & certificates",
      "Full community + comments/Q&A",
    ],
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleUpgrade() {
    if (!user) return navigate("/login", { state: { from: { pathname: "/pricing" } } });
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.startCheckout();
      window.location.href = url; // redirect to Stripe Checkout
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const isPaid = user?.plan === "paid";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Choose your plan</h1>
        <p className="mt-1 text-sm text-gray-600">Start free. Upgrade any time, cancel any time.</p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = (plan.name === "Paid") === isPaid;
          return (
            <div key={plan.name} className={`rounded-2xl border p-6 ${plan.highlighted ? "border-indigo-300 shadow-md" : "border-gray-200"}`}>
              {plan.highlighted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  <Star className="h-3 w-3" /> Most popular
                </span>
              )}
              <h2 className="mt-3 text-lg font-bold text-gray-900">{plan.name}</h2>
              <p className="mt-1">
                <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-500"> {plan.period}</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.name === "Paid" ? (
                <button
                  onClick={handleUpgrade}
                  disabled={isCurrent || busy}
                  className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold ${
                    isCurrent ? "cursor-default bg-gray-100 text-gray-400" : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {isCurrent ? "Current plan" : busy ? "Redirecting…" : "Upgrade to Paid"}
                </button>
              ) : (
                <div className="mt-6 w-full rounded-lg bg-gray-100 px-4 py-2.5 text-center text-sm font-semibold text-gray-400">
                  {isCurrent ? "Current plan" : "Default plan"}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
      <p className="mt-4 text-center text-xs text-gray-400">
        "Upgrade" redirects to Stripe Checkout. Requires STRIPE_* env vars set on the server.
      </p>
    </div>
  );
}
