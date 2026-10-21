// Per-origin persistent browser session — preserves cookies/challenges across runs.
// Adapted from opencode-cloak-fetch (MIT) by PartMent
//
// When enabled, creates a persistent Chromium profile keyed by URL origin (SHA-256).
// Cookie jars, localStorage, IndexedDB, and anti-bot challenge state survive restarts.
// Reusing a session profile means Cloudflare/Akamai/DataDome challenges are solved once.

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';

const SESSIONS_DIR = path.join(homedir(), '.browser-search', 'cloak-sessions');
const PROFILES_DIR = path.join(SESSIONS_DIR, 'profiles');
const LOCKS_DIR = path.join(SESSIONS_DIR, 'locks');

const LOCK_POLL_MS = 500;
const LOCK_HEARTBEAT_MS = 5_000;
const LOCK_STALE_MS = 60_000;

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

function originHash(origin) {
  return crypto.createHash('sha256').update(origin).digest('hex').slice(0, 16);
}

function safePathPart(value, fallback, maxLength) {
  const safe = value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, maxLength)
    .replace(/^[.-]+|[.-]+$/g, '');
  return safe || fallback;
}

/**
 * Compute profile directories and lock path for a URL.
 * @param {string} url
 * @returns {{ origin: string, userDataDir: string, lockPath: string }}
 */
export function resolveSessionProfile(url) {
  const parsed = new URL(url);
  const origin = parsed.origin;

  const protocol = safePathPart(parsed.protocol.replace(/:$/, ''), 'origin', 20);
  const host = safePathPart(parsed.hostname, 'host', 80);
  const port = parsed.port ? `-${safePathPart(parsed.port, 'port', 12)}` : '';
  const hash = originHash(origin);

  const dirName = `${protocol}-${host}${port}-${hash}`;

  return {
    origin,
    userDataDir: path.join(PROFILES_DIR, dirName),
    lockPath: path.join(LOCKS_DIR, `${dirName}.lock`),
  };
}

/**
 * Acquire a session lock and ensure the profile directory exists.
 * Returns a BrowserSession with { origin, userDataDir, lockPath, release() }.
 *
 * @param {string} url
 * @returns {Promise<{ origin: string, userDataDir: string, lockPath: string, release: () => Promise<void> }>}
 */
export async function acquireSession(url) {
  const profile = resolveSessionProfile(url);

  ensureDir(path.dirname(profile.lockPath));
  await fs.mkdir(profile.userDataDir, { recursive: true });

  const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  let waitingLogged = false;
  while (true) {
    try {
      await fs.mkdir(profile.lockPath);
      const owner = {
        token,
        pid: process.pid,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await fs.writeFile(path.join(profile.lockPath, 'owner.json'), JSON.stringify(owner));

      const heartbeat = setInterval(() => {
        void updateLockHeartbeat(profile.lockPath, token).catch(() => {});
      }, LOCK_HEARTBEAT_MS);
      heartbeat.unref?.();

      const release = async () => {
        clearInterval(heartbeat);
        const current = await readLockOwner(profile.lockPath);
        if (current?.token === token) {
          await fs.rm(profile.lockPath, { recursive: true, force: true }).catch(() => {});
        }
      };

      return { ...profile, release };
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;

      if (await removeStaleLock(profile.lockPath)) continue;

      if (!waitingLogged) {
        waitingLogged = true;
        process.stderr.write(JSON.stringify({
          session: 'waiting',
          origin: profile.origin,
          message: 'Another process holds the session lock for this origin',
        }) + '\n');
      }

      await new Promise(r => setTimeout(r, LOCK_POLL_MS));
    }
  }
}

async function readLockOwner(lockPath) {
  try {
    const data = JSON.parse(await fs.readFile(path.join(lockPath, 'owner.json'), 'utf8'));
    if (typeof data?.pid === 'number') return data;
  } catch {}
  return undefined;
}

async function updateLockHeartbeat(lockPath, token) {
  const owner = await readLockOwner(lockPath);
  if (owner?.token !== token) return;
  const updated = { ...owner, updatedAt: new Date().toISOString() };
  await fs.writeFile(path.join(lockPath, 'owner.json'), JSON.stringify(updated));
}

function isProcessAlive(pid) {
  if (pid === process.pid) return true;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

async function lockTimestamp(lockPath) {
  try {
    return (await fs.stat(path.join(lockPath, 'owner.json'))).mtimeMs;
  } catch {}
  try {
    return (await fs.stat(lockPath)).mtimeMs;
  } catch {}
  return 0;
}

async function removeStaleLock(lockPath) {
  try {
    const owner = await readLockOwner(lockPath);

    if (owner?.pid && !isProcessAlive(owner.pid)) {
      await fs.rm(lockPath, { recursive: true, force: true });
      return true;
    }

    const updatedAt = owner?.updatedAt ? Date.parse(owner.updatedAt) : undefined;
    const stale = Number.isFinite(updatedAt)
      ? Date.now() - updatedAt >= LOCK_STALE_MS
      : Date.now() - (await lockTimestamp(lockPath)) >= LOCK_STALE_MS;

    if (stale) {
      await fs.rm(lockPath, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (err) {
    if (err.code === 'ENOENT') return true;
    throw err;
  }
}
