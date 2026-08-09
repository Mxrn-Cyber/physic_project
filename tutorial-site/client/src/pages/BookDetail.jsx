import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Lock,
  ShoppingCart,
  BookOpen,
} from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import BookViewer from "../components/BookViewer.jsx";
import PaymentModal from "../components/PaymentModal.jsx";
import { BADGE_LABELS, BADGE_STYLES } from "../components/badges.js";

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [status, setStatus] = useState("loading");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [viewError, setViewError] = useState(null);
  const [buying, setBuying] = useState(false);

  const load = () =>
    api
      .getBook(id)
      .then(({ book }) => {
        setBook(book);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));

  useEffect(() => {
    setStatus("loading");
    setPdfUrl(null);
    load();
  }, [id]);

  useEffect(() => {
    if (!book) return undefined;
    let cancelled = false;
    api
      .getBookView(id)
      .then(({ pdfUrl, isPreview }) => {
        if (cancelled) return;
        setIsPreview(Boolean(isPreview));
        setPdfUrl(isPreview ? api.getBookPreviewPdfUrl(id) : pdfUrl);
      })
      .catch((err) => {
        if (!cancelled) setViewError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [book?._id, id]);

  if (status === "loading") {
    return (
      <p className="mx-auto max-w-4xl px-4 py-10 text-sm text-gray-500 dark:text-gray-400">
        {t.common.loading}
      </p>
    );
  }

  if (status === "error" || !book) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-red-600">{t.books.notFound}</p>
        <Link
          to="/books"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
        >
          <ArrowLeft className="h-4 w-4" /> {t.books.backToList}
        </Link>
      </div>
    );
  }

  const badges = book.badges || [];
  const onSale = book.discountPercent > 0 && !book.isFree;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <Link
        to="/books"
        className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
      >
        <ArrowLeft className="h-4 w-4" /> {t.books.backToList}
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-6 sm:mt-6 sm:gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)] lg:items-start">
        <div className="aspect-[3/4] max-h-[80vh] w-full sm:max-h-[75vh] lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
          {pdfUrl ? (
            <BookViewer
              url={pdfUrl}
              title={book.title}
              isPreview={isPreview}
              onBuyClick={() => setBuying(true)}
            />
          ) : viewError ? (
            <div
              className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
              style={
                book.coverImageUrl
                  ? {
                      backgroundImage: `url(${book.coverImageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              {!book.coverImageUrl && (
                <FileText className="h-10 w-10 text-gray-400" />
              )}
              <Lock className="h-6 w-6 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t.books.buyToView}
              </p>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                {t.common.loading}
              </p>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="min-w-0">
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {badges.map((b) => (
                  <span
                    key={b}
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE_STYLES[b]}`}
                  >
                    {BADGE_LABELS[b]}
                  </span>
                ))}
              </div>
            )}
            <h1 className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
              {book.title}
            </h1>
            {book.description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                {book.description}
              </p>
            )}
            {book.pageCount ? (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <BookOpen className="h-4 w-4" /> {book.pageCount} pages
              </p>
            ) : null}
          </div>

          <div className="w-full rounded-2xl border border-gray-200 p-5 shadow-sm dark:border-gray-700">
            <div className="flex items-baseline gap-2">
              {book.isFree ? (
                <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {t.common.free}
                </span>
              ) : onSale ? (
                <>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${book.effectivePrice.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    ${book.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${book.price.toFixed(2)}
                </span>
              )}
            </div>

            {book.unlocked ? (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
                <FileText className="h-4 w-4" /> {t.books.youOwnThis}
              </p>
            ) : user ? (
              <button
                type="button"
                onClick={() => setBuying(true)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-[0.98]"
              >
                <ShoppingCart className="h-4 w-4" /> {t.books.buy} $
                {book.effectivePrice.toFixed(2)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-3 w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-red-50 dark:border-red-700 dark:text-gray-300 dark:hover:bg-red-900"
              >
                {t.books.loginToBuy}
              </button>
            )}
          </div>
        </div>
      </div>

      {buying && (
        <PaymentModal
          itemType="book"
          itemId={book._id}
          title={book.title}
          amount={book.effectivePrice}
          onClose={() => setBuying(false)}
          onPaid={() => {
            setBuying(false);
            load();
          }}
        />
      )}
    </div>
  );
}
