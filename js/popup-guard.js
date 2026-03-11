"use strict";

(function () {
  const SUPPORTED_PATTERNS = [
    /^https:\/\/[^/]*\.youtube\.com\//,
    /^https:\/\/www\.youtubekids\.com\//,
    /^https:\/\/www\.youtube-nocookie\.com\/embed\//,
    /^https:\/\/open\.spotify\.com\//
  ];

  function isSupported(url) {
    if (!url) return false;
    return SUPPORTED_PATTERNS.some(function (re) { return re.test(url); });
  }

  // Patch chrome.tabs.sendMessage to always handle lastError
  // This prevents "Unchecked runtime.lastError" in the popup context
  const _originalTabsSendMessage = chrome.tabs.sendMessage.bind(chrome.tabs);
  chrome.tabs.sendMessage = function (tabId, message, optionsOrCallback, maybeCallback) {
    let callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
    const options = typeof optionsOrCallback === "object" ? optionsOrCallback : undefined;

    const safeCallback = function (response) {
      // Always consume lastError to prevent "Unchecked runtime.lastError"
      void chrome.runtime.lastError;
      if (callback) {
        callback(response);
      }
    };

    if (options) {
      _originalTabsSendMessage(tabId, message, options, safeCallback);
    } else {
      _originalTabsSendMessage(tabId, message, safeCallback);
    }
  };

  // Patch chrome.runtime.sendMessage to always handle lastError
  const _originalRuntimeSendMessage = chrome.runtime.sendMessage.bind(chrome.runtime);
  chrome.runtime.sendMessage = function (extensionIdOrMessage, messageOrOptions, optionsOrCallback, maybeCallback) {
    // Determine argument pattern
    let callback;
    if (typeof extensionIdOrMessage === "object" && typeof messageOrOptions === "function") {
      // sendMessage(message, callback)
      callback = messageOrOptions;
    } else if (typeof messageOrOptions === "object" && typeof optionsOrCallback === "function") {
      // sendMessage(extensionId, message, callback) or sendMessage(message, options, callback)
      callback = optionsOrCallback;
    } else if (typeof maybeCallback === "function") {
      callback = maybeCallback;
    }

    const safeCallback = function (response) {
      // Always consume lastError to prevent "Unchecked runtime.lastError"
      void chrome.runtime.lastError;
      if (callback) {
        callback(response);
      }
    };

    // Re-invoke with original args but replace callback with safe version
    if (typeof extensionIdOrMessage === "string") {
      // sendMessage(extensionId, message, ...)
      if (typeof optionsOrCallback === "object") {
        _originalRuntimeSendMessage(extensionIdOrMessage, messageOrOptions, optionsOrCallback, safeCallback);
      } else {
        _originalRuntimeSendMessage(extensionIdOrMessage, messageOrOptions, safeCallback);
      }
    } else {
      // sendMessage(message, ...)
      if (typeof messageOrOptions === "object" && typeof messageOrOptions !== "function") {
        _originalRuntimeSendMessage(extensionIdOrMessage, messageOrOptions, safeCallback);
      } else {
        _originalRuntimeSendMessage(extensionIdOrMessage, safeCallback);
      }
    }
  };
})();
