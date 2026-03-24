import { findActiveSegment } from "../shared/time.js";

/**
 * Extract the YouTube video ID from the current URL.
 *
 * Handles three URL shapes:
 *   - Standard watch:  https://www.youtube.com/watch?v=VIDEO_ID
 *   - Shorts:          https://www.youtube.com/shorts/VIDEO_ID
 *   - Embedded player: https://www.youtube-nocookie.com/embed/VIDEO_ID
 */
const getVideoId = () => {
  const url = new URL(window.location.href);

  // Standard ?v= parameter (watch pages, search previews, …)
  const vParam = url.searchParams.get("v");
  if (vParam) return vParam;

  // Path-based IDs: /shorts/<id>  or  /embed/<id>
  const pathMatch = url.pathname.match(/\/(?:shorts|embed)\/([^/?#]+)/);
  if (pathMatch) return pathMatch[1];

  return null;
};

let currentBinding = null;

const loadSegments = (videoId) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "GET_SEGMENTS",
        payload: { videoId, service: "YouTube", platform: "youtube" }
      },
      (response) => resolve(response?.ok ? response.data : [])
    );
  });

const boot = async () => {
  const player = document.querySelector("video");
  const videoId = getVideoId();
  if (!player || !videoId) return;

  // Prevent duplicate handlers when neither the player nor the video changed.
  if (currentBinding?.player === player && currentBinding.videoId === videoId) return;

  // Tear down any previous binding before the async gap so a fast
  // second navigation can't leave two timeupdate listeners alive.
  if (currentBinding) {
    currentBinding.player.removeEventListener("timeupdate", currentBinding.handler);
    currentBinding = null;
  }

  // --- SPA race-condition guard -------------------------------------------
  // Snapshot the identity we are loading for.  If the user navigates again
  // before the network round-trip finishes, `boot` will already have cleared
  // `currentBinding` above and set it to `null`.  We check after the await
  // that the URL hasn't moved on without us; if it has, we discard the stale
  // result rather than binding segments for the wrong video.
  const bootVideoId = videoId;
  const bootPlayer  = player;

  const segments = await loadSegments(videoId);

  // Bail out if a newer `boot` call has already taken over or the player was
  // swapped while we were waiting.
  if (
    getVideoId() !== bootVideoId ||
    document.querySelector("video") !== bootPlayer
  ) {
    return;
  }

  if (!Array.isArray(segments) || segments.length === 0) return;

  const onTimeUpdate = () => {
    const active = findActiveSegment(player.currentTime, segments);
    if (active) {
      player.currentTime = active.segment[1];
    }
  };

  player.addEventListener("timeupdate", onTimeUpdate);
  currentBinding = { videoId, player, handler: onTimeUpdate };
};

document.addEventListener("DOMContentLoaded", boot);
window.addEventListener("yt-navigate-finish", boot);
window.addEventListener("beforeunload", () => {
  if (currentBinding) {
    currentBinding.player.removeEventListener("timeupdate", currentBinding.handler);
    currentBinding = null;
  }
});
