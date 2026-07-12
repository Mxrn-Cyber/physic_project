import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    api.getCourses().then(({ courses }) => setCourses(courses));
    // If we just came back from Stripe Checkout success_url (?upgraded=1),
    // re-fetch the user so the UI reflects the new plan once the webhook lands.
    if (new URLSearchParams(window.location.search).get("upgraded")) {
      refreshUser().catch(() => {});
    }
  }, [refreshUser]);

  const allLessons = courses.flatMap((c) => c.lessons);
  const unlockedCount = allLessons.filter((l) => l.unlocked).length;
  const isPaid = user?.plan === "paid";

  async function handleManageBilling() {
    setPortalBusy(true);
    try {
      const { url } = await api.openBillingPortal();
      window.location.href = url;
    } catch (err) {
      alert(err.message);
      setPortalBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Plan</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{isPaid ? "Paid" : "Free"}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Lessons unlocked</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{unlockedCount} / {allLessons.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Courses</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{courses.length}</p>
        </div>
      </div>

      {isPaid ? (
        <div className="mt-6 flex items-center justify-between rounded-xl bg-gray-50 p-5">
          <p className="text-sm text-gray-700">Manage your subscription, payment method, or invoices.</p>
          <button
            onClick={handleManageBilling}
            disabled={portalBusy}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            {portalBusy ? "Opening…" : "Manage billing"}
          </button>
        </div>
      ) : (
        <div className="mt-6 flex items-center justify-between rounded-xl bg-indigo-50 p-5">
          <p className="text-sm text-indigo-900">Unlock every lesson and PDF with the Paid plan.</p>
          <Link to="/pricing" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Upgrade
          </Link>
        </div>
      )}
    </div>
  );
}
