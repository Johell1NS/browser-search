<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>browser-search FAQ</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 800px; margin: 0 auto; padding: 2rem 1rem;
    background: #0d1117; color: #e6edf3;
  }
  h1 { font-size: 1.5rem; margin-bottom: 1.5rem; color: #f0f6fc; }
  details {
    border: 1px solid #30363d; border-radius: 6px;
    margin-bottom: 0.75rem; overflow: hidden;
    background: #161b22; transition: border-color 0.15s;
  }
  details[open] { border-color: #58a6ff; }
  summary {
    padding: 0.85rem 1rem; cursor: pointer; font-weight: 600;
    color: #f0f6fc; list-style: none; display: flex;
    align-items: center; gap: 0.5rem;
    user-select: none;
  }
  summary::-webkit-details-marker { display: none; }
  summary::before {
    content: "\276F"; display: inline-block; transition: transform 0.2s;
    color: #58a6ff; font-size: 0.75rem;
  }
  details[open] summary::before { transform: rotate(90deg); }
  details[open] .answer {
    padding: 1rem 1rem 1.25rem; border-top: 1px solid #30363d;
  }
  .answer p { margin-bottom: 0.75rem; line-height: 1.6; }
  .answer p:last-child { margin-bottom: 0; }
  .answer ul { margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.6; }
  .answer li { margin-bottom: 0.3rem; }
  code {
    background: #1c2128; padding: 0.15em 0.4em; border-radius: 3px;
    font-size: 0.875em; color: #ffa657;
  }
  a { color: #58a6ff; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .footer { margin-top: 2rem; font-size: 0.85rem; color: #8b949e; }
</style>
</head>
<body>

<h1>browser-search &mdash; FAQ</h1>

<details>
<summary>Is browser-search really free? No API keys, no subscriptions?</summary>
<div class="answer">
<p>
<strong>Yes, 100% free and self-hosted.</strong> There are no API keys to buy, no
subscriptions, no usage limits, no metered requests. Everything runs on your
own machine:
</p>
<ul>
  <li>
    <strong>SearXNG</strong> — free and open source metasearch engine (Docker).
    It queries Google, Bing, DuckDuckGo, Wikipedia and dozens of other
    engines simultaneously, aggregating results locally.
  </li>
  <li>
    <strong>Camofox</strong> — free and open source browser REST API (Docker).
    Built on top of the Camoufox Firefox fork (MIT licensed).
  </li>
  <li>
    <strong>CloakBrowser</strong> — npm package with a permissive license.
    The Chromium binary downloaded by CloakBrowser is proprietary but
    freely usable, with no API keys or paid tiers.
  </li>
</ul>
<p>
There is no external service to call, no cloud dependency, no rate limit
imposed by anyone but yourself. You own the infrastructure. The only cost
is the hardware to run it — which can be as little as a Raspberry Pi.
</p>
</div>
</details>

<details>
<summary>Why is CloakBrowser installed via npm instead of Docker?</summary>
<div class="answer">
<p>
CloakBrowser uses <code>launch()</code> from the <code>cloakbrowser</code> npm package — a stealth
Chromium with 58 C++ patches for anti-bot evasion (Cloudflare, Akamai,
DataDome, etc.). It requires direct access to the GPU and rendering pipeline,
which makes Docker impractical: you would need X11/VNC passthrough,
<code>--privileged</code> flags, and ~4–8s startup instead of the current ~2s.
</p>
<p>
CloakBrowser is also the <strong>last resort</strong> in the escalation chain (~10% of
cases), designed as fire-and-forget: <code>launch()</code> → navigate → <code>close()</code>. A
Docker wrapper would add significant overhead without real isolation benefits,
since container escape is trivial once you pass through the display server.
</p>
<p>To mitigate npm risks, browser-search includes:</p>
<ul>
  <li>SSRF/DNS validation blocking private IPs, cloud metadata, and DNS rebinding</li>
  <li>Playwright sandbox with whitelisted API methods for custom scripts</li>
  <li>Rate limiting (30 req/min default)</li>
  <li>Path traversal protection for script paths</li>
  <li>Pinned versions in <code>package.json</code> + <code>package-lock.json</code></li>
  <li>An audit script (<code>scripts/audit.sh</code>) checking integrity and vulnerabilities</li>
</ul>
<p>
The CloakBrowser Chromium binary is SHA-256 verified (though it remains
proprietary, as documented in the README's residual risks section).
</p>
</div>
</details>

<details>
<summary>Do I need to install all three tools?</summary>
<div class="answer">
<p>
<strong>Yes.</strong> browser-search is a three-tier system, and the skill instructs
the agent to use all three. Each tool has a distinct role and the agent
assumes all are available:
</p>
<ul>
  <li>
    <strong>SearXNG</strong> (Docker, :8080) — metasearch engine. The agent's entry point
    for any research query. Without it, there is no search phase.
  </li>
  <li>
    <strong>Camofox</strong> (Docker, :9377) — full browser via REST API. The agent uses
    it for the ~90% of sites that are not protected by advanced anti-bot
    systems. It provides snapshots, JavaScript evaluation, Readability.js
    article extraction, and interaction (click, scroll, type).
  </li>
  <li>
    <strong>CloakBrowser</strong> (npm, included via <code>npm install</code>) — stealth Chromium.
    The agent falls back to it when Camofox gets blocked by Cloudflare,
    Akamai, DataDome, or similar protections. It handles the remaining ~10%
    of sites.
  </li>
</ul>
<p>
Omitting any tool breaks the escalation chain. Without SearXNG the agent
cannot search efficiently. Without Camofox it loses fast-path browsing and
must launch a full CloakBrowser instance for every URL (~2s startup each).
Without CloakBrowser it fails on protected sites. The skill is designed for
all three working together — skipping one compromises coverage.
</p>
</div>
</details>

<details>
<summary>Why a skill instead of an MCP server?</summary>
<div class="answer">
<p>
The main reason is <strong>context efficiency</strong>. MCP and skills handle context
in fundamentally different ways:
</p>
<ul>
  <li>
    <strong>MCP</strong> calls <code>tools/list</code> at startup, injecting the complete schema
    (name + description + <code>inputSchema</code>) of every tool into the agent's
    context <em>at every ReACT iteration</em> — whether those tools are relevant
    to the current step or not. With multiple MCP servers, this means
    dozens of full JSON schemas occupying the context window permanently.
    Studies show accuracy drops to ~49% with 50+ tools (Anthropic).
  </li>
  <li>
    <strong>Skills</strong> load in tiers: only <code>name</code> + <code>description</code> (a few dozen
    tokens per skill) are always in context. The full instruction body
    is loaded <strong>on-demand</strong> only when the agent actually invokes the
    skill. Supporting resources are never auto-injected.
  </li>
</ul>
<p>
For a tool like browser-search, this difference is critical. An MCP server
would dump <strong>every</strong> SearXNG parameter, Camofox endpoint, and CloakBrowser
option into the agent's context at all times — thousands of tokens of schema
that the agent only needs 10% of the time. As a skill, the agent sees:
</p>
<pre style="background:#1c2128;padding:0.6rem;border-radius:4px;font-size:0.85rem;margin:0.5rem 0;overflow-x:auto;">
&ltskill&gt
  &ltname&gtbrowser-search&lt/name&gt
  &ltdescription&gtMulti-engine web search (SearXNG) +
  browsing/scraping (Camofox, CloakBrowser). Use
  whenever you need to do web research.&lt/description&gt
&lt/skill&gt</pre>
<p>
Just 20 tokens. The ~380 lines of <code>SKILL.md</code> — commands, escalation
logic, security rules — are loaded only when the agent needs to search
or browse. This keeps the context window free for the actual task.
</p>
<p>
Secondary benefits include: works with <strong>70+ agents</strong> (not just those
with MCP client support), fully editable as plain text, no server to
run or debug, and complete transparency — you see exactly what the
agent is told.
</p>
</div>
</details>

<details>
<summary>Does it work with Claude Code, Cursor, or other agents?</summary>
<div class="answer">
<p>
Yes. browser-search is a <strong>skill</strong> — a plain-text instruction set that
any LLM-based agent can read and follow. It is explicitly designed to be
agent-agnostic.
</p>
<p>
The <code>SKILL.md</code> is written for <strong>OpenCode</strong> syntax (<code>exec</code>, <code>curl</code>), but
the logic is identical for any agent:
</p>
<ul>
  <li><strong>Claude Code</strong> — use <code>bash</code>/<code>tool</code> blocks instead of <code>exec</code></li>
  <li><strong>Cursor</strong> — use <code>!command</code> or terminal integration</li>
  <li><strong>OpenClaw, GitHub Copilot, Cline, Aider, Continue</strong> — each has its own
  command syntax; convert the skill's commands accordingly</li>
</ul>
<p>
Installation also works across agents via <code>npx skills add Johell1NS/browser-search</code>,
which supports <strong>70+ agents</strong> out of the box. If your agent doesn't support
<code>npx skills</code>, you can simply clone the repo and point your agent to
<code>SKILL.md</code> manually.
</p>
<p>
The infrastructure (Docker containers, npm packages) is the same regardless
of which agent you use.
</p>
</div>
</details>

<details>
<summary>How does the escalation between Camofox and CloakBrowser work?</summary>
<div class="answer">
<p>
Escalation is <strong>agent-driven</strong>, not automated by a script. The
<code>SKILL.md</code> instructs the agent on when and how to switch tools:
</p>
<ul>
  <li>
    <strong>SearXNG</strong> is always the first step: the agent searches, gets URLs.
    If the search results alone are exhaustive, browsing is skipped entirely.
  </li>
  <li>
    <strong>Camofox</strong> is the default browser. The agent creates a tab, takes snapshots,
    evaluates JS, clicks, scrolls — all through the REST API. It handles ~90%
    of standard sites: articles, docs, search engines, web apps.
  </li>
  <li>
    <strong>CloakBrowser</strong> is the fallback. If Camofox returns an error, gets
    blocked by a challenge page, or fails to load content, the agent switches
    to CloakBrowser for that URL — <code>launch()</code> → navigate → <code>close()</code>.
  </li>
</ul>
<p>
The decision is entirely in the agent's hands. The skill provides clear rules
("If Camofox fails, switch to CloakBrowser"), and the agent acts accordingly.
There is no shared state or automated router between the two browsers — they
are independent tools invoked by the agent as needed.
</p>
<p>
Real-world reference numbers from the README:
</p>
<ul>
  <li>Camofox (Camoufox engine): up to ~92% on standard Cloudflare, ~65-78% on Turnstile</li>
  <li>CloakBrowser: scores 0.9 reCAPTCHA v3 (human-level), passes all major anti-bot tests</li>
</ul>
</div>
</details>

<p class="footer">
See the <a href="README.md">README</a> and <a href="SKILL.md">SKILL.md</a> for full documentation.
</p>

</body>
</html>
