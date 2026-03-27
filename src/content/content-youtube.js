import { findActiveSegment } from "../shared/time.js";

/**
 * Extract the YouTube video ID from the current URL.
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
let bootCount = 0; // Use a counter to track the latest navigation safely

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
  const currentBootCount = ++bootCount;
  
  // 1. Better player selection (YouTube often has multiple video tags)
  const player = document.querySelector(".html5-main-video") || document.querySelector("video");
  const videoId = getVideoId();
  
  if (!player || !videoId) {
    // 2. Retry if the video element is not yet injected by YouTube's SPA
    setTimeout(() => {
      if (currentBootCount === bootCount) boot();
    }, 500);
    return;
  }

  // Prevent duplicate handlers when neither the player nor the video changed.
  if (currentBinding?.player === player && currentBinding.videoId === videoId) return;

  if (currentBinding) {
    currentBinding.player.removeEventListener("timeupdate", currentBinding.handler);
    currentBinding.player.removeEventListener("seeked", currentBinding.handler);
    currentBinding = null;
  }

  const segments = await loadSegments(videoId);

  // 3. Flawed race condition check replaced with strict boot counter
  if (currentBootCount !== bootCount) return;

  // Bail out if the player was swapped while we were waiting.
  if (
    getVideoId() !== videoId ||
    (document.querySelector(".html5-main-video") || document.querySelector("video")) !== player
  ) {
    return;
  }

  if (!Array.isArray(segments) || segments.length === 0) return;

  const checkSegments = () => {
    // Check if an ad is playing to prevent skipping ad content
    const isAdPlaying = player.closest('.ad-showing') !== null;
    if (isAdPlaying) return;

    const active = findActiveSegment(player.currentTime, segments);
    if (active) {
      player.currentTime = active.segment[1];
    }
  };

  // 4. Use both timeupdate and seeked for more reliable skipping
  player.addEventListener("timeupdate", checkSegments);
  player.addEventListener("seeked", checkSegments);
  
  currentBinding = { videoId, player, handler: checkSegments };
};

// Also listen to yt-page-data-updated which is more reliable for YouTube SPA
document.addEventListener("DOMContentLoaded", boot);
window.addEventListener("yt-navigate-finish", boot);
window.addEventListener("yt-page-data-updated", boot); 

window.addEventListener("beforeunload", () => {
  if (currentBinding) {
    currentBinding.player.removeEventListener("timeupdate", currentBinding.handler);
    currentBinding.player.removeEventListener("seeked", currentBinding.handler);
    currentBinding = null;
  }
});
