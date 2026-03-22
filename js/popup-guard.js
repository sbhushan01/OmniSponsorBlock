"use strict";

(function () {
  function isExtensionContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  /** Chrome message options are objects; typeof null === "object" must be excluded. */
  function isSendOptions(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  // Patch chrome.tabs.sendMessage to always handle lastError
  // and guard against invalidated extension context
  const _originalTabsSendMessage = chrome.tabs.sendMessage.bind(chrome.tabs);
  chrome.tabs.sendMessage = function (tabId, message, optionsOrCallback, maybeCallback) {
    if (!isExtensionContextValid()) {
      const cb = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
      if (typeof cb === "function") {
        cb(undefined);
        return;
      }
      return Promise.resolve(undefined);
    }

    let callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
    const options = isSendOptions(optionsOrCallback) ? optionsOrCallback : undefined;

    if (typeof callback !== "function") {
      try {
        if (options !== undefined) {
          return _originalTabsSendMessage(tabId, message, options);
        }
        return _originalTabsSendMessage(tabId, message);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    const safeCallback = function (response) {
      try { void chrome.runtime.lastError; } catch (e) { /* context invalidated */ }
      callback(response);
    };

    try {
      if (options !== undefined) {
        _originalTabsSendMessage(tabId, message, options, safeCallback);
      } else {
        _originalTabsSendMessage(tabId, message, safeCallback);
      }
    } catch (e) {
      callback(undefined);
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
      } else if (isSendOptions(messageOrOptions) && typeof optionsOrCallback === "function") {
        cb = optionsOrCallback;
      } else if (typeof extensionIdOrMessage === "string" && typeof optionsOrCallback === "function") {
        cb = optionsOrCallback;
      } else if (typeof maybeCallback === "function") {
        cb = maybeCallback;
      }
      if (typeof cb === "function") {
        cb(undefined);
        return;
      }
      return Promise.resolve(undefined);
    }

    let callback;
    if (typeof extensionIdOrMessage === "object" && typeof messageOrOptions === "function") {
      callback = messageOrOptions;
    } else if (isSendOptions(messageOrOptions) && typeof optionsOrCallback === "function") {
      callback = optionsOrCallback;
    } else if (typeof extensionIdOrMessage === "string" && typeof optionsOrCallback === "function") {
      callback = optionsOrCallback;
    } else if (typeof maybeCallback === "function") {
      callback = maybeCallback;
    }

    if (typeof callback !== "function") {
      try {
        if (typeof extensionIdOrMessage === "string") {
          if (isSendOptions(optionsOrCallback)) {
            return _originalRuntimeSendMessage(extensionIdOrMessage, messageOrOptions, optionsOrCallback);
          }
          return _originalRuntimeSendMessage(extensionIdOrMessage, messageOrOptions);
        }
        if (isSendOptions(messageOrOptions)) {
          return _originalRuntimeSendMessage(extensionIdOrMessage, messageOrOptions);
        }
        return _originalRuntimeSendMessage(extensionIdOrMessage);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    const safeCallback = function (response) {
      try { void chrome.runtime.lastError; } catch (e) { /* context invalidated */ }
      callback(response);
    };

    try {
      if (typeof extensionIdOrMessage === "string") {
        if (isSendOptions(optionsOrCallback)) {
          _originalRuntimeSendMessage(extensionIdOrMessage, messageOrOptions, optionsOrCallback, safeCallback);
        } else {
          _originalRuntimeSendMessage(extensionIdOrMessage, messageOrOptions, safeCallback);
        }
      } else {
        if (isSendOptions(messageOrOptions)) {
          _originalRuntimeSendMessage(extensionIdOrMessage, messageOrOptions, safeCallback);
        } else {
          _originalRuntimeSendMessage(extensionIdOrMessage, safeCallback);
        }
      }
    } catch (e) {
      callback(undefined);
    }
  };
})();
