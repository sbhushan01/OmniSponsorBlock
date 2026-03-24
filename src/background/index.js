import { API_BASE_URL, CATEGORY_KEYS } from "../shared/constants.js";
import { getSettings, setSettings } from "../shared/storage.js";

const cache = new Map();
let runtimeConfig = null;

const cacheKey = (videoId, service) => `${service}:${videoId}`;

const getRuntimeConfig = async () => {
  if (runtimeConfig) return runtimeConfig;
  try {
    const response = await fetch(chrome.runtime.getURL("config.json"));
    if (!response.ok) throw new Error("Missing config");
    const parsed = await response.json();
    runtimeConfig = {
      serverAddress: parsed.serverAddress || API_BASE_URL
    };
  } catch (_error) {
    runtimeConfig = { serverAddress: API_BASE_URL };
  }
  return runtimeConfig;
};

const fetchSegments = async ({ videoId, service, platform }) => {
  const key = cacheKey(videoId, service);
  if (cache.has(key)) return cache.get(key);

  const settings = await getSettings();
  const config = await getRuntimeConfig();
  const enabledCategories = CATEGORY_KEYS.filter((cat) => settings[platform]?.[cat]);

  const params = new URLSearchParams({
    videoID: videoId,
    service,
    categories: JSON.stringify(enabledCategories)
  });

  const response = await fetch(`${config.serverAddress}/api/skipSegments?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`SponsorBlock API error (${response.status})`);
  }

  const payload = await response.json();
  cache.set(key, payload);
  return payload;
};

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await setSettings(settings);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cacheCleanup" && cache.size > 500) {
    cache.clear();
  }
});

chrome.alarms.create("cacheCleanup", { periodInMinutes: 30 });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_SEGMENTS") {
    fetchSegments(message.payload)
      .then((segments) => sendResponse({ ok: true, data: segments }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
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
