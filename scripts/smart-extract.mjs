#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const activeChildren = new Set();

function resolveSkillDir() {
  if (process.env.BROWSER_SEARCH_HOME) return process.env.BROWSER_SEARCH_HOME;
  const candidate = dirname(SCRIPT_DIR);
  try {
    const pkg = JSON.parse(readFileSync(join(candidate, 'package.json'), 'utf-8'));
    if (pkg.name === 'browser-search') return candidate;
  } catch {}
  return '/home/johell/.config/opencode/skills/browser-search';
}

const skillDir = resolveSkillDir();
const SKILL_DIR = join(skillDir, 'scripts');
const CAMOFOX = join(SKILL_DIR, 'camofox', 'camofox.mjs');
const CLOAK = join(SKILL_DIR, 'cloak', 'cloak-fetch.mjs');

const PKG = join(skillDir, 'package.json');
let VERSION = '0.1.0';
try {
  VERSION = JSON.parse(readFileSync(PKG, 'utf-8')).version || VERSION;
} catch {}

function help() {
  process.stderr.write(`smart-extract v${VERSION} — Estrazione dati con escalation automatica Camofox → CloakBrowser

USO:
  Mode normale (Camofox, con auto-escalation se tutti falliscono):
    smart-extract.mjs <url1> [url2 ...] [--expr "<expr>"] [options]

  Mode fallback (solo Cloak, per URL specifici già falliti su Camofox):
    smart-extract.mjs --fallback <url1> [url2 ...] [options]

OPZIONI:
  --expr "<expr>"       Espressione JS da valutare (solo Camofox). Se restituisce
                        un Element DOM, viene estratto il textContent. Se restituisce
                        un oggetto, viene auto-convertito in JSON. Se è una stringa
                        o un numero, viene passato com'è.
  --min-chars <n>       Soglia minima caratteri (default: 300).
  --wait <ms>           Attesa extra per rendering JS (default: 2000).
  --timeout <ms>        Timeout generale (default: 60000). Cloak riceve 2x.
  --verbose             Log diagnostici dettagliati su stderr.

COMPORTAMENTO (mode normale):
  - Esegue Camofox su TUTTI gli URL forniti (readability/snapshot o evaluate/tab)
  - Se TUTTI falliscono → scala automaticamente a Cloak senza chiedere
  - Se qualcuno riesce → output risultati, decidi tu se richiamare con --fallback
    per gli URL falliti
  - Risultati sospettosamente corti (es. {}, [], null) emettono un warning in steps[]
  - Output JSON con array "results", un elemento per URL

COMPORTAMENTO (mode fallback):
  - Salta Camofox, esegue solo Cloak sugli URL specificati
  - Cloak restituisce il contenuto raw (markdown), utile anche per URL API
  - Output stesso formato JSON
`);
  process.exit(2);
}

function log(msg) {
  process.stderr.write(`[smart-extract] ${msg}\n`);
}

function run(cmd, args, opts = {}) {
  const spawnCmd = cmd.endsWith('.mjs') ? process.execPath : cmd;
  const spawnArgs = cmd.endsWith('.mjs') ? [cmd, ...args] : args;
  return new Promise((resolve) => {
    const child = execFile(spawnCmd, spawnArgs, {
      timeout: opts.timeout || 30000,
      maxBuffer: 10 * 1024 * 1024,
      ...opts,
    }, (err, stdout, stderr) => {
      activeChildren.delete(child);
      const parsed = { cmd, args: args.slice(0, 3).concat(args.length > 3 ? ['...'] : []) };
      parsed.exitCode = err ? (err.code || err.status || 1) : 0;
      parsed.signal = err?.signal || null;
      if (err && err.killed) parsed.killed = true;

      let data = null;
      let parseError = null;
      if (stdout) {
        try {
          data = JSON.parse(stdout);
        } catch {
          parseError = stdout.trim().slice(0, 500);
        }
      }
      parsed.data = data;
      parsed.parseError = parseError;
      parsed.stderr = stderr.trim().slice(0, 1000) || null;
      parsed.elapsedMs = opts._start ? Date.now() - opts._start : -1;

      if (!data || data.error) {
        parsed.fallito = true;
        parsed.motivo = data?.error || parseError || `exit ${parsed.exitCode}`;
      } else if (data.ok === false) {
        parsed.fallito = true;
        parsed.motivo = data.error || 'errore sconosciuto';
      }

      resolve(parsed);
    });
    activeChildren.add(child);
    child.on('error', (e) => {
      activeChildren.delete(child);
      resolve({ cmd, args, exitCode: -1, killed: false, data: null, parseError: null, stderr: e.message, fallito: true, motivo: e.message, elapsedMs: Date.now() - (opts._start || Date.now()) });
    });
  });
}

function isEmptyResult(v) {
  if (v == null) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return true;
  return false;
}

function smartStringify(v) {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    if (v.nodeType === 1) {
      const text = v.textContent?.trim() || v.innerText?.trim() || '';
      return text;
    }
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function isSuspiciouslyShort(content) {
  if (!content) return true;
  const t = content.trim();
  if (t.length < 3) return true;
  if (t === '{}' || t === '[]' || t === 'null' || t === 'undefined') return true;
  return false;
}

const ERROR_PATTERNS = [
  'access denied', 'accesso negato', 'access dinied',
  '403 forbidden', '403 errore', 'forbidden',
  'you don\'t have permission', 'non hai i permessi',
  'reference #', 'errore 403', 'error 403',
  'too many requests', 'troppe richieste',
  'please enable javascript', 'attiva javascript',
  'sorry, you have been blocked', 'blocked',
];

function isErrorPage(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.trim().toLowerCase();
  for (const pattern of ERROR_PATTERNS) {
    if (lower.includes(pattern)) return true;
  }
  return false;
}

function isPoorContent(text, minChars) {
  if (isEmptyResult(text)) return { poor: true, motivo: 'risultato vuoto' };
  if (typeof text === 'string' && isErrorPage(text)) {
    const trimmed = text.trim().length;
    if (trimmed < 500) {
      return { poor: true, motivo: `pagina di errore rilevata (${trimmed} caratteri)` };
    }
  }
  if (typeof text === 'string' && text.trim().length < minChars) {
    return { poor: true, motivo: `contenuto troppo corto (${text.trim().length} < ${minChars} caratteri)` };
  }
  return { poor: false };
}

function output(obj) {
  process.stdout.write(JSON.stringify({ version: VERSION, ...obj }) + '\n');
}

function parseIntArg(args, flag, def) {
  const i = args.indexOf(flag);
  if (i >= 0 && i + 1 < args.length) {
    const v = parseInt(args[i + 1], 10);
    return isNaN(v) ? def : v;
  }
  return def;
}

function parseArgs() {
  const all = process.argv.slice(2);
  if (all.includes('--help') || all.length === 0) help();

  const fallback = all.includes('--fallback');
  const exprIdx = all.indexOf('--expr');
  const expr = exprIdx >= 0 && exprIdx + 1 < all.length ? all[exprIdx + 1] : null;

  const nonFlagArgs = all.filter(a => (a.startsWith('http://') || a.startsWith('https://')) && !a.startsWith('--'));
  const urls = nonFlagArgs.length > 0 ? nonFlagArgs : null;

  if (!urls) { log('almeno un URL richiesto'); help(); }

  const opts = {
    urls,
    expr,
    fallback,
    minChars: parseIntArg(all, '--min-chars', 300),
    wait: parseIntArg(all, '--wait', 2000),
    timeout: parseIntArg(all, '--timeout', 60000),
    verbose: all.includes('--verbose'),
  };

  return opts;
}

async function tryCamofoxEvaluate(url, expr, opts) {
  const start = Date.now();
  log(`Camofox evaluate: ${url}`);
  const res = await run(CAMOFOX, ['evaluate', url, expr], { _start: start, timeout: 15000 });
  if (!res.data || res.data.ok === false) {
    res.fallito = true;
    res.motivo = res.data?.error || 'nessun output JSON valido';
  }
  return res;
}

async function tryCamofoxReadability(url, opts) {
  const start = Date.now();
  log(`Camofox readability: ${url}`);
  const res = await run(CAMOFOX, ['readability', url], { _start: start, timeout: 30000 });
  return res;
}

async function tryCamofoxSnapshot(url, opts) {
  const start = Date.now();
  log(`Camofox snapshot: ${url}`);
  const res = await run(CAMOFOX, ['snapshot', url], { _start: start, timeout: 30000 });
  return res;
}

async function tryCamofoxTabEvaluate(url, expr, opts) {
  const start = Date.now();
  log(`Camofox tab open --wait: ${url}`);
  const openRes = await run(CAMOFOX, ['tab', 'open', url, '--wait'], { _start: start, timeout: 15000 });
  if (!openRes.data || !openRes.data.tabId) {
    openRes.fallito = true;
    openRes.motivo = openRes.data?.error || 'tab open fallito';
    return openRes;
  }
  const tabId = openRes.data.tabId;

  const evalStart = Date.now();
  log(`Camofox tab evaluate: tabId=${tabId}`);
  const evalRes = await run(CAMOFOX, ['tab', 'evaluate', tabId, expr], { _start: evalStart, timeout: 15000 });

  if (evalRes.data && evalRes.data.ok !== false) {
    const result = evalRes.data.result;
    if (isEmptyResult(result)) {
      evalRes.fallito = true;
      evalRes.motivo = 'risultato vuoto';
    }
  } else {
    evalRes.fallito = true;
    evalRes.motivo = evalRes.data?.error || 'tab evaluate fallito';
  }

  log(`Camofox tab close: ${tabId}`);
  await run(CAMOFOX, ['tab', 'close', tabId], { timeout: 5000 }).catch(() => {});

  evalRes.tabOpenElapsed = openRes.elapsedMs;
  return evalRes;
}

async function tryCamofoxRenderedText(url, opts) {
  return tryCamofoxTabEvaluate(url, 'document.body.innerText', opts);
}

async function tryCloak(url, opts) {
  const start = Date.now();
  log(`CloakBrowser fetch: ${url}`);

  const generalTimeout = opts.timeout || 60000;
  const cloArgs = [url, '--format', 'markdown', '--wait', String(Math.max(opts.wait || 2000, 1000)), '--timeout', String(Math.min(generalTimeout, 120000))];

  if (opts.verbose) cloArgs.push('--verbose');

  const res = await run(CLOAK, cloArgs, { _start: start, timeout: generalTimeout * 2 });
  if (!res.data || res.data.error) {
    res.fallito = true;
    res.motivo = res.data?.error || 'nessun output JSON valido';
    return res;
  }
  if (res.data && res.data.content) {
    const poor = isPoorContent(res.data.content, opts.minChars);
    if (poor.poor) {
      res.fallito = true;
      res.motivo = poor.motivo;
    }
  }
  return res;
}

function extractReadabilityContent(data) {
  if (!data || !data.results || !data.results[0]) return null;
  const r = data.results[0].readability;
  if (r && r.text) {
    return { content: r.text, chars: r.length || r.text.length, title: r.title || '' };
  }
  const s = data.results[0].snapshot;
  if (s) {
    const text = typeof s === 'string' ? s : (s.text || s.snapshot || JSON.stringify(s));
    return { content: text, chars: text.length };
  }
  return null;
}

function extractSnapshotContent(data) {
  if (!data || !data.snapshot) return null;
  const s = data.snapshot;
  const text = typeof s === 'string' ? s : (s.text || s.snapshot || JSON.stringify(s));
  return { content: text, chars: text.length };
}

function pickRicher(a, b) {
  if (!a) return b;
  if (!b) return a;
  return (a.chars || 0) >= (b.chars || 0) ? a : b;
}

async function processUrlCamofox(url, opts) {
  const urlStart = Date.now();
  const steps = [];

  if (opts.expr) {
    const s1 = await tryCamofoxEvaluate(url, opts.expr, opts);
    const res1 = s1.data?.result;
    steps.push({ tool: 'camofox-evaluate', ok: !s1.fallito, motivo: s1.motivo || null, elapsedMs: s1.elapsedMs });

    if (!s1.fallito && !isEmptyResult(res1)) {
      const resultStr = smartStringify(res1);
      if (!isErrorPage(resultStr)) {
        if (isSuspiciouslyShort(resultStr)) {
          steps[steps.length - 1].warning = `risultato sospettosamente corto ('${resultStr}') — possibile selettore JS errato o espressione che restituisce vuoto`;
        }
        return { url, ok: true, content: resultStr, chars: resultStr.length, source: 'camofox-evaluate', title: null, steps, elapsedMs: Date.now() - urlStart };
      }
      steps[steps.length - 1].fallbackReason = `pagina di errore rilevata via --expr`;
      steps[steps.length - 1].ok = false;
    }

    const s2 = await tryCamofoxTabEvaluate(url, opts.expr, opts);
    const res2 = s2.data?.result;
    steps.push({ tool: 'camofox-tab', ok: !s2.fallito, motivo: s2.motivo || null, elapsedMs: (s2.elapsedMs || 0) + (s2.tabOpenElapsed || 0) });

    if (!s2.fallito && !isEmptyResult(res2)) {
      const resultStr = smartStringify(res2);
      if (!isErrorPage(resultStr)) {
        if (isSuspiciouslyShort(resultStr)) {
          steps[steps.length - 1].warning = `risultato sospettosamente corto ('${resultStr}') — possibile selettore JS errato o espressione che restituisce vuoto`;
        }
        return { url, ok: true, content: resultStr, chars: resultStr.length, source: 'camofox-tab', title: null, steps, elapsedMs: Date.now() - urlStart };
      }
      steps[steps.length - 1].fallbackReason = `pagina di errore rilevata via --expr`;
      steps[steps.length - 1].ok = false;
    }

    const lastResult = s2.data?.result ?? s1.data?.result;
    const lastResultStr = lastResult != null ? smartStringify(lastResult) : null;
    return { url, ok: false, content: lastResultStr, chars: lastResultStr?.length || 0, reason: 'Camofox fallito su entrambi i tentativi', source: steps[steps.length - 1]?.tool || 'camofox', steps, elapsedMs: Date.now() - urlStart };
  }

  const s1 = await tryCamofoxReadability(url, opts);
  steps.push({ tool: 'camofox-readability', ok: !s1.fallito, motivo: s1.motivo || null, elapsedMs: s1.elapsedMs });

  let best = extractReadabilityContent(s1.data);
  if (best && !s1.fallito) {
    const poor = isPoorContent(best.content, opts.minChars);
    if (!poor.poor) {
      return { url, ok: true, content: best.content, chars: best.chars, title: best.title || '', source: 'camofox-readability', steps, elapsedMs: Date.now() - urlStart };
    }
    steps[steps.length - 1].fallbackReason = poor.motivo;
  }

  const s2 = await tryCamofoxSnapshot(url, opts);
  steps.push({ tool: 'camofox-snapshot', ok: !s2.fallito, motivo: s2.motivo || null, elapsedMs: s2.elapsedMs });

  const snap = extractSnapshotContent(s2.data);
  best = pickRicher(best, snap);
  if (best) {
    const poor = isPoorContent(best.content, opts.minChars);
    if (!poor.poor) {
      return { url, ok: true, content: best.content, chars: best.chars, title: best.title || '', source: 'camofox-snapshot', steps, elapsedMs: Date.now() - urlStart };
    }
    steps[steps.length - 1].fallbackReason = poor.motivo;
  }

  const s3 = await tryCamofoxRenderedText(url, opts);
  steps.push({ tool: 'camofox-render-text', ok: !s3.fallito, motivo: s3.motivo || null, elapsedMs: s3.elapsedMs });
  if (!s3.fallito && s3.data?.result != null) {
    const rendered = smartStringify(s3.data.result);
    if (!isEmptyResult(rendered)) {
      const poor = isPoorContent(rendered, opts.minChars);
      if (!poor.poor) {
        return { url, ok: true, content: rendered, chars: rendered.length, title: best?.title || null, source: 'camofox-render-text', steps, elapsedMs: Date.now() - urlStart };
      }
      steps[steps.length - 1].fallbackReason = poor.motivo;
    }
  }

  const last = steps[steps.length - 1];
  return { url, ok: false, content: best?.content || null, chars: best?.chars || 0, title: best?.title || null, reason: last?.fallbackReason || last?.motivo || 'Camofox fallito', steps, elapsedMs: Date.now() - urlStart };
}

async function processUrlCloak(url, opts) {
  const urlStart = Date.now();
  const steps = [];
  const s = await tryCloak(url, opts);
  steps.push({ tool: 'cloak', ok: !s.fallito, motivo: s.motivo || null, elapsedMs: s.elapsedMs });

  if (!s.fallito && s.data?.content) {
    return { url, ok: true, content: s.data.content, chars: s.data.content.length, title: s.data.title || '', source: 'cloak', steps, elapsedMs: Date.now() - urlStart };
  }

  return { url, ok: false, content: s.data?.content || null, chars: s.data?.content?.length || 0, title: s.data?.title || null, reason: s.motivo || 'Cloak fallito', steps, elapsedMs: Date.now() - urlStart };
}

async function processUrls(urls, processor, opts) {
  const results = [];
  for (const url of urls) {
    const r = await processor(url, opts);
    results.push(r);
  }
  return results;
}

function mergeCamofoxStepsIntoCloakResults(camofoxResults, cloakResults) {
  return cloakResults.map((cloakRes, i) => {
    const camRes = camofoxResults[i];
    return {
      ...cloakRes,
      steps: [...(camRes?.steps || []), ...cloakRes.steps],
    };
  });
}

function setupSignalHandlers() {
  const cleanup = () => {
    for (const child of activeChildren) {
      try { child.kill('SIGTERM'); } catch {}
    }
    process.exit(130);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

let _overallStart;

async function main() {
  setupSignalHandlers();
  const opts = parseArgs();
  _overallStart = Date.now();

  if (opts.fallback) {
    const results = await processUrls(opts.urls, processUrlCloak, opts);
    output({
      ok: true,
      mode: 'fallback',
      results,
      elapsedMs: Date.now() - _overallStart,
    });
    return;
  }

  const results = await processUrls(opts.urls, processUrlCamofox, opts);
  const allFailed = results.every(r => !r.ok);

  if (allFailed) {
    log('Tutti gli URL falliti su Camofox, escalation automatica a Cloak...');
    const cloakResults = await processUrls(opts.urls, processUrlCloak, opts);
    const merged = mergeCamofoxStepsIntoCloakResults(results, cloakResults);
    output({
      ok: true,
      mode: 'full-auto',
      results: merged,
      elapsedMs: Date.now() - _overallStart,
    });
  } else {
    output({
      ok: true,
      mode: 'camofox',
      results,
      elapsedMs: Date.now() - _overallStart,
    });
  }
}

main().catch((err) => {
  output({ ok: false, error: err.message, stack: err.stack });
  process.exit(1);
});
