(function () {
    'use strict';

    function versionHigher(newVersion, oldVersion) {
      const newVersionParts = newVersion.split(".");
      const oldVersionParts = oldVersion.split(".");
      if (newVersionParts.length !== oldVersionParts.length) return true;
      for (let i = 0; i < newVersionParts.length; i++) {
        const newVersionPart = parseInt(newVersionParts[i]);
        const oldVersionPart = parseInt(oldVersionParts[i]);
        if (newVersionPart > oldVersionPart) {
          return true;
        } else if (newVersionPart < oldVersionPart) {
          return false;
        }
      }
      return false;
    }

    var version = "1.1.48";

    const YT_DOMAINS = [
      "m.youtube.com",
      "www.youtube.com",
      "www.youtube-nocookie.com",
      "music.youtube.com",
      "www.youtubekids.com",
      "tv.youtube.com"
    ];

    function onMobile() {
      return typeof window !== "undefined" && (window.location.hostname === "m.youtube.com" || window.location.pathname.startsWith("/embed"));
    }
    function onYouTubeCableTV() {
      return typeof window !== "undefined" && window.location.hostname === "tv.youtube.com";
    }
    let onV3Extension = null;
    const initTime = performance.now();
    let lastCheck = performance.now();
    function isOnV3Extension(update = false) {
      if (lastCheck - initTime < 500) {
        update = true;
        lastCheck = performance.now();
      }
      if (onV3Extension === null || update && !onV3Extension) {
        onV3Extension = !!document.querySelector("head > .v3");
      }
      return onV3Extension;
    }

    !onMobile() ? "ytd-rich-grid-media, ytd-video-renderer, ytd-movie-renderer, ytd-compact-video-renderer, ytd-compact-radio-renderer, ytd-compact-movie-renderer, ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer, ytd-grid-video-renderer, ytd-grid-movie-renderer, ytd-rich-grid-slim-media, ytd-radio-renderer, ytd-reel-item-renderer, ytd-compact-playlist-renderer, ytd-playlist-renderer, ytd-grid-playlist-renderer, ytd-grid-show-renderer, ytd-structured-description-video-lockup-renderer, ytd-hero-playlist-thumbnail-renderer, yt-lockup-view-model, ytm-shorts-lockup-view-model, .lohp-large-shelf-container, .lohp-medium-shelf, .yt-lockup-video, .related-video" : "ytm-video-with-context-renderer, ytm-compact-radio-renderer, ytm-reel-item-renderer, ytm-channel-featured-video-renderer, ytm-compact-video-renderer, ytm-playlist-video-renderer, ytm-compact-playlist-renderer, ytm-video-card-renderer, ytm-vertical-list-renderer, ytm-playlist-panel-video-renderer, ytm-shorts-lockup-view-model, .autonav-endscreen-countdown-container, yt-page-header-view-model, yt-lockup-view-model";
    function getThumbnailElements() {
      if (!onMobile()) {
        return [
          "ytd-thumbnail",
          "ytd-playlist-thumbnail",
          "ytm-shorts-lockup-view-model",
          "yt-thumbnail-view-model",
          ".ux-thumb-wrap"
          // V3 extension
        ];
      } else {
        return [
          ".media-item-thumbnail-container",
          ".video-thumbnail-container-compact",
          "ytm-thumbnail-cover",
          ".video-thumbnail-container-vertical",
          "ytm-hero-playlist-thumbnail-renderer",
          "ytm-shorts-lockup-view-model",
          ".autonav-endscreen-countdown-container",
          "yt-content-preview-image-view-model",
          "yt-lockup-view-model"
        ];
      }
    }
    function getThumbnailElementsToListenFor() {
      const results = getThumbnailElements();
      if (!onMobile()) {
        results.push("yt-lockup-view-model");
        results.push("ytm-shorts-lockup-view-model-v2");
      }
      return results;
    }

    let lastArtworkSrc = null;
    let mediaSessionThumbnailWaitingTimeout = null;
    let mediaSessionThumbnailData = null;
    function setMediaSessionInfo(data) {
      if ("mediaSession" in navigator) {
        mediaSessionThumbnailData || (mediaSessionThumbnailData = {});
        mediaSessionThumbnailData = {
          ...mediaSessionThumbnailData,
          ...data
        };
        if (navigator.mediaSession.metadata?.artwork?.[0]?.src && !navigator.mediaSession.metadata.artwork[0].src.includes("dearrow-thumb")) {
          lastArtworkSrc = navigator.mediaSession.metadata.artwork[0].src;
        }
        if (checkIfDifference(navigator.mediaSession.metadata, mediaSessionThumbnailData)) {
          setMediaSessionWithDefaults(mediaSessionThumbnailData);
          if (mediaSessionThumbnailWaitingTimeout) {
            clearTimeout(mediaSessionThumbnailWaitingTimeout);
          }
          mediaSessionThumbnailWaitingTimeout = setTimeout(() => {
            if (mediaSessionThumbnailData && checkIfDifference(navigator.mediaSession.metadata, mediaSessionThumbnailData)) {
              setMediaSessionWithDefaults(mediaSessionThumbnailData);
            }
            mediaSessionThumbnailWaitingTimeout = null;
          }, 500);
        }
      }
    }
    function resetMediaSessionThumbnail() {
      if (lastArtworkSrc) {
        setMediaSessionInfo({
          title: (mediaSessionThumbnailData?.title ?? navigator.mediaSession.metadata?.title)?.trim(),
          artwork: [{
            src: lastArtworkSrc
          }]
        });
      }
    }
    function setMediaSessionWithDefaults(data) {
      if ("mediaSession" in navigator) {
        const newData = {
          ...copyMediaSession()
        };
        for (const key in data) {
          newData[key] = data[key];
        }
        if (newData.artwork?.[0]?.src && newData.artwork?.[0]?.src !== navigator.mediaSession.metadata?.artwork?.[0]?.src) {
          if (newData.title?.endsWith(" ")) {
            newData.title = newData.title.trim();
          } else {
            newData.title = newData.title + " ";
          }
        }
        navigator.mediaSession.metadata = new MediaMetadata(newData);
      }
    }
    function checkIfDifference(original, newData) {
      if (original && newData) {
        for (const key of Object.keys(newData)) {
          if (typeof newData[key] === "object" && checkIfDifference(original[key], newData[key])) {
            return true;
          } else if (original[key] !== newData[key]) {
            return true;
          }
        }
      }
      return false;
    }
    function copyMediaSession() {
      const copiedData = {
        ...navigator.mediaSession.metadata,
        artwork: [...navigator.mediaSession.metadata?.artwork ?? []]
      };
      if (copiedData.title === void 0) {
        return {
          title: navigator.mediaSession.metadata?.title ?? "",
          artist: navigator.mediaSession.metadata?.artist ?? "",
          album: navigator.mediaSession.metadata?.album ?? "",
          artwork: [...navigator.mediaSession.metadata?.artwork ?? []]
        };
      }
      return copiedData;
    }
    function resetLastArtworkSrc() {
      lastArtworkSrc = null;
    }

    function isVisible(element, ignoreWidth = false) {
      if (!element) {
        return false;
      }
      if (element.tagName === "VIDEO" && (element.classList.contains("html5-main-video") || element.id === "player" || element.id === "player_html5_api") && [...document.querySelectorAll("video")].filter((v) => v.duration).length === 1 && element.duration) {
        return true;
      }
      if (element.tagName === "VIDEO" && element.offsetHeight) {
        return true;
      }
      if (element.offsetHeight === 0 || element.offsetWidth === 0 && !ignoreWidth) {
        return false;
      }
      const boundingRect = element?.getBoundingClientRect();
      const elementAtPoint = document.elementFromPoint(
        boundingRect.left + boundingRect.width / 2,
        boundingRect.top + boundingRect.height / 2
      ) || document.elementFromPoint(boundingRect.left, boundingRect.top);
      if (!elementAtPoint && element.id === "movie_player" && boundingRect.top < 0) {
        return true;
      }
      if (elementAtPoint === element || !!elementAtPoint && element.contains(elementAtPoint) || !!elementAtPoint && elementAtPoint.contains(element)) {
        return true;
      }
      if (element.tagName === "VIDEO") {
        return !!elementAtPoint?.closest(".html5-video-player")?.contains(element) || !!element?.closest("#inline-preview-player")?.classList?.contains("playing-mode");
      }
      return false;
    }

    let playerClient;
    let lastVideo = "";
    let lastInline = false;
    let lastLive = false;
    const id = "sponsorblock";
    const elementsToListenFor = getThumbnailElementsToListenFor();
    const fetchUrlsToRead = [
      "/youtubei/v1/search",
      "/youtubei/v1/guide",
      "/youtubei/v1/browse",
      "/youtubei/v1/next",
      "/youtubei/v1/player"
    ];
    const ytInfoKeysToIgnore = [
      "videoDetails",
      "videoPrimaryInfoRenderer",
      "videoSecondaryInfoRenderer",
      "currentVideoEndpoint"
    ];
    const sendMessage = (message) => {
      window.postMessage({ source: id, ...message }, "/");
    };
    function setupPlayerClient(e) {
      const oldPlayerClient = playerClient;
      if (e.type === "ytu.app.lib.player.interaction-event") {
        const playerClientTemp = document.querySelector("#movie_player");
        if (playerClientTemp) {
          playerClient = document.querySelector("#movie_player");
          playerClient.querySelector("video")?.addEventListener("durationchange", sendVideoData);
          playerClient.querySelector("video")?.addEventListener("loadstart", sendVideoData);
        } else {
          return;
        }
      } else {
        playerClient = document.getElementById("movie_player");
      }
      sendVideoData();
      if (oldPlayerClient) {
        return;
      }
      playerClient.addEventListener("onAdStart", () => sendMessage({ type: "ad", playing: true }));
      playerClient.addEventListener("onAdFinish", () => sendMessage({ type: "ad", playing: false }));
    }
    function navigationParser(event) {
      const pageType = event.detail.pageType;
      if (pageType) {
        const result = { type: "navigation", pageType, videoID: null };
        if (pageType === "shorts" || pageType === "watch") {
          const endpoint = event.detail.endpoint;
          if (!endpoint) return null;
          result.videoID = (pageType === "shorts" ? endpoint.reelWatchEndpoint : endpoint.watchEndpoint).videoId;
        }
        return result;
      } else {
        return null;
      }
    }
    function navigationStartSend(event) {
      const message = navigationParser(event);
      if (message) {
        sendMessage(message);
      }
    }
    function navigateFinishSend(event) {
      sendVideoData();
      const videoDetails = (event.detail?.data ?? event.detail)?.response?.playerResponse?.videoDetails;
      if (videoDetails) {
        sendMessage({ channelID: videoDetails.channelId, channelTitle: videoDetails.author, ...navigationParser(event) });
      } else {
        const message = navigationParser(event);
        if (message) {
          sendMessage(message);
        }
      }
    }
    function sendVideoData() {
      if (!playerClient) return;
      const videoData = playerClient.getVideoData();
      const isInline = playerClient.isInline();
      if (videoData && (videoData.video_id !== lastVideo || lastLive !== videoData.isLive || lastInline !== isInline || isInline)) {
        lastVideo = videoData.video_id;
        lastInline = isInline;
        lastLive = videoData.isLive;
        sendMessage({
          type: "data",
          videoID: videoData.video_id,
          isLive: videoData.isLive,
          isPremiere: videoData.isPremiere,
          isInline
        });
      }
    }
    function onNewVideoIds(data) {
      sendMessage({
        type: "videoIDsLoaded",
        videoIDs: Array.from(findAllVideoIds(data))
      });
    }
    function findAllVideoIds(data) {
      const videoIds = /* @__PURE__ */ new Set();
      for (const key in data) {
        if (key === "videoId") {
          videoIds.add(data[key]);
        } else if (typeof data[key] === "object" && !ytInfoKeysToIgnore.includes(key)) {
          findAllVideoIds(data[key]).forEach((id2) => videoIds.add(id2));
        }
      }
      return videoIds;
    }
    function windowMessageListener(message) {
      if (message.data?.source) {
        if (message.data?.source === "dearrow-media-session") {
          setMediaSessionInfo(message.data.data);
        } else if (message.data?.source === "dearrow-reset-media-session-thumbnail") {
          resetMediaSessionThumbnail();
        } else if (message.data?.source === "sb-reset-media-session-link") {
          resetLastArtworkSrc();
        } else if (message.data?.source === "sb-verify-time") {
          const video = [...document.querySelectorAll("video")].filter((v) => isVisible(v))[0];
          if (playerClient && message.data?.rawTime === video?.currentTime && Math.abs(playerClient.getCurrentTime() - message.data?.time) > 0.1 && playerClient.getPlayerState() === 2) {
            sendMessage({
              type: "currentTimeWrong",
              playerTime: playerClient.getCurrentTime(),
              expectedTime: message.data?.time
            });
          }
        }
      }
    }
    const savedSetup = {
      browserFetch: null,
      browserPush: null,
      customElementDefine: null,
      waitingInterval: null
    };
    let hasSetupCustomElementListener = false;
    let hasSetupListener = false;
    let thumbnailMutationObserver = null;
    function init() {
      const shouldTearDown = document.querySelector("#sponsorblock-document-script")?.getAttribute?.("teardown") === "true";
      const versionBetter = window["versionCB"] && (!window["versionCB"] || versionHigher(version, window["versionCB"]));
      if (shouldTearDown || versionBetter) {
        window["teardownCB"]?.();
      } else if (window["versionCB"] && !versionHigher(version, window["versionCB"])) {
        return;
      }
      window["versionCB"] = version;
      window["teardownCB"] = teardown;
      if (!document.querySelector("#sponsorblock-document-script")) {
        const fakeDocScript = document.createElement("div");
        fakeDocScript.id = "sponsorblock-document-script";
        fakeDocScript.setAttribute("version", version);
        const head = document.head || document.documentElement;
        head.appendChild(fakeDocScript);
      }
      document.addEventListener("yt-player-updated", setupPlayerClient);
      document.addEventListener("yt-navigate-start", navigationStartSend);
      document.addEventListener("yt-navigate-finish", navigateFinishSend);
      if (document.location.host === "tv.youtube.com") {
        document.addEventListener("yt-navigate", navigateFinishSend);
        document.addEventListener("ytu.app.lib.player.interaction-event", setupPlayerClient);
        if (document.getElementById("#movie_player")) {
          setupPlayerClient({ target: document.getElementById("#movie_player")?.parentElement });
          sendVideoData();
        }
      }
      if (onMobile()) {
        window.addEventListener("state-navigateend", navigateFinishSend);
      }
      if (YT_DOMAINS.includes(window.location.host) && !onMobile() && !onYouTubeCableTV()) {
        if (!window.customElements) {
          createMutationObserver();
        } else {
          const notCreatedYetCheck = setTimeout(() => {
            if (!hasSetupCustomElementListener && !hasSetupListener) {
              createMutationObserver();
            }
          }, 2e3);
          const onV3Check = () => {
            if (!hasSetupListener && !hasSetupCustomElementListener && isOnV3Extension(true)) {
              hasSetupListener = true;
              createMutationObserver();
              clearTimeout(notCreatedYetCheck);
            }
          };
          setTimeout(() => onV3Check(), 100);
          setTimeout(() => onV3Check(), 1e3);
          const realCustomElementDefine = window.customElements.define.bind(window.customElements);
          savedSetup.customElementDefine = realCustomElementDefine;
          Object.defineProperty(window.customElements, "define", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: (name, constructor, options) => {
              let replacedConstructor = constructor;
              if (elementsToListenFor.includes(name)) {
                hasSetupCustomElementListener = true;
                if (thumbnailMutationObserver) {
                  thumbnailMutationObserver.disconnect();
                  thumbnailMutationObserver = null;
                }
                class WrappedThumbnail extends constructor {
                  constructor() {
                    super();
                    sendMessage({ type: "newElement", name });
                  }
                }
                replacedConstructor = WrappedThumbnail;
              }
              realCustomElementDefine(name, replacedConstructor, options);
            }
          });
        }
      }
      const browserFetch = window.fetch;
      savedSetup.browserFetch = browserFetch;
      window.fetch = (resource, init2 = void 0) => {
        if (!(resource instanceof Request) || !fetchUrlsToRead.some((u) => resource.url.includes(u))) {
          return browserFetch(resource, init2);
        }
        if (resource.url.includes("/youtubei/v1/next")) {
          setTimeout(() => sendMessage({ type: "newElement", name: "" }), 1e3);
          setTimeout(() => sendMessage({ type: "newElement", name: "" }), 2500);
          setTimeout(() => sendMessage({ type: "newElement", name: "" }), 8e3);
        }
        return new Promise(async (resolve, reject) => {
          try {
            const response = await browserFetch(resource, init2 = init2);
            const json = await response.json();
            resolve(new Response(JSON.stringify(json), response));
            onNewVideoIds(json);
          } catch (e) {
            reject(e);
          }
        });
      };
      let lastSentDuration = 0;
      const wrapper = (target, thisArg, args) => {
        if (args[0] && args[0] !== window && typeof args[0].start === "number" && args[0].end && args[0].namespace === "ssap" && args[0].id) {
          const videoData = args[0];
          if (videoData) {
            const adDuration = videoData.start;
            if (adDuration !== 0) {
              if (lastSentDuration !== adDuration) {
                lastSentDuration = adDuration;
                sendMessage({
                  type: "adDuration",
                  duration: adDuration / 1e3
                });
              }
            }
          }
        }
        return Reflect.apply(target, thisArg, args);
      };
      const handler = {
        apply: wrapper
      };
      savedSetup.browserPush = window.Array.prototype.push;
      window.Array.prototype.push = new Proxy(window.Array.prototype.push, handler);
      window.addEventListener("message", windowMessageListener);
      if (typeof ytInitialData !== "undefined") {
        onNewVideoIds(ytInitialData);
      } else {
        const waitingInterval = setInterval(() => {
          if (typeof ytInitialData !== "undefined") {
            onNewVideoIds(ytInitialData);
            clearInterval(waitingInterval);
          }
        }, 1);
        savedSetup.waitingInterval = waitingInterval;
      }
      setTimeout(() => {
        if (setInterval.toString().includes("console.log(SCRIPTID, 'original interval:', interval, location.href)")) {
          alert('Warning: You have the user script "YouTube CPU Tamer". This causes performance issues with SponsorBlock, and does not actually improve CPU performance. Please uninstall this user script.');
        }
      }, 1e3);
    }
    function teardown() {
      document.removeEventListener("yt-player-updated", setupPlayerClient);
      document.removeEventListener("yt-navigate-start", navigationStartSend);
      document.removeEventListener("yt-navigate-finish", navigateFinishSend);
      if (document.location.host === "tv.youtube.com") {
        document.removeEventListener("yt-navigate", navigateFinishSend);
        document.removeEventListener("ytu.app.lib.player.interaction-event", setupPlayerClient);
      }
      if (onMobile()) {
        window.removeEventListener("state-navigateend", navigateFinishSend);
      }
      if (savedSetup.browserFetch) {
        window.fetch = savedSetup.browserFetch;
      }
      if (savedSetup.browserPush) {
        window.Array.prototype.push = savedSetup.browserPush;
      }
      if (savedSetup.customElementDefine) {
        window.customElements.define = savedSetup.customElementDefine;
      }
      if (savedSetup.waitingInterval) {
        clearInterval(savedSetup.waitingInterval);
      }
      window.removeEventListener("message", windowMessageListener);
      window["teardownCB"] = null;
      hasSetupCustomElementListener = true;
      thumbnailMutationObserver?.disconnect?.();
    }
    function createMutationObserver() {
      if (thumbnailMutationObserver) {
        thumbnailMutationObserver.disconnect();
      }
      thumbnailMutationObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement) {
              for (const name of elementsToListenFor) {
                if (node.tagName.toLowerCase() === name || node.querySelector(name) || name.startsWith(".") && node.classList.contains(name.slice(1))) {
                  sendMessage({ type: "newElement", name });
                  return;
                }
              }
            }
          }
        }
      });
      thumbnailMutationObserver.observe(document.documentElement, { childList: true, subtree: true });
      for (const name of elementsToListenFor) {
        if (document.querySelector(name)) {
          sendMessage({ type: "newElement", name });
        }
      }
    }

    init();

})();
