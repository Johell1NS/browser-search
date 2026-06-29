// Sandbox tests — verify that restricted methods are blocked

import assert from 'node:assert';
import { createSandbox } from '../sandbox.mjs';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    process.stderr.write(`  ✅ ${name}\n`);
  } catch (err) {
    failed++;
    process.stderr.write(`  ❌ ${name}: ${err.message}\n`);
  }
}

process.stderr.write('\n=== Sandbox Tests ===\n\n');

// Mock Playwright objects for testing
const mockPage = {
  goto: () => {},
  evaluate: () => {},
  title: () => 'test',
  url: () => 'https://example.com',
  $: () => null,
  $$: () => [],
  waitForTimeout: () => {},
  screenshot: () => Buffer.from(''),
  content: () => '',
  close: () => {},
  // Unsafe methods that should be blocked
  setExtraHTTPHeaders: () => {},
  route: () => {},
};

const mockBrowser = {
  close: () => {},
  version: '1.0',
  contexts: () => [],
};

const mockContext = {
  newPage: () => {},
  pages: () => [],
  close: () => {},
  cookies: () => [],
  storageState: () => ({}),
  // Unsafe methods
  addInitScript: () => {},
  grantPermissions: () => {},
};

// Test: safe methods are accessible
test('Safe method: page.goto is accessible', () => {
  const sandbox = createSandbox({ page: mockPage, browser: mockBrowser, context: mockContext });
  assert.strictEqual(typeof sandbox.page.goto, 'function');
});

test('Safe method: page.evaluate is accessible', () => {
  const sandbox = createSandbox({ page: mockPage, browser: mockBrowser, context: mockContext });
  assert.strictEqual(typeof sandbox.page.evaluate, 'function');
});

test('Safe method: page.title is accessible', () => {
  const sandbox = createSandbox({ page: mockPage, browser: mockBrowser, context: mockContext });
  assert.strictEqual(typeof sandbox.page.title, 'function');
});

test('Safe method: page.screenshot is accessible', () => {
  const sandbox = createSandbox({ page: mockPage, browser: mockBrowser, context: mockContext });
  assert.strictEqual(typeof sandbox.page.screenshot, 'function');
});

test('Safe method: page.close is accessible', () => {
  const sandbox = createSandbox({ page: mockPage, browser: mockBrowser, context: mockContext });
  assert.strictEqual(typeof sandbox.page.close, 'function');
});

test('Safe method: browser.close is accessible', () => {
  const sandbox = createSandbox({ page: mockPage, browser: mockBrowser, context: mockContext });
  assert.strictEqual(typeof sandbox.browser.close, 'function');
});

test('Safe method: context.cookies is accessible', () => {
  const sandbox = createSandbox({ page: mockPage, browser: mockBrowser, context: mockContext });
  assert.strictEqual(typeof sandbox.context.cookies, 'function');
});

// Test: unsafe methods are blocked
test('Blocked: page.setExtraHTTPHeaders', () => {
  const sandbox = createSandbox({ page: mockPage, browser: mockBrowser, context: mockContext });
  assert.throws(() => { sandbox.page.setExtraHTTPHeaders; }, /Sandbox/);
});

test('Blocked: page.route', () => {
  const sandbox = createSandbox({ page: mockPage, browser: mockBrowser, context: mockContext });
  assert.throws(() => { sandbox.page.route; }, /Sandbox/);
});

test('Blocked: browser.contexts', () => {
  const sandbox = createSandbox({ page: mockPage, browser: mockBrowser, context: mockContext });
  assert.throws(() => { sandbox.browser.contexts; }, /Sandbox/);
});

test('Blocked: context.addInitScript', () => {
  const sandbox = createSandbox({ page: mockPage, browser: mockBrowser, context: mockContext });
  assert.throws(() => { sandbox.context.addInitScript; }, /Sandbox/);
});

test('Blocked: arbitrary property access', () => {
  const sandbox = createSandbox({ page: mockPage, browser: mockBrowser, context: mockContext });
  assert.throws(() => { sandbox.page.__proto__; }, /Sandbox/);
});

// Summary
process.stderr.write(`\nResults: ${passed} passed, ${failed} failed\n\n`);
if (failed > 0) process.exit(1);
