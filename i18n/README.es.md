# browser-search

<p align="center">
  <img src="../img/logoLarge-browser-search.png" alt="browser-search logo" width="80%">
</p>

> **Una skill para agentes de IA.** OpenCode, Claude Code, Cursor, OpenClaw y más. Busca en la web con SearXNG, navega con Camofox, evade protecciones con CloakBrowser. Todo autoalojado, gratuito, sin límites.

## Por qué existe

browser-search es una SKILL — un conjunto de instrucciones para agentes de IA como OpenCode, Claude Code, Cursor, OpenClaw y otros. Enseña a tu agente cómo buscar y navegar por la web utilizando tres herramientas open source orquestadas.

¿El problema? La web es hostil a la automatización. Cloudflare, Akamai, DataDome y otros sistemas anti-bot bloquean las solicitudes simples. Los sitios modernos usan JavaScript pesado, carga diferida y renderizado del lado del cliente. Una sola solución no es suficiente.

`browser-search` orquesta **tres herramientas open source** en un único sistema de búsqueda y navegación diseñado para agentes de IA. Cada herramienta tiene su rol, orquestada por la skill con lógica de escalado, selección automática e integración lista para usar:

1. **[SearXNG](https://github.com/searxng/searxng)** — metabuscador para la fase de búsqueda (multifuente, JSON)
2. **[Camofox](https://github.com/jo-inc/camofox-browser)** — navegador accesible vía API REST para sitios estándar
3. **[CloakBrowser](https://github.com/cloakhq/cloakbrowser)** — navegador sigiloso para sitios protegidos contra bots

El flujo típico: el agente primero busca con SearXNG, luego navega los resultados con Camofox (o CloakBrowser si el sitio está protegido).

## Beneficios

- **100% gratuito, autoalojado, sin límites.** Sin claves API que comprar, sin suscripciones, sin límites de tasa. Todo se ejecuta en tu máquina, Docker y npm. Uso ilimitado, costo cero.

- **Ligero, funciona en cualquier lugar.** Construido y probado en una Raspberry Pi — si funciona allí, funciona en todas partes. Consumo mínimo de recursos, sin necesidad de infraestructura pesada, funciona 24/7 en hardware de bajo consumo.

- **Búsqueda + navegación en un solo kit.** Sin necesidad de integración manual. La búsqueda y la navegación son dos fases distintas, ambas cubiertas.

- **Escalado automático de navegación.** Si Camofox es bloqueado por Cloudflare/Akamai, el agente cambia automáticamente a CloakBrowser.

- **Rendimiento inteligente.** SearXNG para la fase de búsqueda (milisegundos). Camofox y CloakBrowser solo se usan para navegar los sitios que realmente lo necesitan.

- **Selección automática del agente.** El agente de IA decide qué herramienta usar: SearXNG para la búsqueda inicial, Camofox para navegar, CloakBrowser si el sitio está protegido. Cero intervención humana.

- **Modo de investigación profunda.** La skill instruye al agente para ir más allá de respuestas superficiales: explorar múltiples ángulos, verificar fuentes de forma cruzada, cubrir cada aspecto y nunca tomar atajos.

- **Totalmente personalizable.** La SKILL.md es texto plano. Puedes editar las reglas principales, añadir las tuyas, eliminar lo que no necesites. Adáptala a tu flujo de trabajo, tu equipo, tus estándares.

- **Sigilo nativo.** CloakBrowser detecta automáticamente los desafíos de Cloudflare, Akamai, DataDome, Imperva, PerimeterX y DDoS-Guard, y espera a que se resuelvan antes de extraer contenido.

- **Funciona con cualquier agente.** La SKILL.md está escrita para OpenCode, pero la lógica es idéntica para cualquier agente de IA. El mismo README, el mismo package.json, todo funciona en todas partes. Solo dile a tu agente que convierta la skill para su entorno.

## 🏆 Estado del arte

Estas tres herramientas fueron elegidas porque representan el estado del arte actual disponible hoy. Una skill como esta está diseñada para evolucionar: cuando surjan mejores herramientas, basta con actualizar la SKILL.md para reemplazarlas. 🔄

⭐ **Marca la estrella del repo y sigue** para mantenerte al día sobre nuevas herramientas, mejoras del flujo y actualizaciones de la orquestación. 🚀

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    browser-search                        │
│                                                         │
│  ┌──────────────┐                                       │
│  │   Búsqueda   │                                       │
│  │               │                                       │
│  │  SearXNG      │  motores de búsqueda → URLs          │
│  │  (Docker)     │  resultados JSON, rápido             │
│  │  :8080        │                                       │
│  └──────────────┘                                       │
│         │                                                │
│         │ resultados listos → navegar                    │
│         ↓                                                │
│  ┌─────────────────────────────────────┐                │
│  │          Navegación                  │                │
│  │                                      │                │
│  │  ┌──────────────┐                   │                │
│  │  │   Camofox    │  navegador + REST │                │
│  │  │  (Docker)    │  JS, clic, eval   │                │
│  │  │  :9377       │                   │                │
│  │  └──────┬───────┘                   │                │
│  │         │                           │                │
│  │         │ si está bloqueado         │                │
│  │         ↓                           │                │
│  │  ┌──────────────┐                   │                │
│  │  │ CloakBrowser │  Chromium sigiloso│                │
│  │  │   (npm)      │  anti-bot, proxy  │                │
│  │  └──────────────┘                   │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## Cómo funciona

### Fase 1 — Búsqueda con SearXNG

Contenedor Docker en `localhost:8080`. Metabuscador que consulta Google, Wikipedia, Bing, DuckDuckGo y muchos otros simultáneamente. Salida JSON con títulos, fragmentos y URLs.

**Ejemplo:**

```bash
curl -s "http://localhost:8080/search?format=json&q=largest+llm+benchmark+2026"
```

El agente ahora tiene una lista de URLs para visitar y decide autónomamente si navegarlas con Camofox o CloakBrowser según el sitio.

### Fase 2 — Navegación con Camofox

Contenedor Docker en `localhost:9377`. Expone un navegador Firefox completo a través de una API REST. El agente puede crear pestañas, navegar, hacer clic, desplazarse, ejecutar JavaScript arbitrario y estructurar datos.

**Incluye:** Readability.js de Mozilla para extraer artículos limpios, eliminando navegación, barra lateral y anuncios (~70% de ahorro de tokens).

**Comandos principales:**

```bash
# Crear pestaña y navegar
curl -s -X POST "http://localhost:9377/tabs" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bot","url":"https://example.com"}'

# Leer instantánea (árbol de accesibilidad)
curl -s "http://localhost:9377/tabs/<tabId>/snapshot?userId=bot"

# Ejecutar JavaScript
curl -s -X POST "http://localhost:9377/tabs/<tabId>/evaluate" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CAMOFOX_API_KEY" \
  -d '{"userId":"bot","expression":"document.title"}'
```

### Fase 3 — Navegación con CloakBrowser (cuando Camofox no es suficiente)

Paquete npm basado en Playwright + `cloakbrowser`. Lanza un navegador Chromium con huella digital avanzada para eludir Cloudflare, Akamai, DataDome y otros sistemas anti-bot. Detección automática de desafíos con espera y reintento.

**Scripts disponibles:**

- `cloak-fetch.mjs` — fetch universal con detección de desafíos
- `cloak-script.mjs` — ejecución de scripts Playwright personalizados

**Ejemplo:**

```bash
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com"
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com" --proxy socks5://... --geoip
```

## Por qué tanto Camofox como CloakBrowser?

Porque la velocidad y el sigilo son un compromiso, y la herramienta adecuada depende del sitio.

**Camofox — rápido, estructurado, persistente.**
Camofox envuelve a Camoufox (un fork de Firefox a nivel C++) en una API REST con un navegador siempre caliente. Después de un arranque en frío de ~1-3s, cada solicitud es casi instantánea. Sus instantáneas de accesibilidad son ~90% más pequeñas que el HTML bruto, con referencias de elementos estables (e1, e2, ...) para una interacción fiable. Maneja ~90% de los sitios que no usan protección anti-bot avanzada: artículos, documentos, motores de búsqueda, páginas web estándar.

**CloakBrowser — sigiloso, anti-bot, bajo demanda.**
CloakBrowser lanza una nueva instancia de Chromium por solicitud (~1-3s de arranque cada vez). Utiliza huella digital avanzada, soporte de proxy, geoip y detección automática de desafíos para eludir Cloudflare, Akamai, DataDome, Imperva, PerimeterX y DDoS-Guard. Es el último recurso para el ~10% de los sitios que bloquean a Camofox.

**Números del mundo real:**

| Herramienta | Cloudflare estándar | Cloudflare Turnstile | DataDome |
|---|---|---|---|
| **Camoufox** (motor de Camofox) | hasta **~92%** [¹] | **~65-78%** [¹] | **60-75%** [¹] |
| **Playwright Stealth** | ~70-80% [¹] | ~40-55% [¹] | ~30-50% [¹] |

- **CloakBrowser** aplica **58 parches a nivel de código fuente C++** y obtiene **0.9 reCAPTCHA v3** (nivel humano, verificado por servidor), superando todas las pruebas anti-bot principales, incluyendo Cloudflare Turnstile y FingerprintJS [²]
- **Camofox** arranque en frío: **~1-3s** (una vez, luego ~0ms por solicitud vía API REST caliente) [³]
- **Playwright/Chromium** arranque en frío: **~0.5-6s** (cada lanzamiento, varía según el entorno) [⁴]

Camofox maneja la ruta rápida. CloakBrowser maneja los casos extremos. Juntos cubren toda la web sin huecos. El agente decide cuál usar.

### Fuentes

¹ "Camoufox Vs Playwright Stealth: Complete Comparison & Alternatives (2026)" — [blog.send.win](https://blog.send.win/camoufox-vs-playwright-stealth-complete-comparison-alternatives-2026/)
² CloakBrowser README — [github.com/cloakhq/cloakbrowser](https://github.com/cloakhq/cloakbrowser)
³ camoufox-pi README (cold start comparison) — [github.com/MonsieurBarti/camoufox-pi](https://github.com/MonsieurBarti/camoufox-pi)
⁴ Playwright issue #4345 (launch time variability) — [github.com/microsoft/playwright/issues/4345](https://github.com/microsoft/playwright/issues/4345)

## Instalación

```bash
git clone https://github.com/johell1ns/browser-search
cd browser-search
npm install
```

Muestra este README a tu agente de IA para una instalación completa adaptada a tu entorno y plataforma.

**Resumen de servicios:**

| Servicio | Cómo | Referencia |
|---|---|---|
| SearXNG | Docker, `:8080` | [docs.searxng.org](https://docs.searxng.org/admin/installation-docker.html) |
| Camofox | Docker, `:9377` | [github.com/jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser) |
| CloakBrowser | npm (incluido) | `scripts/cloak/cloak-fetch.mjs` |

**Para el agente de IA — lee estos archivos:**

| Archivo | Qué contiene |
|---|---|
| `SKILL.md` | Skill completa: comandos, escalado, solución de problemas |
| `scripts/cloak/cloak-fetch.mjs` | Uso de CloakBrowser CLI y todas las opciones |
| `scripts/setup-dependencies.sh` | Dependencias del sistema |
| `scripts/check-browser-search.sh` | Verificación post-instalación |
| `docker/setup.md` | Consejos de configuración Docker |

**Nota:** `SKILL.md` está escrita para la sintaxis de **OpenCode** (`exec`, `curl`). Si tu agente usa un formato diferente (Claude Code, Cursor, etc.), léela y convierte los comandos a la sintaxis de tu agente antes de usar la skill.

## Variables de entorno

| Variable | Requerida para | Por defecto |
|---|---|---|
| `CAMOFOX_API_KEY` | evaluate, session, cleanup en Camofox | — |
| `CAMOFOX_ADMIN_KEY` | Endpoint stop de Camofox | — |

## Qué NO hace esta skill

- **Redes sociales.** Instagram, Facebook, TikTok, LinkedIn y Twitter/X requieren inicio de sesión. `browser-search` no intenta navegarlas.
- **Descargar archivos.** Es de solo lectura (excepto capturas de pantalla explícitas).
- **Eludir muros de pago.** No evita sistemas de pago o inicio de sesión.

## Participa

browser-search es open source y gratuito. Si te resulta útil:

- ⭐ **Marca la estrella del repo** — ayuda a otros a descubrirlo
- 🐛 **Abre un issue** — reporta errores o sugiere funciones
- 🔀 **Envía un PR** — corrige, mejora, extiende
- 💬 **Compártelo** — con tu equipo, en Reddit, Twitter, Discord
- 🧠 **Adáptalo** — haz un fork, ajusta la SKILL.md, hazlo tuyo

Cada contribución, por pequeña que sea, lo hace mejor.

## Licencia

MIT
