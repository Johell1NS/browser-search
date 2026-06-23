# browser-search

<p align="center">
  <img src="../img/logoLarge-browser-search.png" alt="browser-search logo" width="80%">
</p>

> **Une skill pour les agents IA.** OpenCode, Claude Code, Cursor, OpenClaw et bien d'autres. Recherchez sur le web avec SearXNG, naviguez avec Camofox, contournez les protections avec CloakBrowser. Le tout auto-hébergé, gratuit, illimité.

## Pourquoi ça existe

browser-search est une SKILL — un ensemble d'instructions pour des agents IA comme OpenCode, Claude Code, Cursor, OpenClaw et autres. Elle apprend à votre agent comment rechercher et naviguer sur le web en utilisant trois outils open source orchestrés.

Le problème ? Le web est hostile à l'automatisation. Cloudflare, Akamai, DataDome et d'autres systèmes anti-bot bloquent les requêtes simples. Les sites modernes utilisent du JavaScript lourd, du chargement différé et du rendu côté client. Une seule solution ne suffit pas.

`browser-search` orchestre **trois outils open source** en un seul système de recherche et de navigation conçu pour les agents IA. Chaque outil a son rôle, orchestré par la skill avec une logique d'escalade, une sélection automatique et une intégration prête à l'emploi :

1. **[SearXNG](https://github.com/searxng/searxng)** — métamoteur de recherche pour la phase de recherche (multisource, JSON)
2. **[Camofox](https://github.com/jo-inc/camofox-browser)** — navigateur accessible via API REST pour les sites standards
3. **[CloakBrowser](https://github.com/cloakhq/cloakbrowser)** — navigateur furtif pour les sites protégés anti-bot

Le flux typique : l'agent recherche d'abord avec SearXNG, puis navigue dans les résultats avec Camofox (ou CloakBrowser si le site est protégé).

## Avantages

- **100% gratuit, auto-hébergé, illimité.** Pas de clés API à acheter, pas d'abonnements, pas de limites de débit. Tout fonctionne sur votre machine, Docker et npm. Utilisation illimitée, coût zéro.

- **Léger, fonctionne partout.** Construit et testé sur un Raspberry Pi — si ça fonctionne là, ça fonctionne partout. Consommation de ressources minimale, pas d'infrastructure lourde nécessaire, fonctionne 24h/24 et 7j/7 sur du matériel basse consommation.

- **Recherche + navigation dans un seul kit.** Pas d'intégration manuelle nécessaire. La recherche et la navigation sont deux phases distinctes, toutes deux couvertes.

- **Escalade automatique de navigation.** Si Camofox est bloqué par Cloudflare/Akamai, l'agent bascule automatiquement vers CloakBrowser.

- **Performances intelligentes.** SearXNG pour la phase de recherche (millisecondes). Camofox et CloakBrowser ne sont utilisés que pour naviguer sur les sites qui en ont réellement besoin.

- **Choix automatique de l'agent.** L'agent IA décide quel outil utiliser : SearXNG pour la recherche initiale, Camofox pour la navigation, CloakBrowser si le site est protégé. Intervention humaine zéro.

- **Mode de recherche approfondie.** La skill ordonne à l'agent d'aller au-delà des réponses superficielles : explorer plusieurs angles, vérifier les sources de manière croisée, couvrir tous les aspects et ne jamais prendre de raccourcis.

- **Entièrement personnalisable.** Le SKILL.md est en texte brut. Vous pouvez modifier les règles principales, ajouter les vôtres, supprimer ce dont vous n'avez pas besoin. Adaptez-le à votre flux de travail, votre équipe, vos standards.

- **Furtivité native.** CloakBrowser détecte automatiquement les défis Cloudflare, Akamai, DataDome, Imperva, PerimeterX et DDoS-Guard, et attend leur résolution avant d'extraire le contenu.

- **Fonctionne avec n'importe quel agent.** Le SKILL.md est écrit pour OpenCode, mais la logique est identique pour tout agent IA. Même README, même package.json, tout fonctionne partout. Demandez simplement à votre agent de convertir la skill pour son environnement.

## 🏆 État de l'art

Ces trois outils ont été choisis parce qu'ils représentent l'état de l'art actuel disponible aujourd'hui. Une skill comme celle-ci est conçue pour évoluer : lorsque de meilleurs outils émergent, il suffit de mettre à jour la SKILL.md pour les remplacer. 🔄

⭐ **Mettez une étoile au dépôt et suivez** pour rester informé des nouveaux outils, des améliorations de flux et des mises à jour d'orchestration. 🚀

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    browser-search                        │
│                                                         │
│  ┌──────────────┐                                       │
│  │  Recherche   │                                       │
│  │               │                                       │
│  │  SearXNG      │  moteurs de recherche → URLs         │
│  │  (Docker)     │  résultats JSON, rapide              │
│  │  :8080        │                                       │
│  └──────────────┘                                       │
│         │                                                │
│         │ résultats prêts → naviguer                     │
│         ↓                                                │
│  ┌─────────────────────────────────────┐                │
│  │          Navigation                  │                │
│  │                                      │                │
│  │  ┌──────────────┐                   │                │
│  │  │   Camofox    │  navigateur + REST│                │
│  │  │  (Docker)    │  JS, clic, eval   │                │
│  │  │  :9377       │                   │                │
│  │  └──────┬───────┘                   │                │
│  │         │                           │                │
│  │         │ si bloqué                 │                │
│  │         ↓                           │                │
│  │  ┌──────────────┐                   │                │
│  │  │ CloakBrowser │  Chromium furtif  │                │
│  │  │   (npm)      │  anti-bot, proxy  │                │
│  │  └──────────────┘                   │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## Comment ça fonctionne

### Phase 1 — Recherche avec SearXNG

Conteneur Docker sur `localhost:8080`. Métamoteur qui interroge Google, Wikipedia, Bing, DuckDuckGo et bien d'autres simultanément. Sortie JSON avec titres, extraits et URLs.

**Exemple :**

```bash
curl -s "http://localhost:8080/search?format=json&q=largest+llm+benchmark+2026"
```

L'agent a maintenant une liste d'URLs à visiter et décide de manière autonome s'il doit les naviguer avec Camofox ou CloakBrowser en fonction du site.

### Phase 2 — Navigation avec Camofox

Conteneur Docker sur `localhost:9377`. Expose un navigateur Firefox complet via une API REST. L'agent peut créer des onglets, naviguer, cliquer, faire défiler, exécuter du JavaScript arbitraire et structurer des données.

**Inclut :** Readability.js de Mozilla pour extraire des articles propres, supprimant la navigation, la barre latérale et les publicités (~70% d'économies de tokens).

**Commandes principales :**

```bash
# Créer un onglet et naviguer
curl -s -X POST "http://localhost:9377/tabs" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bot","url":"https://example.com"}'

# Lire un instantané (arbre d'accessibilité)
curl -s "http://localhost:9377/tabs/<tabId>/snapshot?userId=bot"

# Exécuter du JavaScript
curl -s -X POST "http://localhost:9377/tabs/<tabId>/evaluate" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CAMOFOX_API_KEY" \
  -d '{"userId":"bot","expression":"document.title"}'
```

### Phase 3 — Navigation avec CloakBrowser (quand Camofox ne suffit pas)

Paquet npm basé sur Playwright + `cloakbrowser`. Lance un navigateur Chromium avec des empreintes numériques avancées pour contourner Cloudflare, Akamai, DataDome et autres systèmes anti-bot. Détection automatique des défis avec attente et nouvelle tentative.

**Scripts disponibles :**

- `cloak-fetch.mjs` — fetch universel avec détection de défi
- `cloak-script.mjs` — exécution de script Playwright personnalisé

**Exemple :**

```bash
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com"
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com" --proxy socks5://... --geoip
```

## Pourquoi à la fois Camofox et CloakBrowser ?

Parce que la vitesse et la furtivité sont un compromis, et l'outil approprié dépend du site.

**Camofox — rapide, structuré, persistant.**
Camofox encapsule Camoufox (un fork de Firefox au niveau C++) dans une API REST avec un navigateur toujours chaud. Après un démarrage à froid de ~1-3s, chaque requête est quasi-instantanée. Ses instantanés d'accessibilité sont ~90% plus petits que le HTML brut, avec des références d'éléments stables (e1, e2, ...) pour une interaction fiable. Il gère ~90% des sites qui n'utilisent pas de protection anti-bot avancée : articles, documents, moteurs de recherche, pages web standard.

**CloakBrowser — furtif, anti-bot, à la demande.**
CloakBrowser lance une nouvelle instance Chromium par requête (~1-3s de démarrage à chaque fois). Il utilise des empreintes numériques avancées, le support proxy, le geoip et la détection automatique des défis pour contourner Cloudflare, Akamai, DataDome, Imperva, PerimeterX et DDoS-Guard. C'est le dernier recours pour les ~10% de sites qui bloquent Camofox.

**Chiffres réels :**

| Outil | Cloudflare standard | Cloudflare Turnstile | DataDome |
|---|---|---|---|
| **Camoufox** (moteur Camofox) | jusqu'à **~92%** [¹] | **~65-78%** [¹] | **60-75%** [¹] |
| **Playwright Stealth** | ~70-80% [¹] | ~40-55% [¹] | ~30-50% [¹] |

- **CloakBrowser** applique **58 correctifs au niveau du code source C++** et obtient un score **0.9 reCAPTCHA v3** (niveau humain, vérifié par le serveur), réussissant tous les principaux tests anti-bot, y compris Cloudflare Turnstile et FingerprintJS [²]
- **Camofox** démarrage à froid : **~1-3s** (une fois, puis ~0ms par requête via API REST chaude) [³]
- **Playwright/Chromium** démarrage à froid : **~0.5-6s** (chaque lancement, varie selon l'environnement) [⁴]

Camofox gère la voie rapide. CloakBrowser gère les cas extrêmes. Ensemble, ils couvrent tout le web sans lacunes. L'agent décide lequel utiliser.

### Sources

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

Montrez ce README à votre agent IA pour une installation complète adaptée à votre environnement et votre plateforme.

**Aperçu des services :**

| Service | Comment | Référence |
|---|---|---|
| SearXNG | Docker, `:8080` | [docs.searxng.org](https://docs.searxng.org/admin/installation-docker.html) |
| Camofox | Docker, `:9377` | [github.com/jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser) |
| CloakBrowser | npm (inclus) | `scripts/cloak/cloak-fetch.mjs` |

**Pour l'agent IA — lisez ces fichiers :**

| Fichier | Ce qu'il contient |
|---|---|
| `SKILL.md` | Skill complète : commandes, escalade, dépannage |
| `scripts/cloak/cloak-fetch.mjs` | Utilisation de la CLI CloakBrowser et toutes les options |
| `scripts/setup-dependencies.sh` | Dépendances système |
| `scripts/check-browser-search.sh` | Vérification post-installation |
| `docker/setup.md` | Conseils de configuration Docker |

**Remarque :** `SKILL.md` est écrite pour la syntaxe **OpenCode** (`exec`, `curl`). Si votre agent utilise un format différent (Claude Code, Cursor, etc.), lisez-la et convertissez les commandes dans la syntaxe de votre agent avant d'utiliser la skill.

## Variables d'environnement

| Variable | Requise pour | Défaut |
|---|---|---|
| `CAMOFOX_API_KEY` | evaluate, session, cleanup dans Camofox | — |
| `CAMOFOX_ADMIN_KEY` | Point d'arrêt stop de Camofox | — |

## Ce que cette skill NE fait PAS

- **Réseaux sociaux.** Instagram, Facebook, TikTok, LinkedIn et Twitter/X nécessitent une connexion. `browser-search` ne tente pas de les naviguer.
- **Télécharger des fichiers.** Il est en lecture seule (sauf captures d'écran explicites).
- **Contourner les paywalls.** Ne contourne pas les systèmes de paiement ou de connexion.

## Participer

browser-search est open source et gratuit. Si vous le trouvez utile :

- ⭐ **Mettez une étoile au dépôt** — aide d'autres à le découvrir
- 🐛 **Ouvrez une issue** — signalez des bugs ou suggérez des fonctionnalités
- 🔀 **Soumettez une PR** — corrigez, améliorez, étendez
- 💬 **Partagez-le** — avec votre équipe, sur Reddit, Twitter, Discord
- 🧠 **Adaptez-le** — fork, ajustez le SKILL.md, faites-le vôtre

Chaque contribution, aussi petite soit-elle, rend ce projet meilleur.

## Licence

MIT
