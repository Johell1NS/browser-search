# CloakBrowser — Fetch system

## Architecture

```
cloak-fetch.mjs      →  Universal fetch: navigate + extract content
cloak-script.mjs     →  Run custom Playwright scripts (complex cases)
challenges.mjs       →  Challenge detection and wait (Cloudflare, Akamai...)
scripts/             →  Reusable scripts for cloak-script.mjs
```

All based on `launch()` from `cloakbrowser` (official API). Humanization works natively.

> **Docker container removed.** CloakBrowser now runs only via npm (direct mode with `launch()`). ~2s startup per call.

## cloak-fetch.mjs — Universal fetch

For 90% of sites. Navigates, detects challenges, scrolls, extracts content.

```bash
# Simple (text output)
node "<skill_dir>/scripts/cloak/cloak-fetch.mjs" "https://example.com"

# Raw HTML
node "<skill_dir>/scripts/cloak/cloak-fetch.mjs" "https://example.com" --format html

# With scroll for lazy loading
node "<skill_dir>/scripts/cloak/cloak-fetch.mjs" "https://ebay.com/..." --scroll

# With proxy and anti-bot
node "<skill_dir>/scripts/cloak/cloak-fetch.mjs" "https://protected-site.com" \
  --proxy "socks5://user:pass@proxy:1080" --geoip

# Extra wait and timeout
node "<skill_dir>/scripts/cloak/cloak-fetch.mjs" "https://..." --wait 5000 --timeout 60000

# Deterministic fingerprint
node "<skill_dir>/scripts/cloak/cloak-fetch.mjs" "https://..." --seed 12345 --platform windows

# Disable humanize (faster)
node "<skill_dir>/scripts/cloak/cloak-fetch.mjs" "https://..." --no-humanize

# Truncate output
node "<skill_dir>/scripts/cloak/cloak-fetch.mjs" "https://..." --max-chars 50000

# Persistent profile (cookies)
node "<skill_dir>/scripts/cloak/cloak-fetch.mjs" "https://..." --persistent ./profile
```

## cloak-script.mjs — Custom Playwright scripts

For sites requiring complex interactions (login, multi-step click, custom data extraction).

```bash
node "<skill_dir>/scripts/cloak/cloak-script.mjs" \
  --script "<skill_dir>/scripts/cloak/scripts/<your-script>.mjs" \
  --proxy "socks5://..." --seed 12345
```

Example script:

```javascript
export default async ({ page }) => {
  await page.goto('https://example.com');
  await page.waitForTimeout(2000);

  // Click on a tab
  const tabs = await page.$$('[role=tab]');
  for (const tab of tabs) {
    const text = await tab.textContent();
    if (/reviews|feedback/i.test(text)) { await tab.click(); break; }
  }

  await page.waitForTimeout(1500);
  const text = await page.evaluate(() => document.body.innerText);
  return { text };
};
```

## Screenshot and PDF

```bash
# Screenshot
node "<skill_dir>/scripts/cloak/cloak-script.mjs" \
  --no-humanize \
  --script "<skill_dir>/scripts/cloak/scripts/screenshot.mjs"

# Full-page screenshot
node "<skill_dir>/scripts/cloak/cloak-script.mjs" \
  --no-humanize --fullpage \
  --script "<skill_dir>/scripts/cloak/scripts/screenshot.mjs"
```

## When to use what

| Situation | Tool |
|---|---|
| Normal page, article, docs | `cloak-fetch.mjs` |
| eCommerce with lazy loading | `cloak-fetch.mjs --scroll` |
| Cloudflare / Akamai protected | `cloak-fetch.mjs` (auto challenge detection) |
| Click on tab/accordion needed | `cloak-script.mjs --script scripts/xxx.mjs` |
| Multi-step login | `cloak-script.mjs` + custom script |
| Structured data extraction | `cloak-script.mjs` + custom evaluate |
| Screenshot | `cloak-script.mjs --script scripts/screenshot.mjs` |
| No protection, simple page | `curl` or SearXNG (faster) |

## Notes

- `cloak-fetch.mjs` includes challenge detection (Cloudflare, Akamai, DataDome, Imperva, PerimeterX, DDoS-Guard) adapted from [opencode-cloak-fetch](https://github.com/partment/opencode-cloak-fetch) (MIT)
- Launches a fresh Chromium browser every time (~2s startup)
- Chromium binary lives in `~/.cloakbrowser/` — to reinstall: `npm install cloakbrowser && node -e "import('cloakbrowser').then(c => c.ensureBinary())"`
