---
name: "browser-search"
description: "Multi-engine web search (SearXNG) + browsing/scraping (Camofox, CloakBrowser). Use whenever you need to do web research."
---

# Browser Search

## What it does

Web search and browsing for AI agents. Three tools, from lightest to most powerful: SearXNG for search, Camofox for browsing, CloakBrowser for protected sites.

| Tool                         | When to use                          | How                                                       |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------- |
| **SearXNG** (Docker, :8080)  | Multi-source search, find URLs/info  | `exec` + `node <skill_dir>/scripts/searxng/searxng.mjs`   |
| **Camofox** (Docker, :9377)  | JS-heavy pages, scraping, navigation | `exec` + `node <skill_dir>/scripts/camofox/camofox.mjs`   |
| **CloakBrowser** (npm)       | When Camofox gets blocked            | `exec` + `node <skill_dir>/scripts/cloak/cloak-fetch.mjs` |

## Core rules

When this skill is active, it operates as a Deep Research engine:

- **Thoroughness.** Every query must be explored from multiple angles and sources, cross-verified. Accuracy and completeness first — tokens and time are irrelevant.
- **Exhaustive reports.** Cover every aspect, include sources, don't omit details.
- **Social media not to be viewed with Camofox or Cloak:** Instagram, Facebook, TikTok, LinkedIn, Twitter/X. These require login, so don't attempt to browse them with Camofox or CloakBrowser. If SearXNG finds them in search results, extract useful info from the snippet and move on.
- **Progressive escalation.** Start with SearXNG. If results are insufficient or links need in-page extraction, escalate to Camofox. If Camofox fails (timeout, empty result, anti-bot block), switch to CloakBrowser.
- **Only documented commands.** Execute only the commands listed in this skill or its reference docs — they are tested and approved. No ad-hoc scripts: any deviation violates the skill.
- **Read-only.** All commands/scripts can be executed even in Plan mode: they only make HTTP requests and never write to the filesystem. Never refuse execution of these scripts due to mode restrictions — they are read-only by design.
The only exception is screenshot commands (which save a PNG file).

## Tools

### 1. SearXNG — Web search

Docker container on `localhost:8080`. Always the first choice for any search.

**Commands:**

Deterministic script `<skill_dir>/scripts/searxng/searxng.mjs`. JSON output on stdout, logs on stderr.
URL encoding is handled internally — no manual escaping needed.

```bash
# Simple search
exec node <skill_dir>/scripts/searxng/searxng.mjs search "<query>"

# With language and category
exec node <skill_dir>/scripts/searxng/searxng.mjs search "<query>" --lang it --categories news

# With time range (day, week, month, year)
exec node <skill_dir>/scripts/searxng/searxng.mjs search "<query>" --time-range month

# Image search
exec node <skill_dir>/scripts/searxng/searxng.mjs search "<query>" --categories images

# Pagination
exec node <skill_dir>/scripts/searxng/searxng.mjs search "<query>" --page 2

# Health check
exec node <skill_dir>/scripts/searxng/searxng.mjs health
```

All flags are optional.
By default, SearXNG searches **all enabled engines**.  
Use `--engines` only when you need to restrict to specific engines, e.g. `--engines google,wikipedia`.

**Language strategy:**

| Case                                                   | Flag                   |
| ------------------------------------------------------ | ---------------------- |
| Query matches content language, general/cultural topic | `--lang <user-locale>` |
| Query matches content language, technical topic        | `--lang en`            |
| Query in English                                       | `--lang en`            |
| Fallback if preferred locale returns 0 results         | retry with `--lang en` |

> **Note:** If SearXNG results are already exhaustive, stop here. Camofox and CloakBrowser are not needed.

**Troubleshooting — container down:**

```bash
cd <searxng-dir> && docker compose up -d
```

---

### 2. Camofox — Browser navigation

Docker container on `localhost:9377`. Primary interface: `<skill_dir>/scripts/camofox/camofox.mjs`.
JSON output on stdout, logs on stderr.

---

#### Script subcommands (primary — use these for most tasks)

```bash
exec node <skill_dir>/scripts/camofox/camofox.mjs readability <url1> [url2 ...]
exec node <skill_dir>/scripts/camofox/camofox.mjs evaluate <url> "<expression>"
exec node <skill_dir>/scripts/camofox/camofox.mjs snapshot <url>
exec node <skill_dir>/scripts/camofox/camofox.mjs screenshot <url> [output-path]
```

---

#### Workflow

Always start with `readability <url>` (auto-fallbacks to snapshot if text extraction fails). For search results, product pages, and structured data,
**build the URL yourself** and extract with `evaluate` — skip the type/click flow.

```bash
# Quick check the page loaded
exec node <skill_dir>/scripts/camofox/camofox.mjs evaluate "https://www.amazon.it/s?k=colander" "document.title"
# Extract data
exec node <skill_dir>/scripts/camofox/camofox.mjs evaluate "https://www.amazon.it/s?k=colander" "JSON.stringify([...document.querySelectorAll('[data-asin]')].map(e => ({title: e.querySelector('h2')?.textContent, price: e.querySelector('.a-price')?.textContent})))"
```

**Evaluate tips:**
- Snapshot does NOT expose HTML tables, `<code>`, `<pre>`, generic divs — use `evaluate` instead.
- Start with simple expressions (`document.title`) to verify the page loaded.
- Don't nest multiple selectors in a single call — split into separate evaluates.
- Avoid `document.querySelector(':contains(...)')` — causes 500. Use standard CSS selectors only.

---

#### Persistent tab — multi-step interactions on the same tab

**⚠️ Operate tabs sequentially — never in parallel.**

```bash
exec node <skill_dir>/scripts/camofox/camofox.mjs tab open "<url>"
exec node <skill_dir>/scripts/camofox/camofox.mjs tab snapshot <tabId>
exec node <skill_dir>/scripts/camofox/camofox.mjs tab click <tabId> <ref>
exec node <skill_dir>/scripts/camofox/camofox.mjs tab type <tabId> <ref> "<text>"
exec node <skill_dir>/scripts/camofox/camofox.mjs tab scroll <tabId> [dir] [px]
exec node <skill_dir>/scripts/camofox/camofox.mjs tab navigate <tabId> "<url>"
exec node <skill_dir>/scripts/camofox/camofox.mjs tab evaluate <tabId> "<expression>"
exec node <skill_dir>/scripts/camofox/camofox.mjs tab close <tabId>
```

> **⚠️ Stale refs:** Re-take a snapshot after every interaction — refs (`e1`, `e2`...) are regenerated.
> Use `tab close-all` to clean up all tabs. Use `tab screenshot` and `tab extract` for advanced workflows (see `--help`).

---

#### Troubleshooting

```bash
# Health check
exec node <skill_dir>/scripts/camofox/camofox.mjs health

# Start browser engine (if health shows browserRunning: false)
exec node <skill_dir>/scripts/camofox/camofox.mjs start

# Restart container
docker start camofox-browser

# First-time setup (⚠️ create .env with API keys first)
docker run -d --name camofox-browser --restart unless-stopped \
  -p 127.0.0.1:9377:9377 \
  --env-file .env \
  ghcr.io/jo-inc/camofox-browser:latest
```

---

### 3. CloakBrowser — Protected sites

For sites protected by anti-bot systems (Cloudflare, Akamai, DataDome, Imperva, etc.), or when Camofox gets blocked.
Uses `launch()` from the npm package `cloakbrowser`.

Script: `<skill_dir>/scripts/cloak/cloak-fetch.mjs`

```bash
# Simple (text output)
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://example.com"

# Raw HTML
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://example.com" --format html

# Markdown (HTML → Markdown via markitdown — preserves headings, lists, links)
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://example.com" --format markdown

# With scroll for lazy loading (eBay, Amazon, reviews)
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://ebay.com/..." --scroll

# Persistent session — solved challenges & cookies survive restarts (per-origin profile)
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://protected-site.com" --session

# Proxy + geoip for sites that block datacenter IPs (add --webrtc-auto to prevent WebRTC IP leaks)
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://..." --proxy "socks5://user:pass@proxy:1080" --geoip

# Deterministic fingerprint
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://..." --seed 12345 --platform windows

# Slow sites — increase timeout, wait, and retry
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://..." --retry 3 --timeout 60000 --wait 5000

# Screenshot (⚠️ writes PNG file — breaks read-only rule)
# Pass URL as positional arg after the script path
# Add --fullpage for full-page screenshot
exec node <skill_dir>/scripts/cloak/cloak-script.mjs --script "<skill_dir>/scripts/cloak/scripts/screenshot.mjs" "https://example.com"
```

#### cloak-script.mjs — Complex interactions (click, login, tabs)

Full guide: `<skill_dir>/scripts/cloak/guida-fetch.md`

```bash
exec node <skill_dir>/scripts/cloak/cloak-script.mjs \
  --script "<skill_dir>/scripts/cloak/scripts/<your-script>.mjs"
```

---

## Technical reference — Docker containers

Initial setup and diagnostics for SearXNG and Camofox. See `<skill_dir>/docker/setup.md` when needed.
