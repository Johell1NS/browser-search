#!/usr/bin/env node
// Fetch any URL through CloakBrowser stealth Chromium.
// Adapted from opencode-cloak-fetch (MIT) by PartMent
//
// v2.1.0 — Added per-origin persistent sessions and WebRTC IP spoofing.

import { launch, launchPersistentContext } from 'cloakbrowser';
import { detectChallenge, extractState, waitForChallenge } from './challenges.mjs';
import { validateUrlWithDns } from './lib/url-validation.mjs';
import { RateLimiter } from './lib/rate-limiter.mjs';
import { acquireSession } from './lib/session.mjs';

const VERSION = '2.1.0';

function help() {
  process.stderr.write(`
Usage: node cloak-fetch.mjs <url> [options]

Content:
  --format <fmt>        Output format: text (default), html
  --max-chars <n>       Truncate output to n chars (default: 100000)

Interaction:
  --scroll              Scroll progressively to load lazy content
  --wait <ms>           Extra wait after page load (default: 1000)
  --timeout <ms>        Navigation timeout (default: 30000)
  --retry <n>           Retry on failure

Stealth:
  --seed <num>          Fixed fingerprint seed
  --platform <name>     windows, macos, linux
  --brand <name>        Chrome, Edge, Opera, Vivaldi

Network:
  --proxy <url>         HTTP or SOCKS5 proxy (e.g. socks5://user:pass@host:1080)
  --geoip               Auto-detect timezone/locale from proxy
  --tz <timezone>       Force timezone (e.g. Europe/Rome)
  --locale <locale>     Force locale (e.g. it-IT)
  --webrtc-auto         Auto-spoof WebRTC IP to match proxy exit IP

Behavior:
  --humanize            Human-like mouse/keyboard (default: on)
  --no-humanize         Disable humanization
  --preset <name>       Humanize preset: default, careful

Session:
  --persistent <dir>    Persistent profile (cookies survive restarts)
  --session             Per-origin persistent session (auto profile per domain)

Other:
  --version, --help
  --verbose           Include stack traces in error output
  --no-rate-limit     Disable rate limiting (default: 30 req/min)
  --unsafe            Bypass SSRF protection (allow localhost/private IPs — DANGEROUS)
`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) { help(); process.exit(0); }
  if (args.includes('--version')) { process.stderr.write(JSON.stringify({ tool: 'cloak-fetch', version: VERSION }) + '\n'); process.exit(0); }

  const idx = f => { const i = args.indexOf(f); return i >= 0 && i + 1 < args.length ? i : -1; };
  const has = f => args.includes(f);

  const opts = {
    url: null,
    format: 'text',
    maxChars: 100000,
    scroll: has('--scroll'),
    wait: 1000,
    timeout: 30000,
    retry: 0,
    humanize: !has('--no-humanize'),
    preset: 'default',
    proxy: null,
    geoip: has('--geoip'),
    seed: null,
    platform: null,
    brand: null,
    timezone: null,
    locale: null,
    persistent: null,
    useSession: has('--session'),
    webrtcAuto: has('--webrtc-auto'),
    json: true,
    verbose: has('--verbose'),
    noRateLimit: has('--no-rate-limit'),
    unsafe: has('--unsafe'),
  };

  const strOpts = {
    '--proxy': 'proxy', '--seed': 'seed', '--platform': 'platform',
    '--brand': 'brand', '--tz': 'timezone', '--locale': 'locale',
    '--preset': 'preset', '--persistent': 'persistent',
  };
  for (const [flag, key] of Object.entries(strOpts)) {
    const i = idx(flag);
    if (i >= 0) opts[key] = args[i + 1];
  }

  const numOpts = { '--timeout': 'timeout', '--retry': 'retry', '--wait': 'wait', '--max-chars': 'maxChars' };
  for (const [flag, key] of Object.entries(numOpts)) {
    const i = idx(flag);
    if (i >= 0) opts[key] = parseInt(args[i + 1], 10) || opts[key];
  }

  const fi = idx('--format');
  if (fi >= 0) {
    const v = args[fi + 1];
    if (['text', 'markdown', 'html'].includes(v)) opts.format = v;
  }

  opts.url = args.find(a => a.startsWith('http://') || a.startsWith('https://') || (a && !a.startsWith('--')));
  if (!opts.url) { process.stderr.write(JSON.stringify({ error: 'Please specify a URL' }) + '\n'); help(); process.exit(1); }

  return opts;
}

function truncate(text, maxChars) {
  if (!text || text.length <= maxChars) return text || '';
  return text.slice(0, maxChars) + '\n\n[truncated]';
}

async function fetchPage(opts) {
  const launchOpts = {
    headless: true,
    ...(opts.humanize && { humanize: true, ...(opts.preset !== 'default' && { humanPreset: opts.preset }) }),
    ...(opts.proxy && { proxy: opts.proxy }),
    ...(opts.geoip && { geoip: true }),
    ...(opts.timezone && { timezone: opts.timezone }),
    ...(opts.locale && { locale: opts.locale }),
  };

  const extraArgs = [];
  if (opts.seed) extraArgs.push(`--fingerprint=${opts.seed}`);
  if (opts.platform) extraArgs.push(`--fingerprint-platform=${opts.platform}`);
  if (opts.brand) extraArgs.push(`--fingerprint-brand=${opts.brand}`);
  if (opts.webrtcAuto) extraArgs.push(`--fingerprint-webrtc-ip=auto`);
  if (extraArgs.length > 0) launchOpts.args = extraArgs;

  if (!opts.unsafe) {
    const urlCheck = await validateUrlWithDns(opts.url);
    if (!urlCheck.valid) {
      throw new Error(`URL blocked: ${urlCheck.reason}`);
    }
  }

  let session = null;
  let browser = null;
  let context = null;
  let page = null;

  const start = Date.now();

  try {
    if (opts.persistent) {
      context = await launchPersistentContext({ userDataDir: opts.persistent, ...launchOpts });
      const pages = context.pages();
      page = pages[0] || await context.newPage();
    } else if (opts.useSession) {
      session = await acquireSession(opts.url);
      process.stderr.write(JSON.stringify({
        session: 'acquired',
        origin: session.origin,
        userDataDir: session.userDataDir,
      }) + '\n');
      context = await launchPersistentContext({ userDataDir: session.userDataDir, ...launchOpts });
      const pages = context.pages();
      page = pages[0] || await context.newPage();
    } else {
      browser = await launch(launchOpts);
      context = await browser.newContext();
      page = await context.newPage();
    }

    let navResponse;
    try {
      navResponse = await withTimeout(
        page.goto(opts.url, { waitUntil: 'networkidle', timeout: opts.timeout }),
        opts.timeout,
        'navigation'
      );
    } catch {
      navResponse = await withTimeout(
        page.goto(opts.url, { waitUntil: 'domcontentloaded', timeout: opts.timeout }),
        opts.timeout,
        'navigation'
      );
    }

    const challenge = await waitForChallenge(page, 20000);

    if (opts.wait > 0) await sleep(opts.wait);

    if (opts.scroll) {
      let prev = 0;
      for (let i = 0; i < 5; i++) {
        const h = await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); return document.body.scrollHeight; });
        if (h === prev) break;
        prev = h;
        await sleep(1500);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    const finalUrl = typeof page.url === 'function' ? page.url() : page.url;
    const title = await page.title().catch(() => '');

    let content;
    if (opts.format === 'html') {
      content = await page.content();
    } else {
      content = await page.evaluate(() => document.body?.innerText || '').catch(() => '');
    }

    const result = {
      url: finalUrl,
      title,
      content: truncate(content, opts.maxChars),
      format: opts.format,
      chars: (content || '').length,
      challenge: challenge.detected ? { strategy: challenge.strategy } : null,
      challengeResolved: challenge.resolved,
      retries: 0,
      elapsedMs: Date.now() - start,
      ...(session ? { sessionOrigin: session.origin } : {}),
    };

    return result;
  } finally {
    if (page && !opts.persistent && !session) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    if (session) await session.release().catch(() => {
      process.stderr.write(JSON.stringify({ warning: 'Failed to release session lock' }) + '\n');
    });
  }
}

async function main() {
  const opts = parseArgs();
  const maxRetries = Math.max(0, opts.retry || 0);

  if (!opts.noRateLimit) {
    const limiter = new RateLimiter();
    await limiter.acquire();
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      process.stderr.write(JSON.stringify({ retry: attempt, max: maxRetries }) + '\n');
      await sleep(2000 * attempt);
    }
    try {
      const result = await fetchPage(opts);
      result.retries = attempt;
      process.stdout.write(JSON.stringify(result) + '\n');
      process.exit(0);
    } catch (err) {
      if (attempt < maxRetries) continue;
      const errObj = { error: err.message };
      if (opts.verbose) errObj.stack = err.stack;
      process.stderr.write(JSON.stringify(errObj) + '\n');
      process.exit(1);
    }
  }
}

main();
