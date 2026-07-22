#!/usr/bin/env node

const SEARXNG_BASE = "http://localhost:8080";
const subcommand = process.argv[2];

function usage() {
  process.stderr.write(`SearXNG deterministic script

Subcomandi:
  search <query> [flags]     Esegue una ricerca
  health                     Health check del container

Flags per "search":
  --lang <code>              Lingua (es. it, en, fr, de...)
  --categories <csv>         Categorie (general, news, images, videos, files, social, music)
  --time-range <range>       time_range (day, week, month, year)
  --engines <csv>            Restringe a motori specifici (default: tutti gli abilitati)
  --page <n>                 Numero pagina (default: 1)

Esempi:
  searxng.mjs search "Sanremo 2026"
  searxng.mjs search "cronaca Roma" --lang it --categories news
  searxng.mjs search "CORS Next.js" --lang en --categories general --time-range month
  searxng.mjs search "mountain" --categories images --page 2
  searxng.mjs search "AI" --engines wikipedia
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

async function cmdSearch() {
  const query = process.argv[3];
  if (!query || query.startsWith("--")) {
    fail("Missing query. Usage: searxng.mjs search <query> [flags]");
  }
  const flags = parseFlags(process.argv.slice(4));

  const params = new URLSearchParams();
  params.set("q", query);
  params.set("format", "json");
  if (flags.lang) params.set("language", flags.lang);
  if (flags.categories) params.set("categories", flags.categories);
  if (flags.time_range) params.set("time_range", flags.time_range);
  if (flags.engines) params.set("engines", flags.engines);
  if (flags.page) params.set("pageno", flags.page);

  const url = `${SEARXNG_BASE}/search?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      fail(`SearXNG returned HTTP ${res.status}`, await res.text().catch(() => null));
    }
    const data = await res.json();
    const out = {
      ok: true,
      query: data.query || query,
      parameters: {
        lang: flags.lang || null,
        categories: flags.categories || "general",
        time_range: flags.time_range || null,
        engines: flags.engines || null,
        page: flags.page || 1,
      },
      result_count: (data.results || []).length,
      results: (data.results || []).map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        engine: r.engine,
        category: r.category,
        publishedDate: r.publishedDate || null,
      })),
    };
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  } catch (err) {
    fail(`Connection to SearXNG failed: ${err.message}`);
  }
}

async function cmdHealth() {
  try {
    const url = `${SEARXNG_BASE}/search?format=json&q=health`;
    const res = await fetch(url);
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
