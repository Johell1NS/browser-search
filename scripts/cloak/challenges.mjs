// Adapted from opencode-cloak-fetch (MIT) by PartMent
// https://github.com/partment/opencode-cloak-fetch

const RULES = [
  {
    name: 'cloudflare-challenge',
    minScore: 10,
    rules: [
      { reason: 'cf-mitigated response header', pattern: /header:cf-mitigated=challenge/i, score: 10 },
      { reason: 'Cloudflare challenge platform resource', pattern: /\/cdn-cgi\/challenge-platform/i, score: 10 },
      { reason: 'Cloudflare challenge token marker', pattern: /cf_chl_/i, score: 10 },
      { reason: 'Cloudflare browser verification marker', pattern: /cf-browser-verification/i, score: 10 },
      { reason: 'Cloudflare challenge frame', pattern: /challenges\.cloudflare\.com\/cdn-cgi\/challenge-platform/i, score: 10 },
    ],
  },
  {
    name: 'akamai-bot-manager-challenge',
    minScore: 10,
    rules: [
      { reason: 'Akamai _abck cookie', pattern: /^cookie:_abck$/i, score: 1 },
      { reason: 'Akamai bm_sz cookie', pattern: /^cookie:bm_sz$/i, score: 1 },
      { reason: 'Akamai verification marker', pattern: /bm-verify/i, score: 10 },
      { reason: 'Akamai sensor marker', pattern: /sensor_data/i, score: 2 },
      { reason: 'Akamai telemetry path', pattern: /\/akam\//i, score: 1 },
    ],
  },
  {
    name: 'datadome-challenge',
    minScore: 10,
    rules: [
      { reason: 'DataDome challenge host', pattern: /captcha-delivery\.com/i, score: 10 },
      { reason: 'DataDome cookie or marker', pattern: /(?:^|[:=])datadome/i, score: 1 },
      { reason: 'DataDome endpoint', pattern: /datadome\.co/i, score: 10 },
    ],
  },
  {
    name: 'imperva-incapsula-challenge',
    minScore: 10,
    rules: [
      { reason: 'Imperva resource path', pattern: /_Incapsula_Resource/i, score: 10 },
      { reason: 'Imperva visid_incap cookie', pattern: /^cookie:visid_incap/i, score: 1 },
      { reason: 'Imperva incap_ses cookie', pattern: /^cookie:incap_ses/i, score: 1 },
    ],
  },
  {
    name: 'perimeterx-challenge',
    minScore: 10,
    rules: [
      { reason: 'PerimeterX captcha marker', pattern: /px-captcha/i, score: 10 },
      { reason: 'PerimeterX cookie', pattern: /^cookie:_px/i, score: 1 },
      { reason: 'PerimeterX collector endpoint', pattern: /collector-px/i, score: 2 },
    ],
  },
  {
    name: 'ddos-guard-challenge',
    minScore: 10,
    rules: [
      { reason: 'DDoS-Guard check host', pattern: /check\.ddos-guard\.net/i, score: 10 },
      { reason: 'DDoS-Guard cookie or marker', pattern: /(?:^|[:=])__ddg/i, score: 1 },
    ],
  },
];

export function detectChallenge(state) {
  for (const ruleSet of RULES) {
    const values = collectTechnicalValues(state);
    let score = 0;
    const matched = [];
    for (const rule of ruleSet.rules) {
      const found = values.some(v => rule.pattern.test(v));
      if (found) {
        score += rule.score;
        matched.push(rule.reason);
      }
    }
    if (score >= ruleSet.minScore) {
      return { strategy: ruleSet.name, reason: matched.join(', '), score };
    }
  }
  return null;
}

export async function extractState(page, navigationResponse) {
  const url = typeof page.url === 'function' ? page.url() : page.url;

  const docState = await page.evaluate(() => {
    const unique = arr => [...new Set(arr.filter(Boolean))];

    const resourceUrls = unique([
      ...Array.from(document.scripts, s => s.src),
      ...Array.from(document.querySelectorAll('iframe[src]'), el => el.getAttribute('src')),
      ...Array.from(document.querySelectorAll('form[action]'), el => el.getAttribute('action')),
      ...Array.from(document.querySelectorAll('link[href]'), el => el.getAttribute('href')),
      ...Array.from(document.querySelectorAll('object[data]'), el => el.getAttribute('data')),
      ...Array.from(document.querySelectorAll('embed[src]'), el => el.getAttribute('src')),
    ]);

    const markers = [];
    const attrs = document.querySelectorAll('[id], [class], [name], [data-sitekey], [data-action]');
    for (const el of attrs) {
      if (markers.length >= 500) break;
      for (const attr of el.attributes) {
        if (markers.length >= 500) break;
        if (['id', 'class', 'name'].includes(attr.name) || attr.name.startsWith('data-')) {
          markers.push(`${attr.name}=${attr.value}`);
        }
      }
    }

    const cookieNames = document.cookie
      ? document.cookie.split(';').map(c => c.split('=')[0]?.trim()).filter(Boolean)
      : [];

    return { resourceUrls, markers, cookieNames };
  }).catch(() => ({ resourceUrls: [], markers: [], cookieNames: [] }));

  return {
    url,
    responseUrl: navigationResponse?.url() || url,
    responseHeaders: normalizeHeaders(navigationResponse),
    resourceUrls: docState.resourceUrls.slice(0, 500),
    markers: docState.markers.slice(0, 1000),
    cookieNames: docState.cookieNames,
  };
}

export async function waitForChallenge(page, timeoutMs) {
  if (timeoutMs <= 0) return { detected: false, resolved: false, timedOut: false, elapsedMs: 0 };

  const start = Date.now();

  let navResponse;
  try { navResponse = await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 3000 }).catch(() => null); } catch {}
  let state = await extractState(page, navResponse);
  let detection = detectChallenge(state);

  if (!detection) return { detected: false, resolved: false, timedOut: false, elapsedMs: Date.now() - start };

  const strategy = detection.strategy;
  process.stderr.write(JSON.stringify({ challenge: detection.strategy, reason: detection.reason }) + '\n');

  while (Date.now() - start < timeoutMs) {
    const remaining = timeoutMs - (Date.now() - start);
    const pollMs = Math.min(1000, remaining);

    let newNav;
    try { newNav = await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: pollMs }).catch(() => null); } catch {}

    state = await extractState(page, newNav);
    detection = detectChallenge(state);

    if (!detection) {
      const elapsedMs = Date.now() - start;
      process.stderr.write(JSON.stringify({ challengeResolved: true, elapsedMs }) + '\n');
      return { detected: true, strategy, resolved: true, timedOut: false, elapsedMs };
    }

    if (remaining <= pollMs) break;
  }

  const elapsedMs = Date.now() - start;
  process.stderr.write(JSON.stringify({ challengeResolved: false, timedOut: true, elapsedMs }) + '\n');
  return { detected: true, strategy, resolved: false, timedOut: true, elapsedMs };
}

function collectTechnicalValues(state) {
  const values = [`url:${state.url}`, `response-url:${state.responseUrl}`];
  for (const [k, v] of Object.entries(state.responseHeaders)) values.push(`header:${k}=${v}`);
  for (const v of state.resourceUrls) values.push(`resource:${v}`);
  for (const v of state.markers) values.push(`element:${v}`);
  for (const v of state.cookieNames) values.push(`cookie:${v}`);
  return values;
}

function normalizeHeaders(response) {
  if (!response) return {};
  const headers = {};
  for (const [k, v] of Object.entries(response.headers())) headers[k.toLowerCase()] = v;
  return headers;
}
