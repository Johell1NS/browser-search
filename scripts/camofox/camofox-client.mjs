import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const USER_ID = "opencode-bot";
const SESSION_KEY = "default";
const BASE_URL = "http://localhost:9377";
const API_KEY = process.env.CAMOFOX_API_KEY || "";
const ADMIN_KEY = process.env.CAMOFOX_ADMIN_KEY || "";

function logStep(msg) {
  process.stderr.write(`[camofox-client] ${msg}\n`);
}

async function request(method, path, { body, headers: extraHeaders = {}, rawOutput } = {}) {
  const url = `${BASE_URL}${path}`;
  const urlObj = new URL(url);

  if (method === "GET" && body) {
    urlObj.searchParams.set("userId", USER_ID);
    for (const [k, v] of Object.entries(body)) {
      if (k !== "userId") urlObj.searchParams.set(k, v);
    }
  }

  const finalUrl = urlObj.toString();
  const headers = { ...extraHeaders };

  if (body && method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  if (API_KEY && (path.startsWith("/tabs") && method === "POST" && path.endsWith("/evaluate"))) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }
  if (API_KEY && path.startsWith("/sessions")) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }
  if (API_KEY && path.startsWith("/pressure")) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }
  if (ADMIN_KEY && path === "/stop") {
    headers["x-admin-key"] = ADMIN_KEY;
  }

  const opts = { method, headers };
  if (body && method !== "GET") {
    opts.body = JSON.stringify(body);
  }

  logStep(`${method} ${path}`);

  const res = await fetch(finalUrl, opts);

  if (rawOutput) {
    return res;
  }

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`${method} ${path} → ${res.status} ${res.statusText}: ${text}`);
    err.status = res.status;
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function health() {
  return request("GET", "/health");
}

async function start() {
  return request("POST", "/start");
}

async function stop() {
  return request("POST", "/stop", { body: {} });
}

async function createTab(url) {
  return request("POST", "/tabs", {
    body: { userId: USER_ID, sessionKey: SESSION_KEY, url },
  });
}

async function closeTab(tabId) {
  return request("DELETE", `/tabs/${tabId}`, { body: { userId: USER_ID } });
}

async function snapshot(tabId, offset) {
  const params = offset ? { offset } : {};
  return request("GET", `/tabs/${tabId}/snapshot`, { body: { userId: USER_ID, ...params } });
}

async function evaluate(tabId, expression) {
  const result = await request("POST", `/tabs/${tabId}/evaluate`, {
    body: { userId: USER_ID, expression },
  });
  return result;
}

async function click(tabId, ref) {
  return request("POST", `/tabs/${tabId}/click`, {
    body: { userId: USER_ID, ref },
  });
}

async function type(tabId, ref, text) {
  return request("POST", `/tabs/${tabId}/type`, {
    body: { userId: USER_ID, ref, text },
  });
}

async function scroll(tabId, direction, amount) {
  return request("POST", `/tabs/${tabId}/scroll`, {
    body: { userId: USER_ID, direction, ...(amount ? { amount } : {}) },
  });
}

async function navigate(tabId, url) {
  return request("POST", `/tabs/${tabId}/navigate`, {
    body: { userId: USER_ID, url },
  });
}

async function extract(tabId, schema) {
  return request("POST", `/tabs/${tabId}/extract`, {
    body: { userId: USER_ID, schema },
  });
}

async function wait(tabId, selector) {
  return request("POST", `/tabs/${tabId}/wait`, {
    body: { userId: USER_ID, selector },
  });
}

async function screenshotRaw(tabId) {
  return request("GET", `/tabs/${tabId}/screenshot`, { body: { userId: USER_ID }, rawOutput: true });
}

async function destroySession() {
  return request("DELETE", `/sessions/${USER_ID}`);
}

let _readabilityJs = null;

function getReadabilityJs() {
  if (!_readabilityJs) {
    _readabilityJs = readFileSync(join(__dirname, "Readability.js"), "utf-8");
  }
  return _readabilityJs;
}

async function readability(tabId) {
  const js = getReadabilityJs();
  const expression =
    js +
    '; var a = new Readability(document.cloneNode(true)).parse();' +
    'JSON.stringify({title: a?.title || null, text: a?.textContent || null, excerpt: a?.excerpt || null, length: a?.length || 0})';
  return evaluate(tabId, expression);
}

export {
  USER_ID,
  SESSION_KEY,
  BASE_URL,
  logStep,
  request,
  health,
  start,
  stop,
  createTab,
  closeTab,
  snapshot,
  evaluate,
  click,
  type,
  scroll,
  navigate,
  extract,
  wait,
  screenshotRaw,
  destroySession,
  readability,
  getReadabilityJs,
};
