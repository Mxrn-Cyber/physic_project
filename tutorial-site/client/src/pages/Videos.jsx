import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import VideoCard from "../components/VideoCard.jsx";

export default function Videos() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    api
      .getVideos()
      .then(({ videos }) => {
        setVideos(videos);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.videos.title}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {user ? t.videos.loggedInSubtitle : t.videos.loggedOutSubtitle}
      </p>

      {status === "loading" && (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">{t.common.loading}</p>
      )}
      {status === "error" && (
        <p className="mt-6 text-sm text-red-600">
          Couldn't load videos right now. Please try again later.
        </p>
      )}
      {status === "ready" && videos.length === 0 && (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">No videos yet.</p>
      )}
      {status === "ready" && videos.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
