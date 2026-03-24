import { API_BASE_URL, CATEGORY_KEYS } from "../shared/constants.js";
import { getSettings, setSettings } from "../shared/storage.js";

// ---------------------------------------------------------------------------
// Cache with TTL metadata
//
// Each entry is stored as { data, insertedAt } so we can evict old records
// without nuking recently-fetched segments.
//
// Eviction policy (triggered by the "cacheCleanup" alarm every 30 minutes):
//   1. Remove every entry whose age exceeds CACHE_TTL_MS regardless of size.
//   2. If the cache is still larger than CACHE_MAX_SIZE after TTL eviction,
//      remove the oldest entries (by insertion time) until it fits within
//      CACHE_MAX_SIZE - CACHE_EVICT_COUNT, giving headroom before the next
//      alarm fires.
// ---------------------------------------------------------------------------

const CACHE_MAX_SIZE   = 500;  // Start evicting when size exceeds this
const CACHE_EVICT_COUNT = 75;  // How many oldest entries to drop in one pass
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour – segments rarely change

const cache = new Map(); // key → { data: any, insertedAt: number }
let runtimeConfig = null;

const cacheKey = (videoId, service) => `${service}:${videoId}`;

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

const cacheGet = (key) => {
  const entry = cache.get(key);
  if (!entry) return undefined;
  // Treat stale entries as cache misses; remove lazily.
  if (Date.now() - entry.insertedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry.data;
};

const cacheSet = (key, data) => {
  // Clone defensively so that any later mutation of the original reference
  // (e.g. in fetchSegments or the message handler) cannot corrupt cached data.
  cache.set(key, { data: structuredClone(data), insertedAt: Date.now() });
};

/**
 * Evict expired entries, then – if the cache is still oversized – remove the
 * oldest CACHE_EVICT_COUNT entries by insertion timestamp.
 */
const evictCache = () => {
  const now = Date.now();

  // Pass 1: TTL eviction
  for (const [key, entry] of cache) {
    if (now - entry.insertedAt > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }

  // Pass 2: LRU eviction if still over the size limit
  if (cache.size > CACHE_MAX_SIZE) {
    // Sort ascending by insertion time (oldest first)
    const sortedKeys = [...cache.entries()]
      .sort((a, b) => a[1].insertedAt - b[1].insertedAt)
      .map(([key]) => key);

    const toRemove = sortedKeys.slice(0, CACHE_EVICT_COUNT);
    for (const key of toRemove) {
      cache.delete(key);
    }
  }
};

// ---------------------------------------------------------------------------
// Runtime config
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Segment fetching
// ---------------------------------------------------------------------------

const fetchSegments = async ({ videoId, service, platform }) => {
  const key = cacheKey(videoId, service);

  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

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
  cacheSet(key, payload);
  return payload;
};

// ---------------------------------------------------------------------------
// Extension lifecycle
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await setSettings(settings);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cacheCleanup") {
    evictCache();
  }
});

chrome.alarms.create("cacheCleanup", { periodInMinutes: 30 });

// ---------------------------------------------------------------------------
// Message handling
// ---------------------------------------------------------------------------

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
