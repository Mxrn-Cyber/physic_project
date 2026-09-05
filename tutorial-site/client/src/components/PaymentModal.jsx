import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { api } from "../api/client.js";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function PaymentModal({ itemType, itemId, title, amount, onClose, onPaid }) {
  const { t } = useLanguage();
  const [state, setState] = useState("creating");
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    api
      .createPayment(itemType, itemId)
      .then((data) => {
        if (cancelled) return;
        setPayment(data);
        setState("waiting");
        pollRef.current = setInterval(async () => {
          try {
            const { status } = await api.getPaymentStatus(data.tranId);
            if (status === "completed") {
              clearInterval(pollRef.current);
              onPaid();
            } else if (status === "failed") {
              clearInterval(pollRef.current);
              setError(t.payment.failed);
              setState("error");
            }
          } catch {}
        }, 3000);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setState("error");
      });

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // t is intentionally read at call time only; re-running this effect on a
    // language switch would create a second payment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemType, itemId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 dark:bg-gray-900">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">${amount?.toFixed?.(2) ?? amount}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t.payment.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col items-center">
          {state === "creating" && (
            <p className="py-10 text-sm text-gray-500 dark:text-gray-400">{t.payment.settingUp}</p>
          )}

          {state === "waiting" && payment && (
            <>
              {payment.qrImageUrl ? (
                <img
                  src={payment.qrImageUrl}
                  alt={t.payment.qrAlt}
                  className="h-56 w-56 rounded-lg border border-gray-200 object-contain dark:border-gray-700"
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.payment.qrUnavailable}
                </p>
              )}
              <p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-300">
                {t.payment.scanInstructions}
              </p>
              <p className="mt-2 text-xs text-gray-400">{t.payment.waiting}</p>
            </>
          )}

          {state === "error" && (
            <p className="py-6 text-center text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
