#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { tmpdir, homedir } from "node:os";
import { execSync } from "node:child_process";
import * as client from "./camofox-client.mjs";

const subcommand = process.argv[2];

// Tab create da questo processo e non ancora chiuse: se il processo viene interrotto
// (segnale o scadenza interna) vengono chiuse prima di uscire, cosi' non restano orfane.
const openTabs = new Set();
const pendingCreates = new Set();
let aborting = false;

async function createTrackedTab(url) {
  const p = client.createTab(url);
  pendingCreates.add(p);
  try {
    const tab = await p;
    openTabs.add(tab.tabId);
    return tab;
  } finally {
    pendingCreates.delete(p);
  }
}

async function closeTrackedTab(tabId) {
  try { await client.closeTab(tabId); } finally { openTabs.delete(tabId); }
}

async function abortAndExit(reason, code) {
  if (aborting) return;
  aborting = true;
  const grace = (ms) => new Promise((r) => setTimeout(r, ms).unref?.());
  try {
    if (pendingCreates.size) await Promise.race([Promise.allSettled([...pendingCreates]), grace(20000)]); // il server crea la tab anche se noi abbandoniamo la richiesta
    await Promise.race([
      Promise.allSettled([...openTabs].map((id) => client.closeTab(id))),
      grace(3000),
    ]);
  } catch {}
  process.stderr.write(`${reason}\n`);
  process.stdout.write(JSON.stringify({ ok: false, error: reason }) + "\n");
  process.exit(code);
}

process.on("SIGTERM", () => abortAndExit("interrotto (SIGTERM)", 143));
process.on("SIGINT", () => abortAndExit("interrotto (SIGINT)", 130));
const deadlineMs = parseInt(process.env.CAMOFOX_DEADLINE_MS, 10);
if (deadlineMs > 0) {
  setTimeout(() => abortAndExit(`timeout dopo ${deadlineMs} ms`, 1), deadlineMs).unref();
}

// Lo storage persistito (cookie + localStorage di ogni sito) cresce senza limite e il server lo
// rilegge a ogni ricreazione della sessione: oltre qualche MB manda in OOM l'heap di default.
// Lo si azzera periodicamente, solo se nessuna sessione e' attiva. Best-effort: non blocca mai il comando.
async function maybeResetStorage() {
  try {
    const days = process.env.CAMOFOX_STORAGE_MAX_AGE_DAYS === undefined ? 7 : Number(process.env.CAMOFOX_STORAGE_MAX_AGE_DAYS);
    if (!(days > 0)) return;
    const marker = process.env.CAMOFOX_STORAGE_MARKER || join(homedir(), ".cache", "browser-search", "camofox-storage-reset");
    try {
      if (Date.now() - statSync(marker).mtimeMs < days * 86400000) return;
    } catch {}
    const h = await client.health();
    if (h.activeSessions > 0) return;
    await client.resetStorageState();
    client.logStep("storage persistito azzerato (pulizia periodica)");
    mkdirSync(dirname(marker), { recursive: true });
    writeFileSync(marker, new Date().toISOString());
  } catch (err) {
    client.logStep(`pulizia storage saltata: ${String(err.message || err).slice(0, 80)}`);
  }
}

function usage() {
  process.stderr.write(`Camofox deterministic script

Subcomandi:
  health                              Stato del browser
  start                               Avvia browser
  stop                                Ferma browser
  readability <url1> [url2 ...] [--min-chars N]
                                       Estrai articolo da 1+ URL (con --min-chars: se troppo corto, snapshot e testo nella stessa tab)
  evaluate <url> "<expression>"        Esegui JS su un URL
  snapshot <url>                       Accessibility tree
  screenshot <url> [output-path]       Screenshot PNG
  pdf <url> [output-path]              Salva il PDF aperto nel browser (file completo, richiede Camofox >= 1.16)

  tab open <url> [--wait]              Apre tab persistente, torna tabId (--wait: attende readyState)
  tab evaluate <tabId> "<expr>"        Esegui JS su tab esistente
  tab snapshot <tabId>                 Snapshot su tab esistente
  tab click <tabId> <ref>              Click su tab esistente
  tab type <tabId> <ref> <text> [--submit] [--clear]
                                       Digita su tab esistente (--submit: Invio finale, --clear: svuota prima)
  tab select <tabId> <ref> "<opzione>" Seleziona un'opzione di un menu nativo
  tab press <tabId> <key>              Premi un tasto (Enter, Escape, Tab...)
  tab scroll <tabId> [dir] [px]        Scroll su tab esistente
  tab navigate <tabId> <url>           Naviga su tab esistente
  tab screenshot <tabId> [path]        Screenshot su tab esistente
  tab extract <tabId> '<schema>'       Estrai dati strutturati
  tab close <tabId>                    Chiude tab
  tab close-all                        Chiude tutti i tab
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

function ok(data) {
  process.stdout.write(JSON.stringify({ ok: true, ...data }) + "\n");
}

async function ensureBrowser({ forceVerify = false } = {}) {
  if (!forceVerify) {
    try {
      const h = await client.health();
      if (h.browserRunning && h.browserConnected && (h.consecutiveFailures || 0) <= 5) return;
    } catch (err) {
      if (err.status !== 503) {
        // ECONNREFUSED / network error → prova docker restart come fallback
      }
    }
  } else {
    client.logStep("ensureBrowser: forceVerify=true, salto short-circuit e faccio smoke test");
  }

  try {
    const h = await client.health();
    if (h.status === 503 || (h.consecutiveFailures || 0) > 5) {
      client.logStep("Browser in stato recovering, provo client.start()...");
      try {
        await client.start();
        const deadline = Date.now() + 15_000;
        while (Date.now() < deadline) {
          const h2 = await client.health();
          if (h2.browserRunning && h2.browserConnected) break;
          await new Promise((r) => setTimeout(r, 1000));
        }
        const h3 = await client.health();
        if (h3.browserRunning && h3.browserConnected) return;
      } catch (startErr) {
        client.logStep(`client.start() fallito (${startErr.message}), fallback a docker restart...`);
      }
      client.logStep("Recupero via client.start() non riuscito, riavvio container...");
      try {
        execSync("docker restart camofox-browser", { stdio: "pipe" });
      } catch (restartErr) {
        throw new Error("Riavvio container fallito: " + restartErr.message);
      }
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        try {
          const h2 = await client.health();
          if (h2.browserRunning) return;
        } catch {
          // server still starting, keep polling
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      throw new Error("Browser non disponibile dopo riavvio container (30s timeout)");
    }
  } catch {
    // health fallita, passo al flow legacy di (re)start
  }

  client.logStep("Browser non in esecuzione, avvio...");
  await client.start();

  const BACKOFFS = [3, 5, 8, 12, 18];
  for (const delay of BACKOFFS) {
    await new Promise((r) => setTimeout(r, delay * 1000));
    client.logStep(`Smoke test browser (attesa ${delay}s)...`);
    try {
      const tab = await createTrackedTab("http://example.com");
      try {
        await client.evaluate(tab.tabId, "document.readyState === 'complete' || document.readyState === 'interactive' ? 'ok' : 'loading'");
        client.logStep("Smoke test superato, browser operativo");
        return;
      } finally {
        try { await closeTrackedTab(tab.tabId); } catch {}
      }
    } catch (e) {
      client.logStep(`Smoke test fallito: ${e.message}`);
    }
  }
  throw new Error("Browser non operativo dopo " + BACKOFFS.length + " tentativi di smoke test");
}

async function withRecoverableTab(url, fn, { waitMs = 0, maxRetries = 1 } = {}) {
  let tab;
  let retried = false;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      tab = await createTrackedTab(url);
      break;
    } catch (err) {
      if (err.status === 503 && !retried) {
        client.logStep(`withRecoverableTab: 503 su createTab (${err.message.slice(0,80)}), retry con forceVerify...`);
        retried = true;
        await ensureBrowser({ forceVerify: true });
        continue;
      }
      throw err;
    }
  }
  try {
    if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
    return await fn(tab.tabId, tab);
  } finally {
    try { await closeTrackedTab(tab.tabId); } catch {}
  }
}

// httpStatus/navigationOk sono presenti solo da Camofox 1.15+: con server piu' vecchi si omettono.
function navStatus(tab) {
  const out = {};
  if (tab?.httpStatus !== undefined) out.httpStatus = tab.httpStatus;
  if (tab?.navigationOk !== undefined) out.navigationOk = tab.navigationOk;
  return out;
}

async function cmdHealth() {
  const h = await client.health();
  ok(h);
}

async function cmdStart() {
  await client.start();
  ok({ started: true });
}

async function cmdStop() {
  await client.stop();
  ok({ stopped: true });
}

async function cmdReadability(urls, { minChars = 0 } = {}) {
  const results = [];
  for (const url of urls) {
    try {
      await ensureBrowser();
      let readabilityResult = null;
      let snapshotResult = null;
      let renderedText = null;
      let readabilityError = null;
      let snapshotError = null;
      let navInfo = {};

      await withRecoverableTab(url, async (tabId, tab) => {
        navInfo = navStatus(tab);
        const maxAttempts = 2;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          client.logStep(`Readability tentativo ${attempt}/${maxAttempts}...`);
          let res = null;
          try {
            res = await client.readability(tabId);
          } catch (err) {
            // un errore della pagina (es. CSP) non va perso con gli altri risultati: si passa ai fallback nella stessa tab
            readabilityError = err.message;
            client.logStep(`Readability fallita (${err.message.slice(0, 80)}), passo ai fallback nella stessa tab`);
            break;
          }
          let parsed = null;
          if (res?.result) {
            try { parsed = JSON.parse(res.result); } catch {
              client.logStep(`Readability: JSON.parse fallito, raw result: ${String(res.result).slice(0, 80)}`);
              parsed = null;
            }
          }
          if (parsed?.text) {
            readabilityResult = { title: parsed.title, text: parsed.text, excerpt: parsed.excerpt, length: parsed.length };
            break;
          }
          if (attempt < maxAttempts) {
            const delay = 1500;
            client.logStep(`Readability → null, riprovo tra ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
          }
        }

        const tooShort = readabilityResult && minChars > 0 && readabilityResult.text.trim().length < minChars;
        if (!readabilityResult || tooShort) {
          client.logStep(tooShort
            ? `Readability troppo corta (< ${minChars}), fallback a snapshot e testo nella stessa tab...`
            : "Readability → null, fallback a snapshot e testo nella stessa tab...");
          try {
            snapshotResult = await client.snapshot(tabId);
          } catch (err) {
            snapshotError = err.message;
          }
          try {
            const t = await client.evaluate(tabId, "document.body ? document.body.innerText : ''");
            renderedText = t?.result ?? null;
          } catch { /* il testo e' solo un ulteriore fallback */ }
        }
      }, { waitMs: 2000 });

      const item = { url, readability: readabilityResult, snapshot: snapshotResult, ...navInfo };
      if (renderedText) item.renderedText = renderedText;
      if (snapshotError) item.snapshotError = snapshotError;
      if (readabilityError) item.readabilityError = readabilityError;
      if (!readabilityResult && !snapshotResult && !renderedText) item.error = readabilityError || snapshotError || "nessun contenuto";
      results.push(item);
    } catch (err) {
      results.push({ url, readability: null, snapshot: null, error: err.message });
    }
  }
  ok({ results });
}

async function cmdEvaluate(url, expression) {
  await ensureBrowser();
  const item = await withRecoverableTab(url, async (tabId, tab) => {
    const res = await client.evaluate(tabId, expression);
    return { url, result: res?.result ?? null, ...navStatus(tab) };
  }, { waitMs: 1000 });
  ok(item);
}

async function cmdSnapshot(url) {
  await ensureBrowser();
  const item = await withRecoverableTab(url, async (tabId, tab) => {
    const res = await client.snapshot(tabId);
    return { url, snapshot: res, ...navStatus(tab) };
  }, { waitMs: 1000 });
  ok(item);
}

async function cmdScreenshot(url, outputPath) {
  const out = outputPath || "/tmp/camofox_screenshot.png";
  await ensureBrowser();
  await withRecoverableTab(url, async (tabId) => {
    const res = await client.screenshotRaw(tabId);
    const buf = Buffer.from(await res.arrayBuffer());
    const dir = dirname(out);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(out, buf);
    return {};
  });
  ok({ screenshot: out });
}

async function cmdPdf(url, outputPath) {
  await ensureBrowser();
  // fail() chiama process.exit: va fuori dal callback, altrimenti il finally di withRecoverableTab non chiude la tab
  const pdfError = (msg, details) => Object.assign(new Error(msg), { pdfError: true, details });
  let item;
  try {
  item = await withRecoverableTab(url, async (tabId, tab) => {
    let saved;
    try {
      saved = await client.fetchCurrentResource(tabId);
    } catch (err) {
      if (err.status === 415) throw pdfError("La risorsa aperta non e' un PDF", err.message);
      if (err.status === 413) throw pdfError("PDF troppo grande (limite Camofox 50 MB)", err.message);
      throw err;
    }
    const id = saved?.download?.id;
    const list = await client.downloads(tabId, { includeData: true, maxBytes: 50 * 1024 * 1024 });
    const items = Array.isArray(list?.downloads) ? list.downloads : [];
    const dl = items.find((d) => d.id === id) || items[items.length - 1];
    if (!dl?.dataBase64) throw pdfError("Dati del PDF non disponibili", dl?.dataSkipped || dl?.readError || "download vuoto");
    const buf = Buffer.from(dl.dataBase64, "base64");
    const name = basename(dl.suggestedFilename || "document.pdf").replace(/[^\w.-]/g, "_");
    const out = outputPath || join(tmpdir(), `camofox_${name.endsWith(".pdf") ? name : name + ".pdf"}`);
    const dir = dirname(out);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(out, buf);
    return { url, pdf: out, bytes: buf.length, ...navStatus(tab) };
  }, { waitMs: 1000 });
  } catch (err) {
    if (err.pdfError) fail(err.message, err.details);
    throw err;
  }
  ok(item);
}

async function cmdTab(sub, args) {
  switch (sub) {
    case "open": {
      if (args.length === 0) usage();
      const waitFlag = args.includes("--wait");
      const url = args.find((a) => !a.startsWith("--")) || args[0];
      const waitMs = waitFlag ? 2000 : 0;
      await ensureBrowser();
      let tab;
      let retried = false;
      for (let attempt = 0; attempt <= 1; attempt++) {
        try {
          tab = await createTrackedTab(url);
          break;
        } catch (err) {
          if (err.status === 503 && !retried) {
            client.logStep(`tab open: 503 su createTab, retry con forceVerify...`);
            retried = true;
            await ensureBrowser({ forceVerify: true });
            continue;
          }
          throw err;
        }
      }
      if (waitMs > 0) {
        await new Promise((r) => setTimeout(r, waitMs));
        await client.evaluate(tab.tabId, "void 0").catch(() => {});
      }
      openTabs.delete(tab.tabId); // deve restare aperta per i comandi successivi
      ok({ tabId: tab.tabId, url: tab.url || url, ...navStatus(tab) });
      return;
    }
    case "evaluate": {
      if (args.length < 2) usage();
      const [tabId, ...exprParts] = args;
      const res = await client.evaluate(tabId, exprParts.join(" "));
      ok({ result: res?.result ?? null });
      return;
    }
    case "snapshot": {
      if (args.length === 0) usage();
      const res = await client.snapshot(args[0]);
      ok({ snapshot: res });
      return;
    }
    case "click": {
      if (args.length < 2) usage();
      const res = await client.click(args[0], args[1]);
      ok(res);
      return;
    }
    case "type": {
      if (args.length < 3) usage();
      const [tabId, ref, ...rest] = args;
      const submit = rest.includes("--submit");
      const clear = rest.includes("--clear");
      const textParts = rest.filter((a) => a !== "--submit" && a !== "--clear");
      const res = await client.type(tabId, ref, textParts.join(" "), { submit, clear });
      ok(res);
      return;
    }
    case "select": {
      if (args.length < 3) usage();
      const [tabId, ref, ...optParts] = args;
      const res = await client.select(tabId, ref, optParts.join(" "));
      ok(res);
      return;
    }
    case "press": {
      if (args.length < 2) usage();
      const res = await client.press(args[0], args[1]);
      ok(res);
      return;
    }
    case "scroll": {
      if (args.length === 0) usage();
      const [tabId, direction = "down", amount] = args;
      const res = await client.scroll(tabId, direction, amount ? parseInt(amount) : undefined);
      ok(res);
      return;
    }
    case "navigate": {
      if (args.length < 2) usage();
      const res = await client.navigate(args[0], args[1]);
      ok(res);
      return;
    }
    case "screenshot": {
      if (args.length === 0) usage();
      const out = args[1] || "/tmp/camofox_screenshot.png";
      const res = await client.screenshotRaw(args[0]);
      const buf = Buffer.from(await res.arrayBuffer());
      const dir = dirname(out);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(out, buf);
      ok({ screenshot: out });
      return;
    }
    case "extract": {
      if (args.length < 2) usage();
      const schema = JSON.parse(args[1]);
      const res = await client.extract(args[0], schema);
      ok(res);
      return;
    }
    case "close": {
      if (args.length === 0) usage();
      await client.closeTab(args[0]);
      ok({ closed: true });
      return;
    }
    case "close-all": {
      let closed = 0;
      try {
        const tabsResp = await client.getTabs();
        const tabList = Array.isArray(tabsResp?.tabs) ? tabsResp.tabs : [];
        for (const t of tabList) {
          if (t?.tabId) {
            try { await client.closeTab(t.tabId); closed++; } catch (e) {
              client.logStep(`close-all: impossibile chiudere tab ${t.tabId}: ${e.message}`);
            }
          }
        }
        client.logStep(`close-all: ${closed} tab chiusi`);
      } catch (e) {
        client.logStep(`close-all: GET /tabs fallito (${e.message}), fallback a destroySession`);
        await client.destroySession();
        ok({ closed: -1, fallback: "destroySession" });
        return;
      }
      ok({ closed });
      return;
    }
    default:
      usage();
  }
}

const [,, , ...args] = process.argv;

if (["readability", "evaluate", "snapshot", "screenshot", "pdf"].includes(subcommand) || (subcommand === "tab" && args[0] === "open")) {
  await maybeResetStorage();
}

switch (subcommand) {
  case "health":
    await cmdHealth();
    break;
  case "start":
    await cmdStart();
    break;
  case "stop":
    await cmdStop();
    break;
  case "readability": {
    const mcIdx = args.indexOf("--min-chars");
    const minChars = mcIdx >= 0 ? parseInt(args[mcIdx + 1], 10) || 0 : 0;
    const urls = args.filter((a, i) => !(a === "--min-chars" || (mcIdx >= 0 && i === mcIdx + 1)));
    if (urls.length === 0) usage();
    await cmdReadability(urls, { minChars });
    break;
  }
  case "evaluate": {
    if (args.length < 2) usage();
    const [url, ...exprParts] = args;
    await cmdEvaluate(url, exprParts.join(" "));
    break;
  }
  case "snapshot": {
    if (args.length === 0) usage();
    await cmdSnapshot(args[0]);
    break;
  }
  case "screenshot": {
    if (args.length === 0) usage();
    await cmdScreenshot(args[0], args[1] || null);
    break;
  }
  case "pdf": {
    if (args.length === 0) usage();
    await cmdPdf(args[0], args[1] || null);
    break;
  }
  case "tab": {
    const [sub, ...tabArgs] = args;
    if (!sub) usage();
    await cmdTab(sub, tabArgs);
    break;
  }
  default:
    usage();
}
