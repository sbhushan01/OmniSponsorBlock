(function () {
  'use strict';

  const API_BASE_URL = "https://sponsor.ajay.app";
  const CATEGORY_KEYS = [
    "sponsor",
    "selfpromo",
    "interaction",
    "intro",
    "outro",
    "preview",
    "filler",
    "music_offtopic"
  ];
  const DEFAULT_SETTINGS = {
    youtube: {
      sponsor: true,
      selfpromo: true,
      interaction: true,
      intro: true,
      outro: true,
      preview: true,
      filler: true,
      music_offtopic: true
    },
    spotify: {
      sponsor: true,
      selfpromo: true,
      interaction: true,
      intro: true,
      outro: true,
      preview: true,
      filler: true,
      music_offtopic: true
    }
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const getSettings = () => new Promise((resolve) => {
    chrome.storage.local.get(["settings"], (data) => {
      const merged = {
        youtube: { ...DEFAULT_SETTINGS.youtube, ...data.settings?.youtube || {} },
        spotify: { ...DEFAULT_SETTINGS.spotify, ...data.settings?.spotify || {} }
      };
      resolve(merged);
    });
  });
  const setSettings = (settings) => new Promise((resolve) => {
    chrome.storage.local.set({ settings: clone(settings) }, resolve);
  });

  var serverAddress = "https://sponsor.ajay.app";
  var testingServerAddress = "https://sponsor.ajay.app/test";
  var extensionImportList = {
  	chromium: [
  		"enamippconapkdmgfgjchkhakpfinmaj"
  	],
  	firefox: [
  		"deArrow@ajay.app",
  		"deArrowBETA@ajay.app"
  	],
  	safari: [
  		"app.ajay.dearrow.extension"
  	]
  };

  var CategorySkipOption$1 = /* @__PURE__ */ ((CategorySkipOption2) => {
    CategorySkipOption2[CategorySkipOption2["FallbackToDefault"] = -2] = "FallbackToDefault";
    CategorySkipOption2[CategorySkipOption2["Disabled"] = -1] = "Disabled";
    CategorySkipOption2[CategorySkipOption2["ShowOverlay"] = 0] = "ShowOverlay";
    CategorySkipOption2[CategorySkipOption2["ManualSkip"] = 1] = "ManualSkip";
    CategorySkipOption2[CategorySkipOption2["AutoSkip"] = 2] = "AutoSkip";
    return CategorySkipOption2;
  })(CategorySkipOption$1 || {});
  var NoticeVisibilityMode$1 = /* @__PURE__ */ ((NoticeVisibilityMode2) => {
    NoticeVisibilityMode2[NoticeVisibilityMode2["FullSize"] = 0] = "FullSize";
    NoticeVisibilityMode2[NoticeVisibilityMode2["MiniForAutoSkip"] = 1] = "MiniForAutoSkip";
    NoticeVisibilityMode2[NoticeVisibilityMode2["MiniForAll"] = 2] = "MiniForAll";
    NoticeVisibilityMode2[NoticeVisibilityMode2["FadedForAutoSkip"] = 3] = "FadedForAutoSkip";
    NoticeVisibilityMode2[NoticeVisibilityMode2["FadedForAll"] = 4] = "FadedForAll";
    return NoticeVisibilityMode2;
  })(NoticeVisibilityMode$1 || {});
  var SegmentListDefaultTab$1 = /* @__PURE__ */ ((SegmentListDefaultTab2) => {
    SegmentListDefaultTab2[SegmentListDefaultTab2["Segments"] = 0] = "Segments";
    SegmentListDefaultTab2[SegmentListDefaultTab2["Chapters"] = 1] = "Chapters";
    return SegmentListDefaultTab2;
  })(SegmentListDefaultTab$1 || {});

  let ProtoConfig$1 = class ProtoConfig {
    constructor(syncDefaults, localDefaults, migrateOldSyncFormats) {
      this.configLocalListeners = [];
      this.configSyncListeners = [];
      this.cachedSyncConfig = null;
      this.cachedLocalStorage = null;
      this.config = null;
      this.local = null;
      this.syncDefaults = syncDefaults;
      this.localDefaults = localDefaults;
      void this.setupConfig(migrateOldSyncFormats).then((result) => {
        this.config = result?.sync;
        this.local = result?.local;
      });
    }
    configProxy() {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "sync") {
          for (const key in changes) {
            this.cachedSyncConfig[key] = changes[key].newValue;
          }
          for (const callback of this.configSyncListeners) {
            callback(changes);
          }
        } else if (areaName === "local") {
          for (const key in changes) {
            this.cachedLocalStorage[key] = changes[key].newValue;
          }
          for (const callback of this.configLocalListeners) {
            callback(changes);
          }
        }
      });
      let lastSet = 0;
      const nextToUpdate = /* @__PURE__ */ new Set();
      let activeTimeout = null;
      const self = this;
      const syncHandler = {
        set(obj, prop, value) {
          self.cachedSyncConfig[prop] = value;
          if (Date.now() - lastSet < 100) {
            nextToUpdate.add(prop);
            if (!activeTimeout) {
              const delayUpdate = () => {
                const items = [...nextToUpdate];
                nextToUpdate.clear();
                void chrome.storage.sync.set(items.map((v) => [v, self.cachedSyncConfig[v]]).reduce((acc, [k, v]) => {
                  acc[k] = v;
                  return acc;
                }, {}));
                activeTimeout = null;
              };
              activeTimeout = setTimeout(delayUpdate, 20);
            }
            return true;
          }
          void chrome.storage.sync.set({
            [prop]: value
          });
          lastSet = Date.now();
          return true;
        },
        get(obj, prop) {
          const data = self.cachedSyncConfig[prop];
          return obj[prop] || data;
        },
        deleteProperty(obj, prop) {
          void chrome.storage.sync.remove(prop);
          return true;
        }
      };
      const localHandler = {
        set(obj, prop, value) {
          self.cachedLocalStorage[prop] = value;
          void chrome.storage.local.set({
            [prop]: value
          });
          return true;
        },
        get(obj, prop) {
          const data = self.cachedLocalStorage[prop];
          return obj[prop] || data;
        },
        deleteProperty(obj, prop) {
          void chrome.storage.local.remove(prop);
          return true;
        }
      };
      return {
        sync: new Proxy({ handler: syncHandler }, syncHandler),
        local: new Proxy({ handler: localHandler }, localHandler)
      };
    }
    forceSyncUpdate(prop) {
      const value = this.cachedSyncConfig[prop];
      void chrome.storage.sync.set({
        [prop]: value
      });
    }
    forceLocalUpdate(prop) {
      const value = this.cachedLocalStorage[prop];
      void chrome.storage.local.set({
        [prop]: value
      });
    }
    async fetchConfig() {
      await Promise.all([new Promise((resolve) => {
        chrome.storage.sync.get(null, (items) => {
          this.cachedSyncConfig = items;
          if (this.cachedSyncConfig === void 0) {
            this.cachedSyncConfig = {};
          }
          resolve();
        });
      }), new Promise((resolve) => {
        chrome.storage.local.get(null, (items) => {
          this.cachedLocalStorage = items ?? {};
          resolve();
        });
      })]);
    }
    async setupConfig(migrateOldSyncFormats) {
      if (typeof chrome === "undefined") return null;
      await this.fetchConfig();
      this.addDefaults();
      const result = this.configProxy();
      migrateOldSyncFormats(result.sync, result.local);
      return result;
    }
    // Add defaults
    addDefaults() {
      for (const key in this.syncDefaults) {
        if (!Object.prototype.hasOwnProperty.call(this.cachedSyncConfig, key)) {
          this.cachedSyncConfig[key] = this.syncDefaults[key];
        } else if (key === "barTypes") {
          for (const key2 in this.syncDefaults[key]) {
            if (!Object.prototype.hasOwnProperty.call(this.cachedSyncConfig[key], key2)) {
              this.cachedSyncConfig[key][key2] = this.syncDefaults[key][key2];
            }
          }
        }
      }
      for (const key in this.localDefaults) {
        if (!Object.prototype.hasOwnProperty.call(this.cachedLocalStorage, key)) {
          this.cachedLocalStorage[key] = this.localDefaults[key];
        }
      }
    }
    isReady() {
      return this.config !== null;
    }
  };
  function isSafari$1() {
    return typeof navigator !== "undefined" && navigator.vendor === "Apple Computer, Inc.";
  }
  function keybindEquals$1(first, second) {
    if (first == null || second == null || Boolean(first.alt) != Boolean(second.alt) || Boolean(first.ctrl) != Boolean(second.ctrl) || Boolean(first.shift) != Boolean(second.shift) || first.key == null && first.code == null || second.key == null && second.code == null)
      return false;
    if (first.code != null && second.code != null)
      return first.code === second.code;
    if (first.key != null && second.key != null)
      return first.key.toUpperCase() === second.key.toUpperCase();
    return false;
  }

  var PredicateOperator$1 = /* @__PURE__ */ ((PredicateOperator2) => {
    PredicateOperator2["And"] = "and";
    PredicateOperator2["Or"] = "or";
    return PredicateOperator2;
  })(PredicateOperator$1 || {});

  let ConfigClass$1 = class ConfigClass extends ProtoConfig$1 {
    resetToDefault() {
      chrome.storage.sync.set({
        ...this.syncDefaults,
        userID: this.config.userID,
        minutesSaved: this.config.minutesSaved,
        skipCount: this.config.skipCount,
        sponsorTimesContributed: this.config.sponsorTimesContributed
      });
      chrome.storage.local.set({
        ...this.localDefaults
      });
    }
  };
  function migrateOldSyncFormats$1(config, local) {
    if (local["skipRules"] && local["skipRules"].length !== 0 && local["skipRules"][0]["rules"]) {
      const output = [];
      for (const rule of local["skipRules"]) {
        const rules = rule["rules"];
        if (rules.length !== 0) {
          let predicate = {
            kind: "check",
            ...rules[0]
          };
          for (let i = 1; i < rules.length; i++) {
            predicate = {
              kind: "operator",
              operator: PredicateOperator$1.And,
              left: predicate,
              right: {
                kind: "check",
                ...rules[i]
              }
            };
          }
          const comment = rule["comment"];
          output.push({
            predicate,
            skipOption: rule.skipOption,
            comments: comment.length === 0 ? [] : comment.split(/;\s*/)
          });
        }
      }
      local["skipRules"] = output;
    }
    if (config["whitelistedChannels"]) {
      const whitelistedChannels = config["whitelistedChannels"];
      const skipProfileID = "default-whitelist";
      local.skipProfiles[skipProfileID] = {
        name: chrome.i18n.getMessage("WhitelistedChannels"),
        categorySelections: config.categorySelections.filter((s) => !["exclusive_access"].includes(s.name)).map((s) => ({
          name: s.name,
          option: CategorySkipOption$1.ShowOverlay
        })),
        fullVideoSegments: null,
        manualSkipOnFullVideo: null,
        minDuration: null
      };
      local.skipProfiles = local.skipProfiles;
      for (const channelID of whitelistedChannels) {
        local.channelSkipProfileIDs[channelID] = skipProfileID;
      }
      local.channelSkipProfileIDs = local.channelSkipProfileIDs;
      chrome.storage.sync.remove("whitelistedChannels");
    }
    if (config["showZoomToFillError"]) {
      chrome.storage.sync.remove("showZoomToFillError");
    }
    if (config["unsubmittedSegments"] && Object.keys(config["unsubmittedSegments"]).length > 0) {
      chrome.storage.local.set({
        unsubmittedSegments: config["unsubmittedSegments"]
      }, () => {
        chrome.storage.sync.remove("unsubmittedSegments");
      });
    }
    if (!config["chapterCategoryAdded"]) {
      config["chapterCategoryAdded"] = true;
      if (!config.categorySelections.some((s) => s.name === "chapter")) {
        config.categorySelections.push({
          name: "chapter",
          option: CategorySkipOption$1.ShowOverlay
        });
        config.categorySelections = config.categorySelections;
      }
    }
    if (config["exclusive_accessCategoryAdded"] !== void 0) {
      chrome.storage.sync.remove("exclusive_accessCategoryAdded");
    }
    if (config["fillerUpdate"] !== void 0) {
      chrome.storage.sync.remove("fillerUpdate");
    }
    if (config["highlightCategoryAdded"] !== void 0) {
      chrome.storage.sync.remove("highlightCategoryAdded");
    }
    if (config["highlightCategoryUpdate"] !== void 0) {
      chrome.storage.sync.remove("highlightCategoryUpdate");
    }
    if (config["askAboutUnlistedVideos"]) {
      chrome.storage.sync.remove("askAboutUnlistedVideos");
    }
    if (config["disableAutoSkip"]) {
      for (const selection of config.categorySelections) {
        if (selection.name === "sponsor") {
          selection.option = CategorySkipOption$1.ManualSkip;
          chrome.storage.sync.remove("disableAutoSkip");
        }
      }
    }
    if (typeof config["skipKeybind"] == "string") {
      config["skipKeybind"] = { key: config["skipKeybind"] };
    }
    if (typeof config["startSponsorKeybind"] == "string") {
      config["startSponsorKeybind"] = { key: config["startSponsorKeybind"] };
    }
    if (typeof config["submitKeybind"] == "string") {
      config["submitKeybind"] = { key: config["submitKeybind"] };
    }
    const keybinds = ["skipKeybind", "startSponsorKeybind", "submitKeybind"];
    for (let i = keybinds.length - 1; i >= 0; i--) {
      for (let j = 0; j < keybinds.length; j++) {
        if (i == j)
          continue;
        if (keybindEquals$1(config[keybinds[i]], config[keybinds[j]]))
          config[keybinds[i]] = null;
      }
    }
    if (config["sponsorVideoID"] !== void 0) {
      chrome.storage.sync.remove("sponsorVideoID");
    }
    if (config["previousVideoID"] !== void 0) {
      chrome.storage.sync.remove("previousVideoID");
    }
    if (config["lastIsVipUpdate"]) {
      chrome.storage.sync.remove("lastIsVipUpdate");
    }
  }
  const syncDefaults$1 = {
    userID: null,
    isVip: false,
    permissions: {},
    defaultCategory: "chooseACategory",
    segmentListDefaultTab: SegmentListDefaultTab$1.Segments,
    renderSegmentsAsChapters: false,
    forceChannelCheck: false,
    minutesSaved: 0,
    skipCount: 0,
    sponsorTimesContributed: 0,
    submissionCountSinceCategories: 0,
    showTimeWithSkips: true,
    disableSkipping: false,
    fullVideoSegments: true,
    fullVideoLabelsOnThumbnails: true,
    manualSkipOnFullVideo: false,
    trackViewCount: true,
    trackViewCountInPrivate: true,
    trackDownvotes: true,
    trackDownvotesInPrivate: false,
    dontShowNotice: false,
    showUpcomingNotice: false,
    noticeVisibilityMode: NoticeVisibilityMode$1.FadedForAutoSkip,
    hideVideoPlayerControls: false,
    hideInfoButtonPlayerControls: false,
    hideDeleteButtonPlayerControls: false,
    hideUploadButtonPlayerControls: false,
    hideSkipButtonPlayerControls: false,
    hideDiscordLaunches: 0,
    hideDiscordLink: false,
    serverAddress: serverAddress,
    minDuration: 0,
    skipNoticeDuration: 4,
    audioNotificationOnSkip: false,
    checkForUnlistedVideos: false,
    testingServer: false,
    ytInfoPermissionGranted: false,
    allowExpirements: true,
    showDonationLink: true,
    showPopupDonationCount: 0,
    showUpsells: true,
    showNewFeaturePopups: true,
    donateClicked: 0,
    autoHideInfoButton: true,
    scrollToEditTimeUpdate: false,
    // false means the tooltip will be shown
    categoryPillUpdate: false,
    hookUpdate: false,
    showChapterInfoMessage: true,
    darkMode: true,
    showCategoryGuidelines: true,
    showCategoryWithoutPermission: false,
    showSegmentNameInChapterBar: true,
    useVirtualTime: true,
    showSegmentFailedToFetchWarning: true,
    allowScrollingToEdit: true,
    showZoomToFillError2: true,
    cleanPopup: false,
    hideSegmentCreationInPopup: false,
    prideTheme: false,
    categoryPillColors: {},
    /**
     * Default keybinds should not set "code" as that's gonna be different based on the user's locale. They should also only use EITHER ctrl OR alt modifiers (or none).
     * Using ctrl+alt, or shift may produce a different character that we will not be able to recognize in different locales.
     * The exception for shift is letters, where it only capitalizes. So shift+A is fine, but shift+1 isn't.
     * Don't forget to add the new keybind to the checks in "KeybindDialogComponent.isKeybindAvailable()" and in "migrateOldFormats()"!
     *      TODO: Find a way to skip having to update these checks. Maybe storing keybinds in a Map?
     */
    skipKeybind: { key: "Enter" },
    skipToHighlightKeybind: { key: "Enter", ctrl: true },
    startSponsorKeybind: { key: ";" },
    submitKeybind: { key: "'" },
    actuallySubmitKeybind: { key: "'", ctrl: true },
    previewKeybind: { key: ";", ctrl: true },
    nextChapterKeybind: { key: "ArrowRight" },
    previousChapterKeybind: { key: "ArrowLeft" },
    closeSkipNoticeKeybind: { key: "Backspace" },
    downvoteKeybind: { key: "h", shift: true },
    upvoteKeybind: { key: "g", shift: true },
    categorySelections: [{
      name: "sponsor",
      option: CategorySkipOption$1.AutoSkip
    }, {
      name: "poi_highlight",
      option: CategorySkipOption$1.ManualSkip
    }, {
      name: "exclusive_access",
      option: CategorySkipOption$1.ShowOverlay
    }],
    colorPalette: {
      red: "#780303",
      white: "#ffffff",
      locked: "#ffc83d"
    },
    // Preview bar
    barTypes: {
      "preview-chooseACategory": {
        color: "#ffffff",
        opacity: "0.7"
      },
      "sponsor": {
        color: "#00d400",
        opacity: "0.7"
      },
      "preview-sponsor": {
        color: "#007800",
        opacity: "0.7"
      },
      "selfpromo": {
        color: "#ffff00",
        opacity: "0.7"
      },
      "preview-selfpromo": {
        color: "#bfbf35",
        opacity: "0.7"
      },
      "exclusive_access": {
        color: "#008a5c",
        opacity: "0.7"
      },
      "interaction": {
        color: "#cc00ff",
        opacity: "0.7"
      },
      "preview-interaction": {
        color: "#6c0087",
        opacity: "0.7"
      },
      "intro": {
        color: "#00ffff",
        opacity: "0.7"
      },
      "preview-intro": {
        color: "#008080",
        opacity: "0.7"
      },
      "outro": {
        color: "#0202ed",
        opacity: "0.7"
      },
      "preview-outro": {
        color: "#000070",
        opacity: "0.7"
      },
      "preview": {
        color: "#008fd6",
        opacity: "0.7"
      },
      "preview-preview": {
        color: "#005799",
        opacity: "0.7"
      },
      "hook": {
        color: "#395699",
        opacity: "0.8"
      },
      "preview-hook": {
        color: "#273963",
        opacity: "0.7"
      },
      "poi_highlight": {
        color: "#ff1684",
        opacity: "0.7"
      },
      "preview-poi_highlight": {
        color: "#9b044c",
        opacity: "0.7"
      },
      "filler": {
        color: "#7300FF",
        opacity: "0.9"
      },
      "preview-filler": {
        color: "#2E0066",
        opacity: "0.7"
      }
    }
  };
  const localDefaults$1 = {
    downvotedSegments: {},
    navigationApiAvailable: null,
    alreadyInstalled: false,
    unsubmittedSegments: {},
    skipRules: [],
    channelSkipProfileIDs: {},
    skipProfiles: {},
    skipProfileTemp: null
  };
  const Config$1 = new ConfigClass$1(syncDefaults$1, localDefaults$1, migrateOldSyncFormats$1);

  function NestedProxy(target) {
  	return new Proxy(target, {
  		get(target, prop) {
  			if (!target[prop]) {
  				return;
  			}

  			if (typeof target[prop] !== 'function') {
  				return new NestedProxy(target[prop]);
  			}

  			return (...arguments_) =>
  				new Promise((resolve, reject) => {
  					target[prop](...arguments_, result => {
  						if (chrome.runtime.lastError) {
  							reject(new Error(chrome.runtime.lastError.message));
  						} else {
  							resolve(result);
  						}
  					});
  				});
  		},
  	});
  }

  const chromeP$2 = globalThis.chrome && new NestedProxy(globalThis.chrome);

  // Copied from https://github.com/mozilla/gecko-dev/blob/073cc24f53d0cf31403121d768812146e597cc9d/toolkit/components/extensions/schemas/manifest.json#L487-L491
  const patternValidationRegex = /^(https?|wss?|file|ftp|\*):\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^file:\/\/\/.*$|^resource:\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^about:/;
  const isFirefox = globalThis.navigator?.userAgent.includes('Firefox/');
  const allStarsRegex = isFirefox
      ? /^(https?|wss?):[/][/][^/]+([/].*)?$/
      : /^https?:[/][/][^/]+([/].*)?$/;
  const allUrlsRegex = /^(https?|file|ftp):[/]+/;
  function assertValidPattern(matchPattern) {
      if (!isValidPattern(matchPattern)) {
          throw new Error(matchPattern + ' is an invalid pattern. See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns for more info.');
      }
  }
  function isValidPattern(matchPattern) {
      return matchPattern === '<all_urls>' || patternValidationRegex.test(matchPattern);
  }
  function getRawPatternRegex(matchPattern) {
      assertValidPattern(matchPattern);
      // Host undefined for file:///
      let [, protocol, host = '', pathname] = matchPattern.split(/(^[^:]+:[/][/])([^/]+)?/);
      protocol = protocol
          .replace('*', isFirefox ? '(https?|wss?)' : 'https?') // Protocol wildcard
          .replaceAll(/[/]/g, '[/]'); // Escape slashes
      if (host === '*') {
          host = '[^/]+';
      }
      host &&= host
          .replace(/^[*][.]/, '([^/]+.)*') // Initial wildcard
          .replaceAll(/[.]/g, '[.]') // Escape dots
          .replace(/[*]$/, '[^.]+'); // Last wildcard
      pathname = pathname
          .replaceAll(/[/]/g, '[/]') // Escape slashes
          .replaceAll(/[.]/g, '[.]') // Escape dots
          .replaceAll(/[*]/g, '.*'); // Any wildcard
      return '^' + protocol + host + '(' + pathname + ')?$';
  }
  function patternToRegex(...matchPatterns) {
      // No pattern, match nothing https://stackoverflow.com/q/14115522/288906
      if (matchPatterns.length === 0) {
          return /$./;
      }
      if (matchPatterns.includes('<all_urls>')) {
          return allUrlsRegex;
      }
      if (matchPatterns.includes('*://*/*')) {
          return allStarsRegex;
      }
      return new RegExp(matchPatterns.map(x => getRawPatternRegex(x)).join('|'));
  }

  const gotScripting = Boolean(globalThis.chrome?.scripting);
  function castAllFramesTarget(target) {
      if (typeof target === 'object') {
          return { ...target, allFrames: false };
      }
      return {
          tabId: target,
          frameId: undefined,
          allFrames: true,
      };
  }
  function castArray(possibleArray) {
      if (Array.isArray(possibleArray)) {
          return possibleArray;
      }
      return [possibleArray];
  }
  function normalizeFiles(files, seen = []) {
      return files
          .map(file => typeof file === 'string' ? { file } : file)
          .filter(content => {
          if ('code' in content) {
              return true;
          }
          const file = typeof content === 'string' ? content : content.file;
          if (seen.includes(file)) {
              console.debug(`Duplicated file not injected: ${file}`);
              return false;
          }
          seen.push(file);
          return true;
      });
  }
  function arrayOrUndefined(value) {
      return value === undefined ? undefined : [value];
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention -- It follows the native naming
  async function insertCSS({ tabId, frameId, files, allFrames, matchAboutBlank, runAt, }, { ignoreTargetErrors } = {}) {
      const normalizedFiles = normalizeFiles(files);
      const everyInsertion = Promise.all(normalizedFiles.map(async (content) => {
          if (gotScripting) {
              // One file at a time, according to the types
              return chrome.scripting.insertCSS({
                  target: {
                      tabId,
                      frameIds: arrayOrUndefined(frameId),
                      allFrames: frameId === undefined ? allFrames : undefined,
                  },
                  files: 'file' in content ? [content.file] : undefined,
                  css: 'code' in content ? content.code : undefined,
              });
          }
          return chromeP$2.tabs.insertCSS(tabId, {
              ...content,
              matchAboutBlank,
              allFrames,
              frameId,
              runAt: runAt ?? 'document_start', // CSS should prefer `document_start` when unspecified
          });
      }));
      if (ignoreTargetErrors) {
          await catchTargetInjectionErrors(everyInsertion);
      }
      else {
          await everyInsertion;
      }
  }
  function assertNoCode(files) {
      if (files.some(content => 'code' in content)) {
          throw new Error('chrome.scripting does not support injecting strings of `code`');
      }
  }
  async function executeScript({ tabId, frameId, files, allFrames, matchAboutBlank, runAt, }, { ignoreTargetErrors } = {}) {
      const normalizedFiles = normalizeFiles(files);
      if (gotScripting) {
          assertNoCode(normalizedFiles);
          const injection = chrome.scripting.executeScript({
              target: {
                  tabId,
                  frameIds: arrayOrUndefined(frameId),
                  allFrames: frameId === undefined ? allFrames : undefined,
              },
              files: normalizedFiles.map(({ file }) => file),
          });
          if (ignoreTargetErrors) {
              await catchTargetInjectionErrors(injection);
          }
          else {
              await injection;
          }
          // Don't return `injection`; the "return value" of a file is generally not useful
          return;
      }
      // Don't use .map(), `code` injections can't be "parallel"
      const executions = [];
      for (const content of normalizedFiles) {
          // Files are executed in order, but `code` isn’t, so it must await the last script before injecting more
          if ('code' in content) {
              // eslint-disable-next-line no-await-in-loop, n/no-unsupported-features/es-syntax -- On purpose, see above
              await executions.at(-1);
          }
          executions.push(chromeP$2.tabs.executeScript(tabId, {
              ...content,
              matchAboutBlank,
              allFrames,
              frameId,
              runAt,
          }));
      }
      if (ignoreTargetErrors) {
          await catchTargetInjectionErrors(Promise.all(executions));
      }
      else {
          await Promise.all(executions);
      }
  }
  async function injectContentScript(where, scripts, options = {}) {
      const targets = castArray(where);
      await Promise.all(targets.map(async (target) => injectContentScriptInSpecificTarget(castAllFramesTarget(target), scripts, options)));
  }
  async function injectContentScriptInSpecificTarget({ frameId, tabId, allFrames }, scripts, options = {}) {
      const seen = [];
      const injections = castArray(scripts).flatMap(script => {
          const css = normalizeFiles(script.css ?? [], seen);
          const js = normalizeFiles(script.js ?? [], seen);
          return [
              css.length > 0 && insertCSS({
                  tabId,
                  frameId,
                  allFrames,
                  files: css,
                  matchAboutBlank: script.matchAboutBlank ?? script.match_about_blank,
                  runAt: script.runAt ?? script.run_at,
              }, options),
              js.length > 0 && executeScript({
                  tabId,
                  frameId,
                  allFrames,
                  files: js,
                  matchAboutBlank: script.matchAboutBlank ?? script.match_about_blank,
                  runAt: script.runAt ?? script.run_at,
              }, options),
          ];
      });
      await Promise.all(injections);
  }
  const targetErrors = /^No frame with id \d+ in tab \d+.$|^No tab with id: \d+.$|^The tab was closed.$|^The frame was removed.$/;
  async function catchTargetInjectionErrors(promise) {
      try {
          await promise;
      }
      catch (error) {
          // @ts-expect-error Optional chaining is good enough
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          if (!targetErrors.test(error?.message)) {
              throw error;
          }
      }
  }

  const noMatchesError = 'Type error for parameter contentScriptOptions (Error processing matches: Array requires at least 1 items; you have 0) for contentScripts.register.';
  const noPermissionError = 'Permission denied to register a content script for ';
  const gotNavigation = typeof chrome === 'object' && 'webNavigation' in chrome;
  async function isOriginPermitted(url) {
      return chromeP$2.permissions.contains({
          origins: [new URL(url).origin + '/*'],
      });
  }
  // The callback is only used by webextension-polyfill
  async function registerContentScript(contentScriptOptions, callback) {
      const { js = [], css = [], matchAboutBlank, matches = [], excludeMatches, runAt, } = contentScriptOptions;
      let { allFrames } = contentScriptOptions;
      if (gotNavigation) {
          allFrames = false;
      }
      else if (allFrames) {
          console.warn('`allFrames: true` requires the `webNavigation` permission to work correctly: https://github.com/fregante/content-scripts-register-polyfill#permissions');
      }
      if (matches.length === 0) {
          throw new Error(noMatchesError);
      }
      await Promise.all(matches.map(async (pattern) => {
          if (!await chromeP$2.permissions.contains({ origins: [pattern] })) {
              throw new Error(noPermissionError + pattern);
          }
      }));
      const matchesRegex = patternToRegex(...matches);
      const excludeMatchesRegex = patternToRegex(...excludeMatches !== null && excludeMatches !== void 0 ? excludeMatches : []);
      const inject = async (url, tabId, frameId = 0) => {
          if (!matchesRegex.test(url) // Manual `matches` glob matching
              || excludeMatchesRegex.test(url) // Manual `exclude_matches` glob matching
              || !await isOriginPermitted(url) // Without this, we might have temporary access via accessTab
          ) {
              return;
          }
          await injectContentScript({
              tabId,
              frameId,
          }, {
              css,
              js,
              matchAboutBlank,
              runAt,
          }, {
              ignoreTargetErrors: true,
          });
      };
      const tabListener = async (tabId, { status }, { url }) => {
          // Only status updates are relevant
          // No URL = no permission
          if (status === 'loading' && url) {
              void inject(url, tabId);
          }
      };
      const navListener = async ({ tabId, frameId, url, }) => {
          void inject(url, tabId, frameId);
      };
      if (gotNavigation) {
          chrome.webNavigation.onCommitted.addListener(navListener);
      }
      else {
          chrome.tabs.onUpdated.addListener(tabListener);
      }
      const registeredContentScript = {
          async unregister() {
              if (gotNavigation) {
                  chrome.webNavigation.onCommitted.removeListener(navListener);
              }
              else {
                  chrome.tabs.onUpdated.removeListener(tabListener);
              }
          },
      };
      if (typeof callback === 'function') {
          callback(registeredContentScript);
      }
      return registeredContentScript;
  }

  /// <reference path="./globals.d.ts" />
  // The .js extension is required to create ESM-compatible file
  if (typeof chrome === 'object' && !chrome.contentScripts) {
      chrome.contentScripts = { register: registerContentScript };
  }

  async function waitFor$1(condition, timeout = 5e3, check = 100, predicate) {
    return await new Promise((resolve, reject) => {
      let interval = null;
      const intervalCheck = () => {
        const result = condition();
        if (result) {
          resolve(result);
          if (interval) clearInterval(interval);
        }
      };
      if (timeout) {
        setTimeout(() => {
          clearInterval(interval);
          reject(`TIMEOUT waiting for ${condition?.toString()}: ${Error().stack}`);
        }, timeout);
        interval = setInterval(intervalCheck, check);
      }
      intervalCheck();
    });
  }
  function objectToURI$1(url, data, includeQuestionMark) {
    let counter = 0;
    for (const key in data) {
      const seperator = url.includes("?") || counter > 0 ? "&" : "?" ;
      const value = typeof data[key] === "string" ? data[key] : JSON.stringify(data[key]);
      url += seperator + encodeURIComponent(key) + "=" + encodeURIComponent(value);
      counter++;
    }
    return url;
  }
  const onFirefoxOrSafari$1 = typeof chrome !== "undefined" && !!chrome.runtime?.getManifest()?.browser_specific_settings;
  typeof chrome !== "undefined" && !!chrome.runtime?.getManifest()?.browser_specific_settings?.gecko;
  function isFirefoxOrSafari$1() {
    return onFirefoxOrSafari$1;
  }

  async function getHash$1(value, times = 5e3) {
    if (times <= 0) return "";
    if (!("subtle" in crypto)) {
      return new Promise((resolve, reject) => chrome.runtime.sendMessage({
        message: "getHash",
        value,
        times
      }, (response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      }));
    }
    let hashHex = value;
    for (let i = 0; i < times; i++) {
      const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashHex).buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return hashHex;
  }

  async function sendRealRequestToCustomServer$1(type, url, data = {}, headers = {}) {
    if (type.toLowerCase() === "get") {
      url = objectToURI$1(url, data);
      data = null;
    }
    const response = await fetch(url, {
      method: type,
      headers: {
        "Content-Type": "application/json",
        ...headers || {}
      },
      redirect: "follow",
      body: data ? JSON.stringify(data) : null
    });
    return response;
  }
  function isSerializable$1(value) {
    try {
      window.structuredClone(value);
      return true;
    } catch {
      return false;
    }
  }
  function serializeOrStringify$1(value) {
    return isSerializable$1(value) ? value : "toString" in value && typeof value.toString === "function" ? value.toString() : String(value);
  }
  function setupBackgroundRequestProxy$1() {
    if (globalThis.__OSB_PROXY_SETUP) return;
    globalThis.__OSB_PROXY_SETUP = true;
    chrome.runtime.onMessage.addListener((request, sender, callback) => {
      if (request.message === "sendRequest") {
        sendRealRequestToCustomServer$1(request.type, request.url, request.data, request.headers).then(async (response) => {
          const buffer = request.binary ? isFirefoxOrSafari$1() && !isSafari$1() ? await response.blob() : Array.from(new Uint8Array(await response.arrayBuffer())) : null;
          callback({
            responseText: !request.binary ? await response.text() : "",
            responseBinary: buffer,
            headers: request.returnHeaders && response.headers ? [...response.headers.entries()].reduce(
              (acc, [key, value]) => {
                acc[key] = value;
                return acc;
              },
              {}
            ) : null,
            status: response.status,
            ok: response.ok
          });
        }).catch((error) => {
          console.error("Proxied request failed:", error);
          callback({
            error: serializeOrStringify$1(error)
          });
        });
        return true;
      }
      if (request.message === "getHash") {
        getHash$1(request.value, request.times).then(callback).catch((e) => {
          console.error("Hash request failed:", e);
          callback({
            error: serializeOrStringify$1(e)
          });
        });
        return true;
      }
      return false;
    });
  }

  function onTabUpdatedListener$1(tabId) {
    chrome.tabs.sendMessage(tabId, {
      message: "update"
    }, () => void chrome.runtime.lastError);
  }
  function onNavigationApiAvailableChange$1(changes) {
    if (changes.navigationApiAvailable) {
      if (changes.navigationApiAvailable.newValue) {
        chrome.tabs.onUpdated.removeListener(onTabUpdatedListener$1);
      } else {
        chrome.tabs.onUpdated.addListener(onTabUpdatedListener$1);
      }
    }
  }
  function setupTabUpdates$1(config) {
    chrome.tabs.onUpdated.addListener(onTabUpdatedListener$1);
    void waitFor$1(() => config.local !== null).then(() => {
      if (config.local.navigationApiAvailable) {
        chrome.tabs.onUpdated.removeListener(onTabUpdatedListener$1);
      }
    });
    if (!config.configSyncListeners.includes(onNavigationApiAvailableChange$1)) {
      config.configSyncListeners.push(onNavigationApiAvailableChange$1);
    }
  }

  function generateUserID$1(length = 36) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const cryptoFuncs = typeof window === "undefined" ? crypto : window.crypto;
    if (cryptoFuncs && cryptoFuncs.getRandomValues) {
      const values = new Uint32Array(length);
      cryptoFuncs.getRandomValues(values);
      for (let i = 0; i < length; i++) {
        result += charset[values[i] % charset.length];
      }
      return result;
    } else {
      for (let i = 0; i < length; i++) {
        result += charset[Math.floor(Math.random() * charset.length)];
      }
      return result;
    }
  }

  const chromeP$1 = typeof browser === "undefined" ? typeof chrome !== "undefined" ? chrome : null : browser;

  const popupPort$1 = {};
  const contentScriptRegistrations$1 = {};
  setupBackgroundRequestProxy$1();
  setupTabUpdates$1(Config$1);
  if (!globalThis.__OSB_MAIN_ONMESSAGE) {
    globalThis.__OSB_MAIN_ONMESSAGE = true;
    chrome.runtime.onMessage.addListener(function(request, sender, callback) {
      switch (request.message) {
        case "openConfig":
          chrome.tabs.create({ url: chrome.runtime.getURL("options/options.html" + (request.hash ? "#" + request.hash : "")) });
          return false;
        case "openHelp":
          chrome.tabs.create({ url: chrome.runtime.getURL("welcome/welcome.html") });
          return false;
        case "openPage":
          chrome.tabs.create({ url: chrome.runtime.getURL(request.url) });
          return false;
        case "submitVote":
          submitVote$1(request.type, request.UUID, request.category, request.videoID).then(callback);
          return true;
        case "registerContentScript":
          registerFirefoxContentScript$1(request);
          return false;
        case "unregisterContentScript":
          unregisterFirefoxContentScript$1(request.id);
          return false;
        case "tabs": {
          chrome.tabs.query({
            active: true,
            currentWindow: true
          }, (tabs) => {
            chrome.tabs.sendMessage(
              tabs[0].id,
              request.data,
              (response) => {
                callback(response);
              }
            );
          });
          return true;
        }
        case "time":
        case "infoUpdated":
        case "videoChanged":
          if (sender.tab) {
            try {
              popupPort$1[sender.tab.id]?.postMessage(request);
            } catch (e) {
            }
          }
          return false;
        default:
          return false;
      }
    });
  }
  if (!globalThis.__OSB_MAIN_ONCONNECT) {
    globalThis.__OSB_MAIN_ONCONNECT = true;
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === "popup") {
        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, (tabs) => {
          popupPort$1[tabs[0].id] = port;
        });
      }
    });
  }

  async function registerFirefoxContentScript$1(options) {
    if ("scripting" in chrome && "getRegisteredContentScripts" in chrome.scripting) {
      const existingRegistrations = await chromeP$1.scripting.getRegisteredContentScripts({
        ids: [options.id]
      }).catch(() => []);
      if (existingRegistrations && existingRegistrations.length > 0 && options.matches.every((match) => existingRegistrations[0].matches.includes(match))) {
        return;
      }
    }
    await unregisterFirefoxContentScript$1(options.id);
    if ("scripting" in chrome && "getRegisteredContentScripts" in chrome.scripting) {
      await chromeP$1.scripting.registerContentScripts([{
        id: options.id,
        runAt: "document_start",
        matches: options.matches,
        allFrames: options.allFrames,
        js: options.js,
        css: options.css,
        persistAcrossSessions: true
      }]);
    } else {
      chrome.contentScripts.register({
        allFrames: options.allFrames,
        js: options.js?.map?.((file) => ({ file })),
        css: options.css?.map?.((file) => ({ file })),
        matches: options.matches
      }).then((registration) => void (contentScriptRegistrations$1[options.id] = registration));
    }
  }
  async function unregisterFirefoxContentScript$1(id) {
    if ("scripting" in chrome && "getRegisteredContentScripts" in chrome.scripting) {
      try {
        await chromeP$1.scripting.unregisterContentScripts({
          ids: [id]
        });
      } catch (e) {
      }
    } else {
      if (contentScriptRegistrations$1[id]) {
        contentScriptRegistrations$1[id].unregister();
        delete contentScriptRegistrations$1[id];
      }
    }
  }
  async function submitVote$1(type, UUID, category, videoID) {
    let userID = Config$1.config.userID;
    if (userID == void 0 || userID === "undefined") {
      userID = generateUserID$1();
      Config$1.config.userID = userID;
    }
    const typeSection = type !== void 0 ? "&type=" + type : "&category=" + category;
    try {
      const response = await asyncRequestToServer$2("POST", "/api/voteOnSponsorTime?UUID=" + UUID + "&videoID=" + videoID + "&userID=" + userID + typeSection);
      return {
        status: response.status,
        ok: response.ok,
        responseText: await response.text()
      };
    } catch (e) {
      console.error("Error while voting:", e);
      return {
        error: serializeOrStringify$1(e)
      };
    }
  }
  async function asyncRequestToServer$2(type, address, data = {}) {
    const serverAddress = Config$1.config.testingServer ? testingServerAddress : Config$1.config.serverAddress;
    return await sendRealRequestToCustomServer$1(type, serverAddress + address, data);
  }

  var invidiousList = [
  	"www.youtubekids.com",
  	"inv.nadeko.net",
  	"invidious.f5.si",
  	"invidious.nerdvpn.de",
  	"yt.chocolatemoo53.com"
  ];

  var CategorySkipOption = /* @__PURE__ */ ((CategorySkipOption2) => {
    CategorySkipOption2[CategorySkipOption2["FallbackToDefault"] = -2] = "FallbackToDefault";
    CategorySkipOption2[CategorySkipOption2["Disabled"] = -1] = "Disabled";
    CategorySkipOption2[CategorySkipOption2["ShowOverlay"] = 0] = "ShowOverlay";
    CategorySkipOption2[CategorySkipOption2["ManualSkip"] = 1] = "ManualSkip";
    CategorySkipOption2[CategorySkipOption2["AutoSkip"] = 2] = "AutoSkip";
    return CategorySkipOption2;
  })(CategorySkipOption || {});
  var SponsorHideType = /* @__PURE__ */ ((SponsorHideType2) => {
    SponsorHideType2[SponsorHideType2["Visible"] = void 0] = "Visible";
    SponsorHideType2[SponsorHideType2["Downvoted"] = 1] = "Downvoted";
    SponsorHideType2[SponsorHideType2["MinimumDuration"] = 2] = "MinimumDuration";
    SponsorHideType2[SponsorHideType2["Hidden"] = 3] = "Hidden";
    return SponsorHideType2;
  })(SponsorHideType || {});
  var NoticeVisibilityMode = /* @__PURE__ */ ((NoticeVisibilityMode2) => {
    NoticeVisibilityMode2[NoticeVisibilityMode2["FullSize"] = 0] = "FullSize";
    NoticeVisibilityMode2[NoticeVisibilityMode2["MiniForAutoSkip"] = 1] = "MiniForAutoSkip";
    NoticeVisibilityMode2[NoticeVisibilityMode2["MiniForAll"] = 2] = "MiniForAll";
    NoticeVisibilityMode2[NoticeVisibilityMode2["FadedForAutoSkip"] = 3] = "FadedForAutoSkip";
    NoticeVisibilityMode2[NoticeVisibilityMode2["FadedForAll"] = 4] = "FadedForAll";
    return NoticeVisibilityMode2;
  })(NoticeVisibilityMode || {});
  var SegmentListDefaultTab = /* @__PURE__ */ ((SegmentListDefaultTab2) => {
    SegmentListDefaultTab2[SegmentListDefaultTab2["Segments"] = 0] = "Segments";
    SegmentListDefaultTab2[SegmentListDefaultTab2["Chapters"] = 1] = "Chapters";
    return SegmentListDefaultTab2;
  })(SegmentListDefaultTab || {});

  async function waitFor(condition, timeout = 5e3, check = 100, predicate) {
    return await new Promise((resolve, reject) => {
      let interval = null;
      const intervalCheck = () => {
        const result = condition();
        if (result) {
          resolve(result);
          if (interval) clearInterval(interval);
        }
      };
      if (timeout) {
        setTimeout(() => {
          clearInterval(interval);
          reject(`TIMEOUT waiting for ${condition?.toString()}: ${Error().stack}`);
        }, timeout);
        interval = setInterval(intervalCheck, check);
      }
      intervalCheck();
    });
  }
  function objectToURI(url, data, includeQuestionMark) {
    let counter = 0;
    for (const key in data) {
      const seperator = url.includes("?") || counter > 0 ? "&" : "?" ;
      const value = typeof data[key] === "string" ? data[key] : JSON.stringify(data[key]);
      url += seperator + encodeURIComponent(key) + "=" + encodeURIComponent(value);
      counter++;
    }
    return url;
  }
  const onFirefoxOrSafari = typeof chrome !== "undefined" && !!chrome.runtime.getManifest().browser_specific_settings;
  typeof chrome !== "undefined" && !!chrome.runtime.getManifest().browser_specific_settings?.gecko;
  function isFirefoxOrSafari() {
    return onFirefoxOrSafari;
  }

  class ProtoConfig {
    constructor(syncDefaults, localDefaults, migrateOldSyncFormats, inDeArrow = false) {
      this.configLocalListeners = [];
      this.configSyncListeners = [];
      this.cachedSyncConfig = null;
      this.cachedLocalStorage = null;
      this.config = null;
      this.local = null;
      this.inDeArrow = false;
      this.ignoreLocal = false;
      this.syncDefaults = syncDefaults;
      this.localDefaults = localDefaults ?? {};
      this.ignoreLocal = localDefaults === null;
      this.inDeArrow = inDeArrow;
      void this.setupConfig(migrateOldSyncFormats).then((result) => {
        this.config = result?.sync;
        this.local = result?.local;
      });
    }
    configProxy() {
      chrome.storage.sync.onChanged.addListener((changes) => {
        for (const key in changes) {
          this.cachedSyncConfig[key] = changes[key].newValue;
        }
        for (const callback of this.configSyncListeners) {
          callback(changes);
        }
      });
      if (!this.ignoreLocal) {
        chrome.storage.local.onChanged.addListener((changes) => {
          for (const key in changes) {
            this.cachedLocalStorage[key] = changes[key].newValue;
          }
          for (const callback of this.configLocalListeners) {
            callback(changes);
          }
        });
      }
      let lastSet = 0;
      const nextToUpdate = /* @__PURE__ */ new Set();
      let activeTimeout = null;
      const self = this;
      const syncHandler = {
        set(obj, prop, value) {
          self.cachedSyncConfig[prop] = value;
          if (Date.now() - lastSet < 100) {
            nextToUpdate.add(prop);
            if (!activeTimeout) {
              const delayUpdate = () => {
                const items = [...nextToUpdate];
                nextToUpdate.clear();
                void chrome.storage.sync.set(items.map((v) => [v, self.cachedSyncConfig[v]]).reduce((acc, [k, v]) => {
                  acc[k] = v;
                  return acc;
                }, {}));
                activeTimeout = null;
              };
              activeTimeout = setTimeout(delayUpdate, 20);
            }
            return true;
          }
          void chrome.storage.sync.set({
            [prop]: value
          });
          lastSet = Date.now();
          return true;
        },
        get(obj, prop) {
          const data = self.cachedSyncConfig[prop];
          return obj[prop] || data;
        },
        deleteProperty(obj, prop) {
          void chrome.storage.sync.remove(prop);
          return true;
        }
      };
      const localHandler = {
        set(obj, prop, value) {
          self.cachedLocalStorage[prop] = value;
          void chrome.storage.local.set({
            [prop]: value
          });
          return true;
        },
        get(obj, prop) {
          const data = self.cachedLocalStorage[prop];
          return obj[prop] || data;
        },
        deleteProperty(obj, prop) {
          void chrome.storage.local.remove(prop);
          return true;
        }
      };
      return {
        sync: new Proxy({ handler: syncHandler }, syncHandler),
        local: new Proxy({ handler: localHandler }, localHandler)
      };
    }
    forceSyncUpdate(prop) {
      const value = this.cachedSyncConfig[prop];
      void chrome.storage.sync.set({
        [prop]: value
      });
    }
    forceLocalUpdate(prop) {
      const value = this.cachedLocalStorage[prop];
      void chrome.storage.local.set({
        [prop]: value
      }, () => {
        const error = chrome.runtime.lastError;
        if (error && prop !== "navigationApiAvailable") {
          alert(`SponsorBlock/DeArrow: ${chrome.i18n.getMessage("storageFull")}

${error}`);
        }
      });
    }
    async fetchConfig() {
      await Promise.all([new Promise((resolve) => {
        chrome.storage.sync.get(null, (items) => {
          this.cachedSyncConfig = items;
          if (this.cachedSyncConfig === void 0) {
            this.cachedSyncConfig = {};
            if (this.inDeArrow || window.location.href.includes("options.html")) {
              alert(`${chrome.i18n.getMessage("syncDisabledWarning")}${this.inDeArrow ? `

${chrome.i18n.getMessage("syncDisabledWarningDeArrow")}` : ``}${isFirefoxOrSafari() && !isSafari() ? `

${chrome.i18n.getMessage("syncDisabledFirefoxSuggestions")}` : ``}`);
            }
          }
          resolve();
        });
      }), new Promise((resolve) => {
        if (!this.ignoreLocal) {
          chrome.storage.local.get(null, (items) => {
            this.cachedLocalStorage = items ?? {};
            resolve();
          });
        } else {
          resolve();
        }
      })]);
    }
    async setupConfig(migrateOldSyncFormats) {
      if (typeof chrome === "undefined") return null;
      await this.fetchConfig();
      this.addDefaults();
      const result = this.configProxy();
      migrateOldSyncFormats(result.sync, result.local);
      return result;
    }
    // Add defaults
    addDefaults() {
      for (const key in this.syncDefaults) {
        if (!Object.prototype.hasOwnProperty.call(this.cachedSyncConfig, key)) {
          this.cachedSyncConfig[key] = this.syncDefaults[key];
        } else if (key === "barTypes") {
          for (const key2 in this.syncDefaults[key]) {
            if (!Object.prototype.hasOwnProperty.call(this.cachedSyncConfig[key], key2)) {
              this.cachedSyncConfig[key][key2] = this.syncDefaults[key][key2];
            }
          }
        }
      }
      for (const key in this.localDefaults) {
        if (!Object.prototype.hasOwnProperty.call(this.cachedLocalStorage, key)) {
          this.cachedLocalStorage[key] = this.localDefaults[key];
        }
      }
    }
    isReady() {
      return this.config !== null;
    }
  }
  function isSafari() {
    return typeof navigator !== "undefined" && navigator.vendor === "Apple Computer, Inc.";
  }
  function keybindEquals(first, second) {
    if (first == null || second == null || Boolean(first.alt) != Boolean(second.alt) || Boolean(first.ctrl) != Boolean(second.ctrl) || Boolean(first.shift) != Boolean(second.shift) || first.key == null && first.code == null || second.key == null && second.code == null)
      return false;
    if (first.code != null && second.code != null)
      return first.code === second.code;
    if (first.key != null && second.key != null)
      return first.key.toUpperCase() === second.key.toUpperCase();
    return false;
  }

  var PredicateOperator = /* @__PURE__ */ ((PredicateOperator2) => {
    PredicateOperator2["And"] = "and";
    PredicateOperator2["Or"] = "or";
    return PredicateOperator2;
  })(PredicateOperator || {});

  class ConfigClass extends ProtoConfig {
    resetToDefault() {
      chrome.storage.sync.set({
        ...this.syncDefaults,
        userID: this.config.userID,
        minutesSaved: this.config.minutesSaved,
        skipCount: this.config.skipCount,
        sponsorTimesContributed: this.config.sponsorTimesContributed
      });
      chrome.storage.local.set({
        ...this.localDefaults
      });
    }
  }
  function migrateOldSyncFormats(config, local) {
    if (local["skipRules"] && local["skipRules"].length !== 0 && local["skipRules"][0]["rules"]) {
      const output = [];
      for (const rule of local["skipRules"]) {
        const rules = rule["rules"];
        if (rules.length !== 0) {
          let predicate = {
            kind: "check",
            ...rules[0]
          };
          for (let i = 1; i < rules.length; i++) {
            predicate = {
              kind: "operator",
              operator: PredicateOperator.And,
              left: predicate,
              right: {
                kind: "check",
                ...rules[i]
              }
            };
          }
          const comment = rule["comment"];
          output.push({
            predicate,
            skipOption: rule.skipOption,
            comments: comment.length === 0 ? [] : comment.split(/;\s*/)
          });
        }
      }
      local["skipRules"] = output;
    }
    if (config["whitelistedChannels"]) {
      const whitelistedChannels = config["whitelistedChannels"];
      const skipProfileID = "default-whitelist";
      local.skipProfiles[skipProfileID] = {
        name: chrome.i18n.getMessage("WhitelistedChannels"),
        categorySelections: config.categorySelections.filter((s) => !["exclusive_access", "chapter"].includes(s.name)).map((s) => ({
          name: s.name,
          option: CategorySkipOption.ShowOverlay
        })),
        showAutogeneratedChapters: null,
        showCreatorChapters: null,
        autoSkipOnMusicVideos: null,
        skipNonMusicOnlyOnYoutubeMusic: null,
        muteSegments: null,
        fullVideoSegments: null,
        manualSkipOnFullVideo: null,
        minDuration: null
      };
      local.skipProfiles = local.skipProfiles;
      for (const channelID of whitelistedChannels) {
        local.channelSkipProfileIDs[channelID] = skipProfileID;
      }
      local.channelSkipProfileIDs = local.channelSkipProfileIDs;
      chrome.storage.sync.remove("whitelistedChannels");
    }
    if (!config["changeChapterColor"]) {
      config.barTypes["chapter"].color = "#ffd983";
      config["changeChapterColor"] = true;
      chrome.storage.sync.set({
        "changeChapterColor": true,
        "barTypes": config.barTypes
      });
    }
    if (config["showZoomToFillError"]) {
      chrome.storage.sync.remove("showZoomToFillError");
    }
    if (config["unsubmittedSegments"] && Object.keys(config["unsubmittedSegments"]).length > 0) {
      chrome.storage.local.set({
        unsubmittedSegments: config["unsubmittedSegments"]
      }, () => {
        chrome.storage.sync.remove("unsubmittedSegments");
      });
    }
    if (!config["chapterCategoryAdded"]) {
      config["chapterCategoryAdded"] = true;
      if (!config.categorySelections.some((s) => s.name === "chapter")) {
        config.categorySelections.push({
          name: "chapter",
          option: CategorySkipOption.ShowOverlay
        });
        config.categorySelections = config.categorySelections;
      }
    }
    if (config["exclusive_accessCategoryAdded"] !== void 0) {
      chrome.storage.sync.remove("exclusive_accessCategoryAdded");
    }
    if (config["fillerUpdate"] !== void 0) {
      chrome.storage.sync.remove("fillerUpdate");
    }
    if (config["highlightCategoryAdded"] !== void 0) {
      chrome.storage.sync.remove("highlightCategoryAdded");
    }
    if (config["highlightCategoryUpdate"] !== void 0) {
      chrome.storage.sync.remove("highlightCategoryUpdate");
    }
    if (config["askAboutUnlistedVideos"]) {
      chrome.storage.sync.remove("askAboutUnlistedVideos");
    }
    if (!config["autoSkipOnMusicVideosUpdate"]) {
      config["autoSkipOnMusicVideosUpdate"] = true;
      for (const selection of config.categorySelections) {
        if (selection.name === "music_offtopic" && selection.option === CategorySkipOption.AutoSkip) {
          config.autoSkipOnMusicVideos = true;
          break;
        }
      }
    }
    if (config["disableAutoSkip"]) {
      for (const selection of config.categorySelections) {
        if (selection.name === "sponsor") {
          selection.option = CategorySkipOption.ManualSkip;
          chrome.storage.sync.remove("disableAutoSkip");
        }
      }
    }
    if (typeof config["skipKeybind"] == "string") {
      config["skipKeybind"] = { key: config["skipKeybind"] };
    }
    if (typeof config["startSponsorKeybind"] == "string") {
      config["startSponsorKeybind"] = { key: config["startSponsorKeybind"] };
    }
    if (typeof config["submitKeybind"] == "string") {
      config["submitKeybind"] = { key: config["submitKeybind"] };
    }
    const keybinds = ["skipKeybind", "startSponsorKeybind", "submitKeybind"];
    for (let i = keybinds.length - 1; i >= 0; i--) {
      for (let j = 0; j < keybinds.length; j++) {
        if (i == j)
          continue;
        if (keybindEquals(config[keybinds[i]], config[keybinds[j]]))
          config[keybinds[i]] = null;
      }
    }
    if (config["sponsorVideoID"] !== void 0) {
      chrome.storage.sync.remove("sponsorVideoID");
    }
    if (config["previousVideoID"] !== void 0) {
      chrome.storage.sync.remove("previousVideoID");
    }
    if (!config["supportInvidious"] && config["invidiousInstances"].length < invidiousList.length) {
      config["invidiousInstances"] = [.../* @__PURE__ */ new Set([...invidiousList, ...config["invidiousInstances"]])];
    }
    if (config["lastIsVipUpdate"]) {
      chrome.storage.sync.remove("lastIsVipUpdate");
    }
  }
  const syncDefaults = {
    userID: null,
    isVip: false,
    permissions: {},
    defaultCategory: "chooseACategory",
    segmentListDefaultTab: SegmentListDefaultTab.Segments,
    renderSegmentsAsChapters: false,
    forceChannelCheck: false,
    minutesSaved: 0,
    skipCount: 0,
    sponsorTimesContributed: 0,
    submissionCountSinceCategories: 0,
    showTimeWithSkips: true,
    disableSkipping: false,
    muteSegments: true,
    fullVideoSegments: true,
    fullVideoLabelsOnThumbnails: true,
    manualSkipOnFullVideo: false,
    trackViewCount: true,
    trackViewCountInPrivate: true,
    trackDownvotes: true,
    trackDownvotesInPrivate: false,
    dontShowNotice: false,
    showUpcomingNotice: false,
    noticeVisibilityMode: NoticeVisibilityMode.FadedForAutoSkip,
    hideVideoPlayerControls: false,
    hideInfoButtonPlayerControls: false,
    hideDeleteButtonPlayerControls: false,
    hideUploadButtonPlayerControls: false,
    hideSkipButtonPlayerControls: false,
    hideDiscordLaunches: 0,
    hideDiscordLink: false,
    invidiousInstances: [],
    supportInvidious: false,
    serverAddress: serverAddress,
    minDuration: 0,
    skipNoticeDuration: 4,
    audioNotificationOnSkip: false,
    checkForUnlistedVideos: false,
    testingServer: false,
    ytInfoPermissionGranted: false,
    allowExpirements: true,
    showDonationLink: true,
    showPopupDonationCount: 0,
    showUpsells: true,
    showNewFeaturePopups: true,
    donateClicked: 0,
    autoHideInfoButton: true,
    autoSkipOnMusicVideos: false,
    skipNonMusicOnlyOnYoutubeMusic: false,
    scrollToEditTimeUpdate: false,
    // false means the tooltip will be shown
    categoryPillUpdate: false,
    hookUpdate: false,
    showChapterInfoMessage: true,
    darkMode: true,
    showCategoryGuidelines: true,
    showCategoryWithoutPermission: false,
    showSegmentNameInChapterBar: true,
    showAutogeneratedChapters: true,
    showCreatorChapters: true,
    useVirtualTime: true,
    showSegmentFailedToFetchWarning: true,
    allowScrollingToEdit: true,
    deArrowInstalled: false,
    showDeArrowPromotion: true,
    showDeArrowInSettings: true,
    shownDeArrowPromotion: false,
    showZoomToFillError2: true,
    cleanPopup: false,
    hideSegmentCreationInPopup: false,
    prideTheme: false,
    categoryPillColors: {},
    /**
     * Default keybinds should not set "code" as that's gonna be different based on the user's locale. They should also only use EITHER ctrl OR alt modifiers (or none).
     * Using ctrl+alt, or shift may produce a different character that we will not be able to recognize in different locales.
     * The exception for shift is letters, where it only capitalizes. So shift+A is fine, but shift+1 isn't.
     * Don't forget to add the new keybind to the checks in "KeybindDialogComponent.isKeybindAvailable()" and in "migrateOldFormats()"!
     *      TODO: Find a way to skip having to update these checks. Maybe storing keybinds in a Map?
     */
    skipKeybind: { key: "Enter" },
    skipToHighlightKeybind: { key: "Enter", ctrl: true },
    startSponsorKeybind: { key: ";" },
    submitKeybind: { key: "'" },
    actuallySubmitKeybind: { key: "'", ctrl: true },
    previewKeybind: { key: ";", ctrl: true },
    nextChapterKeybind: { key: "ArrowRight", ctrl: true },
    previousChapterKeybind: { key: "ArrowLeft", ctrl: true },
    closeSkipNoticeKeybind: { key: "Backspace" },
    downvoteKeybind: { key: "h", shift: true },
    upvoteKeybind: { key: "g", shift: true },
    categorySelections: [{
      name: "sponsor",
      option: CategorySkipOption.AutoSkip
    }, {
      name: "poi_highlight",
      option: CategorySkipOption.ManualSkip
    }, {
      name: "exclusive_access",
      option: CategorySkipOption.ShowOverlay
    }, {
      name: "chapter",
      option: CategorySkipOption.ShowOverlay
    }],
    payments: {
      licenseKey: null,
      lastCheck: 0,
      lastFreeCheck: 0,
      freeAccess: false,
      chaptersAllowed: false
    },
    colorPalette: {
      red: "#780303",
      white: "#ffffff",
      locked: "#ffc83d"
    },
    // Preview bar
    barTypes: {
      "preview-chooseACategory": {
        color: "#ffffff",
        opacity: "0.7"
      },
      "sponsor": {
        color: "#00d400",
        opacity: "0.7"
      },
      "preview-sponsor": {
        color: "#007800",
        opacity: "0.7"
      },
      "selfpromo": {
        color: "#ffff00",
        opacity: "0.7"
      },
      "preview-selfpromo": {
        color: "#bfbf35",
        opacity: "0.7"
      },
      "exclusive_access": {
        color: "#008a5c",
        opacity: "0.7"
      },
      "interaction": {
        color: "#cc00ff",
        opacity: "0.7"
      },
      "preview-interaction": {
        color: "#6c0087",
        opacity: "0.7"
      },
      "intro": {
        color: "#00ffff",
        opacity: "0.7"
      },
      "preview-intro": {
        color: "#008080",
        opacity: "0.7"
      },
      "outro": {
        color: "#0202ed",
        opacity: "0.7"
      },
      "preview-outro": {
        color: "#000070",
        opacity: "0.7"
      },
      "preview": {
        color: "#008fd6",
        opacity: "0.7"
      },
      "preview-preview": {
        color: "#005799",
        opacity: "0.7"
      },
      "hook": {
        color: "#395699",
        opacity: "0.8"
      },
      "preview-hook": {
        color: "#273963",
        opacity: "0.7"
      },
      "music_offtopic": {
        color: "#ff9900",
        opacity: "0.7"
      },
      "preview-music_offtopic": {
        color: "#a6634a",
        opacity: "0.7"
      },
      "poi_highlight": {
        color: "#ff1684",
        opacity: "0.7"
      },
      "preview-poi_highlight": {
        color: "#9b044c",
        opacity: "0.7"
      },
      "filler": {
        color: "#7300FF",
        opacity: "0.9"
      },
      "preview-filler": {
        color: "#2E0066",
        opacity: "0.7"
      },
      "chapter": {
        color: "#ffd983",
        opacity: "0"
      }
    }
  };
  const localDefaults = {
    downvotedSegments: {},
    navigationApiAvailable: null,
    alreadyInstalled: false,
    unsubmittedSegments: {},
    skipRules: [],
    channelSkipProfileIDs: {},
    skipProfiles: {},
    skipProfileTemp: null
  };
  const Config = new ConfigClass(syncDefaults, localDefaults, migrateOldSyncFormats);

  function isBodyGarbage(body) {
    return body.startsWith("<!DOCTYPE html>") || body.startsWith("<html>") || body.includes(`cf-wrapper`);
  }
  function getLongErrorMessage(statusCode, responseText) {
    if (statusCode === 0) {
      return chrome.i18n.getMessage("0");
    }
    const postFix = responseText && !isBodyGarbage(responseText) ? "\n\n" + responseText : "";
    let introString = chrome.i18n.getMessage(`${statusCode === 503 ? 502 : statusCode}`);
    if (introString === "") {
      introString = chrome.i18n.getMessage("connectionError");
    }
    const errorCodeString = chrome.i18n.getMessage("errorCode").replace("{code}", `${statusCode}`);
    const reminder = statusCode === 502 || statusCode === 503 ? `

${chrome.i18n.getMessage("statusReminder")}` : "";
    return `${introString} ${errorCodeString}${postFix}${reminder}`;
  }
  function formatJSErrorMessage(error) {
    const introString = chrome.i18n.getMessage("connectionError");
    return `${introString} ${error}`;
  }

  async function getHash(value, times = 5e3) {
    if (times <= 0) return "";
    if (!("subtle" in crypto)) {
      return new Promise((resolve, reject) => chrome.runtime.sendMessage({
        message: "getHash",
        value,
        times
      }, (response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      }));
    }
    let hashHex = value;
    for (let i = 0; i < times; i++) {
      const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashHex).buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return hashHex;
  }

  async function sendRealRequestToCustomServer(type, url, data = {}, headers = {}) {
    if (type.toLowerCase() === "get") {
      url = objectToURI(url, data);
      data = null;
    }
    const response = await fetch(url, {
      method: type,
      headers: {
        "Content-Type": "application/json",
        ...headers || {}
      },
      redirect: "follow",
      body: data ? JSON.stringify(data) : null
    });
    return response;
  }
  function isSerializable(value) {
    try {
      window.structuredClone(value);
      return true;
    } catch {
      return false;
    }
  }
  function serializeOrStringify(value) {
    return isSerializable(value) ? value : "toString" in value && typeof value.toString === "function" ? value.toString() : String(value);
  }
  function setupBackgroundRequestProxy() {
    if (globalThis.__OSB_PROXY_SETUP) return;
    globalThis.__OSB_PROXY_SETUP = true;
    chrome.runtime.onMessage.addListener((request, sender, callback) => {
      if (request.message === "sendRequest") {
        sendRealRequestToCustomServer(request.type, request.url, request.data, request.headers).then(async (response) => {
          const buffer = request.binary ? isFirefoxOrSafari() && !isSafari() ? await response.blob() : Array.from(new Uint8Array(await response.arrayBuffer())) : null;
          callback({
            responseText: !request.binary ? await response.text() : "",
            responseBinary: buffer,
            headers: request.returnHeaders && response.headers ? [...response.headers.entries()].reduce(
              (acc, [key, value]) => {
                acc[key] = value;
                return acc;
              },
              {}
            ) : null,
            status: response.status,
            ok: response.ok
          });
        }).catch((error) => {
          console.error("Proxied request failed:", error);
          callback({
            error: serializeOrStringify(error)
          });
        });
        return true;
      }
      if (request.message === "getHash") {
        getHash(request.value, request.times).then(callback).catch((e) => {
          console.error("Hash request failed:", e);
          callback({
            error: serializeOrStringify(e)
          });
        });
        return true;
      }
      return false;
    });
  }
  function sendRequestToCustomServer(type, url, data = {}, headers = {}) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage({
          message: "sendRequest",
          type,
          url,
          data,
          headers
        }, (response) => {
          if (response == null) {
            reject(new Error(`Got ${response} response from background page`));
          } else if ("error" in response) {
            reject(response.error);
          } else {
            resolve(response);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }
  function logRequest(request, prefix, requestDescription) {
    const body = "responseText" in request && !isBodyGarbage(request.responseText) ? `: ${request.responseText}` : "";
    console.warn(`[${prefix}] Server responded with code ${request.status} to a ${requestDescription} request${body}`);
  }

  function onTabUpdatedListener(tabId) {
    chrome.tabs.sendMessage(tabId, {
      message: "update"
    }, () => void chrome.runtime.lastError);
  }
  function onNavigationApiAvailableChange(changes) {
    if (changes.navigationApiAvailable) {
      if (changes.navigationApiAvailable.newValue) {
        chrome.tabs.onUpdated.removeListener(onTabUpdatedListener);
      } else {
        chrome.tabs.onUpdated.addListener(onTabUpdatedListener);
      }
    }
  }
  function setupTabUpdates(config) {
    chrome.tabs.onUpdated.addListener(onTabUpdatedListener);
    chrome.storage.local.get("navigationApiAvailable", (v) => {
      if (v.navigationApiAvailable) {
        chrome.tabs.onUpdated.removeListener(onTabUpdatedListener);
      }
    });
    if (!config.configSyncListeners.includes(onNavigationApiAvailableChange)) {
      config.configSyncListeners.push(onNavigationApiAvailableChange);
    }
  }

  function generateUserID(length = 36) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const cryptoFuncs = typeof window === "undefined" ? crypto : window.crypto;
    if (cryptoFuncs && cryptoFuncs.getRandomValues) {
      const values = new Uint32Array(length);
      cryptoFuncs.getRandomValues(values);
      for (let i = 0; i < length; i++) {
        result += charset[values[i] % charset.length];
      }
      return result;
    } else {
      for (let i = 0; i < length; i++) {
        result += charset[Math.floor(Math.random() * charset.length)];
      }
      return result;
    }
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
  function isVisibleOrParent(element, ignoreWidth = false, checkParent = true) {
    return isVisible(element, ignoreWidth) || checkParent && !!element && (isVisible(element.parentElement, ignoreWidth) || isVisible(element.parentElement?.parentElement ?? null, ignoreWidth));
  }
  function findValidElementFromSelector(selectors, ignoreWidth = false, checkParent = false) {
    return findValidElementFromGenerator(selectors, ignoreWidth, checkParent, (selector) => document.querySelector(selector));
  }
  function findValidElementFromGenerator(objects, ignoreWidth = false, checkParent = false, generator) {
    for (const obj of objects) {
      const element = generator ? generator(obj) : obj;
      if (element && isVisibleOrParent(element, ignoreWidth, checkParent)) {
        return element;
      }
    }
    return null;
  }

  async function asyncRequestToServer$1(type, address, data = {}, headers = {}) {
    const serverAddress = Config.config.testingServer ? testingServerAddress : Config.config.serverAddress;
    return await sendRequestToCustomServer(type, serverAddress + address, data, headers);
  }

  class Utils {
    constructor(backgroundScriptContainer = null) {
      // Used to add content scripts and CSS required
      this.js = [
        "./js/content.js"
      ];
      this.css = [
        "content.css",
        "./libs/Source+Sans+Pro.css",
        "popup.css",
        "shared.css"
      ];
      this.backgroundScriptContainer = backgroundScriptContainer;
    }
    async wait(condition, timeout = 5e3, check = 100) {
      return waitFor(condition, timeout, check);
    }
    containsPermission(permissions) {
      return new Promise((resolve) => {
        chrome.permissions.contains(permissions, resolve);
      });
    }
    /**
     * Asks for the optional permissions required for all extra sites.
     * It also starts the content script registrations.
     * 
     * For now, it is just SB.config.invidiousInstances.
     * 
     * @param {CallableFunction} callback
     */
    setupExtraSitePermissions(callback) {
      const permissions = [];
      if (isSafari()) {
        permissions.push("webNavigation");
      }
      chrome.permissions.request({
        origins: this.getPermissionRegex(),
        permissions
      }, async (granted) => {
        if (granted) {
          this.setupExtraSiteContentScripts();
        } else {
          this.removeExtraSiteRegistration();
        }
        callback(granted);
      });
    }
    getExtraSiteRegistration() {
      return {
        message: "registerContentScript",
        id: "invidious",
        allFrames: true,
        js: this.js,
        css: this.css,
        matches: this.getPermissionRegex()
      };
    }
    /**
     * Registers the content scripts for the extra sites.
     * Will use a different method depending on the browser.
     * This is called by setupExtraSitePermissions().
     * 
     * For now, it is just SB.config.invidiousInstances.
     */
    setupExtraSiteContentScripts() {
      const registration = this.getExtraSiteRegistration();
      if (this.backgroundScriptContainer) {
        this.backgroundScriptContainer.registerFirefoxContentScript(registration);
      } else {
        chrome.runtime.sendMessage(registration);
      }
    }
    /**
     * Removes the permission and content script registration.
     */
    removeExtraSiteRegistration() {
      const id = "invidious";
      if (this.backgroundScriptContainer) {
        this.backgroundScriptContainer.unregisterFirefoxContentScript(id);
      } else {
        chrome.runtime.sendMessage({
          message: "unregisterContentScript",
          id
        });
      }
      chrome.permissions.remove({
        origins: this.getPermissionRegex()
      });
    }
    applyInvidiousPermissions(enable, option = "supportInvidious") {
      return new Promise((resolve) => {
        if (enable) {
          this.setupExtraSitePermissions((granted) => {
            if (!granted) {
              Config.config[option] = false;
            }
            resolve(granted);
          });
        } else {
          this.removeExtraSiteRegistration();
          resolve(false);
        }
      });
    }
    containsInvidiousPermission() {
      return new Promise((resolve) => {
        const permissions = [];
        if (isSafari()) {
          permissions.push("webNavigation");
        }
        chrome.permissions.contains({
          origins: this.getPermissionRegex(),
          permissions
        }, function(result) {
          resolve(result);
        });
      });
    }
    /**
     * Merges any overlapping timestamp ranges into single segments and returns them as a new array.
     */
    getMergedTimestamps(timestamps) {
      let deduped = [];
      timestamps.forEach((range) => {
        const startOverlaps = deduped.findIndex((other) => range[0] >= other[0] && range[0] <= other[1]);
        const endOverlaps = deduped.findIndex((other) => range[1] >= other[0] && range[1] <= other[1]);
        if (~startOverlaps && ~endOverlaps) {
          if (startOverlaps === endOverlaps) return;
          const other1 = deduped.splice(Math.max(startOverlaps, endOverlaps), 1)[0];
          const other2 = deduped.splice(Math.min(startOverlaps, endOverlaps), 1)[0];
          deduped.push([Math.min(other1[0], other2[0]), Math.max(other1[1], other2[1])]);
        } else if (~startOverlaps) {
          deduped[startOverlaps][1] = range[1];
        } else if (~endOverlaps) {
          deduped[endOverlaps][0] = range[0];
        } else {
          deduped.push(range.slice());
        }
        deduped = deduped.filter((other) => !(other[0] > range[0] && other[1] < range[1]));
      });
      return deduped;
    }
    /**
     * Returns the total duration of the timestamps, taking into account overlaps.
     */
    getTimestampsDuration(timestamps) {
      return this.getMergedTimestamps(timestamps).reduce((acc, range) => {
        return acc + range[1] - range[0];
      }, 0);
    }
    getSponsorIndexFromUUID(sponsorTimes, UUID) {
      for (let i = 0; i < sponsorTimes.length; i++) {
        if (sponsorTimes[i].UUID && (sponsorTimes[i].UUID.startsWith(UUID) || UUID.startsWith(sponsorTimes[i].UUID))) {
          return i;
        }
      }
      return -1;
    }
    getSponsorTimeFromUUID(sponsorTimes, UUID) {
      return sponsorTimes[this.getSponsorIndexFromUUID(sponsorTimes, UUID)];
    }
    /**
     * @returns {String[]} Domains in regex form
     */
    getPermissionRegex(domains = []) {
      const permissionRegex = [];
      if (domains.length === 0) {
        domains = [...Config.config.invidiousInstances];
      }
      for (const url of domains) {
        permissionRegex.push("https://*." + url + "/*");
        permissionRegex.push("http://*." + url + "/*");
      }
      return permissionRegex;
    }
    findReferenceNode() {
      const selectors = [
        "#player-container-id",
        // Mobile YouTube
        "#movie_player",
        ".html5-video-player",
        // May 2023 Card-Based YouTube Layout
        "#c4-player",
        // Channel Trailer
        "#player-container",
        // Preview on hover
        "#main-panel.ytmusic-player-page",
        // YouTube music
        "#player-container .video-js",
        // Invidious
        ".main-video-section > .video-container",
        // Cloudtube
        ".shaka-video-container",
        // Piped
        "#player-container.ytk-player",
        // YT Kids
        "#id-tv-container"
        // YTTV
      ];
      let referenceNode = findValidElementFromSelector(selectors);
      if (referenceNode == null) {
        const player = document.getElementById("player");
        referenceNode = player?.firstChild;
        if (referenceNode) {
          let index = 1;
          while (index < player.children.length && (!referenceNode.classList?.contains("html5-video-player") || !referenceNode.classList?.contains("ytp-embed"))) {
            referenceNode = player.children[index];
            index++;
          }
        }
      }
      return referenceNode;
    }
    isContentScript() {
      return window.location.protocol === "http:" || window.location.protocol === "https:";
    }
    isHex(num) {
      return Boolean(num.match(/^[0-9a-f]+$/i));
    }
    async addHiddenSegment(videoID, segmentUUID, hidden) {
      if (chrome.extension.inIncognitoContext && !Config.config.trackDownvotesInPrivate || !Config.config.trackDownvotes) return;
      if (segmentUUID.length < 60) {
        let segmentIDData;
        try {
          segmentIDData = await asyncRequestToServer$1("GET", "/api/segmentID", {
            UUID: segmentUUID,
            videoID
          });
        } catch (e) {
          console.error("[SB] Caught error while trying to resolve the segment UUID to be hidden", e);
          alert(`${chrome.i18n.getMessage("segmentHideFailed")}
${formatJSErrorMessage(e)}`);
          return;
        }
        if (segmentIDData.ok && segmentIDData.responseText) {
          segmentUUID = segmentIDData.responseText;
        } else {
          logRequest(segmentIDData, "SB", "segment UUID resolution");
          alert(`${chrome.i18n.getMessage("segmentHideFailed")}
${getLongErrorMessage(segmentIDData.status, segmentIDData.responseText)}`);
          return;
        }
      }
      const hashedVideoID = (await getHash(videoID, 1)).slice(0, 4);
      const UUIDHash = await getHash(segmentUUID, 1);
      const allDownvotes = Config.local.downvotedSegments;
      const currentVideoData = allDownvotes[hashedVideoID] || { segments: [], lastAccess: 0 };
      currentVideoData.lastAccess = Date.now();
      const existingData = currentVideoData.segments.find((segment) => segment.uuid === UUIDHash);
      if (hidden === SponsorHideType.Visible) {
        currentVideoData.segments.splice(currentVideoData.segments.indexOf(existingData), 1);
        if (currentVideoData.segments.length === 0) {
          delete allDownvotes[hashedVideoID];
        }
      } else {
        if (existingData) {
          existingData.hidden = hidden;
        } else {
          currentVideoData.segments.push({
            uuid: UUIDHash,
            hidden
          });
        }
        allDownvotes[hashedVideoID] = currentVideoData;
      }
      const entries = Object.entries(allDownvotes);
      if (entries.length > 1e4) {
        let min = null;
        for (let i = 0; i < entries[0].length; i++) {
          if (min === null || entries[i][1].lastAccess < min[1].lastAccess) {
            min = entries[i];
          }
        }
        delete allDownvotes[min[0]];
      }
      Config.forceLocalUpdate("downvotedSegments");
    }
  }

  function getExtensionIdsToImportFrom() {
    if (isSafari()) {
      return extensionImportList.safari;
    } else if (isFirefoxOrSafari()) {
      return extensionImportList.firefox;
    } else {
      return extensionImportList.chromium;
    }
  }

  const chromeP = typeof browser === "undefined" ? typeof chrome !== "undefined" ? chrome : null : browser;

  async function injectUpdatedScripts(extraScripts = [], ignoreNormalScipts = false) {
    const scripts = ignoreNormalScipts ? extraScripts : extraScripts.concat(chrome.runtime.getManifest().content_scripts || []);
    if ("scripting" in chrome) {
      for (const cs of scripts) {
        for (const tab of await chromeP.tabs.query({ url: cs.matches })) {
          if (cs.css && cs.css.length > 0) {
            await chromeP.scripting.insertCSS({
              target: { tabId: tab.id },
              files: cs.css || []
            });
          }
          await chromeP.scripting.executeScript({
            target: { tabId: tab.id },
            files: cs.js || [],
            world: cs["world"] || "ISOLATED"
          });
        }
      }
    } else {
      chrome.windows.getAll({
        populate: true
      }, (windows) => {
        for (const window2 of windows) {
          if (window2.tabs) {
            for (const tab of window2.tabs) {
              for (const script of scripts) {
                if (tab.url && script.matches?.some?.((match) => tab.url.match(match.replace(/\//g, "\\/").replace(/\./g, "\\.").replace(/\*/g, ".*")))) {
                  if (script.js) {
                    for (const file of script.js) {
                      void chrome.tabs.executeScript(tab.id, {
                        file
                      });
                    }
                  }
                  if (script.css) {
                    for (const file of script.css) {
                      void chrome.tabs.insertCSS(tab.id, {
                        file
                      });
                    }
                  }
                }
              }
            }
          }
        }
      });
    }
  }

  if (typeof window !== "undefined") {
    window["SBLogs"] = {
      debug: [],
      warn: []
    };
  }
  function logWarn(message) {
    if (typeof window !== "undefined") {
      window["SBLogs"].warn.push(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`);
    } else {
      console.warn(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`);
    }
  }

  const utils = new Utils({
    registerFirefoxContentScript,
    unregisterFirefoxContentScript
  });
  const popupPort = {};
  const contentScriptRegistrations = {};
  utils.wait(() => Config.isReady()).then(function() {
    if (Config.config.supportInvidious) utils.setupExtraSiteContentScripts();
  });
  setupBackgroundRequestProxy();
  setupTabUpdates(Config);
  if (!globalThis.__OSB_MAIN_ONMESSAGE) {
    globalThis.__OSB_MAIN_ONMESSAGE = true;
    chrome.runtime.onMessage.addListener(function(request, sender, callback) {
      switch (request.message) {
        case "openConfig":
          chrome.tabs.create({ url: chrome.runtime.getURL("options/options.html" + (request.hash ? "#" + request.hash : "")) });
          return false;
        case "openHelp":
          chrome.tabs.create({ url: chrome.runtime.getURL("welcome/welcome.html") });
          return false;
        case "openPage":
          chrome.tabs.create({ url: chrome.runtime.getURL(request.url) });
          return false;
        case "submitVote":
          submitVote(request.type, request.UUID, request.category, request.videoID).then(callback);
          return true;
        case "registerContentScript":
          registerFirefoxContentScript(request);
          return false;
        case "unregisterContentScript":
          unregisterFirefoxContentScript(request.id);
          return false;
        case "tabs": {
          chrome.tabs.query({
            active: true,
            currentWindow: true
          }, (tabs) => {
            chrome.tabs.sendMessage(
              tabs[0].id,
              request.data,
              (response) => {
                callback(response);
              }
            );
          });
          return true;
        }
        case "time":
        case "infoUpdated":
        case "videoChanged":
          if (sender.tab) {
            try {
              popupPort[sender.tab.id]?.postMessage(request);
            } catch (e) {
            }
          }
          return false;
        default:
          return false;
      }
    });
  }
  if (!globalThis.__OSB_MAIN_ONMESSAGEEXTERNAL) {
    globalThis.__OSB_MAIN_ONMESSAGEEXTERNAL = true;
    chrome.runtime.onMessageExternal.addListener((request, sender, callback) => {
      if (getExtensionIdsToImportFrom().includes(sender.id)) {
        if (request.message === "requestConfig") {
          callback({
            userID: Config.config.userID,
            allowExpirements: Config.config.allowExpirements,
            showDonationLink: Config.config.showDonationLink,
            showUpsells: Config.config.showUpsells,
            darkMode: Config.config.darkMode
          });
        }
      }
    });
  }
  if (!globalThis.__OSB_MAIN_ONCONNECT) {
    globalThis.__OSB_MAIN_ONCONNECT = true;
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === "popup") {
        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, (tabs) => {
          popupPort[tabs[0].id] = port;
        });
      }
    });
  }
  chrome.runtime.onInstalled.addListener(function() {
    setTimeout(async () => {
      const userID = Config.config.userID;
      if (!userID && !Config.local.alreadyInstalled) {
        chrome.tabs.create({ url: chrome.runtime.getURL("/welcome/welcome.html") });
        const newUserID = generateUserID();
        Config.config.userID = newUserID;
        Config.local.alreadyInstalled = true;
        Config.config.categoryPillUpdate = true;
      }
      if (Config.config.supportInvidious) {
        if (!await utils.containsInvidiousPermission()) {
          chrome.tabs.create({ url: chrome.runtime.getURL("/permissions/index.html") });
        }
      }
      getHash(Config.config.userID).then((userID2) => {
        if (userID2 == "60eed03c8644b7efa32df06977b3a4c11b62f63518e74a0e29baa1fd449cb54f" || userID2 == "e347d9878bc4c8400d2d9e1164b1f2e630b04a4ca10f1a9270969a9d53da6ebb") {
          Config.config.prideTheme = true;
        }
      });
    }, 1500);
    if (!isFirefoxOrSafari()) {
      injectUpdatedScripts().catch(logWarn);
      waitFor(() => Config.isReady()).then(() => {
        if (Config.config.supportInvidious) {
          injectUpdatedScripts([
            utils.getExtraSiteRegistration()
          ]);
        }
      }).catch(logWarn);
    }
  });
  async function registerFirefoxContentScript(options) {
    if ("scripting" in chrome && "getRegisteredContentScripts" in chrome.scripting) {
      const existingRegistrations = await chromeP.scripting.getRegisteredContentScripts({
        ids: [options.id]
      }).catch(() => []);
      if (existingRegistrations && existingRegistrations.length > 0 && options.matches.every((match) => existingRegistrations[0].matches.includes(match))) {
        return;
      }
    }
    await unregisterFirefoxContentScript(options.id);
    if ("scripting" in chrome && "getRegisteredContentScripts" in chrome.scripting) {
      await chromeP.scripting.registerContentScripts([{
        id: options.id,
        runAt: "document_start",
        matches: options.matches,
        allFrames: options.allFrames,
        js: options.js,
        css: options.css,
        persistAcrossSessions: true
      }]);
    } else {
      chrome.contentScripts.register({
        allFrames: options.allFrames,
        js: options.js?.map?.((file) => ({ file })),
        css: options.css?.map?.((file) => ({ file })),
        matches: options.matches
      }).then((registration) => void (contentScriptRegistrations[options.id] = registration));
    }
  }
  async function unregisterFirefoxContentScript(id) {
    if ("scripting" in chrome && "getRegisteredContentScripts" in chrome.scripting) {
      try {
        await chromeP.scripting.unregisterContentScripts({
          ids: [id]
        });
      } catch (e) {
      }
    } else {
      if (contentScriptRegistrations[id]) {
        contentScriptRegistrations[id].unregister();
        delete contentScriptRegistrations[id];
      }
    }
  }
  async function submitVote(type, UUID, category, videoID) {
    let userID = Config.config.userID;
    if (userID == void 0 || userID === "undefined") {
      userID = generateUserID();
      Config.config.userID = userID;
    }
    const typeSection = type !== void 0 ? "&type=" + type : "&category=" + category;
    try {
      const response = await asyncRequestToServer("POST", "/api/voteOnSponsorTime?UUID=" + UUID + "&videoID=" + videoID + "&userID=" + userID + typeSection);
      return {
        status: response.status,
        ok: response.ok,
        responseText: await response.text()
      };
    } catch (e) {
      console.error("Error while voting:", e);
      return {
        error: serializeOrStringify(e)
      };
    }
  }
  async function asyncRequestToServer(type, address, data = {}) {
    const serverAddress = Config.config.testingServer ? testingServerAddress : Config.config.serverAddress;
    return await sendRealRequestToCustomServer(type, serverAddress + address, data);
  }

  const CACHE_MAX_SIZE = 500;
  const CACHE_EVICT_COUNT = 75;
  const CACHE_TTL_MS = 60 * 60 * 1e3;
  const CACHE_PREFIX = "sb_cache_";
  const cacheGet = async (key) => {
    const fullKey = CACHE_PREFIX + key;
    const result = await chrome.storage.local.get(fullKey);
    const entry = result[fullKey];
    if (!entry) return void 0;
    if (Date.now() - entry.insertedAt > CACHE_TTL_MS) {
      await chrome.storage.local.remove(fullKey);
      return void 0;
    }
    await chrome.storage.local.set({
      [fullKey]: { data: entry.data, insertedAt: Date.now() }
    });
    return entry.data;
  };
  const cacheSet = async (key, data) => {
    const fullKey = CACHE_PREFIX + key;
    await chrome.storage.local.set({
      [fullKey]: { data, insertedAt: Date.now() }
    });
  };
  const evictCache = async () => {
    const allData = await chrome.storage.local.get(null);
    const now = Date.now();
    const cacheEntries = [];
    for (const [key, entry] of Object.entries(allData)) {
      if (key.startsWith(CACHE_PREFIX)) {
        if (now - entry.insertedAt > CACHE_TTL_MS) {
          await chrome.storage.local.remove(key);
        } else {
          cacheEntries.push({ key, insertedAt: entry.insertedAt });
        }
      }
    }
    if (cacheEntries.length > CACHE_MAX_SIZE) {
      cacheEntries.sort((a, b) => a.insertedAt - b.insertedAt);
      const excess = cacheEntries.length - CACHE_MAX_SIZE;
      const itemsToRemove = Math.max(CACHE_EVICT_COUNT, excess);
      const keysToRemove = cacheEntries.slice(0, itemsToRemove).map((e) => e.key);
      await chrome.storage.local.remove(keysToRemove);
    }
  };
  const getRuntimeConfig = async () => {
    try {
      const response = await fetch(chrome.runtime.getURL("config.json"));
      if (!response.ok) throw new Error("Missing config");
      const parsed = await response.json();
      return {
        serverAddress: parsed.serverAddress || API_BASE_URL
      };
    } catch (_error) {
      return { serverAddress: API_BASE_URL };
    }
  };
  const fetchSegments = async ({ videoId, service, platform }) => {
    const settings = await getSettings();
    const config = await getRuntimeConfig();
    const enabledCategories = CATEGORY_KEYS.filter((cat) => settings[platform]?.[cat]).sort();
    const key = `${service}:${videoId}:${enabledCategories.join(",")}`;
    const cached = await cacheGet(key);
    if (cached !== void 0) return cached;
    const params = new URLSearchParams({
      videoID: videoId,
      service,
      categories: JSON.stringify(enabledCategories)
    });
    const response = await fetch(`${config.serverAddress}/api/skipSegments?${params.toString()}`);
    if (!response.ok) {
      if (response.status === 404) {
        await cacheSet(key, []);
        return [];
      }
      throw new Error(`SponsorBlock API error (${response.status})`);
    }
    const payload = await response.json();
    await cacheSet(key, payload);
    return payload;
  };
  chrome.runtime.onInstalled.addListener(async () => {
    const settings = await getSettings();
    await setSettings(settings);
    chrome.alarms.create("cacheCleanup", { periodInMinutes: 30 });
  });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "cacheCleanup") {
      evictCache();
    }
  });
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_SEGMENTS") {
      fetchSegments(message.payload).then((segments) => sendResponse({ ok: true, data: segments })).catch((error) => sendResponse({ ok: false, error: String(error) }));
      return true;
    }
    if (message.type === "GET_SETTINGS") {
      getSettings().then((settings) => sendResponse({ ok: true, data: settings }));
      return true;
    }
    if (message.type === "SET_SETTINGS") {
      setSettings(message.payload).then(() => sendResponse({ ok: true }));
      return true;
    }
    return false;
  });

})();
