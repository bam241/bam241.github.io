# Local Development Guide

This guide covers everything you need to run **bam241.github.io** locally,
using the provided `Makefile` (orchestration) and `tools/run.sh` (Jekyll
wrapper used by CI).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Tool Files](#project-tool-files)
  - [Makefile](#makefile)
  - [tools/run.sh](#toolsrunsh)
  - [rollup.config.js](#rollupconfigjs)
  - [\_config\_dev.yml](#_config_devyml)
- [Makefile Target Reference](#makefile-target-reference)
- [Daily Development Workflow](#daily-development-workflow)
- [Editing Assets](#editing-assets)
  - [SCSS / CSS](#scss--css)
  - [JavaScript](#javascript)
- [Configuration Files](#configuration-files)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

The following tools must be installed before using the `Makefile`.  
Run `make check` at any time to verify your environment.

| Tool | Minimum Version | Install |
|------|----------------|---------|
| [Homebrew](https://brew.sh) | any | See [brew.sh](https://brew.sh) |
| [rbenv](https://github.com/rbenv/rbenv) | any | `brew install rbenv ruby-build` |
| Ruby | 3.2+ | `rbenv install 3.2.2` |
| Bundler | 2.0+ | `gem install bundler` |
| Node.js | 18+ | `brew install node` |
| npm | 9+ | bundled with Node |

> **Why rbenv instead of system Ruby?**  
> macOS ships with an outdated Ruby that requires `sudo` for gem installs.
> rbenv keeps Ruby versions isolated per project and avoids permission issues.

### One-time shell setup for rbenv

```bash
# Add to ~/.zshrc (default shell on modern macOS)
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc
```

---

## Quick Start

```bash
# 1 — Clone the repo
git clone https://github.com/bam241/bam241.github.io.git
cd bam241.github.io

# 2 — Verify your environment
make check

# 3 — Install all dependencies and build assets (one-time)
make setup

# 4 — Start the development server
make serve
# → open http://127.0.0.1:4000
```

> **Also editing JavaScript?**  
> Open a second terminal and run `make watch-js` alongside `make serve`.

---

## Project Tool Files

### Makefile

**Location:** `Makefile` (repo root)  
**Purpose:** Single entry point for all local development tasks.

The `Makefile` orchestrates:

- Checking that required tools are installed (`make check`)
- Installing Ruby gems via Bundler and Node packages via npm
- Building JavaScript bundles with Rollup
- Building and serving the Jekyll site
- Cleaning generated and cached files

It uses **sentinel files** (`vendor/.bundle-installed`,
`node_modules/.npm-installed`) so that `bundle install` and `npm install`
are only re-run when their lockfiles (`Gemfile.lock`, `package-lock.json`)
actually change — keeping repeated `make` invocations fast.

```
Makefile
├── check           verify toolchain
├── setup           full first-time setup
├── install
│   ├── install-ruby   → bundle install
│   └── install-node   → npm install
├── build
│   ├── build-js       → rollup (npm run build)
│   └── build-jekyll   → jekyll build
├── serve           jekyll serve --livereload
├── watch-js        rollup --watch
├── clean           remove _site/, .jekyll-cache/, assets/js/dist/
├── purge           clean + remove node_modules/, vendor/
├── rebuild         clean → build → serve
└── open            open http://127.0.0.1:4000 in browser
```

---

### tools/run.sh

**Location:** `tools/run.sh`  
**Purpose:** Thin shell wrapper around `jekyll serve`, used by both the
`Makefile` and the GitHub Actions workflow
(`.github/workflows/pages-deploy.yml`).

You can invoke it directly if you prefer not to use `make`:

```bash
bash tools/run.sh
```

> The `Makefile`'s `serve` target is the recommended approach locally
> because it also sets `JEKYLL_ENV=development` and applies the
> `_config_dev.yml` overlay automatically.

---

### rollup.config.js

**Location:** `rollup.config.js` (repo root)  
**Purpose:** Configures [Rollup](https://rollupjs.org) to bundle the
source JavaScript files found in `_javascript/` into
`assets/js/dist/`.

The bundled files in `assets/js/dist/` are **not committed to the
repo** (they are listed in `.gitignore`). You must build them locally
before the site's JavaScript features will work.

```
_javascript/          ← source files (edit these)
    ├── commons.js
    ├── home.js
    ├── page.js
    ├── post.js
    └── ...
         ↓  rollup
assets/js/dist/       ← generated bundles (do NOT edit)
    ├── commons.min.js
    └── ...
```

| npm script | What it does |
|-----------|-------------|
| `npm run build` | One-shot production bundle |
| `npm run watch` | Watches `_javascript/` and rebuilds on save |

---

### _config_dev.yml

**Location:** `_config_dev.yml` (repo root, you may need to create it)  
**Purpose:** Overrides production values in `_config.yml` for local
development.

The `Makefile` automatically detects this file and merges it with
`_config.yml` when serving locally. If the file does not exist, only
`_config.yml` is used.

Recommended contents:

```yaml
# _config_dev.yml
# Overrides for local development — never committed to main branch

url: "http://127.0.0.1:4000"
baseurl: ""

# Disable third-party services locally
google_analytics:
  id: ""

comments:
  active: ""

paginate: 10
```

> **Tip:** Add `_config_dev.yml` to your global git ignore
> (`~/.gitignore_global`) so it is never accidentally committed.

---

## Makefile Target Reference

```
make <target>
```

| Target | Description |
|--------|-------------|
| `help` | *(default)* Print all available targets with descriptions |
| `check` | Verify ruby, bundler, jekyll, node, and npm are installed |
| `setup` | **First-time setup:** check → install → build |
| `install` | Install all Ruby gems and Node packages |
| `install-ruby` | Run `bundle install` only |
| `install-node` | Run `npm install` only |
| `build` | Build JS bundles + Jekyll site |
| `build-js` | Build JS bundles with Rollup only |
| `build-jekyll` | Build Jekyll site only |
| `serve` | Start Jekyll dev server with live reload on port 4000 |
| `watch-js` | Watch `_javascript/` and rebuild bundles on change |
| `clean` | Remove `_site/`, `.jekyll-cache/`, `assets/js/dist/` |
| `purge` | `clean` + remove `node_modules/` and `vendor/` |
| `rebuild` | `clean` → `build` → `serve` (fixes most broken states) |
| `open` | Open `http://127.0.0.1:4000` in your default browser |

---

## Daily Development Workflow

### Standard session (content / SCSS changes only)

```bash
make serve
# → Jekyll watches _posts/, _pages/, _sass/ automatically
# → Browser refreshes on every save via --livereload
```

### Session with JavaScript changes

Open two terminals side by side:

```bash
# Terminal 1 — JS watcher
make watch-js

# Terminal 2 — Jekyll server
make serve
```

Both processes must run simultaneously. Rollup rebuilds the JS bundle
on save, then Jekyll's live reload picks up the new file and refreshes
the browser.

### After pulling changes from remote

```bash
git pull

# Re-install deps only if lockfiles changed (make handles this automatically)
make install

# Rebuild JS in case upstream changed _javascript/
make build-js

# Then serve as normal
make serve
```

### Nuclear reset (when things are broken)

```bash
make purge      # wipes _site/, .jekyll-cache/, node_modules/, vendor/
make setup      # reinstalls everything from scratch
make serve
```

---

## Editing Assets

### SCSS / CSS

Source files live in `_sass/`. Jekyll compiles them automatically —
no manual step required.

```
_sass/
├── addon/          ← Chirpy overrides
├── colors/         ← light/dark theme variables
├── layout/         ← page structure
└── main.scss       ← entry point
```

Just save your `.scss` file while `make serve` is running and the
browser will refresh automatically.

> Do **not** edit files inside `assets/css/` directly — they are
> generated output.

### JavaScript

Source files live in `_javascript/`. Rollup compiles them.

```
_javascript/
├── commons.js      ← shared across all pages
├── home.js         ← homepage-specific
├── page.js         ← static pages
├── post.js         ← blog post pages
└── utils/
    └── ...
```

**One-shot rebuild:**
```bash
make build-js
```

**Continuous rebuild while editing:**
```bash
make watch-js   # in a dedicated terminal
```

> Do **not** edit files inside `assets/js/dist/` — they are generated
> and will be overwritten on the next build.

---

## Configuration Files

| File | Environment | Purpose |
|------|-------------|---------|
| `_config.yml` | Production + local | Main Jekyll configuration |
| `_config_dev.yml` | Local only | Dev overrides (URL, disable analytics) |
| `Gemfile` | Both | Ruby gem dependencies |
| `Gemfile.lock` | Both | Locked gem versions (commit this) |
| `package.json` | Both | Node dependencies + npm scripts |
| `package-lock.json` | Both | Locked Node versions (commit this) |
| `rollup.config.js` | Build time | JS bundler configuration |
| `.github/workflows/pages-deploy.yml` | CI/CD only | GitHub Actions deployment pipeline |

---

## Troubleshooting

### `make check` fails on Ruby

```bash
brew install rbenv ruby-build
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc
rbenv install 3.2.2
rbenv global 3.2.2
```

### `make serve` fails with "cannot load such file -- webrick"

```bash
bundle add webrick
make serve
```

### JavaScript features broken (search, dark mode, etc.)

The `assets/js/dist/` folder is missing or stale:

```bash
make build-js
```

### Site links are broken or point to github.io URLs

Check that `_config_dev.yml` exists and contains:

```yaml
url: "http://127.0.0.1:4000"
baseurl: ""
```

### Changes to `_config.yml` not showing up

`jekyll serve` does not watch `_config.yml`. Restart the server:

```bash
# Ctrl+C to stop, then:
make serve
```

### Gem version conflicts after `git pull`

```bash
bundle install   # or: make install-ruby
```

### Everything is broken

```bash
make purge
make setup
make serve
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│           LOCAL DEVELOPMENT — QUICK REFERENCE           │
├──────────────────────┬──────────────────────────────────┤
│ First time setup     │ make setup                       │
│ Start dev server     │ make serve                       │
│ Watch JS changes     │ make watch-js  (2nd terminal)    │
│ Rebuild JS once      │ make build-js                    │
│ Clean generated      │ make clean                       │
│ Full reset           │ make purge && make setup         │
│ Verify tools         │ make check                       │
│ Open in browser      │ make open                        │
│ See all targets      │ make help                        │
└──────────────────────┴──────────────────────────────────┘
```

---

## About This Documentation

The repository and website are maintained by
[@bam241](https://github.com/bam241).

### Sources & References

The setup and tooling documented here draws from the following sources:

| Source | Used for |
|--------|---------|
| [Chirpy Theme Documentation](https://chirpy.cotes.page) | Theme configuration, asset pipeline, deployment |
| [Jekyll Official Docs](https://jekyllrb.com/docs/) | Jekyll CLI flags, configuration, SCSS pipeline |
| [Rollup.js Documentation](https://rollupjs.org/guide/en/) | JS bundling configuration |
| [rbenv Documentation](https://github.com/rbenv/rbenv) | Ruby version management on macOS |
| [Bundler Documentation](https://bundler.io) | Ruby gem dependency management |

### AI Assistance

The `Makefile` and this documentation were drafted with the assistance of
**Claude Sonnet 4.5** (Anthropic).

AI assistance was used for:

- Scaffolding the `Makefile` structure and sentinel file pattern
- Writing the target reference table and workflow sections
- Drafting troubleshooting scenarios based on known Chirpy pitfalls

All generated content has been reviewed, tested, and adapted for this
specific repository by [@bam241](https://github.com/bam241).

> **Note:** Always verify AI-generated configuration and shell scripts
> against the official documentation for your specific tool versions
> before using them in production.