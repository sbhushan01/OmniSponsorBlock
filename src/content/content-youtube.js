import { findActiveSegment } from "../shared/time.js";

const getVideoId = () => new URL(window.location.href).searchParams.get("v");
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

  // Prevent duplicate handlers and clean up discarded players.
  if (currentBinding?.player === player && currentBinding.videoId === videoId) return;
  if (currentBinding) {
    currentBinding.player.removeEventListener("timeupdate", currentBinding.handler);
    currentBinding = null;
  }

  const segments = await loadSegments(videoId);
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
