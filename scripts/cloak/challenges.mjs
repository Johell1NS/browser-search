// Challenge detection engine — adapted from opencode-cloak-fetch (MIT)
// Detects Cloudflare, Akamai, DataDome, Imperva, PerimeterX, DDoS-Guard

const DETECTORS = [
  {
    name: 'cloudflare',
    weight: 2,
    test: ({ url, resourceUrls, cookies, headers, html }) => {
      let score = 0;
      if (cookies.find(c => c.name.startsWith('__cf'))) score += 2;
      if (headers['server']?.toLowerCase().includes('cloudflare')) score += 2;
      if (resourceUrls.find(u => /\/cdn-cgi\//.test(u))) score += 3;
      if ((html || '').includes('Checking your browser') && (html || '').includes('Cloudflare')) score += 2;
      if ((html || '').includes('Just a moment')) score += 1;
      if ((html || '').includes('Attention Required! Cloudflare')) score += 3;
      if (url.includes('__cf_chl_f_tk')) score += 2;
      return score;
    },
  },
  {
    name: 'akamai',
    weight: 2,
    test: ({ cookies, headers, html }) => {
      let score = 0;
      if (cookies.find(c => c.name === 'ak_bmsc')) score += 3;
      if (cookies.find(c => c.name.startsWith('_abck'))) score += 2;
      if (headers['x-akamai-transformed'] || headers['x-akamai-request-id']) score += 2;
      if ((html || '').includes('Akamai')) score += 1;
      if ((html || '').includes('/akamai/')) score += 2;
      return score;
    },
  },
  {
    name: 'datadome',
    weight: 2,
    test: ({ cookies, html, url }) => {
      let score = 0;
      if (cookies.find(c => c.name.startsWith('datadome'))) score += 3;
      if ((html || '').includes('Datadome')) score += 1;
      if ((html || '').includes('/datadome/')) score += 2;
      if (url.includes('x-craft-preview') || url.includes('ddl_')) score += 1;
      return score;
    },
  },
  {
    name: 'imperva',
    weight: 2,
    test: ({ cookies, headers, html }) => {
      let score = 0;
      if (cookies.find(c => c.name.startsWith('incap_ses_'))) score += 3;
      if (cookies.find(c => c.name.startsWith('visid_incap_'))) score += 2;
      if (headers['x-iinfo']) score += 1;
      if ((html || '').includes('Imperva')) score += 1;
      if ((html || '').includes('/_Incapsula_Resource')) score += 2;
      return score;
    },
  },
  {
    name: 'perimeterx',
    weight: 2,
    test: ({ cookies, html }) => {
      let score = 0;
      if (cookies.find(c => c.name.startsWith('_px'))) score += 3;
      if ((html || '').includes('PerimeterX')) score += 1;
      if ((html || '').includes('/px.js')) score += 2;
      return score;
    },
  },
  {
    name: 'ddos-guard',
    weight: 2,
    test: ({ cookies, headers, html }) => {
      let score = 0;
      if (cookies.find(c => c.name.startsWith('__ddg'))) score += 3;
      if (headers['server']?.toLowerCase().includes('ddos-guard')) score += 2;
      if ((html || '').includes('DDoS-Guard')) score += 1;
      return score;
    },
  },
];

export function detectChallenge(state) {
  const results = [];
  for (const detector of DETECTORS) {
    const score = detector.test(state);
    if (score >= (detector.weight || 1)) {
      results.push({ name: detector.name, score });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.length > 0 ? results[0] : null;
}

export function extractState(page) {
  return {
    url: page.url ? page.url() : '',
    resourceUrls: [],
    cookies: [],
    headers: {},
    html: '',
  };
}

export async function waitForChallenge(page, timeout = 20000) {
  const start = Date.now();
  let detected = false;
  let resolved = false;
  let strategy = null;

  while (Date.now() - start < timeout) {
    const cookies = await page.context().cookies().catch(() => []);
    const url = page.url ? page.url() : '';
    const html = await page.evaluate(() => document.documentElement?.outerHTML || '').catch(() => '');
    const headers = {};

    const state = { url, resourceUrls: [], cookies, headers, html };

    const challenge = detectChallenge(state);
    if (challenge) {
      detected = true;
      strategy = challenge.name;

      const currentUrl = page.url ? page.url() : '';
      if (!html.includes('Checking your browser') &&
          !html.includes('Just a moment') &&
          !html.includes('Attention Required') &&
          !currentUrl.includes('/cdn-cgi/') &&
          !cookies.find(c => c.name.startsWith('__cf') && c.name.includes('bm'))) {
        resolved = true;
        break;
      }
    } else {
      if (detected) {
        resolved = true;
      }
      break;
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  return { detected, resolved, strategy };
}
