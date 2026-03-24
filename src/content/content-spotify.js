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

  // --- Stale-segment guard ------------------------------------------------
  // Clear synchronously *before* the await so the `timeupdate` listener
  // cannot fire with the previous episode's timestamps while the network
  // request is in flight.  The array will be repopulated once the fetch
  // resolves; if it fails or returns empty, `timeupdate` simply becomes a
  // no-op until the next episode loads.
  currentSegments = [];

  currentSegments = await fetchSegments(currentEpisodeId);
});

const injectMainWorldHook = () => {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("js/spotify-inject.js");
  script.onload = () => script.remove();
  (document.documentElement || document.head).appendChild(script);
};

const startSkipping = () => {
  const media = document.querySelector("audio,video");
  if (!media) return;

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
document.addEventListener("DOMContentLoaded", startSkipping);
window.addEventListener("spotify-navigate", startSkipping);
window.addEventListener("popstate", startSkipping);
