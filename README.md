# browser-search

<p align="center">
  <img src="img/logoLarge-browser-search.png" alt="browser-search logo" width="80%">
</p>

> **A skill for AI agents.** OpenCode, Claude Code, Cursor, OpenClaw and
> beyond. Search the web with SearXNG, browse with Camofox, bypass
> protections with CloakBrowser. All self-hosted, free, unlimited.

<p align="center"><b>English</b> · <a href="i18n/README.zh-CN.md">简体中文</a> · <a href="i18n/README.es.md">Español</a> · <a href="i18n/README.ja.md">日本語</a> · <a href="i18n/README.ko.md">한국어</a> · <a href="i18n/README.pt-BR.md">Português (Brasil)</a> · <a href="i18n/README.fr.md">Français</a> · <a href="i18n/README.de.md">Deutsch</a> · <a href="i18n/README.ru.md">Русский</a> · <a href="i18n/README.ar.md">العربية</a> · <a href="i18n/README.it.md">Italiano</a></p>

## Why it exists

browser-search is a SKILL — an instruction set for AI agents like OpenCode,
Claude Code, Cursor, OpenClaw and others. It teaches your agent how to
search and browse the web using three orchestrated open source tools.

The problem? The web is hostile to automation. Cloudflare, Akamai, DataDome
and other anti-bot systems block simple requests. Modern sites use heavy
JavaScript, lazy loading, and client-side rendering. One single solution
is not enough.

`browser-search` orchestrates **three open source tools** into a single
search and browsing system designed for AI agents. Each tool has its role,
orchestrated by the skill with escalation logic, automatic selection,
and ready-to-use integration:

1. **[SearXNG](https://github.com/searxng/searxng)** — metasearch engine for the search phase (multi-source, JSON)
2. **[Camofox](https://github.com/jo-inc/camofox-browser)** — browser navigable via REST API for standard sites
3. **[CloakBrowser](https://github.com/cloakhq/cloakbrowser)** — stealth browser for anti-bot protected sites

The typical flow: the agent first searches with SearXNG, then browses the
results with Camofox (or CloakBrowser if the site is protected).

## Benefits

- **100% free, self-hosted, unlimited.** No API keys to buy, no
  subscriptions, no rate limits. Everything runs on your machine,
  Docker and npm. Unlimited usage, zero cost.

- **Lightweight, runs anywhere.** Built and tested on a Raspberry Pi
  — if it runs there, it runs everywhere. Minimal resource consumption,
  no heavy infrastructure needed, runs 24/7 on low-power hardware.

- **Search + browse in one kit.** No manual integration needed.
  Searching and browsing are two distinct phases, both covered.

- **Automatic navigation escalation.** If Camofox gets blocked by
  Cloudflare/Akamai, the agent automatically switches to CloakBrowser.

- **Smart performance.** SearXNG for the search phase (milliseconds).
  Camofox and CloakBrowser are only used to browse the sites that
  actually need it.

- **Automatic agent choice.** The AI agent decides which tool to use:
  SearXNG for initial search, Camofox for browsing, CloakBrowser if
  the site is protected. Zero human intervention.

- **Deep Research mode.** The skill instructs the agent to go beyond
  superficial answers: explore multiple angles, cross-verify sources,
  cover every aspect, and never cut corners.

- **Fully customizable.** The SKILL.md is plain text. You can edit the
  core rules, add your own, remove what you don't need. Adapt it to
  your workflow, your team, your standards.

- **Native stealth.** CloakBrowser automatically detects Cloudflare,
  Akamai, DataDome, Imperva, PerimeterX, and DDoS-Guard challenges,
  and waits for them to resolve before extracting content.

- **Works with any agent.** The SKILL.md is written for OpenCode,
  but the logic is identical for any AI agent. Same README, same
  package.json, everything works everywhere. Just ask your agent
  how to convert the skill for its environment.

## 🏆 State of the art

These three tools were chosen because they represent the current
state of the art available today. A skill like this is designed
to evolve: when better tools emerge, updating the SKILL.md is
all it takes to swap them in. 🔄

⭐ **Star the repo and follow** to stay up to date on new tools,
flow improvements, and orchestration updates over time. 🚀

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    browser-search                        │
│                                                         │
│  ┌──────────────┐                                       │
│  │    Search     │                                       │
│  │               │                                       │
│  │  SearXNG      │  search engines → URLs               │
│  │  (Docker)     │  JSON results, fast                  │
│  │  :8080        │                                       │
│  └──────────────┘                                       │
│         │                                                │
│         │ results ready → to browse                      │
│         ↓                                                │
│  ┌─────────────────────────────────────┐                │
│  │           Browsing                   │                │
│  │                                      │                │
│  │  ┌──────────────┐                   │                │
│  │  │   Camofox    │  browser + REST   │                │
│  │  │  (Docker)    │  JS, click, eval  │                │
│  │  │  :9377       │                   │                │
│  │  └──────┬───────┘                   │                │
│  │         │                           │                │
│  │         │ if blocked                │                │
│  │         ↓                           │                │
│  │  ┌──────────────┐                   │                │
│  │  │ CloakBrowser │  stealth Chromium │                │
│  │  │   (npm)      │  anti-bot, proxy  │                │
│  │  └──────────────┘                   │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## How it works

### Phase 1 — Search with SearXNG

Docker container on `localhost:8080`. Metasearch engine that queries
Google, Wikipedia, Bing, DuckDuckGo and many others simultaneously.
JSON output with titles, snippets, and URLs.

**Example:**

```bash
curl -s "http://localhost:8080/search?format=json&q=largest+llm+benchmark+2026"
```

The agent now has a list of URLs to visit and autonomously decides
whether to browse them with Camofox or CloakBrowser based on the site.

### Phase 2 — Browse with Camofox

Docker container on `localhost:9377`. Exposes a full Firefox browser
through a REST API. The agent can create tabs, navigate, click,
scroll, execute arbitrary JavaScript, and structure data.

**Includes:** Mozilla's Readability.js for extracting clean articles,
removing nav, sidebar, and ads (~70% token savings).

**Main commands:**

```bash
# Create tab and navigate
curl -s -X POST "http://localhost:9377/tabs" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bot","url":"https://example.com"}'

# Read snapshot (accessibility tree)
curl -s "http://localhost:9377/tabs/<tabId>/snapshot?userId=bot"

# Execute JavaScript
curl -s -X POST "http://localhost:9377/tabs/<tabId>/evaluate" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CAMOFOX_API_KEY" \
  -d '{"userId":"bot","expression":"document.title"}'
```

### Phase 3 — Browse with CloakBrowser (when Camofox isn't enough)

npm package based on Playwright + `cloakbrowser`. Launches a Chromium
browser with advanced fingerprinting to bypass Cloudflare, Akamai,
DataDome and other anti-bot systems. Automatic challenge detection
with wait and retry.

**Available scripts:**

- `cloak-fetch.mjs` — universal fetch with challenge detection
- `cloak-script.mjs` — custom Playwright script execution

**Example:**

```bash
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com"
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com" --proxy socks5://... --geoip
```

## Why both Camofox and CloakBrowser?

Because speed and stealth are a tradeoff, and the right tool depends on the site.

**Camofox — fast, structured, persistent.**
Camofox wraps Camoufox (a C++-level Firefox fork) in a REST API with an
always-warm browser. After a ~1-3s cold start, every request is near-instant.
Its accessibility snapshots are ~90% smaller than raw HTML, with stable
element refs (e1, e2, ...) for reliable interaction. It handles the ~90% of
sites that don't use advanced anti-bot protection: articles, docs, search
engines, standard web pages.

**CloakBrowser — stealth, anti-bot, on-demand.**
CloakBrowser launches a fresh Chromium instance per request (~1-3s startup
each time). It uses advanced fingerprinting, proxy support, geoip, and
automatic challenge detection to bypass Cloudflare, Akamai, DataDome,
Imperva, PerimeterX, and DDoS-Guard. It is the last resort for the ~10% of
sites that block Camofox.

**Real-world numbers:**

| Tool | Cloudflare standard | Cloudflare Turnstile | DataDome |
|---|---|---|---|
| **Camoufox** (Camofox engine) | up to **~92%** [¹] | **~65-78%** [¹] | **60-75%** [¹] |
| **Playwright Stealth** | ~70-80% [¹] | ~40-55% [¹] | ~30-50% [¹] |

- **CloakBrowser** applies **58 C++ source-level patches** and scores **0.9 reCAPTCHA v3** (human-level, server-verified), passing all major anti-bot tests including Cloudflare Turnstile and FingerprintJS [²]
- **Camofox** cold start: **~1-3s** (one-time, then ~0ms per request via warm REST API) [³]
- **Playwright/Chromium** cold start: **~0.5-6s** (every launch, varies by environment) [⁴]

Camofox handles the fast path. CloakBrowser handles the edge cases. Together
they cover the entire web with no gaps. The agent decides which to use.

### Sources

¹ "Camoufox Vs Playwright Stealth: Complete Comparison & Alternatives (2026)" — [blog.send.win](https://blog.send.win/camoufox-vs-playwright-stealth-complete-comparison-alternatives-2026/)
² CloakBrowser README — [github.com/cloakhq/cloakbrowser](https://github.com/cloakhq/cloakbrowser)
³ camoufox-pi README (cold start comparison) — [github.com/MonsieurBarti/camoufox-pi](https://github.com/MonsieurBarti/camoufox-pi)
⁴ Playwright issue #4345 (launch time variability) — [github.com/microsoft/playwright/issues/4345](https://github.com/microsoft/playwright/issues/4345)

## Installation

```bash
git clone https://github.com/johell1ns/browser-search
cd browser-search
npm install
```

Show this README to your AI agent for a complete installation
tailored to your environment and platform.

**Services overview:**

| Service | How | Reference |
|---|---|---|
| SearXNG | Docker, `:8080` | [docs.searxng.org](https://docs.searxng.org/admin/installation-docker.html) |
| Camofox | Docker, `:9377` | [github.com/jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser) |
| CloakBrowser | npm (included) | `scripts/cloak/cloak-fetch.mjs` |

**For the AI agent — read these files:**

| File | What it contains |
|---|---|
| `SKILL.md` | Complete skill: commands, escalation, troubleshooting |
| `scripts/cloak/cloak-fetch.mjs` | CloakBrowser CLI usage and all options |
| `scripts/setup-dependencies.sh` | System dependencies |
| `scripts/check-browser-search.sh` | Post-installation verification |
| `docker/setup.md` | Docker setup tips |

**Note:** `SKILL.md` is written for **OpenCode** syntax (`exec`, `curl`).
If your agent uses a different format (Claude Code, Cursor, etc.), read it
and convert the commands to your agent's syntax before using the skill.

## Environment variables

| Variable             | Required for                      | Default |
|----------------------|-----------------------------------|---------|
| `CAMOFOX_API_KEY`    | evaluate, session, cleanup in Camofox | —   |
| `CAMOFOX_ADMIN_KEY`  | Camofox stop endpoint             | —       |

## What this skill does NOT do

- **Social media.** Instagram, Facebook, TikTok, LinkedIn, and Twitter/X
  require login. `browser-search` does not attempt to browse them.
- **Download files.** It is read-only (except for explicit screenshots).
- **Bypass paywalls.** Does not circumvent payment or login systems.

## Get involved

browser-search is open source and free. If you find it useful:

- ⭐ **Star the repo** — helps others discover it
- 🐛 **Open an issue** — report bugs or suggest features
- 🔀 **Submit a PR** — fix, improve, extend
- 💬 **Share it** — with your team, on Reddit, Twitter, Discord
- 🧠 **Adapt it** — fork it, tweak the SKILL.md, make it yours

Every contribution, no matter how small, makes this better.

## License

MIT
