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
  
  // Call startSkipping here! The audio element is much more likely to exist now.
  startSkipping(); 

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

const startSkipping = (retryCount = 0) => {
  const media = document.querySelector("audio,video");
  
  if (!media) {
    // If we can't find the player, try again in 500ms (up to 5 times max)
    if (retryCount < 5) {
      setTimeout(() => startSkipping(retryCount + 1), 500);
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
document.addEventListener("DOMContentLoaded", () => startSkipping());
window.addEventListener("spotify-navigate", () => startSkipping());
window.addEventListener("popstate", () => startSkipping());
