"use strict";

(function () {
  // ── Configuration ───────────────────────────────────────────────────────────
  const GITHUB_REPO   = "sbhushan01/OmniSponsorBlock";
  const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
  const RELEASES_URL   = `https://github.com/${GITHUB_REPO}/releases/latest`;

  // ── Show installed version ──────────────────────────────────────────────────
  const manifest = chrome.runtime.getManifest();
  const currentVersion = manifest.version;

  const versionBadge = document.getElementById("version-badge");
  if (versionBadge) {
    versionBadge.textContent = currentVersion;
  }

  // ── "Get Started" → open options page ──────────────────────────────────────
  const getStartedBtn = document.getElementById("get-started-btn");
  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", function () {
      chrome.runtime.sendMessage({ message: "openConfig" });
    });
  }

  // ── Auto-update check via GitHub Releases API ───────────────────────────────
  // Compares the installed version against the latest GitHub release and shows
  // a banner when a newer version is available.
  //
  // Version parts are compared numerically. Non-numeric parts (e.g. pre-release
  // suffixes like "1.0.0-beta") are treated as 0 so the comparison stays safe.
  function parseVersionParts(v) {
    return v
      .replace(/^v/, "")
      .split(".")
      .map(function (part) {
        const n = parseInt(part, 10);
        return isNaN(n) ? 0 : n;
      });
  }

  function versionIsNewer(latest, current) {
    const a = parseVersionParts(latest);
    const b = parseVersionParts(current);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const diff = (a[i] || 0) - (b[i] || 0);
      if (diff > 0) return true;
      if (diff < 0) return false;
    }
    return false;
  }

  fetch(GITHUB_API_URL)
    .then(function (res) {
      if (!res.ok) return null;
      return res.json();
    })
    .then(function (data) {
      if (!data || !data.tag_name) return;

      const latestVersion = data.tag_name;
      if (versionIsNewer(latestVersion, currentVersion)) {
        const banner = document.getElementById("update-banner");
        const link   = document.getElementById("update-link");
        if (banner && link) {
          link.href = data.html_url || RELEASES_URL;
          banner.classList.add("visible");
        }
      }
    })
    .catch(function () {
      // Network or API errors are silently ignored — the welcome page must
      // work even when the GitHub API is unavailable.
    });
})();
