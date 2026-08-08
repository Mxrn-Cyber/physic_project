import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Lock, ShoppingCart, BookOpen } from "lucide-react";
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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/books"
        className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
      >
        <ArrowLeft className="h-4 w-4" /> {t.books.backToList}
      </Link>

      <div className="mt-4 aspect-[3/4] max-h-[70vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        {pdfUrl ? (
          <BookViewer
            url={pdfUrl}
            title={book.title}
            isPreview={isPreview}
            onBuyClick={() => setBuying(true)}
          />
        ) : viewError ? (
          <div
            className="flex h-full flex-col items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800"
            style={
              book.coverImageUrl
                ? { backgroundImage: `url(${book.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          >
            {!book.coverImageUrl && <FileText className="h-10 w-10 text-gray-400" />}
            <Lock className="h-6 w-6 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.books.buyToView}</p>
          </div>
        ) : (
          <p className="flex h-full items-center justify-center p-4 text-sm text-gray-500 dark:text-gray-400">
            {t.common.loading}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
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
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {book.title}
          </h1>
          {book.description && (
            <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">{book.description}</p>
          )}
          {book.pageCount ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <BookOpen className="h-4 w-4" /> {book.pageCount} pages
            </p>
          ) : null}
        </div>

        <div className="w-full max-w-xs shrink-0 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
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
                <span className="text-sm text-gray-400 line-through">${book.price.toFixed(2)}</span>
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
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <ShoppingCart className="h-4 w-4" /> {t.books.buy} ${book.effectivePrice.toFixed(2)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t.books.loginToBuy}
            </button>
          )}
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
