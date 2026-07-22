import { Link } from "react-router-dom";
import { Play, Lock } from "lucide-react";
import { BADGE_LABELS, BADGE_STYLES } from "./badges.js";

// Shared video preview card -- used on the Videos listing page and on the
// Home page "Videos" section so both look and behave identically.
export default function VideoCard({ video }) {
  const badges = video.badges || [];
  const onSale = video.discountPercent > 0 && !video.isFree;

  return (
    <Link
      to={`/videos/${video._id}`}
      className="flex flex-col rounded-xl border border-gray-200 p-5 text-left transition hover:border-red-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-red-500"
    >
      <div
        className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gray-900 text-white"
        style={
          video.thumbnailUrl
            ? { backgroundImage: `url(${video.thumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        {video.thumbnailUrl && <div className="absolute inset-0 bg-black/25" />}
        {video.unlocked ? (
          <Play className="relative h-10 w-10" />
        ) : (
          <Lock className="relative h-10 w-10 text-gray-200" />
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{video.title}</h3>
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
        {video.isFree ? (
          <span className="font-semibold text-green-700 dark:text-green-400">Free</span>
        ) : onSale ? (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              ${video.effectivePrice.toFixed(2)}
            </span>
            <span className="text-sm text-gray-400 line-through">
              ${video.price.toFixed(2)}
            </span>
          </>
        ) : (
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            ${video.price.toFixed(2)}
          </span>
        )}
      </div>
    </Link>
  );
}
