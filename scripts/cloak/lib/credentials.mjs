// Credential manager — API key storage
// Reads from env vars first, falls back to local JSON file (~/.browser-search/keys.json)
// Note: keys are stored in plaintext with restrictive file permissions (0600).
// For production use, consider an OS keyring (libsecret, Keychain, Credential Manager).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const KEYS_DIR = join(homedir(), '.browser-search');
const KEYS_FILE = join(KEYS_DIR, 'keys.json');

/**
 * Read an API key from environment variable or local key file.
 * @param {string} envVarName - Environment variable name (e.g., 'CAMOFOX_API_KEY')
 * @returns {string|null} - The API key or null if not found
 */
export function readApiKey(envVarName) {
  // Priority 1: Environment variable
  const envValue = process.env[envVarName];
  if (envValue) return envValue;

  // Priority 2: Local key file
  try {
    if (existsSync(KEYS_FILE)) {
      const keys = JSON.parse(readFileSync(KEYS_FILE, 'utf-8'));
      return keys[envVarName] || null;
    }
  } catch {
    // File unreadable or corrupted
  }

  return null;
}

/**
 * Store an API key in the local key file.
 * @param {string} envVarName - Key name
 * @param {string} value - Key value
 */
export function writeApiKey(envVarName, value) {
  if (!existsSync(KEYS_DIR)) {
    mkdirSync(KEYS_DIR, { recursive: true, mode: 0o700 });
  }

  let keys = {};
  try {
    if (existsSync(KEYS_FILE)) {
      keys = JSON.parse(readFileSync(KEYS_FILE, 'utf-8'));
    }
  } catch {
    keys = {};
  }

  keys[envVarName] = value;
  writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), { mode: 0o600 });
}

/**
 * Check if a key exists (in env or file).
 * @param {string} envVarName
 * @returns {boolean}
 */
export function hasApiKey(envVarName) {
  return readApiKey(envVarName) !== null;
}
