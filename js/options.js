(function () {
  'use strict';

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
  const CATEGORY_LABELS = {
    sponsor: "Sponsor",
    selfpromo: "Self-promo",
    interaction: "Interaction",
    intro: "Intro",
    outro: "Outro",
    preview: "Preview",
    filler: "Filler",
    music_offtopic: "Music Off-topic"
  };

  const getSettingsContainer = () => document.getElementById("settings");
  const render = (settings, container) => {
    container.replaceChildren();
    ["youtube", "spotify"].forEach((platform) => {
      const section = document.createElement("section");
      const title = document.createElement("h3");
      title.textContent = platform.toUpperCase();
      section.appendChild(title);
      CATEGORY_KEYS.forEach((category) => {
        const row = document.createElement("label");
        row.className = "row";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.platform = platform;
        checkbox.dataset.category = category;
        checkbox.checked = !!settings[platform]?.[category];
        const labelText = document.createElement("span");
        labelText.textContent = CATEGORY_LABELS[category];
        row.appendChild(checkbox);
        row.appendChild(labelText);
        section.appendChild(row);
      });
      container.appendChild(section);
    });
  };
  const readSettings = () => new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (response) => {
      resolve(response?.ok && response.data ? response.data : null);
    });
  });
  const saveSettings = (settings) => new Promise((resolve) => {
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

})();
