# Contributing to OmniSponsorBlock

Thank you for your interest in contributing! This document outlines how to set up the project, submit changes, and report issues.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Related Projects](#related-projects)

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally (replace `your-username` with your GitHub username):
   ```bash
   git clone https://github.com/your-username/OmniSponsorBlock
   cd OmniSponsorBlock
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/sbhushan01/OmniSponsorBlock
   ```

---

## Development Setup

**Requirements:** Node.js 18+, npm

```bash
# Initialize submodules
git submodule update --init --recursive

# Install dependencies
npm install --ignore-scripts

# Copy config
cp config.json.example config.json

# Start a dev build with watch mode
npm run build:watch
```

Load the `dist/` folder as an unpacked extension in `chrome://extensions/` with **Developer mode** enabled.

---

## Branch Naming Conventions

Use descriptive branch names with the following prefixes:

| Prefix | Purpose |
|---|---|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `chore/` | Maintenance / tooling |
| `refactor/` | Code refactoring |

Examples: `feat/add-brave-support`, `fix/spotify-skip-regression`, `docs/update-readme`

---

## Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

Examples:
- `feat(spotify): add skip support for music podcasts`
- `fix(youtube): resolve segment overlap handling`
- `docs: update contributing guide`
- `chore: bump maze-utils submodule`

---

## Submitting a Pull Request

1. Ensure your branch is up to date with `upstream/main`:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. Run the linter and fix any issues:
   ```bash
   npm run lint
   npm run lint:fix
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Push your branch and open a pull request against `main`.
5. Fill in the PR template with a clear description of what changed and why.
6. Link any related issues using `Closes #<issue-number>`.

---

## Reporting Bugs

Please open a [GitHub Issue](https://github.com/sbhushan01/OmniSponsorBlock/issues) and include:

- A clear, descriptive title
- Steps to reproduce the problem
- Expected behaviour vs. actual behaviour
- Browser name and version
- Extension version (visible in `chrome://extensions/`)
- Any relevant console errors or screenshots

---

## Requesting Features

Open a [GitHub Issue](https://github.com/sbhushan01/OmniSponsorBlock/issues) with the `enhancement` label and describe:

- The problem you are trying to solve
- Your proposed solution or feature
- Any alternatives you considered

---

## Related Projects

- **[SponsorBlock](https://github.com/ajayyy/SponsorBlock)** — the upstream YouTube sponsor-skipping extension
- **[Spot-SponsorBlock](https://github.com/Spot-SponsorBlock/Spot-SponsorBlock-Extension)** — the upstream Spotify sponsor-skipping extension
- **[maze-utils](https://github.com/ajayyy/maze-utils)** — shared utilities submodule used by SponsorBlock
