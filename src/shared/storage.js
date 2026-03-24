import { DEFAULT_SETTINGS } from "./constants.js";

const clone = (value) => structuredClone(value);

export const getSettings = () =>
  new Promise((resolve) => {
    chrome.storage.local.get(["settings"], (data) => {
      const merged = {
        youtube: { ...DEFAULT_SETTINGS.youtube, ...(data.settings?.youtube || {}) },
        spotify: { ...DEFAULT_SETTINGS.spotify, ...(data.settings?.spotify || {}) }
      };
      resolve(merged);
    });
  });

export const setSettings = (settings) =>
  new Promise((resolve) => {
    chrome.storage.local.set({ settings: clone(settings) }, resolve);
  });
