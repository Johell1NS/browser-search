# browser-search

<p align="center">
  <img src="../img/logoLarge-browser-search.png" alt="browser-search logo" width="80%">
</p>

> **Une skill pour les agents IA.** OpenCode, Claude Code, Cursor, OpenClaw et bien d'autres. Recherchez sur le web avec SearXNG, naviguez avec Camofox, contournez les protections avec CloakBrowser. **Anti-hallucination par conception.** Le tout auto-hébergé, gratuit, illimité.

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

- **Anti-hallucination par conception.** Le mode de recherche approfondie de la skill impose un flux "cherche d'abord, réponds ensuite" : l'agent doit vérifier chaque affirmation factuelle contre des sources web en direct, recouper plusieurs sources et ne jamais deviner. Plus de réponses inventées.

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
node scripts/searxng/searxng.mjs search "largest llm benchmark 2026"
```

L'agent a maintenant une liste d'URLs à visiter et décide de manière autonome s'il doit les naviguer avec Camofox ou CloakBrowser en fonction du site.

### Phase 2 — Navigation avec Camofox

Conteneur Docker sur `localhost:9377`. Expose un navigateur Firefox complet via une API REST. L'agent peut créer des onglets, naviguer, cliquer, faire défiler, exécuter du JavaScript arbitraire et structurer des données.

**Inclut :** Readability.js de Mozilla pour extraire des articles propres, supprimant la navigation, la barre latérale et les publicités (~70% d'économies de tokens).

**Commandes principales :**

```bash
# Single-URL extraction (Readability.js, auto-fallback to snapshot)
node scripts/camofox/camofox.mjs readability "https://example.com"

# JavaScript evaluation
node scripts/camofox/camofox.mjs evaluate "https://example.com" "document.title"

# Accessibility snapshot
node scripts/camofox/camofox.mjs snapshot "https://example.com"
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

### Étape 1 — Installer la skill

Installez la définition de la skill dans votre agent IA avec une seule commande :

```bash
npx skills add Johell1NS/browser-search
```

Fonctionne avec plus de 70 agents IA, dont OpenCode, Claude Code, Cursor, GitHub Copilot et plus encore.

### Étape 2 — Configurer l'infrastructure

```bash
git clone https://github.com/Johell1NS/browser-search
cd browser-search
npm install
```

CloakBrowser est installé via npm. SearXNG et Camofox nécessitent des conteneurs Docker séparés — assurez-vous qu'ils soient en cours d'exécution avant d'utiliser la skill.

Montrez ce README à votre agent IA pour une installation complète adaptée à votre environnement et votre plateforme.

browser-search ne fournit pas de fichiers docker-compose ni de scripts d'installation spécifiques à une plateforme. Votre agent IA lit les références ci-dessous et adapte automatiquement la configuration à votre système d'exploitation, architecture et environnement.

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
| `scripts/setup.sh` | Dépendances système |
| `scripts/check.sh` | Vérification post-installation |
| `docker/setup.md` | Conseils de configuration Docker |

**Remarque :** `SKILL.md` est écrite pour la syntaxe **OpenCode** (`exec`, `node scripts`). Si votre agent utilise un format différent (Claude Code, Cursor, etc.), lisez-la et convertissez les commandes dans la syntaxe de votre agent avant d'utiliser la skill.

## Variables d'environnement

| Variable | Requise pour | Défaut |
|---|---|---|
| `CAMOFOX_API_KEY` | evaluate, session, cleanup dans Camofox | — |
| `CAMOFOX_ADMIN_KEY` | Point d'arrêt stop de Camofox | — |

## Ce que cette skill NE fait PAS

- **Réseaux sociaux.** Instagram, Facebook, TikTok, LinkedIn et Twitter/X nécessitent une connexion. `browser-search` ne tente pas de les naviguer.
- **Télécharger des fichiers.** Il est en lecture seule (sauf captures d'écran explicites).
- **Contourner les paywalls.** Ne contourne pas les systèmes de paiement ou de connexion.

## Sécurité

browser-search comprend plusieurs couches de durcissement de la sécurité :

### Protections intégrées

- **Prévention SSRF.** Les URLs sont validées avant la navigation — les IP internes (`127.x`, `10.x`, `192.168.x`, `169.254.x`), les points de terminaison de métadonnées cloud et les TLD `.internal`/`.local` sont bloqués. La résolution DNS est également vérifiée pour prévenir les attaques de DNS rebinding.
- **Sandbox de scripts.** Les scripts personnalisés (`cloak-script.mjs`) s'exécutent dans une sandbox qui restreint la surface API de Playwright (seules les méthodes autorisées sur `page`, `browser`, `context` sont accessibles). Note : les API Node.js restent disponibles — pour un isolement complet, un `vm.Context` serait nécessaire. Utilisez `--unsafe` pour contourner la sandbox et la protection SSRF.
- **Protection contre le path traversal.** Les chemins `--script` doivent se trouver dans le répertoire de la skill. Les chemins absolus et la traversée `../` sont bloqués.
- **Rate limiting.** 30 requêtes/minute par défaut pour éviter les DoS accidentels ou le déclenchement anti-bot (utilisez `--no-rate-limit` pour désactiver).
- **Noms de fichiers sécurisés.** Les captures d'écran utilisent des UUID aléatoires au lieu d'horodatages prévisibles.
- **Suppression des stack traces.** La sortie d'erreur omet les stack traces par défaut. Utilisez `--verbose` pour le débogage.

### Bonnes pratiques

- **Clés API.** Utilisez des variables d'environnement (`$CAMOFOX_API_KEY`) ou `--env-file` pour Docker. Ne collez jamais les clés sur la ligne de commande — elles apparaissent dans `ps aux` et l'historique du shell.
- **Liaison Docker.** Utilisez toujours le préfixe `127.0.0.1:` pour le mappage de ports (`-p 127.0.0.1:9377:9377`). N'exposez jamais sur `0.0.0.0`.
- **Encodage URL.** Les scripts déterministes gèrent l'encodage en interne. Aucun échappement manuel nécessaire.
- **Épinglage de versions.** Les dépendances utilisent des versions exactes (pas de plages `^`) et `package-lock.json` pour des builds reproductibles.

### Audit

Exécutez `bash scripts/audit.sh` pour vérifier la posture de sécurité de votre installation.

### Risques résiduels

- **Injection de prompt.** Un agent IA peut être amené à effectuer des actions nuisibles. Les outils atténuent les dégâts mais ne peuvent pas empêcher un agent complètement compromis.
- **Supply chain.** CloakBrowser télécharge un binaire Chromium depuis `cloakbrowser.dev`. Le binaire est vérifié par SHA-256 mais est propriétaire.
- **Automatisation du navigateur.** Tout outil avec accès au navigateur comporte des risques inhérents. Exécutez dans des environnements isolés lorsque c'est possible.

## Participer

browser-search est open source et gratuit. Si vous le trouvez utile :

- ⭐ **Mettez une étoile au dépôt** — aide d'autres à le découvrir
- 🐛 **Ouvrez une issue** — signalez des bugs ou suggérez des fonctionnalités
- 🔀 **Soumettez une PR** — corrigez, améliorez, étendez
- 💬 **Partagez-le** — avec votre équipe, sur Reddit, Twitter, Discord
- 🧠 **Adaptez-le** — fork, ajustez le SKILL.md, faites-le vôtre

Chaque contribution, aussi petite soit-elle, rend ce projet meilleur.

## FAQ

Consultez [FAQ.md](../FAQ.md) pour les questions fréquentes sur l'installation, l'architecture, les choix de conception et les problèmes courants.

## Licence

MIT
