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

  function isExtensionContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  // Patch chrome.tabs.sendMessage to always handle lastError
  // and guard against invalidated extension context
  const _originalTabsSendMessage = chrome.tabs.sendMessage.bind(chrome.tabs);
  chrome.tabs.sendMessage = function (tabId, message, optionsOrCallback, maybeCallback) {
    if (!isExtensionContextValid()) {
      const cb = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
      if (typeof cb === "function") cb(undefined);
      return;
    }

    let callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
    const options = typeof optionsOrCallback === "object" ? optionsOrCallback : undefined;

    const safeCallback = function (response) {
      try { void chrome.runtime.lastError; } catch (e) { /* context invalidated */ }
      if (callback) callback(response);
    };

    try {
      if (options) {
        _originalTabsSendMessage(tabId, message, options, safeCallback);
      } else {
        _originalTabsSendMessage(tabId, message, safeCallback);
      }
    } catch (e) {
      if (callback) callback(undefined);
    }
  };

  // Patch chrome.runtime.sendMessage to always handle lastError
  // and guard against invalidated extension context
  const _originalRuntimeSendMessage = chrome.runtime.sendMessage.bind(chrome.runtime);
  chrome.runtime.sendMessage = function (extensionIdOrMessage, messageOrOptions, optionsOrCallback, maybeCallback) {
    if (!isExtensionContextValid()) {
      let cb;
      if (typeof extensionIdOrMessage === "object" && typeof messageOrOptions === "function") {
        cb = messageOrOptions;
      } else if (typeof messageOrOptions === "object" && typeof optionsOrCallback === "function") {
        cb = optionsOrCallback;
      } else if (typeof maybeCallback === "function") {
        cb = maybeCallback;
      }
      if (typeof cb === "function") cb(undefined);
      return;
    }

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
      try { void chrome.runtime.lastError; } catch (e) { /* context invalidated */ }
      if (callback) callback(response);
    };

    // Re-invoke with original args but replace callback with safe version
    try {
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
    } catch (e) {
      if (callback) callback(undefined);
    }
  };
})();
