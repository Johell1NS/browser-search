---
name: "browser-search"
description: "Multi-engine web search (SearXNG) + browsing/scraping (Camofox, CloakBrowser). Use whenever you need to do web research."
---

# Browser Search

## What it does

Web search and browsing for AI agents. Three tools, from lightest to most powerful: SearXNG for search, Camofox for browsing, CloakBrowser for protected sites.

| Tool                         | When to use                          | How                                                     |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------- |
| **SearXNG** (Docker, :8080)  | Multi-source search, find URLs/info  | `exec` + `curl` on `:8080/search`                       |
| **Camofox** (Docker, :9377)  | JS-heavy pages, scraping, navigation | `exec` + `curl` on `:9377` (REST API)                   |
| **CloakBrowser** (npm)       | When Camofox gets blocked            | `exec` + `node <skill_dir>/scripts/cloak/cloak-fetch.mjs` |

## Core rules

When this skill is active, it operates as a Deep Research engine:

- **No superficiality.** Every query must be explored from multiple angles, sources, and cross-verified.
- **No shortcuts.** Accuracy and completeness first. Tokens and time are irrelevant.
- **Exhaustive reports.** Cover every aspect, include sources, don't omit details.
- **Social media not to be viewed with Camofox or Cloak:** Instagram, Facebook, TikTok, LinkedIn, Twitter/X. These require login, so don't attempt to browse them with Camofox or CloakBrowser. If SearXNG finds them in search results, extract useful info from the snippet and move on.
- **Automatic escalation.** If Camofox fails, switch to CloakBrowser.
- **Only documented commands.** Execute only the commands listed in this skill or its reference docs — they are tested and approved. No ad-hoc scripts: any deviation violates the skill.
- **Read-only.** Except where specified (screenshot saves PNG), all commands/scripts are read-only: they only make HTTP requests and don't write to the filesystem. Safe to run even in Plan mode.

## Tools

### 1. SearXNG — Web search

Docker container on `localhost:8080`. Always the first choice for any search.

**Commands:**

Direct call to SearXNG REST API via `curl`. JSON output.

```bash
# Simple search
exec curl -s "http://localhost:8080/search?format=json&q=<query>"

# With language and category
exec curl -s "http://localhost:8080/search?format=json&q=<query>&language=en&categories=news"

# With time range (day, week, month, year)
exec curl -s "http://localhost:8080/search?format=json&q=<query>&time_range=month"

# Specific engines
exec curl -s "http://localhost:8080/search?format=json&q=<query>&engines=google,wikipedia"

# Image search
exec curl -s "http://localhost:8080/search?format=json&q=<query>&categories=images"

# Pagination
exec curl -s "http://localhost:8080/search?format=json&q=<query>&pageno=2"

# Health check
exec curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/search?format=json&q=health"
```

For specific engines, check the `engine` field in results and pass names with `&engines=name1,name2`.

**Language strategy:**

| Situation                                        | `--language` |
| ------------------------------------------------ | ------------ |
| Query matches content language, general/cultural | that locale  |
| Query matches content language, technical topic  | `en`         |
| Query in English                                 | `en`         |
| Fallback if preferred locale returns 0 results   | `en`         |

> **Note:** If SearXNG results are already exhaustive, Camofox and CloakBrowser are not needed. Stop here.

**Troubleshooting — container down:**

```bash
cd <searxng-dir> && docker compose up -d
```

---

### 2. Camofox — Browser navigation (REST API)

Docker container on `localhost:9377`. Official interface: REST API over HTTP.
Full OpenAPI spec: **`http://localhost:9377/docs`** (Swagger UI) or **`http://localhost:9377/openapi.json`** (raw).

**Constants for all commands:**

```bash
USER_ID="opencode-bot"
SESSION_KEY="default"
API_KEY="${CAMOFOX_API_KEY}"
```

The API key (Bearer) is required for `POST /evaluate`, `POST /sessions/{userId}/cookies`, `DELETE /sessions/{userId}`, `GET /sessions/{userId}/traces`, `DELETE /sessions/{userId}/traces/{filename}`, and `POST /pressure/cleanup`. `POST /stop` requires `x-admin-key` header (see below). Other endpoints work without auth.

**General pattern:**

1. **Create tab** → `POST /tabs` → get `tabId` (+ initial snapshot)
2. **Operate** on the tab with snapshot, evaluate, click, scroll...
3. **Close tab** → `DELETE /tabs/{tabId}`

> **TabId persistence:** Always keep the `tabId` between commands. Camofox commands must never run in isolation: create a tab, use the `tabId` for all subsequent operations, then close it.
>
> **⚠️ Stale refs:** After every interaction (click, scroll, navigate), refs (`e1`, `e2`...) are regenerated. Always take a fresh snapshot before using a ref.
>
> **404 error:** If a command returns 404, the tab may have expired or been closed. Recreate it with `POST /tabs` and resume.

#### Essential commands

```bash
# 1. Create tab and navigate → returns { tabId, url } (snapshot separate)
exec curl -s -X POST "http://localhost:9377/tabs" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$USER_ID\",\"sessionKey\":\"$SESSION_KEY\",\"url\":\"<url>\"}"

# 2. Snapshot (accessibility tree with refs e1, e2, ...)
exec curl -s "http://localhost:9377/tabs/<tabId>/snapshot?userId=$USER_ID"
# Options: &includeScreenshot=true  |  &offset=N (pagination)

# 3. Evaluate (arbitrary JavaScript — for HTML tables, <code>, <pre>, non-ARIA divs)
exec curl -s -X POST "http://localhost:9377/tabs/<tabId>/evaluate" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $API_KEY" \
  -d "{\"userId\":\"$USER_ID\",\"expression\":\"<js-expression>\"}"

# 4. Click (by ref e1, e2... or CSS selector)
exec curl -s -X POST "http://localhost:9377/tabs/<tabId>/click" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$USER_ID\",\"ref\":\"<ref>\"}"

# 5. Type (with optional clear and submit)
exec curl -s -X POST "http://localhost:9377/tabs/<tabId>/type" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$USER_ID\",\"ref\":\"<ref>\",\"text\":\"<text>\"}"

# 6. Scroll (direction: down/up/left/right, optional amount in px)
exec curl -s -X POST "http://localhost:9377/tabs/<tabId>/scroll" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$USER_ID\",\"direction\":\"down\"}"

# 7. Navigate (URL or search macro)
exec curl -s -X POST "http://localhost:9377/tabs/<tabId>/navigate" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$USER_ID\",\"url\":\"<new-url>\"}"

# 8. Extract (structured data via JSON Schema + x-ref)
exec curl -s -X POST "http://localhost:9377/tabs/<tabId>/extract" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$USER_ID\",\"schema\":{\"type\":\"object\",\"properties\":{\"field\":{\"x-ref\":\"e1\"}}}}"

# 9. Close tab
exec curl -s -X DELETE "http://localhost:9377/tabs/<tabId>?userId=$USER_ID"

# 10. Destroy session (closes all tabs — requires API key)
exec curl -s -X DELETE "http://localhost:9377/sessions/$USER_ID" \
  -H "Authorization: Bearer $API_KEY"

# 11. Health check
exec curl -s "http://localhost:9377/health"

# 12. Screenshot (⚠️ returns raw PNG binary, not JSON — save to file)
exec curl -s -o /tmp/camofox_screenshot.png "http://localhost:9377/tabs/<tabId>/screenshot?userId=$USER_ID"

# 13. Stop browser (⚠️ requires CAMOFOX_ADMIN_KEY env var + x-admin-key header)
exec curl -s -X POST "http://localhost:9377/stop" \
  -H 'Content-Type: application/json' \
  -H "x-admin-key: $CAMOFOX_ADMIN_KEY" \
  -d '{}'
```

**Other endpoints:** `back`, `forward`, `refresh`, `press`, `wait`, `viewport`, `links`, `images`, `screenshot`, `downloads`, `stats`, `start`, `stop`, `tabs/group/{id}`, `sessions/{userId}/cookies`, `sessions/{userId}/traces`, `sessions/{userId}/traces/{filename}`. All documented with params and body in the OpenAPI spec at `http://localhost:9377/docs`. Consult it when needed.

**⚠️ `/screenshot` returns raw PNG binary (not base64 JSON)** — save to file with `curl -s -o file.png` then read it. Don't try to parse as JSON.

#### Reading method selection

Firefox's accessibility tree (snapshot) does **NOT** expose: HTML tables without ARIA roles, `<code>`, `<pre>`, generic divs.

**Decision flow:**

1. **Always start with `snapshot`.** If it's rich in textual content and refs are usable, you're good.

2. **Discard the snapshot if** it's dominated by iframes, ad links, cookie banners, or the noise/content ratio is unfavorable. In that case go directly to `evaluate`.

3. **`evaluate` is the main path** for extracting structured data from any page. Strategy:

   - **First contact:** simple expressions (`document.title`) to verify the page loaded.
   - **Explore the DOM** with targeted selectors, one field at a time (`document.querySelector("h1")?.textContent`).
     - **Don't nest** multiple selectors in a single evaluate — can cause 500 errors. Separate into multiple calls.
     - **`document.querySelector(':contains(...)')` causes 500** because `:contains` is not standard CSS. Arrow functions and `:has` work fine. Use standard CSS selectors.

4. **On dynamic pages** (SPA, lazy content, infinite scroll): after creating the tab, use `POST /tabs/{tabId}/wait` on a known selector (e.g. `h1`) or `POST /tabs/{tabId}/scroll` to trigger loading before evaluating.

5. **Readability for articles** (blogs, news, Wikipedia, docs):
   Use `evaluate` + Readability.js (Mozilla, `scripts/camofox/Readability.js`) to extract clean article text, removing nav, sidebar, ads, footer. ~70% token savings vs snapshot. For SEARCH/LIST pages, use snapshot instead.
   On lazy-loading pages: scroll before Readability.

   **Command:**

   ```bash
   # Read Readability.js, build ~94KB JSON payload and inject
   python3 -c "
   import json
   js = open('<skill_dir>/scripts/camofox/Readability.js').read()
   expr = js + '; var a = new Readability(document.cloneNode(true)).parse(); JSON.stringify({title: a?.title, text: a?.textContent, excerpt: a?.excerpt, length: a?.length})'
   json.dump({'userId': '$USER_ID', 'expression': expr}, open('/tmp/rb_article.json', 'w'))
   "

   exec curl -s -X POST "http://localhost:9377/tabs/<tabId>/evaluate" \
     -H 'Content-Type: application/json' \
     -H "Authorization: Bearer $API_KEY" \
     -d @/tmp/rb_article.json
   # Output: { ok: true, result: "...{title, text, excerpt, length}..." }
   # If result is null → fallback to snapshot. Otherwise use text.
   ```

#### Search Macros

Use with `POST /tabs/{tabId}/navigate` passing `macro` and `query`:

| Macro               | Site      |
| ------------------- | --------- |
| `@google_search`    | Google    |
| `@youtube_search`   | YouTube   |
| `@amazon_search`    | Amazon    |
| `@reddit_search`    | Reddit    |
| `@reddit_subreddit` | Subreddit |
| `@wikipedia_search` | Wikipedia |
| `@yelp_search`      | Yelp      |
| `@spotify_search`   | Spotify   |
| `@netflix_search`   | Netflix   |
| `@linkedin_search`  | LinkedIn  |
| `@twitter_search`   | Twitter/X |
| `@instagram_search` | Instagram |
| `@tiktok_search`    | TikTok    |
| `@twitch_search`    | Twitch    |

#### Full workflow example

```bash
# 1. Create tab
exec curl -s -X POST "http://localhost:9377/tabs" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"opencode-bot","sessionKey":"default","url":"https://example.com"}'
# → {"tabId":"abc123","url":"https://example.com/"}

# 2. Snapshot (understand structure and refs)
exec curl -s "http://localhost:9377/tabs/abc123/snapshot?userId=opencode-bot"

# 3. If snapshot is sparse → evaluate for raw HTML
exec curl -s -X POST "http://localhost:9377/tabs/abc123/evaluate" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CAMOFOX_API_KEY" \
  -d '{"userId":"opencode-bot","expression":"document.querySelector(\"main\")?.innerHTML || document.body.innerHTML"}'

# 4. Interact: scroll, click, type...
exec curl -s -X POST "http://localhost:9377/tabs/abc123/scroll" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"opencode-bot","direction":"down","amount":500}'

# 5. After each interaction, take new snapshot (refs change!)
exec curl -s "http://localhost:9377/tabs/abc123/snapshot?userId=opencode-bot"

# 6. Click and new snapshot
exec curl -s -X POST "http://localhost:9377/tabs/abc123/click" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"opencode-bot","ref":"e3"}'
exec curl -s "http://localhost:9377/tabs/abc123/snapshot?userId=opencode-bot"

# 7. Structured extract
exec curl -s -X POST "http://localhost:9377/tabs/abc123/extract" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"opencode-bot","schema":{"type":"object","properties":{"title":{"x-ref":"e1"}}}}'

# 8. Close tab
exec curl -s -X DELETE "http://localhost:9377/tabs/abc123?userId=opencode-bot"

# 9. (Optional) Cleanup session (requires API key)
exec curl -s -X DELETE "http://localhost:9377/sessions/opencode-bot" \
  -H "Authorization: Bearer $CAMOFOX_API_KEY"
```

**Troubleshooting — container down:**

```bash
docker start camofox-browser
# If doesn't exist:
docker run -d --name camofox-browser --restart unless-stopped \
  -p 9377:9377 \
  -e CAMOFOX_API_KEY=<your-api-key> \
  -e CAMOFOX_ADMIN_KEY=<your-admin-key> \
  camofox-browser:latest
```

---

### 3. CloakBrowser — Protected sites

For sites with Cloudflare, Akamai, Kasada, DataDome, or when Camofox gets blocked.
Uses `launch()` from the npm package `cloakbrowser`.

Script: `<skill_dir>/scripts/cloak/cloak-fetch.mjs`

```bash
# Simple (markdown output)
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://example.com"

# Text only (no markdown header)
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://example.com" --format text

# Raw HTML
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://example.com" --format html

# With scroll for lazy loading (eBay, Amazon, reviews)
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://ebay.com/..." --scroll

# Automatic challenge detection (Cloudflare, Akamai, DataDome...)
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://protected-site.com"

# Proxy + geoip for sites that block datacenter IPs
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://..." --proxy "socks5://user:pass@proxy:1080" --geoip

# Deterministic fingerprint
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://..." --seed 12345 --platform windows

# Screenshot (⚠️ writes PNG file — breaks read-only rule)
exec node <skill_dir>/scripts/cloak/cloak-script.mjs --script "<skill_dir>/scripts/cloak/scripts/screenshot.mjs"
```

#### cloak-script.mjs — For complex interactions

When click, login, multi-step, or custom data extraction is needed:

```bash
exec node <skill_dir>/scripts/cloak/cloak-script.mjs \
  --script "<skill_dir>/scripts/cloak/scripts/<your-script>.mjs" \
  --proxy "socks5://..." --seed 12345
```

Full guide: `<skill_dir>/scripts/cloak/guida-fetch.md`

---

## Technical reference — Docker containers

Initial setup and diagnostics for SearXNG and Camofox. See `<skill_dir>/docker/setup.md` when needed.
