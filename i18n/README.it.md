# browser-search

<p align="center">
  <img src="../img/logoLarge-browser-search.png" alt="browser-search logo" width="80%">
</p>

> **Una skill per agenti AI.** OpenCode, Claude Code, Cursor, OpenClaw e oltre. Cerca sul web con SearXNG, naviga con Camofox, bypassa le protezioni con CloakBrowser. **Progettato contro le allucinazioni.** Tutto self-hosted, gratuito, illimitato.

## Perché esiste

browser-search è una SKILL — un insieme di istruzioni per agenti AI come OpenCode, Claude Code, Cursor, OpenClaw e altri. Insegna al tuo agente come cercare e navigare sul web usando tre strumenti open source orchestrati.

Il problema? Il web è ostile all'automazione. Cloudflare, Akamai, DataDome e altri sistemi anti-bot bloccano le richieste semplici. I siti moderni usano JavaScript pesante, caricamento lazy e rendering lato client. Una singola soluzione non basta.

`browser-search` orchestra **tre strumenti open source** in un unico sistema di ricerca e navigazione progettato per agenti AI. Ogni strumento ha il suo ruolo, orchestrato dalla skill con logica di escalation, selezione automatica e integrazione pronta all'uso:

1. **[SearXNG](https://github.com/searxng/searxng)** — metamotore di ricerca per la fase di ricerca (multi-fonte, JSON)
2. **[Camofox](https://github.com/jo-inc/camofox-browser)** — browser navigabile via REST API per siti standard
3. **[CloakBrowser](https://github.com/cloakhq/cloakbrowser)** — browser stealth per siti protetti anti-bot

Il flusso tipico: l'agente prima cerca con SearXNG, poi naviga i risultati con Camofox (o CloakBrowser se il sito è protetto).

## Benefici

- **100% gratuito, self-hosted, illimitato.** Nessuna chiave API da comprare, nessun abbonamento, nessun limite di velocità. Tutto gira sulla tua macchina, Docker e npm. Utilizzo illimitato, costo zero.

- **Leggero, funziona ovunque.** Costruito e testato su un Raspberry Pi — se funziona lì, funziona ovunque. Consumo minimo di risorse, nessuna infrastruttura pesante necessaria, funziona 24/7 su hardware a basso consumo.

- **Ricerca + navigazione in un unico kit.** Nessuna integrazione manuale necessaria. Ricerca e navigazione sono due fasi distinte, entrambe coperte.

- **Escalation automatica della navigazione.** Se Camofox viene bloccato da Cloudflare/Akamai, l'agente passa automaticamente a CloakBrowser.

- **Prestazioni intelligenti.** SearXNG per la fase di ricerca (millisecondi). Camofox e CloakBrowser vengono usati solo per navigare i siti che ne hanno effettivamente bisogno.

- **Scelta automatica dell'agente.** L'agente AI decide quale strumento usare: SearXNG per la ricerca iniziale, Camofox per la navigazione, CloakBrowser se il sito è protetto. Zero intervento umano.

- **Progettato contro le allucinazioni.** La modalità Deep Research della skill impone un flusso "prima cerca, poi rispondi": l'agente deve verificare ogni affermazione fattuale su fonti web live, incrociare più fonti e mai indovinare. Niente più risposte inventate.

- **Completamente personalizzabile.** La SKILL.md è testo semplice. Puoi modificare le regole principali, aggiungere le tue, rimuovere ciò che non ti serve. Adattala al tuo flusso di lavoro, al tuo team, ai tuoi standard.

- **Stealth nativo.** CloakBrowser rileva automaticamente le sfide di Cloudflare, Akamai, DataDome, Imperva, PerimeterX e DDoS-Guard, e attende che si risolvano prima di estrarre il contenuto.

- **Funziona con qualsiasi agente.** La SKILL.md è scritta per OpenCode, ma la logica è identica per qualsiasi agente AI. Stesso README, stesso package.json, tutto funziona ovunque. Chiedi semplicemente al tuo agente di convertire la skill per il suo ambiente.

## 🏆 Stato dell'arte

Questi tre strumenti sono stati scelti perché rappresentano al momento lo stato dell'arte di quanto disponibile sul mercato. Una skill come questa è pensata per evolversi: quando usciranno strumenti migliori, basterà aggiornare qualche riga nella SKILL.md per sostituirli. 🔄

⭐ **Metti una stella al repo e seguici** per restare sempre aggiornato su nuovi strumenti, miglioramenti del flusso e aggiornamenti dell'orchestrazione. 🚀

## Architettura

```
┌─────────────────────────────────────────────────────────┐
│                    browser-search                        │
│                                                         │
│  ┌──────────────┐                                       │
│  │   Ricerca    │                                       │
│  │               │                                       │
│  │  SearXNG      │  motori di ricerca → URL             │
│  │  (Docker)     │  risultati JSON, veloci              │
│  │  :8080        │                                       │
│  └──────────────┘                                       │
│         │                                                │
│         │ risultati pronti → navigare                    │
│         ↓                                                │
│  ┌─────────────────────────────────────┐                │
│  │          Navigazione                 │                │
│  │                                      │                │
│  │  ┌──────────────┐                   │                │
│  │  │   Camofox    │  browser + REST   │                │
│  │  │  (Docker)    │  JS, click, eval  │                │
│  │  │  :9377       │                   │                │
│  │  └──────┬───────┘                   │                │
│  │         │                           │                │
│  │         │ se bloccato               │                │
│  │         ↓                           │                │
│  │  ┌──────────────┐                   │                │
│  │  │ CloakBrowser │  Chromium stealth │                │
│  │  │   (npm)      │  anti-bot, proxy  │                │
│  │  └──────────────┘                   │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## Come funziona

### Fase 1 — Ricerca con SearXNG

Container Docker su `localhost:8080`. Metamotore che interroga Google, Wikipedia, Bing, DuckDuckGo e molti altri simultaneamente. Output JSON con titoli, snippet e URL.

**Esempio:**

```bash
curl -s "http://localhost:8080/search?format=json&q=largest+llm+benchmark+2026"
```

L'agente ora ha un elenco di URL da visitare e decide autonomamente se navigarli con Camofox o CloakBrowser in base al sito.

### Fase 2 — Navigazione con Camofox

Container Docker su `localhost:9377`. Espone un browser Firefox completo tramite API REST. L'agente può creare schede, navigare, cliccare, scorrere, eseguire JavaScript arbitrario e strutturare dati.

**Include:** Readability.js di Mozilla per estrarre articoli puliti, rimuovendo navigazione, barra laterale e pubblicità (~70% di risparmio token).

**Comandi principali:**

```bash
# Creare scheda e navigare
curl -s -X POST "http://localhost:9377/tabs" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bot","url":"https://example.com"}'

# Leggere snapshot (albero di accessibilità)
curl -s "http://localhost:9377/tabs/<tabId>/snapshot?userId=bot"

# Eseguire JavaScript
curl -s -X POST "http://localhost:9377/tabs/<tabId>/evaluate" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CAMOFOX_API_KEY" \
  -d '{"userId":"bot","expression":"document.title"}'
```

### Fase 3 — Navigazione con CloakBrowser (quando Camofox non basta)

Pacchetto npm basato su Playwright + `cloakbrowser`. Avvia un browser Chromium con impronta digitale avanzata per bypassare Cloudflare, Akamai, DataDome e altri sistemi anti-bot. Rilevamento automatico delle sfide con attesa e riprova.

**Script disponibili:**

- `cloak-fetch.mjs` — fetch universale con rilevamento sfide
- `cloak-script.mjs` — esecuzione script Playwright personalizzato

**Esempio:**

```bash
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com"
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com" --proxy socks5://... --geoip
```

## Perché sia Camofox che CloakBrowser?

Perché velocità e stealth sono un compromesso, e lo strumento giusto dipende dal sito.

**Camofox — veloce, strutturato, persistente.**
Camofox avvolge Camoufox (un fork di Firefox a livello C++) in una API REST con un browser sempre caldo. Dopo un avvio a freddo di ~1-3s, ogni richiesta è quasi istantanea. I suoi snapshot di accessibilità sono ~90% più piccoli dell'HTML grezzo, con riferimenti a elementi stabili (e1, e2, ...) per un'interazione affidabile. Gestisce ~90% dei siti che non usano protezione anti-bot avanzata: articoli, documenti, motori di ricerca, pagine web standard.

**CloakBrowser — stealth, anti-bot, on-demand.**
CloakBrowser avvia una nuova istanza Chromium per richiesta (~1-3s di avvio ogni volta). Usa impronte digitali avanzate, supporto proxy, geoip e rilevamento automatico delle sfide per bypassare Cloudflare, Akamai, DataDome, Imperva, PerimeterX e DDoS-Guard. È l'ultima risorsa per il ~10% dei siti che bloccano Camofox.

**Numeri reali:**

| Strumento | Cloudflare standard | Cloudflare Turnstile | DataDome |
|---|---|---|---|
| **Camoufox** (motore Camofox) | fino a **~92%** [¹] | **~65-78%** [¹] | **60-75%** [¹] |
| **Playwright Stealth** | ~70-80% [¹] | ~40-55% [¹] | ~30-50% [¹] |

- **CloakBrowser** applica **58 patch a livello di codice sorgente C++** e ottiene **0.9 reCAPTCHA v3** (livello umano, verificato dal server), superando tutti i principali test anti-bot inclusi Cloudflare Turnstile e FingerprintJS [²]
- **Camofox** avvio a freddo: **~1-3s** (una tantum, poi ~0ms per richiesta via API REST calda) [³]
- **Playwright/Chromium** avvio a freddo: **~0.5-6s** (ogni avvio, varia in base all'ambiente) [⁴]

Camofox gestisce il percorso veloce. CloakBrowser gestisce i casi limite. Insieme coprono l'intero web senza lacune. L'agente decide quale usare.

### Fonti

¹ "Camoufox Vs Playwright Stealth: Complete Comparison & Alternatives (2026)" — [blog.send.win](https://blog.send.win/camoufox-vs-playwright-stealth-complete-comparison-alternatives-2026/)
² CloakBrowser README — [github.com/cloakhq/cloakbrowser](https://github.com/cloakhq/cloakbrowser)
³ camoufox-pi README (cold start comparison) — [github.com/MonsieurBarti/camoufox-pi](https://github.com/MonsieurBarti/camoufox-pi)
⁴ Playwright issue #4345 (launch time variability) — [github.com/microsoft/playwright/issues/4345](https://github.com/microsoft/playwright/issues/4345)

## Installazione

### Passo 1 — Installa la skill

Installa la definizione della skill nel tuo agente AI con un solo comando:

```bash
npx skills add Johell1NS/browser-search
```

Funziona con oltre 70 agenti AI tra cui OpenCode, Claude Code, Cursor, GitHub Copilot e altri.

### Passo 2 — Configura l'infrastruttura

```bash
git clone https://github.com/Johell1NS/browser-search
cd browser-search
npm install
```

Mostra questo README al tuo agente AI per un'installazione completa adattata al tuo ambiente e piattaforma.

**Panoramica servizi:**

| Servizio | Come | Riferimento |
|---|---|---|
| SearXNG | Docker, `:8080` | [docs.searxng.org](https://docs.searxng.org/admin/installation-docker.html) |
| Camofox | Docker, `:9377` | [github.com/jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser) |
| CloakBrowser | npm (incluso) | `scripts/cloak/cloak-fetch.mjs` |

**Per l'agente AI — leggi questi file:**

| File | Cosa contiene |
|---|---|
| `SKILL.md` | Skill completa: comandi, escalation, risoluzione problemi |
| `scripts/cloak/cloak-fetch.mjs` | Utilizzo CLI CloakBrowser e tutte le opzioni |
| `scripts/setup-dependencies.sh` | Dipendenze di sistema |
| `scripts/check-browser-search.sh` | Verifica post-installazione |
| `docker/setup.md` | Suggerimenti configurazione Docker |

**Nota:** `SKILL.md` è scritta per la sintassi di **OpenCode** (`exec`, `curl`). Se il tuo agente usa un formato diverso (Claude Code, Cursor, ecc.), leggila e converti i comandi nella sintassi del tuo agente prima di usare la skill.

## Variabili d'ambiente

| Variabile | Richiesta per | Default |
|---|---|---|
| `CAMOFOX_API_KEY` | evaluate, session, cleanup in Camofox | — |
| `CAMOFOX_ADMIN_KEY` | Endpoint stop di Camofox | — |

## Cosa NON fa questa skill

- **Social media.** Instagram, Facebook, TikTok, LinkedIn e Twitter/X richiedono l'accesso. `browser-search` non tenta di navigarli.
- **Scaricare file.** È in sola lettura (tranne screenshot espliciti).
- **Bypassare paywall.** Non aggira sistemi di pagamento o login.

## Sicurezza

browser-search include diversi livelli di protezione per la sicurezza:

### Protezioni integrate

- **Prevenzione SSRF.** Gli URL vengono validati prima della navigazione — IP interni (`127.x`, `10.x`, `192.168.x`, `169.254.x`), endpoint dei metadati cloud e domini `.internal`/`.local` sono bloccati. Anche la risoluzione DNS viene controllata per prevenire attacchi di DNS rebinding.
- **Sandbox degli script.** Gli script personalizzati (`cloak-script.mjs`) vengono eseguiti in una sandbox che limita la superficie API di Playwright (solo i metodi autorizzati su `page`, `browser`, `context` sono accessibili). Nota: le API Node.js rimangono disponibili — per un isolamento completo sarebbe necessario un `vm.Context`. Usa `--unsafe` per bypassare la sandbox e la protezione SSRF.
- **Protezione path traversal.** I percorsi di `--script` devono essere all'interno della directory della skill. I percorsi assoluti e l'attraversamento con `../` sono bloccati.
- **Rate limiting.** 30 richieste/minuto di default per prevenire DoS accidentale o attivazione anti-bot (usa `--no-rate-limit` per disabilitare).
- **Nomi file sicuri.** Gli screenshot usano UUID casuali invece di timestamp prevedibili.
- **Soppressione stack trace.** L'output degli errori omette gli stack trace di default. Usa `--verbose` per il debugging.

### Buone pratiche

- **Chiavi API.** Usa variabili d'ambiente (`$CAMOFOX_API_KEY`) o `--env-file` per Docker. Non incollare chiavi sulla riga di comando — appaiono in `ps aux` e nella cronologia della shell.
- **Binding Docker.** Usa sempre il prefisso `127.0.0.1:` per il port mapping (`-p 127.0.0.1:9377:9377`). Non esporre mai su `0.0.0.0`.
- **Codifica URL.** Usa `--data-urlencode` con curl — non interpolare mai input grezzi negli URL.
- **Versioni bloccate.** Le dipendenze usano versioni esatte (nessun range con `^`) e `package-lock.json` per build riproducibili.

### Audit

Esegui `bash scripts/audit.sh` per verificare la postura di sicurezza della tua installazione.

### Rischi residui

- **Iniezione di prompt.** Un agente AI può essere indotto a compiere azioni dannose. Gli strumenti mitigano i danni ma non possono impedire un agente completamente compromesso.
- **Supply chain.** CloakBrowser scarica un binario Chromium da `cloakbrowser.dev`. Il binario è verificato tramite SHA-256 ma è proprietario.
- **Automazione browser.** Qualsiasi strumento con accesso al browser ha rischi intrinseci. Esegui in ambienti isolati quando possibile.

## Partecipa

browser-search è open source e gratuito. Se lo trovi utile:

- ⭐ **Metti una stella sul repo** — aiuta altri a scoprirlo
- 🐛 **Apri un issue** — segnala bug o suggerisci funzionalità
- 🔀 **Invia una PR** — correggi, migliora, estendi
- 💬 **Condividilo** — con il tuo team, su Reddit, Twitter, Discord
- 🧠 **Adattalo** — fanne un fork, modifica SKILL.md, rendilo tuo

Ogni contributo, per quanto piccolo, lo rende migliore.

## Licenza

MIT
