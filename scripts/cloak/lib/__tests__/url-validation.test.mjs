// URL validation tests — node:assert (zero dependencies)

import assert from 'node:assert';
import { validateUrl, validateUrlWithDns } from '../url-validation.mjs';

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

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    process.stderr.write(`  ✅ ${name}\n`);
  } catch (err) {
    failed++;
    process.stderr.write(`  ❌ ${name}: ${err.message}\n`);
  }
}

process.stderr.write('\n=== URL Validation Tests ===\n\n');

// Valid URLs
test('Valid: https://example.com', () => {
  const r = validateUrl('https://example.com');
  assert.strictEqual(r.valid, true);
});

test('Valid: http://example.com', () => {
  const r = validateUrl('http://example.com');
  assert.strictEqual(r.valid, true);
});

test('Valid: https://www.google.com/search?q=test', () => {
  const r = validateUrl('https://www.google.com/search?q=test');
  assert.strictEqual(r.valid, true);
});

test('Valid: https://sub.domain.example.org/path', () => {
  const r = validateUrl('https://sub.domain.example.org/path');
  assert.strictEqual(r.valid, true);
});

// Blocked: loopback
test('Blocked: localhost', () => {
  const r = validateUrl('http://localhost:8080');
  assert.strictEqual(r.valid, false);
  assert.ok(r.reason.includes('localhost'));
});

test('Blocked: 127.0.0.1', () => {
  const r = validateUrl('http://127.0.0.1:22');
  assert.strictEqual(r.valid, false);
  assert.ok(r.reason.includes('Blocked IP'));
});

test('Blocked: 127.0.0.255', () => {
  const r = validateUrl('http://127.0.0.255/admin');
  assert.strictEqual(r.valid, false);
});

// Blocked: private ranges
test('Blocked: 10.0.0.1', () => {
  const r = validateUrl('http://10.0.0.1');
  assert.strictEqual(r.valid, false);
});

test('Blocked: 192.168.1.1', () => {
  const r = validateUrl('http://192.168.1.1');
  assert.strictEqual(r.valid, false);
});

test('Blocked: 172.16.0.1', () => {
  const r = validateUrl('http://172.16.0.1');
  assert.strictEqual(r.valid, false);
});

test('Blocked: 172.31.255.255', () => {
  const r = validateUrl('http://172.31.255.255');
  assert.strictEqual(r.valid, false);
});

// Blocked: metadata endpoints
test('Blocked: 169.254.169.254 (AWS metadata)', () => {
  const r = validateUrl('http://169.254.169.254/latest/meta-data/');
  assert.strictEqual(r.valid, false);
});

test('Blocked: metadata.google.internal', () => {
  const r = validateUrl('http://metadata.google.internal/computeMetadata/v1/');
  assert.strictEqual(r.valid, false);
  assert.ok(r.reason.includes('metadata'));
});

// Blocked: bad schemes
test('Blocked: file://', () => {
  const r = validateUrl('file:///etc/passwd');
  assert.strictEqual(r.valid, false);
  assert.ok(r.reason.includes('scheme'));
});

test('Blocked: ftp://', () => {
  const r = validateUrl('ftp://example.com');
  assert.strictEqual(r.valid, false);
});

test('Blocked: data://', () => {
  const r = validateUrl('data:text/html,<h1>test</h1>');
  assert.strictEqual(r.valid, false);
});

// Blocked: internal TLDs
test('Blocked: .internal TLD', () => {
  const r = validateUrl('http://service.internal');
  assert.strictEqual(r.valid, false);
  assert.ok(r.reason.includes('TLD'));
});

test('Blocked: .local TLD', () => {
  const r = validateUrl('http://printer.local');
  assert.strictEqual(r.valid, false);
});

// Blocked: IPv6
test('Blocked: IPv6 loopback', () => {
  const r = validateUrl('http://[::1]:8080');
  assert.strictEqual(r.valid, false);
});

test('Blocked: IPv6 link-local', () => {
  const r = validateUrl('http://[fe80::1]:8080');
  assert.strictEqual(r.valid, false);
});

// Invalid URL
test('Blocked: invalid URL', () => {
  const r = validateUrl('not a url');
  assert.strictEqual(r.valid, false);
  assert.ok(r.reason.includes('Invalid'));
});

// === Async DNS validation tests ===
process.stderr.write('\n--- Async DNS Validation (validateUrlWithDns) ---\n\n');

// Run async tests
(async () => {
  // Valid public URLs (DNS resolves to public IPs)
  await testAsync('DNS Valid: https://example.com', async () => {
    const r = await validateUrlWithDns('https://example.com');
    assert.strictEqual(r.valid, true);
  });

  // Blocked: sync checks still work (no DNS needed)
  await testAsync('DNS Blocked: localhost', async () => {
    const r = await validateUrlWithDns('http://localhost:8080');
    assert.strictEqual(r.valid, false);
  });

  await testAsync('DNS Blocked: 127.0.0.1', async () => {
    const r = await validateUrlWithDns('http://127.0.0.1:22');
    assert.strictEqual(r.valid, false);
  });

  await testAsync('DNS Blocked: 10.0.0.1', async () => {
    const r = await validateUrlWithDns('http://10.0.0.1');
    assert.strictEqual(r.valid, false);
  });

  await testAsync('DNS Blocked: 169.254.169.254', async () => {
    const r = await validateUrlWithDns('http://169.254.169.254/');
    assert.strictEqual(r.valid, false);
  });

  // DNS failure should not block (graceful degradation)
  await testAsync('DNS Graceful: nonexistent-domain-xyz123.invalid', async () => {
    const r = await validateUrlWithDns('http://nonexistent-domain-xyz123.invalid');
    // Should pass sync checks and not crash on DNS failure
    assert.strictEqual(r.valid, true);
  });

  // IPv6 loopback blocked
  await testAsync('DNS Blocked: IPv6 loopback [::1]', async () => {
    const r = await validateUrlWithDns('http://[::1]:8080');
    assert.strictEqual(r.valid, false);
  });

  // Summary
  process.stderr.write(`\nResults: ${passed} passed, ${failed} failed\n\n`);
  if (failed > 0) process.exit(1);
})();
