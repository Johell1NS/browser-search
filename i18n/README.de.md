# browser-search

<p align="center">
  <img src="../img/logoLarge-browser-search.png" alt="browser-search logo" width="80%">
</p>

> **Eine Skill für KI-Agenten.** OpenCode, Claude Code, Cursor, OpenClaw und mehr. Durchsuchen Sie das Web mit SearXNG, browsen Sie mit Camofox, umgehen Sie Schutzmaßnahmen mit CloakBrowser. Alles selbst gehostet, kostenlos, unbegrenzt.

## Warum es existiert

browser-search ist eine SKILL — ein Anweisungssatz für KI-Agenten wie OpenCode, Claude Code, Cursor, OpenClaw und andere. Sie bringt Ihrem Agenten bei, wie er mit drei orchestrierten Open-Source-Tools das Web durchsuchen und browsen kann.

Das Problem? Das Web ist feindlich gegenüber Automatisierung. Cloudflare, Akamai, DataDome und andere Anti-Bot-Systeme blockieren einfache Anfragen. Moderne Websites verwenden schweres JavaScript, verzögertes Laden und clientseitiges Rendering. Eine einzige Lösung reicht nicht aus.

`browser-search` orchestriert **drei Open-Source-Tools** zu einem einzigen Such- und Browsingsystem, das für KI-Agenten entwickelt wurde. Jedes Tool hat seine Rolle, orchestriert durch die Skill mit Eskalationslogik, automatischer Auswahl und sofort einsatzbereiter Integration:

1. **[SearXNG](https://github.com/searxng/searxng)** — Metasuchmaschine für die Suchphase (multiquelle, JSON)
2. **[Camofox](https://github.com/jo-inc/camofox-browser)** — über REST API navigierbarer Browser für Standard-Websites
3. **[CloakBrowser](https://github.com/cloakhq/cloakbrowser)** — Tarnkappenbrowser für anti-bot-geschützte Websites

Der typische Ablauf: Der Agent sucht zuerst mit SearXNG, dann durchsucht er die Ergebnisse mit Camofox (oder CloakBrowser, wenn die Website geschützt ist).

## Vorteile

- **100% kostenlos, selbst gehostet, unbegrenzt.** Keine API-Schlüssel zu kaufen, keine Abonnements, keine Ratenbegrenzungen. Alles läuft auf Ihrer Maschine, Docker und npm. Unbegrenzte Nutzung, null Kosten.

- **Leicht, läuft überall.** Entwickelt und getestet auf einem Raspberry Pi — wenn es dort läuft, läuft es überall. Minimaler Ressourcenverbrauch, keine schwere Infrastruktur erforderlich, läuft 24/7 auf stromsparender Hardware.

- **Suche + Browsen in einem Kit.** Keine manuelle Integration erforderlich. Suche und Browsen sind zwei verschiedene Phasen, beide abgedeckt.

- **Automatische Navigationseskalation.** Wenn Camofox von Cloudflare/Akamai blockiert wird, wechselt der Agent automatisch zu CloakBrowser.

- **Intelligente Leistung.** SearXNG für die Suchphase (Millisekunden). Camofox und CloakBrowser werden nur zum Browsen der Websites verwendet, die es tatsächlich benötigen.

- **Automatische Agentenauswahl.** Der KI-Agent entscheidet, welches Tool verwendet wird: SearXNG für die erste Suche, Camofox zum Browsen, CloakBrowser wenn die Website geschützt ist. Kein menschliches Eingreifen.

- **Tiefenrecherche-Modus.** Die Skill weist den Agenten an, über oberflächliche Antworten hinauszugehen: mehrere Blickwinkel erkunden, Quellen kreuzweise verifizieren, jeden Aspekt abdecken und niemals Abkürzungen nehmen.

- **Vollständig anpassbar.** Die SKILL.md ist reiner Text. Sie können die Kernregeln bearbeiten, eigene hinzufügen, entfernen was Sie nicht brauchen. Passen Sie sie an Ihren Workflow, Ihr Team, Ihre Standards an.

- **Native Tarnung.** CloakBrowser erkennt automatisch Cloudflare-, Akamai-, DataDome-, Imperva-, PerimeterX- und DDoS-Guard-Herausforderungen und wartet auf deren Lösung, bevor es Inhalte extrahiert.

- **Funktioniert mit jedem Agenten.** Die SKILL.md ist für OpenCode geschrieben, aber die Logik ist für jeden KI-Agenten identisch. Gleiches README, gleiches package.json, alles funktioniert überall. Bitten Sie einfach Ihren Agenten, die Skill für seine Umgebung zu konvertieren.

## 🏆 Stand der Technik

Diese drei Werkzeuge wurden ausgewählt, weil sie den aktuellen Stand der Technik repräsentieren. Eine solche Skill ist darauf ausgelegt, sich weiterzuentwickeln: wenn bessere Werkzeuge auftauchen, reicht ein Update der SKILL.md, um sie auszutauschen. 🔄

⭐ **Gib dem Repository einen Stern und folge ihm**, um über neue Tools, Verbesserungen des Ablaufs und Orchestrierungs-Updates auf dem Laufenden zu bleiben. 🚀

## Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    browser-search                        │
│                                                         │
│  ┌──────────────┐                                       │
│  │    Suche     │                                       │
│  │               │                                       │
│  │  SearXNG      │  Suchmaschinen → URLs                │
│  │  (Docker)     │  JSON-Ergebnisse, schnell            │
│  │  :8080        │                                       │
│  └──────────────┘                                       │
│         │                                                │
│         │ Ergebnisse bereit → browsen                    │
│         ↓                                                │
│  ┌─────────────────────────────────────┐                │
│  │           Browsen                    │                │
│  │                                      │                │
│  │  ┌──────────────┐                   │                │
│  │  │   Camofox    │  Browser + REST   │                │
│  │  │  (Docker)    │  JS, Klick, eval  │                │
│  │  │  :9377       │                   │                │
│  │  └──────┬───────┘                   │                │
│  │         │                           │                │
│  │         │ wenn blockiert            │                │
│  │         ↓                           │                │
│  │  ┌──────────────┐                   │                │
│  │  │ CloakBrowser │  Tarn-Chromium    │                │
│  │  │   (npm)      │  Anti-Bot, Proxy  │                │
│  │  └──────────────┘                   │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## Wie es funktioniert

### Phase 1 — Suche mit SearXNG

Docker-Container auf `localhost:8080`. Metasuchmaschine, die gleichzeitig Google, Wikipedia, Bing, DuckDuckGo und viele andere abfragt. JSON-Ausgabe mit Titeln, Ausschnitten und URLs.

**Beispiel:**

```bash
curl -s "http://localhost:8080/search?format=json&q=largest+llm+benchmark+2026"
```

Der Agent hat nun eine Liste von zu besuchenden URLs und entscheidet autonom, ob er sie mit Camofox oder CloakBrowser basierend auf der Website durchsucht.

### Phase 2 — Browsen mit Camofox

Docker-Container auf `localhost:9377`. Stellt einen vollständigen Firefox-Browser über eine REST-API bereit. Der Agent kann Tabs erstellen, navigieren, klicken, scrollen, beliebiges JavaScript ausführen und Daten strukturieren.

**Enthalten:** Mozillas Readability.js zum Extrahieren sauberer Artikel, Entfernen von Navigation, Seitenleiste und Werbung (~70% Token-Ersparnis).

**Hauptbefehle:**

```bash
# Tab erstellen und navigieren
curl -s -X POST "http://localhost:9377/tabs" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bot","url":"https://example.com"}'

# Snapshot lesen (Barrierefreiheitsbaum)
curl -s "http://localhost:9377/tabs/<tabId>/snapshot?userId=bot"

# JavaScript ausführen
curl -s -X POST "http://localhost:9377/tabs/<tabId>/evaluate" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CAMOFOX_API_KEY" \
  -d '{"userId":"bot","expression":"document.title"}'
```

### Phase 3 — Browsen mit CloakBrowser (wenn Camofox nicht ausreicht)

npm-Paket basierend auf Playwright + `cloakbrowser`. Startet einen Chromium-Browser mit erweiterter Fingerabdruckerkennung, um Cloudflare, Akamai, DataDome und andere Anti-Bot-Systeme zu umgehen. Automatische Erkennung von Herausforderungen mit Warte- und Wiederholungsfunktion.

**Verfügbare Skripte:**

- `cloak-fetch.mjs` — universeller Fetch mit Herausforderungserkennung
- `cloak-script.mjs` — benutzerdefinierte Playwright-Skriptausführung

**Beispiel:**

```bash
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com"
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com" --proxy socks5://... --geoip
```

## Warum sowohl Camofox als auch CloakBrowser?

Weil Geschwindigkeit und Tarnung ein Kompromiss sind und das richtige Werkzeug von der Website abhängt.

**Camofox — schnell, strukturiert, persistent.**
Camofox kapselt Camoufox (einen C++-basierten Firefox-Fork) in eine REST-API mit einem immer warmen Browser. Nach einem Kaltstart von ~1-3s ist jede Anfrage nahezu sofort. Seine Barrierefreiheits-Snapshots sind ~90% kleiner als rohes HTML, mit stabilen Elementreferenzen (e1, e2, ...) für zuverlässige Interaktion. Es bewältigt ~90% der Websites, die keine erweiterte Anti-Bot-Schutz verwenden: Artikel, Dokumente, Suchmaschinen, Standard-Webseiten.

**CloakBrowser — Tarnung, Anti-Bot, auf Abruf.**
CloakBrowser startet eine neue Chromium-Instanz pro Anfrage (~1-3s Startzeit jedes Mal). Es verwendet erweiterte Fingerabdruckerkennung, Proxy-Unterstützung, GeoIP und automatische Herausforderungserkennung, um Cloudflare, Akamai, DataDome, Imperva, PerimeterX und DDoS-Guard zu umgehen. Es ist die letzte Ressource für die ~10% der Websites, die Camofox blockieren.

**Zahlen aus der Praxis:**

| Werkzeug | Cloudflare Standard | Cloudflare Turnstile | DataDome |
|---|---|---|---|
| **Camoufox** (Camofox-Engine) | bis zu **~92%** [¹] | **~65-78%** [¹] | **60-75%** [¹] |
| **Playwright Stealth** | ~70-80% [¹] | ~40-55% [¹] | ~30-50% [¹] |

- **CloakBrowser** wendet **58 C++-Quellcode-Patches** an und erreicht **0.9 reCAPTCHA v3** (menschliches Niveau, serververifiziert), bestehend alle wichtigen Anti-Bot-Tests einschließlich Cloudflare Turnstile und FingerprintJS [²]
- **Camofox** Kaltstart: **~1-3s** (einmalig, dann ~0ms pro Anfrage über warme REST-API) [³]
- **Playwright/Chromium** Kaltstart: **~0.5-6s** (jeder Start, variiert je nach Umgebung) [⁴]

Camofox bewältigt den schnellen Pfad. CloakBrowser bewältigt die Grenzfälle. Zusammen decken sie das gesamte Web ohne Lücken ab. Der Agent entscheidet, welches verwendet wird.

### Quellen

¹ "Camoufox Vs Playwright Stealth: Complete Comparison & Alternatives (2026)" — [blog.send.win](https://blog.send.win/camoufox-vs-playwright-stealth-complete-comparison-alternatives-2026/)
² CloakBrowser README — [github.com/cloakhq/cloakbrowser](https://github.com/cloakhq/cloakbrowser)
³ camoufox-pi README (cold start comparison) — [github.com/MonsieurBarti/camoufox-pi](https://github.com/MonsieurBarti/camoufox-pi)
⁴ Playwright issue #4345 (launch time variability) — [github.com/microsoft/playwright/issues/4345](https://github.com/microsoft/playwright/issues/4345)

## Installation

```bash
git clone https://github.com/johell1ns/browser-search
cd browser-search
npm install
```

Zeigen Sie dieses README Ihrem KI-Agenten für eine vollständige, auf Ihre Umgebung und Plattform zugeschnittene Installation.

**Diensteübersicht:**

| Dienst | Wie | Referenz |
|---|---|---|
| SearXNG | Docker, `:8080` | [docs.searxng.org](https://docs.searxng.org/admin/installation-docker.html) |
| Camofox | Docker, `:9377` | [github.com/jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser) |
| CloakBrowser | npm (enthalten) | `scripts/cloak/cloak-fetch.mjs` |

**Für den KI-Agenten — lesen Sie diese Dateien:**

| Datei | Was sie enthält |
|---|---|
| `SKILL.md` | Vollständige Skill: Befehle, Eskalation, Fehlerbehebung |
| `scripts/cloak/cloak-fetch.mjs` | CloakBrowser CLI-Nutzung und alle Optionen |
| `scripts/setup-dependencies.sh` | Systemabhängigkeiten |
| `scripts/check-browser-search.sh` | Überprüfung nach der Installation |
| `docker/setup.md` | Docker-Einrichtungstipps |

**Hinweis:** `SKILL.md` ist für die **OpenCode**-Syntax (`exec`, `curl`) geschrieben. Wenn Ihr Agent ein anderes Format verwendet (Claude Code, Cursor, etc.), lesen Sie sie und konvertieren Sie die Befehle in die Syntax Ihres Agenten, bevor Sie die Skill verwenden.

## Umgebungsvariablen

| Variable | Erforderlich für | Standard |
|---|---|---|
| `CAMOFOX_API_KEY` | evaluate, session, cleanup in Camofox | — |
| `CAMOFOX_ADMIN_KEY` | Camofox stop-Endpunkt | — |

## Was diese Skill NICHT tut

- **Soziale Medien.** Instagram, Facebook, TikTok, LinkedIn und Twitter/X erfordern eine Anmeldung. `browser-search` versucht nicht, sie zu durchsuchen.
- **Dateien herunterladen.** Es ist schreibgeschützt (außer bei expliziten Screenshots).
- **Paywalls umgehen.** Umgeht keine Zahlungs- oder Anmeldesysteme.

## Mitmachen

browser-search ist Open Source und kostenlos. Wenn Sie es nützlich finden:

- ⭐ **Star das Repository** — hilft anderen, es zu entdecken
- 🐛 **Öffne ein Issue** — melde Fehler oder schlage Funktionen vor
- 🔀 **Sende eine PR** — korrigiere, verbessere, erweitere
- 💬 **Teile es** — mit deinem Team, auf Reddit, Twitter, Discord
- 🧠 **Passe es an** — forke es, passe die SKILL.md an, mach es zu deinem

Jeder Beitrag, egal wie klein, macht dies besser.

## Lizenz

MIT
