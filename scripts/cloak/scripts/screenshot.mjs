// Save a screenshot of a URL.
// Usage: node cloak-script.mjs --script scripts/screenshot.mjs [launch options]
// Pass URL as second positional arg or via --url flag.

import { randomUUID } from 'node:crypto';
import { validateUrlWithDns } from '../lib/url-validation.mjs';

export default async ({ page }) => {
  const url = process.argv.find(a => a.startsWith('http')) || 'https://example.com';

  // SSRF protection — use async DNS validation for DNS rebinding protection
  const urlCheck = await validateUrlWithDns(url);
  if (!urlCheck.valid) {
    throw new Error(`URL blocked: ${urlCheck.reason}`);
  }

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Secure filename — random UUID instead of predictable timestamp
  const filename = `cloak-shot-${randomUUID()}.png`;
  await page.screenshot({ path: filename, fullPage: process.argv.includes('--fullpage') });

  const title = await page.title();
  return { title, url: page.url(), screenshot: filename };
};
