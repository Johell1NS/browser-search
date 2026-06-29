// URL validation — anti-SSRF protection
// Blocks internal IPs, link-local, metadata endpoints, and DNS rebinding

import { resolve } from 'node:dns';
import { promisify } from 'node:util';

const resolveAsync = promisify(resolve);

// RFC 1918 + special ranges
const BLOCKED_RANGES = [
  // Loopback
  { cidr: '127.0.0.0', prefixLen: 8 },
  // Link-local
  { cidr: '169.254.0.0', prefixLen: 16 },
  // RFC 1918 private
  { cidr: '10.0.0.0', prefixLen: 8 },
  { cidr: '172.16.0.0', prefixLen: 12 },
  { cidr: '192.168.0.0', prefixLen: 16 },
  // Additional reserved
  { cidr: '0.0.0.0', prefixLen: 8 },
  { cidr: '100.64.0.0', prefixLen: 10 },   // CGNAT
  { cidr: '192.0.0.0', prefixLen: 24 },    // IETF Protocol Assignments
  { cidr: '192.0.2.0', prefixLen: 24 },    // TEST-NET-1
  { cidr: '198.51.100.0', prefixLen: 24 }, // TEST-NET-2
  { cidr: '203.0.113.0', prefixLen: 24 },  // TEST-NET-3
  { cidr: '224.0.0.0', prefixLen: 4 },     // Multicast
  { cidr: '240.0.0.0', prefixLen: 4 },     // Reserved
];

// Known cloud metadata endpoints (hostname check, in addition to IP check)
const BLOCKED_HOSTNAMES = new Set([
  'metadata.google.internal',
  'metadata.google.internal.',
  'instance-data.pai.googleapis.com',
  'instance-data.pai.googleapis.com.',
]);

// IPv6 blocked patterns
const BLOCKED_IPV6_PATTERNS = [
  /^::1$/,           // loopback
  /^fe80:/i,         // link-local
  /^fc/i, /^fd/i,    // unique local
  /^ff/i,            // multicast
];

function ipToNumber(ip) {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

function isInBlockedRange(ip) {
  const ipNum = ipToNumber(ip);
  for (const { cidr, prefixLen } of BLOCKED_RANGES) {
    const networkNum = ipToNumber(cidr);
    const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
    if ((ipNum & mask) === (networkNum & mask)) return true;
  }
  return false;
}

function isBlockedIPv6(ip) {
  for (const pattern of BLOCKED_IPV6_PATTERNS) {
    if (pattern.test(ip)) return true;
  }
  return false;
}

/**
 * Validate a URL for SSRF safety.
 * @param {string} url - URL to validate
 * @returns {{ valid: true } | { valid: false, reason: string }}
 */
export function validateUrl(url) {
  // Parse URL
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  // Scheme check
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, reason: `Blocked scheme: ${parsed.protocol}` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block empty hostname
  if (!hostname) {
    return { valid: false, reason: 'Missing hostname' };
  }

  // Block known metadata hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, reason: 'Blocked hostname: cloud metadata endpoint' };
  }

  // Block localhost
  if (hostname === 'localhost' || hostname === 'localhost.') {
    return { valid: false, reason: 'Blocked hostname: localhost' };
  }

  // Block IP literals in URL (IPv4)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    if (isInBlockedRange(hostname)) {
      return { valid: false, reason: `Blocked IP: ${hostname}` };
    }
    // Allow public IPs but warn — most SSRF targets are private
    return { valid: true };
  }

  // Block IPv6 literals
  if (/^\[.*\]$/.test(hostname) || hostname.includes(':')) {
    const ipv6 = hostname.replace(/^\[|\]$/g, '');
    if (isBlockedIPv6(ipv6)) {
      return { valid: false, reason: `Blocked IPv6: ${ipv6}` };
    }
    return { valid: true };
  }

  // Block common internal TLDs
  if (hostname.endsWith('.internal') || hostname.endsWith('.local') || hostname.endsWith('.lan')) {
    return { valid: false, reason: `Blocked TLD: ${hostname}` };
  }

  return { valid: true };
}

/**
 * Async DNS resolution check — resolves hostname and verifies the IP is not private.
 * This protects against DNS rebinding attacks.
 * @param {string} url - URL to check
 * @returns {{ valid: true } | { valid: false, reason: string }}
 */
export async function validateUrlWithDns(url) {
  // First do sync validation
  const syncResult = validateUrl(url);
  if (!syncResult.valid) return syncResult;

  // If it's already an IP, we're done
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();

  // Skip DNS for IP literals
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return syncResult;
  }

  // Resolve hostname to IP and check
  try {
    const addresses = await resolveAsync(hostname);
    for (const addr of addresses) {
      if (isInBlockedRange(addr)) {
        return { valid: false, reason: `DNS resolved to blocked IP: ${addr}` };
      }
      if (isBlockedIPv6(addr)) {
        return { valid: false, reason: `DNS resolved to blocked IPv6: ${addr}` };
      }
    }
  } catch {
    // DNS resolution failed — let the browser handle it
    // Don't block on DNS failure, the browser will fail gracefully
  }

  return { valid: true };
}
