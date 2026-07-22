# browser-search — FAQ

<details>
<summary>Is browser-search really free? No API keys, no subscriptions?</summary>

**Yes, 100% free and self-hosted.** There are no API keys to buy, no
subscriptions, no usage limits, no metered requests. Everything runs on your
own machine:

- **SearXNG** — free and open source metasearch engine (Docker).
  It queries Google, Bing, DuckDuckGo, Wikipedia and dozens of other
  engines simultaneously, aggregating results locally.
- **Camofox** — free and open source browser REST API (Docker).
  Built on top of the Camoufox Firefox fork (MIT licensed).
- **CloakBrowser** — npm package with a permissive license.
  The Chromium binary downloaded by CloakBrowser is proprietary but
  freely usable, with no API keys or paid tiers.

There is no external service to call, no cloud dependency, no rate limit
imposed by anyone but yourself. You own the infrastructure. The only cost
is the hardware to run it — which can be as little as a Raspberry Pi.

</details>

<details>
<summary>Why is CloakBrowser installed via npm instead of Docker?</summary>

CloakBrowser is available both via npm (`cloakbrowser` package) and as an
official Docker image (`cloakhq/cloakbrowser`). browser-search uses npm by
default:

- **CloakBrowser is the last resort** in the escalation chain (~10% of cases),
  designed as fire-and-forget: `launch()` → navigate → `close()`. Running it
  on-demand avoids keeping a ~200MB container idle 24/7 for marginal use.
- **Resource-conscious design.** browser-search is built and tested on Raspberry
  Pi — every MB counts. An always-on Docker container for a tool used once
  every ten requests is wasteful.
- **Users can choose Docker.** Since the official image exists, anyone on a
  desktop or server can adapt the skill to use Docker instead of npm. The npm
  default optimises for the RPi use case while keeping the option open.

To mitigate npm risks, browser-search includes:

- SSRF/DNS validation blocking private IPs, cloud metadata, and DNS rebinding
- Playwright sandbox with whitelisted API methods for custom scripts
- Rate limiting (30 req/min default)
- Path traversal protection for script paths
- Pinned versions in `package.json` + `package-lock.json`
- An audit script (`scripts/audit.sh`) checking integrity and vulnerabilities

The CloakBrowser Chromium binary is SHA-256 verified (though it remains
proprietary, as documented in the README's residual risks section).

</details>

<details>
<summary>Do I need to install all three tools?</summary>

**Yes.** browser-search is a three-tier system, and the skill instructs
the agent to use all three. Each tool has a distinct role and the agent
assumes all are available:

- **SearXNG** (Docker, :8080) — metasearch engine. The agent's entry point
  for any research query. Without it, there is no search phase.
- **Camofox** (Docker, :9377) — full browser via REST API. The agent uses
  it for the ~90% of sites that are not protected by advanced anti-bot
  systems. It provides snapshots, JavaScript evaluation, Readability.js
  article extraction, and interaction (click, scroll, type).
- **CloakBrowser** (npm, included via `npm install`) — stealth Chromium.
  The agent falls back to it when Camofox gets blocked by Cloudflare,
  Akamai, DataDome, or similar protections. It handles the remaining ~10%
  of sites.

Omitting any tool breaks the escalation chain. Without SearXNG the agent
cannot search efficiently. Without Camofox it loses fast-path browsing and
must launch a full CloakBrowser instance for every URL (~2s startup each).
Without CloakBrowser it fails on protected sites. The skill is designed for
all three working together — skipping one compromises coverage.

</details>

<details>
<summary>Why a skill instead of an MCP server?</summary>

The main reason is **context efficiency**. MCP and skills handle context
in fundamentally different ways:

- **MCP** calls `tools/list` at startup, injecting the complete schema
  (name + description + `inputSchema`) of every tool into the agent's
  context *at every ReACT iteration* — whether those tools are relevant
  to the current step or not. With multiple MCP servers, this means
  dozens of full JSON schemas occupying the context window permanently.
  Studies show accuracy drops to ~49% with 50+ tools (Anthropic).
- **Skills** load in tiers: only `name` + `description` (a few dozen
  tokens per skill) are always in context. The full instruction body
  is loaded **on-demand** only when the agent actually invokes the
  skill. Supporting resources are never auto-injected.

For a tool like browser-search, this difference is critical. An MCP server
would dump **every** SearXNG parameter, Camofox endpoint, and CloakBrowser
option into the agent's context at all times — thousands of tokens of schema
that the agent only needs 10% of the time. As a skill, the agent sees:

```
<skill>
  <name>browser-search</name>
  <description>Multi-engine web search (SearXNG) +
  browsing/scraping (Camofox, CloakBrowser). Use
  whenever you need to do web research.</description>
</skill>
```

Just 20 tokens. The ~380 lines of `SKILL.md` — commands, escalation
logic, security rules — are loaded only when the agent needs to search
or browse. This keeps the context window free for the actual task.

Secondary benefits include: works with **70+ agents** (not just those
with MCP client support), fully editable as plain text, no server to
run or debug, and complete transparency — you see exactly what the
agent is told.

</details>

<details>
<summary>Does it work with Claude Code, Cursor, or other agents?</summary>

Yes. browser-search is a **skill** — a plain-text instruction set that
any LLM-based agent can read and follow. It is explicitly designed to be
agent-agnostic.

The `SKILL.md` is written for **OpenCode** syntax (`exec`, `node scripts`), but
the logic is identical for any agent:

- **Claude Code** — use `bash`/`tool` blocks instead of `exec`
- **Cursor** — use `!command` or terminal integration
- **OpenClaw, GitHub Copilot, Cline, Aider, Continue** — each has its own
  command syntax; convert the skill's commands accordingly

Installation also works across agents via `npx skills add Johell1NS/browser-search`,
which supports **70+ agents** out of the box. If your agent doesn't support
`npx skills`, you can simply clone the repo and point your agent to
`SKILL.md` manually.

The infrastructure (Docker containers, npm packages) is the same regardless
of which agent you use.

</details>

<details>
<summary>How does the escalation between Camofox and CloakBrowser work?</summary>

Escalation is **agent-driven**, not automated by a script. The
`SKILL.md` instructs the agent on when and how to switch tools:

- **SearXNG** is always the first step: the agent searches, gets URLs.
  If the search results alone are exhaustive, browsing is skipped entirely.
- **Camofox** is the default browser. The agent creates a tab, takes snapshots,
  evaluates JS, clicks, scrolls — all through the REST API. It handles ~90%
  of standard sites: articles, docs, search engines, web apps.
- **CloakBrowser** is the fallback. If Camofox returns an error, gets
  blocked by a challenge page, or fails to load content, the agent switches
  to CloakBrowser for that URL — `launch()` → navigate → `close()`.

The decision is entirely in the agent's hands. The skill provides clear rules
("If Camofox fails, switch to CloakBrowser"), and the agent acts accordingly.
There is no shared state or automated router between the two browsers — they
are independent tools invoked by the agent as needed.

Real-world reference numbers from the README:

- Camofox (Camoufox engine): up to ~92% on standard Cloudflare, ~65-78% on Turnstile
- CloakBrowser: scores 0.9 reCAPTCHA v3 (human-level), passes all major anti-bot tests

</details>

<details>
<summary>Can I change the default ports (8080 / 9377)?</summary>

**Yes.** The ports used by SearXNG and Camofox are fully customizable.

You can ask your AI agent to change them, or do it yourself by editing
the port references in `SKILL.md` and the Docker configuration — either
way, the agent will adapt automatically.

For example, you can tell your agent: *"Use port 8888 for SearXNG and
9444 for Camofox instead of the defaults."*

Default ports are `8080` (SearXNG) and `9377` (Camofox).

For SearXNG Docker, set `SEARXNG_HOST=127.0.0.1` in `searxng/.env` so the
search API is not exposed on `0.0.0.0` (see [SearXNG docker docs](https://docs.searxng.org/admin/installation-docker.html)).

</details>

---

See the [README](README.md) and [SKILL.md](SKILL.md) for full documentation.
