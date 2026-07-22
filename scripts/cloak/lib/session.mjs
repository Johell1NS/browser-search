// Per-origin persistent browser session management
// Creates persistent Chromium profiles keyed by URL origin (SHA-256 hash)
// Profiles live in ~/.browser-search/cloak-sessions/<origin-hash>/
// Implements file-based locking with heartbeat and stale lock detection

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

const SESSIONS_DIR = join(homedir(), '.browser-search', 'cloak-sessions');

function hashOrigin(origin) {
  return createHash('sha256').update(origin).digest('hex').slice(0, 16);
}

function getLockPath(originHash) {
  return join(SESSIONS_DIR, originHash, '.lock');
}

function isLockStale(lockPath, ttl = 30000) {
  try {
    const stat = existsSync(lockPath) ? readFileSync(lockPath, 'utf-8') : null;
    if (!stat) return true;
    const { pid, timestamp } = JSON.parse(stat);
    const age = Date.now() - timestamp;
    if (age > ttl) return true;
    try {
      process.kill(pid, 0);
      return false;
    } catch {
      return true;
    }
  } catch {
    return true;
  }
}

function acquireLock(originHash) {
  const lockDir = join(SESSIONS_DIR, originHash);
  if (!existsSync(lockDir)) {
    mkdirSync(lockDir, { recursive: true, mode: 0o700 });
  }

  const lockPath = getLockPath(originHash);
  if (existsSync(lockPath)) {
    if (!isLockStale(lockPath)) {
      throw new Error(`Session lock held by another process (${lockPath}). Use a different origin or wait.`);
    }
    try { unlinkSync(lockPath); } catch {}
  }

  writeFileSync(lockPath, JSON.stringify({
    pid: process.pid,
    timestamp: Date.now(),
  }), { mode: 0o600 });
}

function releaseLock(originHash) {
  const lockPath = getLockPath(originHash);
  try {
    const data = JSON.parse(readFileSync(lockPath, 'utf-8'));
    if (data.pid === process.pid) {
      unlinkSync(lockPath);
    }
  } catch {}
}

function heartbeatLock(originHash) {
  const lockPath = getLockPath(originHash);
  try {
    writeFileSync(lockPath, JSON.stringify({
      pid: process.pid,
      timestamp: Date.now(),
    }), { mode: 0o600 });
  } catch {}
}

export async function acquireSession(url) {
  const parsed = new URL(url);
  const origin = parsed.origin;
  const originHash = hashOrigin(origin);
  const userDataDir = join(SESSIONS_DIR, originHash);

  acquireLock(originHash);

  const heartbeat = setInterval(() => heartbeatLock(originHash), 10000);

  return {
    origin,
    originHash,
    userDataDir,
    release: async () => {
      clearInterval(heartbeat);
      releaseLock(originHash);
    },
  };
}

export function getSessionDir(url) {
  const parsed = new URL(url);
  const origin = parsed.origin;
  const originHash = hashOrigin(origin);
  return join(SESSIONS_DIR, originHash);
}
