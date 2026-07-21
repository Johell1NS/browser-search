#!/usr/bin/env node
// Execute a custom Playwright script through CloakBrowser.
// Script receives { page, browser, context }, uses Playwright API directly.
// Follows the official CloakBrowser pattern: launch() + Playwright API.
//
// v1.1.0 — Added per-origin sessions, WebRTC IP spoofing.

import { launch, launchPersistentContext } from 'cloakbrowser';
import { resolve, dirname, sep } from 'path';
import { fileURLToPath } from 'url';
import { realpath } from 'node:fs/promises';
import { createSandbox } from './lib/sandbox.mjs';
import { RateLimiter } from './lib/rate-limiter.mjs';
import { acquireSession } from './lib/session.mjs';

const SKILL_DIR = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));

function help() {
  process.stderr.write(`
Usage: node cloak-script.mjs --script <file.mjs> [launch options]

Required:
  --script <file>       JS module to execute (default export receives { page, browser, context })

Launch options (same as cloak-fetch):
  --proxy <url>         HTTP or SOCKS5 proxy
  --seed <num>          Fixed fingerprint seed
  --platform <name>     windows, macos, linux
  --humanize            Human-like behavior (default: on)
  --no-humanize         Disable humanization
  --preset <name>       default, careful
  --geoip               Auto-detect timezone/locale
  --tz <timezone>       Force timezone
  --locale <locale>     Force locale
  --persistent <dir>    Persistent profile
  --session             Per-origin persistent session (auto profile per domain)
  --webrtc-auto         Auto-spoof WebRTC IP to match proxy exit IP
  --timeout <ms>        Browser launch timeout (default: 30000)

Other:
  --version, --help
  --unsafe            Bypass sandbox (full Playwright API access — DANGEROUS)
  --verbose           Include stack traces in error output
  --no-rate-limit     Disable rate limiting (default: 30 req/min)

Script example:
  export default async ({ page }) => {
    await page.goto('https://example.com');
    await page.waitForTimeout(2000);
    const text = await page.evaluate(() => document.body.innerText);
    return { text };
  };
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) { help(); process.exit(0); }
  if (args.includes('--version')) { process.stderr.write(JSON.stringify({ tool: 'cloak-script', version: '1.1.0' }) + '\n'); process.exit(0); }

  const idx = f => { const i = args.indexOf(f); return i >= 0 && i + 1 < args.length ? i : -1; };
  const has = f => args.includes(f);

  const si = idx('--script');
  if (si < 0) { process.stderr.write(JSON.stringify({ error: 'Please specify --script <file>' }) + '\n'); help(); process.exit(1); }

  const opts = {
    script: resolve(args[si + 1]),
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
    timeout: 30000,
    unsafe: has('--unsafe'),
    verbose: has('--verbose'),
    noRateLimit: has('--no-rate-limit'),
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

  const ti = idx('--timeout');
  if (ti >= 0) opts.timeout = parseInt(args[ti + 1], 10) || 30000;

  return opts;
}

async function main() {
  const opts = parseArgs();

  if (!opts.unsafe) {
    let realScriptPath;
    try {
      realScriptPath = await realpath(opts.script);
    } catch {
      realScriptPath = opts.script;
    }
    if (realScriptPath !== SKILL_DIR && !realScriptPath.startsWith(SKILL_DIR + sep)) {
      const err = new Error(`Script path must be within skill directory (${SKILL_DIR}). Got: ${realScriptPath}`);
      process.stderr.write(JSON.stringify({ error: err.message }) + '\n');
      process.exit(1);
    }
  }

  if (!opts.noRateLimit) {
    const limiter = new RateLimiter();
    await limiter.acquire();
  }

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

  let session = null;
  let browser = null;
  let context = null;
  let page = null;

  try {
    const scriptModule = await import(opts.script);
    const scriptFn = scriptModule.default;
    if (typeof scriptFn !== 'function') throw new Error(`Script ${opts.script} must export a default function`);

    if (opts.persistent) {
      context = await launchPersistentContext({ userDataDir: opts.persistent, ...launchOpts });
      const pages = context.pages();
      page = pages[0] || await context.newPage();
    } else if (opts.useSession) {
      const scriptContent = await import('node:fs').then(fs => fs.default.readFileSync(opts.script, 'utf8'));
      const urlMatch = scriptContent.match(/['"]https?:\/\/[^'"]+['"]/);
      const sessionUrl = urlMatch ? urlMatch[0].replace(/['"]/g, '') : 'https://example.com';

      session = await acquireSession(sessionUrl);
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

    const api = opts.unsafe
      ? { page, browser, context }
      : createSandbox({ page, browser, context });

    const result = await scriptFn(api);

    process.stdout.write(JSON.stringify({ ok: true, data: result ?? null }) + '\n');
  } catch (err) {
    const errObj = { error: err.message };
    if (opts.verbose) errObj.stack = err.stack;
    process.stderr.write(JSON.stringify(errObj) + '\n');
    process.exit(1);
  } finally {
    if (page && !opts.persistent && !session) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    if (session) await session.release().catch(() => {
      process.stderr.write(JSON.stringify({ warning: 'Failed to release session lock' }) + '\n');
    });
  }
}

main();
