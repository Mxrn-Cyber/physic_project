import { toVideoEmbedUrl } from "../utils/media.js";

export default function VideoPlayer({ url, title }) {
  const embedUrl = toVideoEmbedUrl(url);

  if (embedUrl) {
    return (
      <iframe
        className="h-full w-full"
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Fall back to a direct <video> tag for plain .mp4/.webm links.
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video className="h-full w-full" src={url} controls title={title} />
  );
}
