(function interceptSpotifyEpisodeData() {
  const originalFetch = window.fetch;
  const originalXHROpen = window.XMLHttpRequest.prototype.open;
  const originalXHRSend = window.XMLHttpRequest.prototype.send;
  let lastEpisodeId = null;

  const emitEpisodeId = (episodeId) => {
    if (!episodeId) return;
    if (episodeId === lastEpisodeId) return;
    lastEpisodeId = episodeId;
    window.postMessage({ type: "OMNI_SPOTIFY_EPISODE", episodeId }, "*");
  };

  const parseEpisodeIdFromText = (text) => {
    if (!text || typeof text !== "string") return null;
    const matchers = [
      /"episodeUri"\s*:\s*"spotify:episode:([a-zA-Z0-9]+)"/i,
      /"episodeId"\s*:\s*"([a-zA-Z0-9]+)"/i,
      /spotify:episode:([a-zA-Z0-9]+)/i
    ];
    for (const matcher of matchers) {
      const match = text.match(matcher);
      if (match?.[1]) return match[1];
    }
    return null;
  };

  const shouldInspect = (url) =>
    /spotify\.com|googleusercontent\.com/i.test(url || "");

  window.fetch = async (...args) => {
    const response = await originalFetch.apply(window, args);
    try {
      const url = String(args[0]?.url || args[0] || "");
      if (!shouldInspect(url)) return response;
      const cloned = response.clone();
      const text = await cloned.text();
      emitEpisodeId(parseEpisodeIdFromText(text));
    } catch (_error) {
      // Best-effort interceptor; skip failures silently.
    }
    return response;
  };

  window.XMLHttpRequest.prototype.open = function patchedOpen(method, url, ...rest) {
    this.__omniUrl = String(url || "");
    return originalXHROpen.call(this, method, url, ...rest);
  };

  window.XMLHttpRequest.prototype.send = function patchedSend(...args) {
    const onLoad = () => {
      try {
        if (!shouldInspect(this.__omniUrl)) return;
        if (typeof this.responseText !== "string") return;
        emitEpisodeId(parseEpisodeIdFromText(this.responseText));
      } catch (_error) {
        // Ignore parsing errors for unrelated XHR responses.
      }
    };
    this.addEventListener("load", onLoad, { once: true });
    return originalXHRSend.apply(this, args);
  };
})();
