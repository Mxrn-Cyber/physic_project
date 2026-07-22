import { toDriveEmbedUrl } from "../utils/media.js";

export default function BookViewer({ url, title }) {
  const embedUrl = toDriveEmbedUrl(url) || url;

  return (
    <iframe
      className="h-full w-full bg-white"
      src={embedUrl}
      title={title}
      allow="autoplay"
    />
  );
}
