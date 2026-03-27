import { API_BASE_URL, CATEGORY_KEYS } from "../shared/constants.js";
import { getSettings, setSettings } from "../shared/storage.js";

// ---------------------------------------------------------------------------
// Cache with TTL metadata (Backed by chrome.storage.local for MV3)
// ---------------------------------------------------------------------------

const CACHE_MAX_SIZE = 500;
const CACHE_EVICT_COUNT = 75;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_PREFIX = "sb_cache_";

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

const cacheGet = async (key) => {
  const fullKey = CACHE_PREFIX + key;
  const result = await chrome.storage.local.get(fullKey);
  const entry = result[fullKey];

  if (!entry) return undefined;

  if (Date.now() - entry.insertedAt > CACHE_TTL_MS) {
    await chrome.storage.local.remove(fullKey);
    return undefined;
  }

  // Bug fix: refresh insertedAt on every read so eviction is truly LRU
  // (least-recently-used) rather than LRI (least-recently-inserted).
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

  // Pass 2: LRU eviction if still over the size limit
  if (cacheEntries.length > CACHE_MAX_SIZE) {
    cacheEntries.sort((a, b) => a.insertedAt - b.insertedAt);

    // Calculate how many items are over the limit to ensure we drop below max
    const excess = cacheEntries.length - CACHE_MAX_SIZE;
    const itemsToRemove = Math.max(CACHE_EVICT_COUNT, excess);

    const keysToRemove = cacheEntries.slice(0, itemsToRemove).map(e => e.key);
    await chrome.storage.local.remove(keysToRemove);
  }
};

// ---------------------------------------------------------------------------
// Runtime config
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Segment fetching
// ---------------------------------------------------------------------------

const fetchSegments = async ({ videoId, service, platform }) => {
  const settings = await getSettings();
  const config = await getRuntimeConfig();

  // Sort categories so the cache key is deterministic regardless of order
  const enabledCategories = CATEGORY_KEYS.filter((cat) => settings[platform]?.[cat]).sort();

  // Include categories in cache key so settings changes fetch new segment subsets
  const key = `${service}:${videoId}:${enabledCategories.join(',')}`;

  const cached = await cacheGet(key);
  if (cached !== undefined) return cached;

  const params = new URLSearchParams({
    videoID: videoId,
    service,
    categories: JSON.stringify(enabledCategories)
  });

  const response = await fetch(`${config.serverAddress}/api/skipSegments?${params.toString()}`);
  if (!response.ok) {
    if (response.status === 404) {
      // 404 simply means no segments exist for this video.
      // Cache the empty result so we don't spam the API on navigation.
      await cacheSet(key, []);
      return [];
    }
    throw new Error(`SponsorBlock API error (${response.status})`);
  }

  const payload = await response.json();
  await cacheSet(key, payload);
  return payload;
};

// ---------------------------------------------------------------------------
// Extension lifecycle
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await setSettings(settings);

  // Create alarm here to avoid recreating it every time the SW wakes up
  chrome.alarms.create("cacheCleanup", { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cacheCleanup") {
    evictCache();
  }
});

// ---------------------------------------------------------------------------
// Message handling
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_SEGMENTS") {
    fetchSegments(message.payload)
      .then((segments) => sendResponse({ ok: true, data: segments }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true; // Keep message channel open for async
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
