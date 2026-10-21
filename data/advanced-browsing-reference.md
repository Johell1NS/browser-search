# Advanced browsing — direct script reference

For operations that `smart-extract.mjs` does not support (screenshots, interactive tabs, Cloak advanced features), use the underlying scripts directly.

## Camofox — `camofox.mjs`

Script: `<skill_dir>/scripts/camofox/camofox.mjs`

### Screenshot

```bash
exec node <skill_dir>/scripts/camofox/camofox.mjs screenshot <url> [output-path]
```

Add `--fullpage` for full-page screenshot. ⚠️ Writes a PNG file (breaks read-only rule).

### PDF download

```bash
exec node <skill_dir>/scripts/camofox/camofox.mjs pdf <url> [output-path]
```

Saves the complete PDF that the browser loaded (including PDFs behind a bot check) and returns `{pdf: <path>, bytes}`. Read the file afterwards with your own PDF tools: `smart-extract` only sees the pages the in-browser viewer has rendered, so it returns a fraction of long papers. Requires Camofox 1.16+, limit 50 MB. Fails with a clear error if the URL is not a PDF. ⚠️ Writes a file (breaks read-only rule); default path is in the system temp directory.

### Health & start

```bash
# Health check
exec node <skill_dir>/scripts/camofox/camofox.mjs health

# Start browser engine (if health shows browserRunning: false)
exec node <skill_dir>/scripts/camofox/camofox.mjs start
```

### Interactive tabs — multi-step on the same tab

> ⚠️ Operate tabs sequentially — never in parallel.

```bash
exec node <skill_dir>/scripts/camofox/camofox.mjs tab open "<url>" [--wait]
exec node <skill_dir>/scripts/camofox/camofox.mjs tab snapshot <tabId>
exec node <skill_dir>/scripts/camofox/camofox.mjs tab click <tabId> <ref>
exec node <skill_dir>/scripts/camofox/camofox.mjs tab type <tabId> <ref> "<text>" [--submit] [--clear]
exec node <skill_dir>/scripts/camofox/camofox.mjs tab select <tabId> <ref> "<option label or value>"
exec node <skill_dir>/scripts/camofox/camofox.mjs tab press <tabId> <key>
exec node <skill_dir>/scripts/camofox/camofox.mjs tab scroll <tabId> [dir] [px]
exec node <skill_dir>/scripts/camofox/camofox.mjs tab navigate <tabId> "<url>"
exec node <skill_dir>/scripts/camofox/camofox.mjs tab evaluate <tabId> "<expression>"
exec node <skill_dir>/scripts/camofox/camofox.mjs tab close <tabId>
```

> **Stale refs:** Re-take a snapshot after every interaction — refs (`e1`, `e2`...) are regenerated. Use `tab close-all` to clean up all tabs.

> **Forms:** `--submit` presses Enter after typing, `--clear` empties the field first. Use `tab select` for native `<select>` menus (combobox refs in the snapshot) and `tab press` for keys such as `Enter`, `Escape`, `Tab`.

> **HTTP status:** On Camofox 1.15+, `tab open`, `evaluate`, `snapshot` and `readability` also return `httpStatus` and `navigationOk`. A status of 400 or higher does not always mean failure (some sites serve real content with a 403 after a challenge), so check the content too.

> **Storage:** Camofox persists cookies and localStorage of every visited site and never prunes them; a large file can exhaust the server heap when the session is recreated. `camofox.mjs` therefore resets the stored state automatically every 7 days (only when no session is active; consent banners and anti-bot cookies are regenerated on the next visit). `CAMOFOX_STORAGE_MAX_AGE_DAYS` changes the interval (`0` disables it), `CAMOFOX_STORAGE_MARKER` the marker file (default `~/.cache/browser-search/camofox-storage-reset`).

> **Timeouts:** when `smart-extract.mjs` gives a Camofox step a timeout, `camofox.mjs` stops itself slightly earlier (`CAMOFOX_DEADLINE_MS`) and closes the tabs it opened. The same happens on SIGTERM/SIGINT.

> **`tab open --wait`:** Waits ~2s after navigation before returning the tabId. Useful for slow-loading sites where subsequent `tab evaluate` would otherwise see a half-rendered DOM.

### Docker setup

```bash
docker start camofox-browser

docker run -d --name camofox-browser --restart unless-stopped \
  --ulimit core=0 \
  --log-opt max-size=10m --log-opt max-file=3 \
  -v camofox-data:/root/.camofox \
  -e CAMOFOX_CRASH_REPORT_ENABLED=false \
  -e MAX_OLD_SPACE_SIZE=512 \
  -p 127.0.0.1:9377:9377 \
  --env-file .env \
  ghcr.io/jo-inc/camofox-browser:1.18.1
```

Dettagli sui flag (soprattutto `--ulimit core=0`, che evita l'accumulo di core dump) in `<skill_dir>/docker/setup.md`.

---

## CloakBrowser — `cloak-fetch.mjs`

Script: `<skill_dir>/scripts/cloak/cloak-fetch.mjs`

### Output format

```bash
# Raw HTML
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://example.com" --format html

# Markdown (preserves headings, lists, links)
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://example.com" --format markdown
```

### Lazy loading (scroll)

```bash
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://ebay.com/..." --scroll
```

### Persistent session

Cookie sessions survive restarts (per-origin profile).

```bash
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://protected-site.com" --session
```

### Proxy + geoip

For sites that block datacenter IPs.

```bash
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://..." --proxy "socks5://user:pass@proxy:1080" --geoip
```

Add `--webrtc-auto` to prevent WebRTC IP leaks.

### Custom fingerprint

```bash
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://..." --seed 12345 --platform windows
```

### Slow sites (retry + timeout)

```bash
exec node <skill_dir>/scripts/cloak/cloak-fetch.mjs "https://..." --retry 3 --timeout 60000 --wait 5000
```

### Screenshot

⚠️ Writes PNG file — breaks read-only rule. Pass URL as positional arg after the script path.

```bash
exec node <skill_dir>/scripts/cloak/cloak-script.mjs --script "<skill_dir>/scripts/cloak/scripts/screenshot.mjs" "https://example.com"
```

Add `--fullpage` for full-page screenshot.

### Complex interactions (`cloak-script.mjs`)

For click, login, tabs and other complex workflows. Full guide: `<skill_dir>/scripts/cloak/guida-fetch.md`

```bash
exec node <skill_dir>/scripts/cloak/cloak-script.mjs \
  --script "<skill_dir>/scripts/cloak/scripts/<your-script>.mjs"
```

## SearXNG — `searxng.mjs`

Tuning del rate-limit della modalità multi-query (serie con pausa tra le query).

### Env var

| Var | Valore | Default |
|---|---|---|
| `SEARXNG_QUERY_DELAY` | Pausa in ms tra query consecutive della modalità multi-query; `0` la disattiva | `3000` |
| `SEARXNG_URL` | Indirizzo di SearXNG (anche con `/search` finale). Se impostata, lo script non riavvia nessun container in caso di errore | `http://127.0.0.1:8080` |
| `SEARXNG_TIMEOUT_MS` | Timeout in ms di ogni richiesta a SearXNG | `30000` |

```bash
SEARXNG_QUERY_DELAY=5000 exec node <skill_dir>/scripts/searxng/searxng.mjs search --query "q1" --query "q2"
```
