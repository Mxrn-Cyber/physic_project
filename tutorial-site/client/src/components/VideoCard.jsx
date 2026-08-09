import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Lock } from "lucide-react";
import { badgeLabel, BADGE_STYLES } from "./badges.js";
import { api } from "../api/client.js";
import { toVideoEmbedUrl } from "../utils/media.js";
import { useLanguage } from "../context/LanguageContext.jsx";

function toHoverEmbedUrl(embedUrl) {
  try {
    const u = new URL(embedUrl);
    if (u.hostname.includes("youtube.com")) {
      u.searchParams.set("autoplay", "1");
      u.searchParams.set("mute", "1");
      u.searchParams.set("controls", "0");
      u.searchParams.set("modestbranding", "1");
      u.searchParams.set("loop", "1");
      u.searchParams.set("playlist", u.pathname.split("/").pop());
    } else if (u.hostname.includes("vimeo.com")) {
      u.searchParams.set("autoplay", "1");
      u.searchParams.set("muted", "1");
      u.searchParams.set("loop", "1");
      u.searchParams.set("controls", "0");
    }
    return u.toString();
  } catch {
    return embedUrl;
  }
}

function HoverPreview({ videoId }) {
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const timerRef = useRef(null);

  const start = () => {
    api
      .getVideoPlayback(videoId)
      .then(({ playbackUrl, previewSeconds, isPreview }) => {
        if (!playbackUrl) return;
        setPlaybackUrl(playbackUrl);
        if (isPreview && previewSeconds) {
          timerRef.current = setTimeout(() => setPlaybackUrl(null), previewSeconds * 1000);
        }
      })
      .catch(() => {});
  };

  const stop = () => {
    clearTimeout(timerRef.current);
    setPlaybackUrl(null);
  };

  if (!playbackUrl) {
    return <div className="absolute inset-0" onMouseEnter={start} onMouseLeave={stop} />;
  }

  const embedUrl = toVideoEmbedUrl(playbackUrl);
  return (
    <div className="absolute inset-0" onMouseLeave={stop}>
      {embedUrl ? (
        <iframe
          className="pointer-events-none h-full w-full"
          src={toHoverEmbedUrl(embedUrl)}
          title="Preview"
          allow="autoplay; encrypted-media"
        />
      ) : (
        (<video className="h-full w-full object-cover" src={playbackUrl} autoPlay muted loop playsInline />)
      )}
    </div>
  );
}

export default function VideoCard({ video }) {
  const { t } = useLanguage();
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
        <HoverPreview videoId={video._id} />
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
                {badgeLabel(b, t)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        {video.isFree ? (
          <span className="font-semibold text-green-700 dark:text-green-400">{t.common.free}</span>
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
