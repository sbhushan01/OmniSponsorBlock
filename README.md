<div align="center">
  <img src="icons/LogoSponsorBlocker256px.png" alt="OmniSponsorBlock Logo" width="160" />

  # OmniSponsorBlock

  **The unified solution to skip sponsors, self-promos, and unwanted segments on YouTube videos and Spotify podcasts.**

  [![License: LGPL-3.0](https://img.shields.io/badge/License-LGPL%203.0-blue.svg)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
  [![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-yellow.svg)]()
  [![Firefox](https://img.shields.io/badge/Firefox-Manifest%20V2-orange.svg)]()

  *One extension. Two platforms. Zero interruptions.*
</div>

---

## 🌟 Overview

**OmniSponsorBlock** merges the power of [SponsorBlock](https://github.com/ajayyy/SponsorBlock) (for YouTube) and [Spot-SponsorBlock](https://github.com/Spot-SponsorBlock/Spot-SponsorBlock-Extension) (for Spotify) into a **single, unified browser extension**. 

Instead of juggling multiple extensions, OmniSponsorBlock delivers a seamless, shared configuration and unified popup to control your skip preferences across platforms.

### ✨ Key Features

- **📺 YouTube Skipping & Submitting**: Skip sponsors, intros, outros, and filler content automatically. Contribute back by submitting segments directly from the YouTube player.
- **🎧 Spotify Skipping & Submitting**: Silently jump past sponsored segments in your favorite podcasts on Spotify Web, and submit your own segments.
- **🎛️ Unified Control Panel**: A single popup and settings page to manage both platforms seamlessly.
- **🎚️ Category Toggles**: Enable or disable specific skip categories independently for each platform.
- **📱 Mobile Web Support**: Full compatibility with both YouTube and Spotify mobile web layouts.

---

## 🚀 Installation

### Load Pre-built Extension (Chrome / Edge)

1. Download and extract the `omnisponsorblock-dist.zip` release.
2. Navigate to `chrome://extensions/` (or `edge://extensions/`).
3. Toggle **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the extracted `dist/` directory.
5. Pin the **OmniSponsorBlock** icon to your toolbar and enjoy!

### Build from Source

**Prerequisites:** Node.js 18+ and npm.

```bash
# Clone the repository
git clone https://github.com/sbhushan01/OmniSponsorBlock.git
cd OmniSponsorBlock

# Initialize submodules (maze-utils)
git submodule update --init --recursive

# Install dependencies
npm install --ignore-scripts

# Copy and optionally edit the config
cp config.json.example config.json

# Build the extension
npm run build:chrome    # For Chrome/Edge (Manifest V3)
npm run build:firefox   # For Firefox (Manifest V2)
```
The built files will be output to the `dist/` directory, ready to be loaded via **Load unpacked**.

---

## ⚙️ Configuration

Copy `config.json.example` to `config.json` before building. The key options:

| Field | Default | Description |
|---|---|---|
| `serverAddress` | `https://sponsor.ajay.app` | SponsorBlock API server |
| `testingServerAddress` | `https://sponsor.ajay.app/test` | Server used for testing |
| `categoryList` | *(all categories)* | Which segment categories to fetch |
| `categorySupport` | *(see file)* | Which skip modes each category supports |

*Note: You can configure `serverAddress` to point to a self-hosted SponsorBlock server instance.*

---

## 🔒 Privacy & Permissions

OmniSponsorBlock respects your privacy and only requests the permissions absolutely necessary to function:

| Permission | Reason |
|---|---|
| `storage` / `unlimitedStorage` | Save user settings and cache skip segments. |
| `scripting` | Inject content scripts natively on YouTube and Spotify. |
| `*://*.youtube.com/*` | Intercept video playback for YouTube skipping and UI injection. |
| `*://open.spotify.com/*` | Intercept audio playback for Spotify skipping and UI injection. |
| `*://sponsor.ajay.app/*` | Fetch crowdsourced skip segments from the API. |

---

## 🧠 Segment Categories

Customize exactly what you want to skip. Each category can be toggled on or off:

| Category | Description | Default Action |
|:---|:---|:---|
| **Sponsor** | Paid promotions and sponsorships | ⏩ Skip |
| **Self-promo** | Unpaid promotions by the creator | ⏩ Skip |
| **Interaction** | "Like and Subscribe" reminders | ⏩ Skip |
| **Intro** | Opening animations or channel branding | ⏩ Skip |
| **Outro** | Endcards and credits | ⏩ Skip |
| **Preview** | Recaps of previous content | ⏩ Skip |
| **Filler** | Tangents, jokes, and off-topic banter | ⏩ Skip |
| **Music off-topic** | Non-music sections in a music video | ⏩ Skip |

---

## 🏗️ Architecture

OmniSponsorBlock efficiently merges the official SponsorBlock and Spot-SponsorBlock codebases while keeping them isolated in the source. They are bundled together using Rollup:

```text
manifest.json
├── content.js          → youtube.com only (Official YouTube UI & skip logic)
└── content-spotify.js  → open.spotify.com (Spot-SponsorBlock UI & skip logic)

background.js           → Shared service worker merging API requests, storage, and handlers for both.
```

- **Spotify**: `content-spotify.js` natively injects the Spot-SponsorBlock UI and intercepts network requests directly to extract episode data.
- **YouTube**: `content.js` injects the official SponsorBlock UI over the YouTube player, monitors playback, and allows segment submission.

---

## 🤝 Credits & Acknowledgements

OmniSponsorBlock stands on the shoulders of giants. This project is built upon two incredible open-source extensions:

- **[SponsorBlock](https://github.com/ajayyy/SponsorBlock)** by [@ajayyy](https://github.com/ajayyy) — the pioneering YouTube extension and community database.
- **[Spot-SponsorBlock](https://github.com/Spot-SponsorBlock/Spot-SponsorBlock-Extension)** by [@nicholasMeadows](https://github.com/nicholasMeadows) — the Spotify podcast skip integration.

---

## 🛠️ Contributing

We welcome contributions! 

1. **Fork** the repository and create a feature branch.
2. **Build** locally (`npm run build:firefox` or `npm run build:chrome`).
3. **Test** by loading the `dist/` directory as an unpacked extension.
4. **Submit a PR** with a clear description of your changes.

Found a bug or have a feature idea? Open an issue on GitHub!

---

## 📄 License

This project is licensed under **LGPL-3.0**. See the [LICENSE](LICENSE) file for complete details. Also refer to `LICENSE-HISTORY.txt` and `oss-attribution/attribution.txt`.
