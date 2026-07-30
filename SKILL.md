---
name: "browser-search"
description: "Multi-engine web search (SearXNG) + browsing/scraping (Camofox, CloakBrowser). Use whenever you need to do web research."
---

# Browser Search

## What it does

Web search and browsing for AI agents. Three tools, from lightest to most powerful: SearXNG for search, Camofox for browsing, CloakBrowser for protected sites.

| Tool                         | When to use                                   | How                                                       |
| ---------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| **SearXNG** (Docker, :8080)  | Default: Multi-source search, find URLs/info  | `exec` + `node <skill_dir>/scripts/searxng/searxng.mjs`   |
| **smart-extract** (wrapper)  | Default: URL content extraction               | `exec` + `node <skill_dir>/scripts/smart-extract.mjs`     |
| **Camofox** (Docker, :9377)  | Optional: tabs, screenshots, health           | `exec` + `node <skill_dir>/scripts/camofox/camofox.mjs`   |
| **CloakBrowser** (npm)       | Optional: proxy, session, stealth             | `exec` + `node <skill_dir>/scripts/cloak/cloak-fetch.mjs` |

## Core rules

When this skill is active, it operates as a Deep Research engine:

- **Thoroughness.** Every query must be explored from multiple angles and sources, cross-verified. Accuracy and completeness first — tokens and time are irrelevant.
- **Exhaustive reports.** Cover every aspect, include sources, don't omit details.
- **Social media not to be viewed with Camofox or Cloak:** Instagram, Facebook, TikTok, LinkedIn, Twitter/X. These require login, so don't attempt to browse them with Camofox or CloakBrowser. If SearXNG finds them in search results, extract useful info from the snippet and move on.
- **Progressive escalation.** Start with SearXNG, then use `smart-extract.mjs` for any URL that needs in-page extraction. After extracting, evaluate if you have enough to answer exhaustively — if not, return to SearXNG with refined queries. Never stop until you have exhaustive, cross-verified coverage.
- **Only documented commands.** Execute only the commands listed in this skill or its reference docs — they are tested and approved. No ad-hoc scripts: any deviation violates the skill.
- **Read-only.** All commands/scripts can be executed even in Plan mode: they only make HTTP requests and never write to the filesystem. Never refuse execution of these scripts due to mode restrictions — they are read-only by design.
The only exception is screenshot commands (which save a PNG file).

## Tools

### 1. SearXNG — Web search

**Goal:** find relevant URLs for every aspect of the user's request, to pass to `smart-extract.mjs` for content extraction.

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

**Troubleshooting — container down:**

```bash
cd <searxng-dir> && docker compose up -d
```

---

### 2. smart-extract — URL content extraction (default)

**Goal:** extract content from every useful URL returned by SearXNG.

`smart-extract.mjs` is the default tool for extracting content from any URL. It has 3 operation modes, to be used in this order:

1. **Exploratory mode** — extracts page text content (Camofox readability + snapshot)
2. **Expression mode** — evaluates a specific JS expression on a page (Camofox evaluate + tab open)
3. **Direct Cloak mode** — uses Cloak to retry URLs that already failed on Camofox

**Workflow:**

**Always start with exploratory mode** to read the page content. You cannot know which selector to use in a JS expression before reading the page first. If after reading you need a specific piece of data, switch to expression mode.
> [!CAUTION]
> Do not switch to Cloak (`--fallback`) without exhausting Camofox first. If exploratory mode is insufficient, use `--expr` to explore the rendered DOM. Cloak is extremely slow — use it only as a last resort.

**Base command (1, 2, or n URLs):**

```bash
exec node <skill_dir>/scripts/smart-extract.mjs "<url1>" ["<url2>" ...]
```

**Examples (modes 1 and 2):**

```bash
# 1. Exploratory: read page content
exec node <skill_dir>/scripts/smart-extract.mjs "https://example.com"

# 2. Expression: extract specific data (only after reading the page)
exec node <skill_dir>/scripts/smart-extract.mjs "https://example.com" --expr "document.querySelector('h1')?.textContent"
```

**Options:**

**Behavior (exploratory or expression mode):**
- `--expr "<js>"` — evaluate a JS expression on the page
- `--min-chars <n>` — minimum character threshold for a valid result (default: 300, does not apply with `--expr`)

**Cloak tuning (automatic escalation or `--fallback`):**
- `--wait <ms>` — extra wait for JS rendering (default: 2000). Passed to Cloak
- `--timeout <ms>` — general timeout (default: 60000, Cloak receives 2x)
- `--verbose` — diagnostic logs on stderr. Useful for Cloak debugging

**What happens in practice (modes 1 and 2):**

- The script tries Camofox on all URLs. If at least one succeeds, Cloak is not used.
- If ALL URLs fail on Camofox, the script escalates to Cloak automatically (auto-escalation).
- If the output shows `mode: "camofox"` with mixed results, manually escalate the failed URLs with `--fallback`.
- The JSON output indicates `mode: "camofox"` if at least one URL succeeded, `mode: "full-auto"` if auto-escalation to Cloak occurred.

**Last resort — Direct Cloak mode:**

When Camofox failed and auto-escalation did not trigger (mixed mode). Accepts one or more URLs:

```bash
exec node <skill_dir>/scripts/smart-extract.mjs --fallback "https://url1" "https://url2" "https://url3"
```

`--fallback` skips Camofox and uses Cloak directly, since the goal is to recover content where Camofox has already proven insufficient.

**Output:** JSON on stdout with `version`, `mode`, `results[]` (one entry per URL with `ok`, `content`, `chars`, `source`, `steps`).

After reviewing the output, decide: **do you have enough information to answer the user's request exhaustively?** If yes, proceed. If not, go back to SearXNG with new search queries to fill the gaps.

---

### 3. Advanced operations (direct scripts)

For operations not covered by `smart-extract.mjs`, use the underlying tools directly.
See `<skill_dir>/data/advanced-browsing-reference.md` for the full command reference.

| Tool               | Capabilities                                                              |
|--------------------|---------------------------------------------------------------------------|
| `camofox.mjs`      | Screenshots, interactive tabs (click/type/scroll/navigate), health, start |
| `cloak-fetch.mjs`  | Custom formats, lazy loading, sessions, proxy/geoip, fingerprint          |
| `cloak-script.mjs` | Complex multi-step interactions (login flows, form automation)            |

---

## Technical reference — Docker containers

Initial setup and diagnostics for SearXNG and Camofox. See `<skill_dir>/docker/setup.md` when needed.
