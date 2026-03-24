import { CATEGORY_KEYS, CATEGORY_LABELS } from "../shared/constants.js";

const getSettingsContainer = () => document.getElementById("settings");

const render = (settings, container) => {
  container.innerHTML = "";

  ["youtube", "spotify"].forEach((platform) => {
    const section = document.createElement("section");
    section.innerHTML = `<h3>${platform.toUpperCase()}</h3>`;

    CATEGORY_KEYS.forEach((category) => {
      const row = document.createElement("label");
      row.className = "row";
      row.innerHTML = `
        <input type="checkbox" data-platform="${platform}" data-category="${category}" ${
        settings[platform][category] ? "checked" : ""
      }>
        <span>${CATEGORY_LABELS[category]}</span>
      `;
      section.appendChild(row);
    });

    container.appendChild(section);
  });
};

const readSettings = () =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (response) => {
      resolve(response?.ok && response.data ? response.data : null);
    });
  });

const saveSettings = (settings) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "SET_SETTINGS", payload: settings }, resolve);
  });

const boot = async () => {
  const container = getSettingsContainer();
  if (!container) return;

  const settings = await readSettings();
  if (!settings) return;
  render(settings, container);

  container.addEventListener("change", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const platform = target.dataset.platform;
    const category = target.dataset.category;
    if (!platform || !category) return;

    settings[platform][category] = target.checked;
    await saveSettings(settings);
  });
};

boot();
