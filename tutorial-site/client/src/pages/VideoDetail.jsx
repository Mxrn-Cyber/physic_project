import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Lock, ShoppingCart, Clock, CheckCircle2 } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import VideoPlayer from "../components/VideoPlayer.jsx";
import PaymentModal from "../components/PaymentModal.jsx";
import { badgeLabel, BADGE_STYLES } from "../components/badges.js";
import Seo, { fill } from "../components/Seo.jsx";
import { videoSchema, breadcrumbSchema } from "../utils/schema.js";

export default function VideoDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [status, setStatus] = useState("loading");
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const [previewInfo, setPreviewInfo] = useState({ previewSeconds: 0, isPreview: false });
  const [playError, setPlayError] = useState(null);
  const [buying, setBuying] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

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
  }, [id]);

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

  // One-way: the server only exposes addToSet (see POST /videos/:id/complete),
  // there is no "unmark" endpoint. Re-fetching afterward keeps this in sync
  // with the same server response every other action already relies on,
  // instead of hand-rolling local state that could drift from it.
  function handleMarkComplete() {
    if (markingComplete || video.completed) return;
    setMarkingComplete(true);
    api
      .markVideoComplete(video._id)
      .then(load)
      .catch(() => {})
      .finally(() => setMarkingComplete(false));
  }

  const seoDescription =
    video.description || fill(t.seo.videoDescription, { title: video.title });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Seo
        title={video.title}
        description={seoDescription}
        image={video.thumbnailUrl}
        type="video.other"
        jsonLd={[
          videoSchema(video, { description: seoDescription, lang }),
          breadcrumbSchema(
            [
              { name: t.nav.home, path: "/" },
              { name: t.seo.videos.title, path: "/videos" },
              { name: video.title, path: `/videos/${video._id}` },
            ],
            lang
          ),
        ]}
      />
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

      {/* Stacked on phones, side by side from `sm` up. This used to be a
          single flex-wrap row: with `flex-1 min-w-0` on the left and a
          320px `shrink-0` card on the right, the row never wrapped -- the
          title column just shrank to a sliver, clipping the heading and
          breaking "19 min" across two lines. */}
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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

        <div className="w-full rounded-xl border border-gray-200 p-5 dark:border-gray-700 sm:max-w-xs sm:shrink-0">
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
            <>
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
                <Play className="h-4 w-4" /> {t.videos.youOwnThis}
              </p>
              {video.completed ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> {t.videos.completed}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  disabled={markingComplete}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <CheckCircle2 className="h-4 w-4" /> {t.videos.markComplete}
                </button>
              )}
            </>
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
