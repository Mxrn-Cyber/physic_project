import { Link } from "react-router-dom";
import { FileText, Lock } from "lucide-react";
import { BADGE_LABELS, BADGE_STYLES } from "./badges.js";

// Shared book preview card -- used on the Books listing page and on the
// Home page "Books" section so both look and behave identically.
export default function BookCard({ book }) {
  const badges = book.badges || [];
  const onSale = book.discountPercent > 0 && !book.isFree;

  return (
    <Link
      to={`/books/${book._id}`}
      className="flex flex-col rounded-xl border border-gray-200 p-5 text-left transition hover:border-red-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-red-500"
    >
      <div
        className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
        style={
          book.coverImageUrl
            ? { backgroundImage: `url(${book.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        {!book.coverImageUrl &&
          (book.unlocked ? (
            <FileText className="h-10 w-10 text-gray-400" />
          ) : (
            <Lock className="h-10 w-10 text-gray-400" />
          ))}
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{book.title}</h3>
        {badges.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
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
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        {book.isFree ? (
          <span className="font-semibold text-green-700 dark:text-green-400">Free</span>
        ) : onSale ? (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              ${book.effectivePrice.toFixed(2)}
            </span>
            <span className="text-sm text-gray-400 line-through">
              ${book.price.toFixed(2)}
            </span>
          </>
        ) : (
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            ${book.price.toFixed(2)}
          </span>
        )}
      </div>
    </Link>
  );
}
