import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { api } from "../api/client.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const SLOW_AFTER_MS = 3 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;

export default function PaymentModal({
  itemType,
  itemId,
  title,
  amount,
  onClose,
  onPaid,
}) {
  const { t } = useLanguage();
  const [state, setState] = useState("creating");
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [slow, setSlow] = useState(false);
  const [manualChecking, setManualChecking] = useState(false);
  const pollRef = useRef(null);
  const slowTimerRef = useRef(null);
  const tranIdRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      const { status } = await api.getPaymentStatus(tranIdRef.current);
      if (cancelled) return status;
      if (status === "completed") {
        clearInterval(pollRef.current);
        clearTimeout(slowTimerRef.current);
        onPaid();
      } else if (status === "failed") {
        clearInterval(pollRef.current);
        clearTimeout(slowTimerRef.current);
        setError(t.payment.failed);
        setState("error");
      }
      return status;
    }

    api
      .createPayment(itemType, itemId)
      .then((data) => {
        if (cancelled) return;
        tranIdRef.current = data.tranId;
        setPayment(data);
        setState("waiting");
        pollRef.current = setInterval(() => {
          checkStatus().catch(() => {});
        }, POLL_INTERVAL_MS);
        // Purely a UI cue -- polling itself keeps running underneath so a
        // payment that completes right after this fires is still caught by
        // the very next automatic check, not just by the manual button.
        slowTimerRef.current = setTimeout(() => {
          if (!cancelled) setSlow(true);
        }, SLOW_AFTER_MS);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setState("error");
      });

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
    // t is intentionally read at call time only; re-running this effect on a
    // language switch would create a second payment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemType, itemId]);

  function handleManualCheck() {
    if (manualChecking || !tranIdRef.current) return;
    setManualChecking(true);
    api
      .getPaymentStatus(tranIdRef.current)
      .then(({ status }) => {
        if (status === "completed") {
          clearInterval(pollRef.current);
          clearTimeout(slowTimerRef.current);
          onPaid();
        } else if (status === "failed") {
          clearInterval(pollRef.current);
          clearTimeout(slowTimerRef.current);
          setError(t.payment.failed);
          setState("error");
        }
        // Still pending: stay on the QR screen, the automatic poll (and this
        // button) keep trying -- there is nothing else to tell the buyer yet.
      })
      .catch(() => {})
      .finally(() => setManualChecking(false));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 dark:bg-gray-900">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ${amount?.toFixed?.(2) ?? amount}
            </p>
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
            <p className="py-10 text-sm text-gray-500 dark:text-gray-400">
              {t.payment.settingUp}
            </p>
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

              {slow && (
                <div className="mt-4 w-full border-t border-gray-200 pt-4 dark:border-gray-700">
                  <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                    {t.payment.slowNotice}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleManualCheck}
                      disabled={manualChecking}
                      className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {manualChecking
                        ? t.payment.checking
                        : t.payment.checkAgain}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {t.payment.cancelAndGoBack}
                    </button>
                  </div>
                </div>
              )}
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
