#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { execSync } from "node:child_process";
import * as client from "./camofox-client.mjs";

const subcommand = process.argv[2];

function usage() {
  process.stderr.write(`Camofox deterministic script

Subcomandi:
  health                              Stato del browser
  start                               Avvia browser
  stop                                Ferma browser
  readability <url1> [url2 ...]        Estrai articolo da 1+ URL
  evaluate <url> "<expression>"        Esegui JS su un URL
  snapshot <url>                       Accessibility tree
  screenshot <url> [output-path]       Screenshot PNG

  tab open <url>                       Apre tab persistente, torna tabId
  tab evaluate <tabId> "<expr>"        Esegui JS su tab esistente
  tab snapshot <tabId>                 Snapshot su tab esistente
  tab click <tabId> <ref>              Click su tab esistente
  tab type <tabId> <ref> <text>        Digita su tab esistente
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

async function ensureBrowser() {
  try {
    const h = await client.health();
    if (h.browserRunning) return;
  } catch (err) {
    if (err.status === 503) {
      client.logStep("Browser in stato recovering, riavvio container...");
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
    // Per altri errori (ECONNREFUSED, container giù) → comportamento legacy
  }
  client.logStep("Browser non in esecuzione, avvio...");
  await client.start();

  const BACKOFFS = [3, 5, 8, 12, 18];
  for (const delay of BACKOFFS) {
    await new Promise((r) => setTimeout(r, delay * 1000));
    client.logStep(`Smoke test browser (attesa ${delay}s)...`);
    try {
      const tab = await client.createTab("http://example.com");
      try {
        await client.evaluate(tab.tabId, "1+1");
        client.logStep("Smoke test superato, browser operativo");
        return;
      } finally {
        try { await client.closeTab(tab.tabId); } catch {}
      }
    } catch (e) {
      client.logStep(`Smoke test fallito: ${e.message}`);
    }
  }
  throw new Error("Browser non operativo dopo " + BACKOFFS.length + " tentativi di smoke test");
}

async function runOnTab(url, fn, { waitMs = 0 } = {}) {
  const tab = await client.createTab(url);
  try {
    if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
    return await fn(tab.tabId);
  } finally {
    try { await client.closeTab(tab.tabId); } catch {}
  }
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

async function cmdReadability(urls) {
  const results = [];
  await ensureBrowser();
  for (const url of urls) {
    try {
      let readabilityResult = null;
      let snapshotResult = null;

      await runOnTab(url, async (tabId) => {
        const maxAttempts = 2;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          client.logStep(`Readability tentativo ${attempt}/${maxAttempts}...`);
          const res = await client.readability(tabId);
          let parsed = null;
          if (res?.result) {
            try { parsed = JSON.parse(res.result); } catch { parsed = null; }
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

        if (!readabilityResult) {
          client.logStep("Readability → null dopo 2 tentativi, fallback a snapshot...");
          snapshotResult = await client.snapshot(tabId);
        }
      }, { waitMs: 2000 });

      results.push({ url, readability: readabilityResult, snapshot: snapshotResult });
    } catch (err) {
      results.push({ url, readability: null, snapshot: null, error: err.message });
    }
  }
  ok({ results });
}

async function cmdEvaluate(url, expression) {
  await ensureBrowser();
  const item = await runOnTab(url, async (tabId) => {
    const res = await client.evaluate(tabId, expression);
    return { url, result: res?.result ?? res };
  }, { waitMs: 1000 });
  ok(item);
}

async function cmdSnapshot(url) {
  await ensureBrowser();
  const item = await runOnTab(url, async (tabId) => {
    const res = await client.snapshot(tabId);
    return { url, snapshot: res };
  }, { waitMs: 1000 });
  ok(item);
}

async function cmdScreenshot(url, outputPath) {
  const out = outputPath || "/tmp/camofox_screenshot.png";
  await ensureBrowser();
  await runOnTab(url, async (tabId) => {
    const res = await client.screenshotRaw(tabId);
    const buf = Buffer.from(await res.arrayBuffer());
    const dir = dirname(out);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(out, buf);
    return {};
  });
  ok({ screenshot: out });
}

async function cmdTab(sub, args) {
  switch (sub) {
    case "open": {
      if (args.length === 0) usage();
      await ensureBrowser();
      const tab = await client.createTab(args[0]);
      ok({ tabId: tab.tabId, url: tab.url });
      return;
    }
    case "evaluate": {
      if (args.length < 2) usage();
      const [tabId, ...exprParts] = args;
      const res = await client.evaluate(tabId, exprParts.join(" "));
      ok({ result: res?.result ?? res });
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
      const [tabId, ref, ...textParts] = args;
      const res = await client.type(tabId, ref, textParts.join(" "));
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
      await client.destroySession();
      ok({ closed: true });
      return;
    }
    default:
      usage();
  }
}

const [,, , ...args] = process.argv;

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
    if (args.length === 0) usage();
    await cmdReadability(args);
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
  case "tab": {
    const [sub, ...tabArgs] = args;
    if (!sub) usage();
    await cmdTab(sub, tabArgs);
    break;
  }
  default:
    usage();
}
