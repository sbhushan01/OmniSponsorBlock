export const API_BASE_URL = "https://sponsor.ajay.app";

export const CATEGORY_KEYS = [
  "sponsor",
  "selfpromo",
  "interaction",
  "intro",
  "outro",
  "preview",
  "filler",
  "music_offtopic"
];

export const CATEGORY_LABELS = {
  sponsor: "Sponsor",
  selfpromo: "Self-promo",
  interaction: "Interaction",
  intro: "Intro",
  outro: "Outro",
  preview: "Preview",
  filler: "Filler",
  music_offtopic: "Music Off-topic"
};

export const DEFAULT_SETTINGS = {
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
