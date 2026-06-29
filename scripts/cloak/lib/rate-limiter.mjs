// Rate limiter — file-based state for independent processes
// Prevents excessive requests that could trigger anti-bot or DoS

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

const STATE_DIR = join(homedir(), '.browser-search');
const STATE_FILE = join(STATE_DIR, 'rate-state.json');

/**
 * Rate limiter with file-based persistence across processes.
 * Enforces per-minute request limits.
 */
export class RateLimiter {
  /**
   * @param {Object} opts
   * @param {number} opts.maxPerMinute - Max requests per minute (default: 30)
   */
  constructor({ maxPerMinute = 30 } = {}) {
    this.maxPerMinute = maxPerMinute;
    this.stateFile = STATE_FILE;
  }

  _ensureDir() {
    if (!existsSync(STATE_DIR)) {
      mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 });
    }
  }

  _readState() {
    this._ensureDir();
    try {
      if (existsSync(this.stateFile)) {
        const raw = readFileSync(this.stateFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {
      // Corrupted or unreadable — start fresh
    }
    return { requests: [] };
  }

  _writeState(state) {
    this._ensureDir();
    writeFileSync(this.stateFile, JSON.stringify(state), { mode: 0o600 });
  }

  _cleanupOldRequests(state) {
    const oneMinuteAgo = Date.now() - 60000;
    state.requests = state.requests.filter(ts => ts > oneMinuteAgo);
  }

  /**
   * Acquire a rate limit slot. Blocks if limit is reached.
   * @returns {Promise<void>}
   */
  async acquire() {
    let state = this._readState();
    this._cleanupOldRequests(state);

    // Check per-minute limit
    if (state.requests.length >= this.maxPerMinute) {
      const oldestInWindow = state.requests[0];
      const waitMs = oldestInWindow + 60000 - Date.now();
      if (waitMs > 0) {
        await new Promise(r => setTimeout(r, waitMs + 100));
        state = this._readState();
        this._cleanupOldRequests(state);
      }
    }

    // Record this request
    state.requests.push(Date.now());
    this._writeState(state);
  }

  /**
   * Get current rate limit status.
   * @returns {{ used: number, limit: number, remaining: number }}
   */
  status() {
    const state = this._readState();
    this._cleanupOldRequests(state);
    return {
      used: state.requests.length,
      limit: this.maxPerMinute,
      remaining: Math.max(0, this.maxPerMinute - state.requests.length),
    };
  }
}
