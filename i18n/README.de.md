# browser-search

<p align="center">
  <img src="../img/logoLarge-browser-search.png" alt="browser-search logo" width="80%">
</p>

> **Eine Skill für KI-Agenten.** OpenCode, Claude Code, Cursor, OpenClaw und mehr. Durchsuchen Sie das Web mit SearXNG, browsen Sie mit Camofox, umgehen Sie Schutzmaßnahmen mit CloakBrowser. **Anti-Halluzination durch Design.** Alles selbst gehostet, kostenlos, unbegrenzt.

## Warum es existiert

browser-search ist eine **SKILL** — ein Anweisungssatz für KI-Agenten wie OpenCode, Claude Code, Cursor, OpenClaw und andere. Sie bringt Ihrem Agenten bei, wie er mit drei orchestrierten Open-Source-Tools das Web durchsuchen und browsen kann.

Heute ist ein KI-Agent, der das Web durchsuchen will, wie ein **Dieb mit Sturmhaube**, der sich in einer Polizeiakademie herumtreibt. Die Seitenschutzmaßnahmen blockieren ihn, fordern ihn heraus, weisen ihn ab.

👮 browser-search dreht die Situation um: Ihr Agent ist nicht mehr der Dieb, sondern wird zum **Polizeichef**. Keine unbeholfenen Zugriffsversuche mehr. Er geht durch jede Tür, weil er die richtigen Werkzeuge hat. SearXNG zum Suchen, Camofox zum Browsen, CloakBrowser wenn es hart auf hart kommt.

Die Skill erzwingt die ausschließliche Verwendung deterministischer Skripte. Dies **beseitigt Modellhalluzinationen**, selbst bei den günstigsten Modellen. Die 3 Werkzeuge werden in natürlicher Sprache beschrieben, aber die Ausführung ist starr: Das Modell kann weder den Befehl falsch eingeben noch die Ausgabe falsch interpretieren. Das Ergebnis ist **garantierter Erfolg bei jeder Abfrage** — die Skill und ihre deterministischen Skripte führen das Modell an, das Web zu durchkämmen, bis es die Antwort findet.

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

- **Anti-Halluzination durch Design.** Der Tiefenrecherche-Modus der Skill erzwingt einen "erst suchen, dann antworten"-Workflow: der Agent muss jede Tatsachenbehauptung anhand von Live-Webquellen überprüfen, mehrere Quellen kreuzreferenzieren und niemals raten. Keine erfundenen Antworten mehr.

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
node scripts/searxng/searxng.mjs search "largest llm benchmark 2026"
```

Der Agent hat nun eine Liste von zu besuchenden URLs und entscheidet autonom, ob er sie mit Camofox oder CloakBrowser basierend auf der Website durchsucht.

### Phase 2 — Browsen mit Camofox

Docker-Container auf `localhost:9377`. Stellt einen vollständigen Firefox-Browser über eine REST-API bereit. Der Agent kann Tabs erstellen, navigieren, klicken, scrollen, beliebiges JavaScript ausführen und Daten strukturieren.

**Enthalten:** Mozillas Readability.js zum Extrahieren sauberer Artikel, Entfernen von Navigation, Seitenleiste und Werbung (~70% Token-Ersparnis).

**Hauptbefehle:**

```bash
# Single-URL extraction (Readability.js, auto-fallback to snapshot)
node scripts/camofox/camofox.mjs readability "https://example.com"

# JavaScript evaluation
node scripts/camofox/camofox.mjs evaluate "https://example.com" "document.title"

# Accessibility snapshot
node scripts/camofox/camofox.mjs snapshot "https://example.com"
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

# Markdown output (requires: pip install markitdown)
node scripts/cloak/cloak-fetch.mjs "https://example.com" --format markdown
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

### Schritt 1 — Skill installieren

Installieren Sie die Skill-Definition mit einem einzigen Befehl in Ihren KI-Agenten:

```bash
npx skills add Johell1NS/browser-search
```

Funktioniert mit über 70 KI-Agenten, darunter OpenCode, Claude Code, Cursor, GitHub Copilot und mehr.

### Schritt 2 — Infrastruktur einrichten

```bash
git clone https://github.com/Johell1NS/browser-search
cd browser-search
npm install
```

CloakBrowser wird per npm installiert. SearXNG und Camofox benötigen separate Docker-Container — stelle sicher, dass sie laufen, bevor du die Skill verwendest.

Zeigen Sie dieses README Ihrem KI-Agenten für eine vollständige, auf Ihre Umgebung und Plattform zugeschnittene Installation.

browser-search stellt keine plattformspezifischen docker-compose-Dateien oder Installationsskripte bereit. Dein KI-Agent liest die folgenden Referenzen und passt das Setup automatisch an dein Betriebssystem, deine Architektur und Umgebung an.

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
| `scripts/setup.sh` | Systemabhängigkeiten |
| `scripts/check.sh` | Überprüfung nach der Installation |
| `docker/setup.md` | Docker-Einrichtungstipps |

**Hinweis:** `SKILL.md` ist für die **OpenCode**-Syntax (`exec`, `node scripts`) geschrieben. Wenn Ihr Agent ein anderes Format verwendet (Claude Code, Cursor, etc.), lesen Sie sie und konvertieren Sie die Befehle in die Syntax Ihres Agenten, bevor Sie die Skill verwenden.

## Umgebungsvariablen

| Variable | Erforderlich für | Standard |
|---|---|---|
| `CAMOFOX_API_KEY` | evaluate, session, cleanup in Camofox | — |
| `CAMOFOX_ADMIN_KEY` | Camofox stop-Endpunkt | — |

## Was diese Skill NICHT tut

- **Soziale Medien.** Instagram, Facebook, TikTok, LinkedIn und Twitter/X erfordern eine Anmeldung. `browser-search` versucht nicht, sie zu durchsuchen.
- **Dateien herunterladen.** Es ist schreibgeschützt (außer bei expliziten Screenshots).
- **Paywalls umgehen.** Umgeht keine Zahlungs- oder Anmeldesysteme.

## Sicherheit

browser-search enthält mehrere Sicherheitsschichten:

### Integrierte Schutzmaßnahmen

- **SSRF-Prävention.** URLs werden vor der Navigation validiert — interne IPs (`127.x`, `10.x`, `192.168.x`, `169.254.x`), Cloud-Metadaten-Endpunkte und `.internal`/`.local` TLDs werden blockiert. Die DNS-Auflösung wird ebenfalls überprüft, um DNS-Rebinding-Angriffe zu verhindern.
- **Skript-Sandbox.** Benutzerdefinierte Skripte (`cloak-script.mjs`) laufen in einer Sandbox, die die Playwright-API-Oberfläche einschränkt (nur zugelassene Methoden auf `page`, `browser`, `context` sind zugänglich). Hinweis: Node.js-APIs bleiben verfügbar — für vollständige Isolation wäre ein `vm.Context` erforderlich. Verwende `--unsafe`, um die Sandbox und den SSRF-Schutz zu umgehen.
- **Path-Traversal-Schutz.** `--script`-Pfade müssen innerhalb des Skill-Verzeichnisses liegen. Absolute Pfade und `../`-Traversierung werden blockiert.
- **Rate Limiting.** 30 Anfragen/Minute standardmäßig, um versehentliche DoS-Angriffe oder Anti-Bot-Auslösung zu verhindern (verwende `--no-rate-limit` zum Deaktivieren).
- **Sichere Dateinamen.** Screenshots verwenden zufällige UUIDs anstelle von vorhersagbaren Zeitstempeln.
- **Stack-Trace-Unterdrückung.** Die Fehlerausgabe enthält standardmäßig keine Stack-Traces. Verwende `--verbose` zum Debuggen.

### Bewährte Praktiken

- **API-Schlüssel.** Verwende Umgebungsvariablen (`$CAMOFOX_API_KEY`) oder `--env-file` für Docker. Füge Schlüssel niemals in der Befehlszeile ein — sie erscheinen in `ps aux` und im Shell-Verlauf.
- **Docker-Bindung.** Verwende immer das Präfix `127.0.0.1:` für das Port-Mapping (`-p 127.0.0.1:9377:9377`). Niemals auf `0.0.0.0` exponieren.
- **URL-Kodierung.** Deterministische Skripte behandeln die Codierung intern. Kein manuelles Escaping nötig.
- **Version-Pinning.** Abhängigkeiten verwenden exakte Versionen (keine `^`-Bereiche) und `package-lock.json` für reproduzierbare Builds.

### Audit

Führe `bash scripts/audit.sh` aus, um die Sicherheitslage deiner Installation zu überprüfen.

### Restrisiken

- **Prompt-Injection.** Ein KI-Agent kann zu schädlichen Aktionen verleitet werden. Die Werkzeuge mildern Schäden, können aber einen vollständig kompromittierten Agenten nicht verhindern.
- **Supply Chain.** CloakBrowser lädt ein Chromium-Binary von `cloakbrowser.dev` herunter. Das Binary wird per SHA-256 verifiziert, ist aber proprietär.
- **Browser-Automation.** Jedes Tool mit Browserzugriff birgt inhärente Risiken. Führe es nach Möglichkeit in isolierten Umgebungen aus.

## Mitmachen

browser-search ist Open Source und kostenlos. Wenn Sie es nützlich finden:

- ⭐ **Star das Repository** — hilft anderen, es zu entdecken
- 🐛 **Öffne ein Issue** — melde Fehler oder schlage Funktionen vor
- 🔀 **Sende eine PR** — korrigiere, verbessere, erweitere
- 💬 **Teile es** — mit deinem Team, auf Reddit, Twitter, Discord
- 🧠 **Passe es an** — forke es, passe die SKILL.md an, mach es zu deinem

Jeder Beitrag, egal wie klein, macht dies besser.

## FAQ

Siehe [FAQ.md](../FAQ.md) für häufig gestellte Fragen zu Installation, Architektur, Entwurfsentscheidungen und häufigen Problemen.

## Lizenz

MIT
