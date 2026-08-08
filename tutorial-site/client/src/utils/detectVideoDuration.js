export function detectDurationFromFile(file) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.onloadedmetadata = () => {
      const seconds = Number.isFinite(videoEl.duration) ? Math.round(videoEl.duration) : null;
      URL.revokeObjectURL(objectUrl);
      resolve(seconds);
    };
    videoEl.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    videoEl.src = objectUrl;
  });
}

function detectDurationFromDirectUrl(url) {
  return new Promise((resolve) => {
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.crossOrigin = "anonymous";
    const timeout = setTimeout(() => resolve(null), 6000);
    videoEl.onloadedmetadata = () => {
      clearTimeout(timeout);
      resolve(Number.isFinite(videoEl.duration) ? Math.round(videoEl.duration) : null);
    };
    videoEl.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };
    videoEl.src = url;
  });
}

async function detectDurationFromVimeo(url) {
  try {
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return Number.isFinite(data.duration) ? Math.round(data.duration) : null;
  } catch {
    return null;
  }
}

export async function detectDurationFromUrl(url) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    if (host.includes("vimeo.com")) return detectDurationFromVimeo(url);
    if (host.includes("youtube.com") || host === "youtu.be")
      return null;
  } catch {
    return null;
  }
  return detectDurationFromDirectUrl(url);
}
