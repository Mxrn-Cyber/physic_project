import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Lock, ShoppingCart, Clock } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import VideoPlayer from "../components/VideoPlayer.jsx";
import PaymentModal from "../components/PaymentModal.jsx";
import { BADGE_LABELS, BADGE_STYLES } from "../components/badges.js";

export default function VideoDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [status, setStatus] = useState("loading");
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const [previewInfo, setPreviewInfo] = useState({ previewSeconds: 0, isPreview: false });
  const [playError, setPlayError] = useState(null);
  const [buying, setBuying] = useState(false);

  const load = () =>
    api
      .getVideo(id)
      .then(({ video }) => {
        setVideo(video);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));

  useEffect(() => {
    setStatus("loading");
    setPlaybackUrl(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch playback regardless of the unlocked flag -- the server itself
  // decides whether to hand over the URL (fully unlocked, a preview
  // window, or a 403 if neither applies), rather than the client
  // pre-judging it from `video.unlocked` alone.
  useEffect(() => {
    if (!video) return undefined;
    let cancelled = false;
    api
      .getVideoPlayback(id)
      .then(({ playbackUrl, previewSeconds, isPreview }) => {
        if (!cancelled) {
          setPlaybackUrl(playbackUrl);
          setPreviewInfo({ previewSeconds: previewSeconds || 0, isPreview: Boolean(isPreview) });
        }
      })
      .catch((err) => {
        if (!cancelled) setPlayError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [video?._id, id]);

  if (status === "loading") {
    return (
      <p className="mx-auto max-w-4xl px-4 py-10 text-sm text-gray-500 dark:text-gray-400">
        {t.common.loading}
      </p>
    );
  }

  if (status === "error" || !video) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-red-600">{t.videos.notFound}</p>
        <Link
          to="/videos"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
        >
          <ArrowLeft className="h-4 w-4" /> {t.videos.backToList}
        </Link>
      </div>
    );
  }

  const badges = video.badges || [];
  const onSale = video.discountPercent > 0 && !video.isFree;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/videos"
        className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
      >
        <ArrowLeft className="h-4 w-4" /> {t.videos.backToList}
      </Link>

      <div
        className="relative mt-4 aspect-video overflow-hidden rounded-xl bg-gray-900"
        style={
          !playbackUrl && video.thumbnailUrl
            ? { backgroundImage: `url(${video.thumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        {playbackUrl ? (
          <VideoPlayer
            url={playbackUrl}
            title={video.title}
            previewSeconds={previewInfo.previewSeconds}
            isPreview={previewInfo.isPreview}
            onBuyClick={() => setBuying(true)}
          />
        ) : playError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-white">
            <Lock className="h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-100">{t.videos.buyToWatch}</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-4">
            <p className="text-sm text-gray-100">{t.common.loading}</p>
          </div>
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
            {video.title}
          </h1>
          {video.description && (
            <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
              {video.description}
            </p>
          )}
          {video.durationSeconds ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" /> {Math.round(video.durationSeconds / 60)} min
            </p>
          ) : null}
        </div>

        <div className="w-full max-w-xs shrink-0 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          <div className="flex items-baseline gap-2">
            {video.isFree ? (
              <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                {t.common.free}
              </span>
            ) : onSale ? (
              <>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${video.effectivePrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  ${video.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${video.price.toFixed(2)}
              </span>
            )}
          </div>

          {video.unlocked ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
              <Play className="h-4 w-4" /> {t.videos.youOwnThis}
            </p>
          ) : user ? (
            <button
              type="button"
              onClick={() => setBuying(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <ShoppingCart className="h-4 w-4" /> {t.videos.buy} ${video.effectivePrice.toFixed(2)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t.videos.loginToBuy}
            </button>
          )}
        </div>
      </div>

      {buying && (
        <PaymentModal
          itemType="video"
          itemId={video._id}
          title={video.title}
          amount={video.effectivePrice}
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
