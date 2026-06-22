# browser-search

> **A skill for AI agents.** OpenCode, Claude Code, Cursor, OpenClaw and
> beyond. Search the web with SearXNG, browse with Camofox, bypass
> protections with CloakBrowser. All self-hosted, free, unlimited.

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

- **Native stealth.** CloakBrowser automatically detects Cloudflare,
  Akamai, DataDome, Imperva, PerimeterX, and DDoS-Guard challenges,
  and waits for them to resolve before extracting content.

- **Works with any agent.** The SKILL.md is written for OpenCode,
  but the logic is identical for any AI agent. Same README, same
  package.json, everything works everywhere. Just ask your agent
  how to convert the skill for its environment.

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

## Installation

```bash
git clone https://github.com/johell1ns/browser-search
cd browser-search
npm install
```

Then start the Docker containers:

```bash
# SearXNG (follow the official guide)
# https://docs.searxng.org/admin/installation-docker.html

# Camofox
docker run -d --name camofox-browser --restart unless-stopped \
  -p 9377:9377 \
  -e CAMOFOX_API_KEY=your-key \
  camofox-browser:latest
```

Ask your AI agent to handle the details. Each tool has its own
integrated documentation.

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

## License

MIT
