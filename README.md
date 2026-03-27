# OmniSponsorBlock

**Skip sponsors and unwanted segments on YouTube videos and Spotify podcasts — in one extension.**

![License: LGPL-3.0](https://img.shields.io/badge/License-LGPL%203.0-blue.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-yellow.svg)
![Firefox](https://img.shields.io/badge/Firefox-Manifest%20V2-orange.svg)

OmniSponsorBlock combines [SponsorBlock](https://github.com/ajayyy/SponsorBlock) (YouTube) and [Spot-SponsorBlock](https://github.com/Spot-SponsorBlock/Spot-SponsorBlock-Extension) (Spotify) into a single browser extension. Instead of installing and managing two separate extensions, you get unified sponsor-skipping across both platforms with a shared configuration and popup.

---

## Features

- **YouTube**: Skip sponsors, self-promos, intros, outros, interaction reminders, filler content, and more — powered by the community-driven SponsorBlock database
- **Spotify**: Skip sponsor segments in podcasts, automatically and silently
- **Shared popup**: One extension icon, one settings panel for both platforms
- **Category control**: Enable or disable specific segment types independently per platform
- **Mobile support**: Works on YouTube mobile web and Spotify mobile web layouts
- **Supported segment types**: sponsor, self-promo, interaction, intro, outro, preview, filler, music off-topic

---

## Installation

### Load Pre-built Extension (Chrome / Edge)

1. Download and extract `omnisponsorblock-dist.zip`
2. Open `chrome://extensions/` (or `edge://extensions/`)
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the extracted `dist/` folder
5. The OmniSponsorBlock icon will appear in your toolbar

### Build from Source

**Requirements:** Node.js 18+, npm

```bash
# Clone the repository
git clone https://github.com/sbhushan01/OmniSponsorBlock
cd OmniSponsorBlock

# Initialize submodules (maze-utils)
git submodule update --init --recursive

# Install dependencies
npm install --ignore-scripts

# Copy and optionally edit the config
cp config.json.example config.json

# Build
npm run build:firefox   # Firefox (Manifest V2)
npm run build:chrome    # Chrome / Edge (Manifest V3)
```

The built extension will be in the `dist/` folder. Load it via **Load unpacked** as described above.

### Firefox MV2 source workflow

This repository includes a focused Firefox MV2 source pipeline:

```bash
npm install --ignore-scripts
cp config.json.example config.json   # optional; overrides API server address
npm run build:firefox
```

Artifacts are generated in `dist/` using:

- `manifest.firefox.v2.json` -> `dist/manifest.json`
- `src/background/index.js` -> `dist/js/background.js`
- `src/content/content-youtube.js` -> `dist/js/content.js`
- `src/content/content-spotify.js` -> `dist/js/content-spotify.js`
- `src/content/spotify-inject.js` -> `dist/js/spotify-inject.js`
- `public/*` static UI files -> `dist/*`

If `config.json` exists, it is copied to `dist/config.json`; otherwise `config.json.example` is used as fallback.

### Development Build (with source maps)

```bash
npm run build:dev         # One-time dev build
npm run build:watch       # Watch mode — rebuilds on file changes
```

---

## Configuration

Copy `config.json.example` to `config.json` before building. The key options:

| Field | Default | Description |
|---|---|---|
| `serverAddress` | `https://sponsor.ajay.app` | SponsorBlock API server |
| `testingServerAddress` | `https://sponsor.ajay.app/test` | Server used for testing |
| `categoryList` | *(all categories)* | Which segment categories to fetch |
| `categorySupport` | *(see file)* | Which skip modes each category supports |

You can point `serverAddress` at a self-hosted SponsorBlock server instance if desired.

---

## Permissions

The extension requests only what it needs:

| Permission | Reason |
|---|---|
| `storage` / `unlimitedStorage` | Save your settings and segment cache |
| `scripting` | Inject content scripts on YouTube and Spotify |
| `https://*.youtube.com/*` | YouTube sponsor skipping |
| `https://open.spotify.com/*` | Spotify podcast sponsor skipping |
| `https://sponsor.ajay.app/*` | Fetch sponsor segments from the SponsorBlock API |

---

## Architecture

OmniSponsorBlock uses three content scripts, routing by domain at runtime:

```
manifest.json
├── content.js          → youtube.com only   (YouTube skip logic)
├── content-spotify.js  → open.spotify.com   (Spotify skip logic)
└── spotify-inject.js   → injected into page context to intercept episode data

background.js           → shared service worker (API requests, storage, messaging)
```

The Spotify content script (`content-spotify.js`) listens for episode ID messages posted by `spotify-inject.js`, which runs in the page's main world and intercepts `fetch`/`XHR` responses to extract the current episode ID.

The YouTube content script binds to the `<video>` element and checks the current playback time against segments fetched from the SponsorBlock API on every `timeupdate` and `seeked` event.

---

## Segment Categories

| Category | Description | Default action |
|---|---|---|
| Sponsor | Paid promotion | Skip |
| Self-promo | Unpaid promotion by the creator | Skip |
| Interaction | Subscribe/like reminders | Skip |
| Intro | Intro animation / channel branding | Skip |
| Outro | Endcards and credits | Skip |
| Preview | Recap of previous content | Skip |
| Filler | Tangents and jokes | Skip |
| Music off-topic | Non-music section in a music video | Skip |

---

## Credits

OmniSponsorBlock is built on top of two open-source projects:

- **[SponsorBlock](https://github.com/ajayyy/SponsorBlock)** by [@ajayyy](https://github.com/ajayyy) — the YouTube sponsor-skipping extension and community database that powers this project
- **[Spot-SponsorBlock](https://github.com/Spot-SponsorBlock/Spot-SponsorBlock-Extension)** — the Spotify podcast sponsor-skipping extension

Both are licensed under LGPL-3.0. See `LICENSE`, `LICENSE-HISTORY.txt`, and `oss-attribution/attribution.txt` for full license details.

---

## Contributing

1. Fork the repository and create a feature branch
2. Run `npm run build:dev` or `npm run build:watch` during development
3. Run `npm test` before submitting
4. Run `npm run lint` and `npm run lint:fix` to check code style
5. Open a pull request with a clear description of what changed and why

Bug reports and feature requests are welcome via GitHub Issues.

---

## License

LGPL-3.0 — see [LICENSE](LICENSE) for details.
