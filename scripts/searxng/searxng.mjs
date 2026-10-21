#!/usr/bin/env node

import { execSync } from "node:child_process";

const SEARXNG_BASE = (process.env.SEARXNG_URL || "http://127.0.0.1:8080")
  .replace(/\/+$/, "")
  .replace(/\/search$/, "");
const TIMEOUT_MS = Number(process.env.SEARXNG_TIMEOUT_MS) || 30000;
const subcommand = process.argv[2];

function usage() {
  process.stderr.write(`SearXNG deterministic script

Subcomandi:
  search <query> [flags]     Esegue una ricerca
  search --query <q> [flags] [--query <q2> [flags] ...]
                             Esegue piu ricerche in serie (3s di distanza)
  health                     Health check del container

Flags per "search":
  --query <query>            Apre un nuovo gruppo di ricerca (modalita multi-query)
  --lang <code>              Lingua (es. it, en, fr, de...)
  --categories <csv>         Categorie (general, news, images, videos, files, social, music)
  --time-range <range>       time_range (day, week, month, year)
  --engines <csv>            Restringe a motori specifici (default: tutti gli abilitati)
  --page <n>                 Numero pagina (default: 1)

Variabili d'ambiente:
  SEARXNG_URL <url>          Indirizzo di SearXNG (default: http://127.0.0.1:8080)
  SEARXNG_TIMEOUT_MS <ms>    Timeout di ogni richiesta (default: 30000)
  SEARXNG_QUERY_DELAY <ms>   Attesa tra query consecutive in modalita multi-query
                             (default: 3000, 0 per disattivare)

Esempi:
  searxng.mjs search "Sanremo 2026"
  searxng.mjs search "cronaca Roma" --lang it --categories news
  searxng.mjs search "CORS Next.js" --lang en --categories general --time-range month
  searxng.mjs search "mountain" --categories images --page 2
  searxng.mjs search "AI" --engines wikipedia
  searxng.mjs search --query "AI news" --time-range week --query "AI models" --lang en
  searxng.mjs health
`);
  process.exit(2);
}

function fail(msg, details) {
  const out = { ok: false, error: msg };
  if (details !== undefined) out.details = details;
  process.stderr.write(`${msg}\n`);
  process.stdout.write(JSON.stringify(out) + "\n");
  process.exit(1);
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--lang":
      case "--categories":
      case "--time-range":
      case "--time_range":
      case "--engines":
      case "--page": {
        const key = args[i].replace(/^--/, "").replace(/-/g, "_");
        i++;
        if (i >= args.length) fail(`Flag ${args[i - 1]} requires a value`);
        flags[key] = args[i];
        break;
      }
      default:
        fail(`Unknown flag: ${args[i]}`);
    }
  }
  return flags;
}

const FLAG_ALIASES = {
  "--lang": "--lang",
  "--categories": "--categories",
  "--time-range": "--time-range",
  "--time_range": "--time-range",
  "--engines": "--engines",
  "--page": "--page",
};

function parseQueryGroups(args) {
  const groups = [];
  let current = null;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--query") {
      i++;
      if (i >= args.length) fail(`${arg} requires a value`);
      current = { query: args[i], flags: {} };
      groups.push(current);
    } else if (arg in FLAG_ALIASES) {
      if (!current) {
        fail(
          `Flag ${arg} must follow a --query. Usage: searxng.mjs search --query "<q>" [flags] --query "<q2>" ...`
        );
      }
      const key = FLAG_ALIASES[arg].replace(/^--/, "").replace(/-/g, "_");
      i++;
      if (i >= args.length) fail(`Flag ${FLAG_ALIASES[arg]} requires a value`);
      current.flags[key] = args[i];
    } else {
      fail(`Unknown flag: ${arg}`);
    }
  }
  if (!groups.length) {
    fail(
      "Missing query. Usage: searxng.mjs search <query> [flags] or searxng.mjs search --query \"<q>\" ..."
    );
  }
  return groups;
}

async function searchOne(query, flags) {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("format", "json");
  if (flags.lang) params.set("language", flags.lang);
  if (flags.categories) params.set("categories", flags.categories);
  if (flags.time_range) params.set("time_range", flags.time_range);
  if (flags.engines) params.set("engines", flags.engines);
  if (flags.page) params.set("pageno", flags.page);

  const url = `${SEARXNG_BASE}/search?${params.toString()}`;

  const get = () => fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  const isTimeout = (e) => e?.name === "TimeoutError" || e?.name === "AbortError";

  let res;
  try {
    res = await get();
  } catch (err) {
    if (isTimeout(err)) fail(`SearXNG timeout after ${TIMEOUT_MS}ms`);
    if (!(await tryRecover())) {
      fail(`Connection to SearXNG failed: ${err.message}`);
    }
    try {
      res = await get();
    } catch (err2) {
      fail(
        isTimeout(err2)
          ? `SearXNG timeout after ${TIMEOUT_MS}ms`
          : `Connection to SearXNG failed after restart: ${err2.message}`
      );
    }
  }
  if (!res.ok) {
    const hint =
      res.status === 403
        ? " — JSON output is probably disabled: add `json` to `search.formats` in SearXNG settings.yml (see README)"
        : "";
    const body = await res.text().catch(() => null);
    fail(`SearXNG returned HTTP ${res.status}${hint}`, body && body.slice(0, 500));
  }
  let data;
  try {
    data = await res.json();
  } catch (err) {
    fail(
      isTimeout(err)
        ? `SearXNG timeout after ${TIMEOUT_MS}ms`
        : `SearXNG returned invalid JSON: ${err.message}`
    );
  }
  const out = {
    query: data.query || query,
    parameters: {
      lang: flags.lang || null,
      categories: flags.categories || "general",
      time_range: flags.time_range || null,
      engines: flags.engines || null,
      page: flags.page || 1,
    },
    result_count: (data.results || []).length,
    results: (data.results || []).map(mapResult),
  };

  const unresponsive = (data.unresponsive_engines || []).map(([engine, reason]) => ({
    engine,
    reason,
  }));
  if (unresponsive.length) out.unresponsive_engines = unresponsive;
  if (data.suggestions?.length) out.suggestions = data.suggestions;
  if (data.corrections?.length) out.corrections = data.corrections;
  const answers = (data.answers || [])
    .map((a) => (typeof a === "string" ? { answer: a } : { answer: a.answer, url: a.url }))
    .filter((a) => a.answer);
  if (answers.length) out.answers = answers;
  const infoboxes = (data.infoboxes || []).map((b) => ({
    infobox: b.infobox,
    content: b.content ? String(b.content).slice(0, 500) : undefined,
    url: b.id || b.urls?.[0]?.url,
  }));
  if (infoboxes.length) out.infoboxes = infoboxes;
  return out;
}

// Keeps the original keys and adds the ones SearXNG fills per result type.
// Empty values are skipped so the output stays compact.
function mapResult(r) {
  const out = {
    title: r.title,
    url: r.url,
    snippet: r.content,
    engine: r.engine,
    category: r.category,
    publishedDate: r.publishedDate || r.pubdate || null,
  };
  const extra = {
    engines: r.engines?.length > 1 ? r.engines : undefined,
    img_src: r.img_src,
    thumbnail_src: r.thumbnail_src,
    resolution: r.resolution,
    thumbnail: r.thumbnail,
    length: r.length,
    iframe_src: r.iframe_src,
    author: r.author,
  };
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

async function cmdSearch() {
  const raw = process.argv.slice(3);
  let groups;
  if (!raw.length || raw[0].startsWith("--")) {
    groups = parseQueryGroups(raw);
  } else {
    if (!raw[0]) {
      fail("Missing query. Usage: searxng.mjs search <query> [flags]");
    }
    if (raw.some((a) => a === "--query")) {
      fail(
        'Cannot mix a positional query with --query groups. Use either: search "<query>" [flags] OR search --query "<q>" [flags] ...'
      );
    }
    groups = [{ query: raw[0], flags: parseFlags(raw.slice(1)) }];
  }

  const delayMs = Number(process.env.SEARXNG_QUERY_DELAY ?? 3000);
  const results = [];
  for (let i = 0; i < groups.length; i++) {
    if (i > 0 && delayMs > 0) {
      process.stderr.write(`[rate-limit] waiting ${delayMs}ms before next query\n`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
    results.push(await searchOne(groups[i].query, groups[i].flags));
  }

  const out =
    groups.length === 1 ? { ok: true, ...results[0] } : { ok: true, searches: results };
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

async function tryRecover() {
  // With a custom SEARXNG_URL we cannot tell which container serves it: don't restart anything.
  if (process.env.SEARXNG_URL) {
    process.stderr.write("[recovery] skipped: SEARXNG_URL is set, restart the service manually\n");
    return false;
  }
  let ids = [];
  try {
    const out = execSync("docker ps -aq", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    ids = out.trim().split(/\s+/).filter(Boolean);
  } catch (err) {
    process.stderr.write(`[recovery] docker unavailable: ${err.message}\n`);
    return false;
  }
  let target = null;
  for (const id of ids) {
    try {
      const cfg = execSync(`docker inspect ${id} --format "{{json .Config.ExposedPorts}}"`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      const ports = JSON.parse(cfg.trim() || "{}");
      if (ports && "8080/tcp" in ports) {
        target = id;
        break;
      }
    } catch {}
  }
  if (!target) {
    process.stderr.write(
      "[recovery] no SearXNG container exposing :8080 found, manual restart required\n"
    );
    return false;
  }
  process.stderr.write(`[recovery] restarting SearXNG container (${target})...\n`);
  try {
    execSync(`docker restart ${target}`, { stdio: "pipe" });
  } catch (err) {
    process.stderr.write(`[recovery] docker restart failed: ${err.message}\n`);
    return false;
  }
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${SEARXNG_BASE}/search?format=json&q=health`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) {
        process.stderr.write("[recovery] SearXNG is back up\n");
        return true;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  process.stderr.write("[recovery] SearXNG did not respond within 30s\n");
  return false;
}

async function cmdHealth() {
  try {
    const url = `${SEARXNG_BASE}/search?format=json&q=health`;
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const out = { ok: true, status: res.status };
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  } catch (err) {
    fail(`SearXNG is down: ${err.message}`);
  }
}

async function main() {
  switch (subcommand) {
    case "search":
      await cmdSearch();
      break;
    case "health":
      await cmdHealth();
      break;
    case "--help":
    case "-h":
    case undefined:
      usage();
      break;
    default:
      fail(`Unknown subcommand: ${subcommand}. Use --help for usage.`);
  }
}

main();
