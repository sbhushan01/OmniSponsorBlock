import { findActiveSegment } from "../shared/time.js";

let currentEpisodeId = null;
let currentSegments = [];
let currentMedia = null;
let currentMediaListener = null;

const fetchSegments = (episodeId) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "GET_SEGMENTS",
        payload: { videoId: episodeId, service: "Spotify", platform: "spotify" }
      },
      (response) => resolve(response?.ok ? response.data : [])
    );
  });

window.addEventListener("message", async (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== "OMNI_SPOTIFY_EPISODE") return;
  if (!event.data.episodeId || event.data.episodeId === currentEpisodeId) return;

  currentEpisodeId = event.data.episodeId;
  currentSegments = [];

  // Pass the episode ID so retries can bail if the episode changes mid-retry.
  startSkipping(currentEpisodeId);

  const requestedEpisodeId = currentEpisodeId;
  const segments = await fetchSegments(requestedEpisodeId);

  if (currentEpisodeId === requestedEpisodeId) {
    currentSegments = segments;
  }
});

const injectMainWorldHook = () => {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("js/spotify-inject.js");
  script.onload = () => script.remove();
  (document.documentElement || document.head).appendChild(script);
};

// Bug fix: accept episodeId so stale retry chains abort when the episode changes.
const startSkipping = (episodeId, retryCount = 0) => {
  // Bail out if the user has already navigated to a different episode.
  if (episodeId !== currentEpisodeId) return;

  const media = document.querySelector("audio,video");

  if (!media) {
    if (retryCount < 5) {
      setTimeout(() => startSkipping(episodeId, retryCount + 1), 500);
    }
    return;
  }

  // Rebind only when the media element changes.
  if (currentMedia === media && currentMediaListener) return;
  if (currentMedia && currentMediaListener) {
    currentMedia.removeEventListener("timeupdate", currentMediaListener);
  }

  const onTimeUpdate = () => {
    if (!currentSegments.length) return;
    const active = findActiveSegment(media.currentTime, currentSegments);
    if (active) {
      media.currentTime = active.segment[1];
    }
  };

  media.addEventListener("timeupdate", onTimeUpdate);
  currentMedia = media;
  currentMediaListener = onTimeUpdate;
};

injectMainWorldHook();
// Initial bind on page load (no episode yet, so pass null — will be a no-op
// until the first OMNI_SPOTIFY_EPISODE message arrives and sets currentEpisodeId).
document.addEventListener("DOMContentLoaded", () => startSkipping(currentEpisodeId));
// Bug fix: removed the dead `spotify-navigate` listener — nothing ever dispatches
// that event. SPA navigation is already handled by the OMNI_SPOTIFY_EPISODE
// message flow (inject script intercepts fetch/XHR) and popstate below.
window.addEventListener("popstate", () => startSkipping(currentEpisodeId));
