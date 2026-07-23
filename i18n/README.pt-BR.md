# browser-search

<p align="center">
  <img src="../img/logoLarge-browser-search.png" alt="browser-search logo" width="80%">
</p>

> **Uma skill para agentes de IA.** OpenCode, Claude Code, Cursor, OpenClaw e muito mais. Pesquise na web com SearXNG, navegue com Camofox, burle proteções com CloakBrowser. **Antialucinação por design.** Tudo auto-hospedado, gratuito, ilimitado.

## Por que existe

Hoje, um agente de IA tentando navegar na web é como um **ladrão de balaclava** se esgueirando por uma academia de polícia. As proteções do site o bloqueiam, o desafiam, o rejeitam.

👮 browser-search vira a mesa: seu agente deixa de ser o ladrão e se torna o **chefe de polícia**. Chega de tentativas desajeitadas de acesso. Ele atravessa cada porta porque tem as ferramentas certas. SearXNG para pesquisar, Camofox para navegar, CloakBrowser quando o jogo fica duro.

A skill impõe o uso exclusivo de scripts determinísticos. Isso **elimina as alucinações do modelo**, mesmo com os modelos mais baratos. As 3 ferramentas são descritas em linguagem natural, mas a execução é rígida: o modelo não pode errar o comando nem interpretar errado a saída. O resultado é **sucesso garantido em cada consulta** — a skill e seus scripts determinísticos guiam o modelo a vasculhar a web até encontrar a resposta.

1. **[SearXNG](https://github.com/searxng/searxng)** — metabuscador para a fase de pesquisa (multifonte, JSON)
2. **[Camofox](https://github.com/jo-inc/camofox-browser)** — navegador acessível via API REST para sites padrão
3. **[CloakBrowser](https://github.com/cloakhq/cloakbrowser)** — navegador furtivo para sites protegidos contra bots

O fluxo típico: o agente primeiro pesquisa com SearXNG, depois navega pelos resultados com Camofox (ou CloakBrowser se o site estiver protegido).

## Benefícios

- **100% gratuito, auto-hospedado, ilimitado.** Sem chaves de API para comprar, sem assinaturas, sem limites de taxa. Tudo roda na sua máquina, Docker e npm. Uso ilimitado, custo zero.

- **Leve, funciona em qualquer lugar.** Construído e testado em um Raspberry Pi — se funciona lá, funciona em qualquer lugar. Consumo mínimo de recursos, sem necessidade de infraestrutura pesada, funciona 24/7 em hardware de baixo consumo.

- **Pesquisa + navegação em um único kit.** Sem necessidade de integração manual. Pesquisa e navegação são duas fases distintas, ambas cobertas.

- **Escalonamento automático de navegação.** Se o Camofox for bloqueado por Cloudflare/Akamai, o agente muda automaticamente para o CloakBrowser.

- **Desempenho inteligente.** SearXNG para a fase de pesquisa (milissegundos). Camofox e CloakBrowser são usados apenas para navegar nos sites que realmente precisam.

- **Escolha automática do agente.** O agente de IA decide qual ferramenta usar: SearXNG para pesquisa inicial, Camofox para navegação, CloakBrowser se o site estiver protegido. Intervenção humana zero.

- **Antialucinação por design.** O modo de pesquisa aprofundada da skill impõe um fluxo "primeiro pesquise, depois responda": o agente deve verificar cada afirmação factual contra fontes web ao vivo, cruzar múltiplas fontes e nunca adivinhar. Chega de respostas inventadas.

- **Totalmente personalizável.** A SKILL.md é texto simples. Você pode editar as regras principais, adicionar as suas, remover o que não precisa. Adapte ao seu fluxo de trabalho, sua equipe, seus padrões.

- **Furtividade nativa.** CloakBrowser detecta automaticamente desafios do Cloudflare, Akamai, DataDome, Imperva, PerimeterX e DDoS-Guard, e aguarda sua resolução antes de extrair conteúdo.

- **Funciona com qualquer agente.** A SKILL.md é escrita para OpenCode, mas a lógica é idêntica para qualquer agente de IA. Mesmo README, mesmo package.json, tudo funciona em qualquer lugar. Basta pedir ao seu agente para converter a skill para seu ambiente.

## 🏆 Estado da arte

Estas três ferramentas foram escolhidas porque representam o estado da arte atual disponível hoje. Uma skill como esta é projetada para evoluir: quando ferramentas melhores surgirem, basta atualizar a SKILL.md para substituí-las. 🔄

⭐ **Dê uma estrela no repositório e siga** para ficar atualizado sobre novas ferramentas, melhorias no fluxo e atualizações de orquestração. 🚀

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    browser-search                        │
│                                                         │
│  ┌──────────────┐                                       │
│  │   Pesquisa   │                                       │
│  │               │                                       │
│  │  SearXNG      │  mecanismos de busca → URLs          │
│  │  (Docker)     │  resultados JSON, rápido             │
│  │  :8080        │                                       │
│  └──────────────┘                                       │
│         │                                                │
│         │ resultados prontos → navegar                   │
│         ↓                                                │
│  ┌─────────────────────────────────────┐                │
│  │          Navegação                   │                │
│  │                                      │                │
│  │  ┌──────────────┐                   │                │
│  │  │   Camofox    │  navegador + REST │                │
│  │  │  (Docker)    │  JS, clique, eval │                │
│  │  │  :9377       │                   │                │
│  │  └──────┬───────┘                   │                │
│  │         │                           │                │
│  │         │ se bloqueado              │                │
│  │         ↓                           │                │
│  │  ┌──────────────┐                   │                │
│  │  │ CloakBrowser │  Chromium furtivo │                │
│  │  │   (npm)      │  anti-bot, proxy  │                │
│  │  └──────────────┘                   │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## Como funciona

### Fase 1 — Pesquisa com SearXNG

Container Docker em `localhost:8080`. Metabuscador que consulta Google, Wikipedia, Bing, DuckDuckGo e muitos outros simultaneamente. Saída JSON com títulos, trechos e URLs.

**Exemplo:**

```bash
node scripts/searxng/searxng.mjs search "largest llm benchmark 2026"
```

O agente agora tem uma lista de URLs para visitar e decide autonomamente se as navega com Camofox ou CloakBrowser com base no site.

### Fase 2 — Navegação com Camofox

Container Docker em `localhost:9377`. Expõe um navegador Firefox completo através de uma API REST. O agente pode criar abas, navegar, clicar, rolar, executar JavaScript arbitrário e estruturar dados.

**Inclui:** Readability.js da Mozilla para extrair artigos limpos, removendo navegação, barra lateral e anúncios (~70% de economia de tokens).

**Comandos principais:**

```bash
# Single-URL extraction (Readability.js, auto-fallback to snapshot)
node scripts/camofox/camofox.mjs readability "https://example.com"

# JavaScript evaluation
node scripts/camofox/camofox.mjs evaluate "https://example.com" "document.title"

# Accessibility snapshot
node scripts/camofox/camofox.mjs snapshot "https://example.com"
```

### Fase 3 — Navegação com CloakBrowser (quando Camofox não é suficiente)

Pacote npm baseado em Playwright + `cloakbrowser`. Inicia um navegador Chromium com impressão digital avançada para burlar Cloudflare, Akamai, DataDome e outros sistemas anti-bot. Detecção automática de desafios com espera e tentativa novamente.

**Scripts disponíveis:**

- `cloak-fetch.mjs` — fetch universal com detecção de desafios
- `cloak-script.mjs` — execução de script Playwright personalizado

**Exemplo:**

```bash
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com"
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com" --proxy socks5://... --geoip

# Markdown output (requires: pip install markitdown)
node scripts/cloak/cloak-fetch.mjs "https://example.com" --format markdown
```

## Por que tanto Camofox quanto CloakBrowser?

Porque velocidade e furtividade são um tradeoff, e a ferramenta certa depende do site.

**Camofox — rápido, estruturado, persistente.**
Camofox envolve o Camoufox (um fork do Firefox em nível C++) em uma API REST com um navegador sempre aquecido. Após uma inicialização a frio de ~1-3s, cada requisição é quase instantânea. Seus snapshots de acessibilidade são ~90% menores que HTML bruto, com referências de elemento estáveis (e1, e2, ...) para interação confiável. Ele lida com ~90% dos sites que não usam proteção anti-bot avançada: artigos, documentos, mecanismos de busca, páginas web padrão.

**CloakBrowser — furtivo, anti-bot, sob demanda.**
CloakBrowser inicia uma nova instância do Chromium por requisição (~1-3s de inicialização cada vez). Usa impressão digital avançada, suporte a proxy, geoip e detecção automática de desafios para burlar Cloudflare, Akamai, DataDome, Imperva, PerimeterX e DDoS-Guard. É o último recurso para os ~10% dos sites que bloqueiam o Camofox.

**Números do mundo real:**

| Ferramenta | Cloudflare padrão | Cloudflare Turnstile | DataDome |
|---|---|---|---|
| **Camoufox** (motor do Camofox) | até **~92%** [¹] | **~65-78%** [¹] | **60-75%** [¹] |
| **Playwright Stealth** | ~70-80% [¹] | ~40-55% [¹] | ~30-50% [¹] |

- **CloakBrowser** aplica **58 patches em nível de código-fonte C++** e pontua **0.9 reCAPTCHA v3** (nível humano, verificado pelo servidor), passando em todos os principais testes anti-bot, incluindo Cloudflare Turnstile e FingerprintJS [²]
- **Camofox** inicialização a frio: **~1-3s** (uma vez, depois ~0ms por requisição via API REST aquecida) [³]
- **Playwright/Chromium** inicialização a frio: **~0.5-6s** (cada inicialização, varia conforme o ambiente) [⁴]

Camofox lida com o caminho rápido. CloakBrowser lida com os casos extremos. Juntos, eles cobrem toda a web sem lacunas. O agente decide qual usar.

### Fontes

¹ "Camoufox Vs Playwright Stealth: Complete Comparison & Alternatives (2026)" — [blog.send.win](https://blog.send.win/camoufox-vs-playwright-stealth-complete-comparison-alternatives-2026/)
² CloakBrowser README — [github.com/cloakhq/cloakbrowser](https://github.com/cloakhq/cloakbrowser)
³ camoufox-pi README (cold start comparison) — [github.com/MonsieurBarti/camoufox-pi](https://github.com/MonsieurBarti/camoufox-pi)
⁴ Playwright issue #4345 (launch time variability) — [github.com/microsoft/playwright/issues/4345](https://github.com/microsoft/playwright/issues/4345)

## Instalação

### Passo 1 — Instalar a skill

Instale a definição da skill no seu agente de IA com um único comando:

```bash
npx skills add Johell1NS/browser-search
```

Funciona com mais de 70 agentes de IA, incluindo OpenCode, Claude Code, Cursor, GitHub Copilot e outros.

### Passo 2 — Configurar a infraestrutura

```bash
git clone https://github.com/Johell1NS/browser-search
cd browser-search
npm install
```

CloakBrowser é instalado via npm. SearXNG e Camofox exigem contêineres Docker separados — certifique-se de que estejam em execução antes de usar a skill.

Mostre este README ao seu agente de IA para uma instalação completa adaptada ao seu ambiente e plataforma.

browser-search não fornece arquivos docker-compose ou scripts de instalação específicos para plataforma. Seu agente de IA lê as referências abaixo e adapta a configuração ao seu sistema operacional, arquitetura e ambiente automaticamente.

**Visão geral dos serviços:**

| Serviço | Como | Referência |
|---|---|---|
| SearXNG | Docker, `:8080` | [docs.searxng.org](https://docs.searxng.org/admin/installation-docker.html) |
| Camofox | Docker, `:9377` | [github.com/jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser) |
| CloakBrowser | npm (incluído) | `scripts/cloak/cloak-fetch.mjs` |

**Para o agente de IA — leia estes arquivos:**

| Arquivo | O que contém |
|---|---|
| `SKILL.md` | Skill completa: comandos, escalonamento, solução de problemas |
| `scripts/cloak/cloak-fetch.mjs` | Uso da CLI do CloakBrowser e todas as opções |
| `scripts/setup.sh` | Dependências do sistema |
| `scripts/check.sh` | Verificação pós-instalação |
| `docker/setup.md` | Dicas de configuração Docker |

**Nota:** `SKILL.md` está escrita para a sintaxe do **OpenCode** (`exec`, `node scripts`). Se seu agente usar um formato diferente (Claude Code, Cursor, etc.), leia-a e converta os comandos para a sintaxe do seu agente antes de usar a skill.

## Variáveis de ambiente

| Variável | Obrigatória para | Padrão |
|---|---|---|
| `CAMOFOX_API_KEY` | evaluate, session, cleanup no Camofox | — |
| `CAMOFOX_ADMIN_KEY` | Endpoint stop do Camofox | — |

## O que esta skill NÃO faz

- **Redes sociais.** Instagram, Facebook, TikTok, LinkedIn e Twitter/X exigem login. `browser-search` não tenta navegá-los.
- **Baixar arquivos.** É somente leitura (exceto capturas de tela explícitas).
- **Burlar paywalls.** Não contorna sistemas de pagamento ou login.

## Segurança

browser-search inclui múltiplas camadas de proteção de segurança:

### Proteções integradas

- **Prevenção SSRF.** URLs são validadas antes da navegação — IPs internos (`127.x`, `10.x`, `192.168.x`, `169.254.x`), endpoints de metadados em nuvem e TLDs `.internal`/`.local` são bloqueados. A resolução DNS também é verificada para evitar ataques de DNS rebinding.
- **Sandbox de scripts.** Scripts personalizados (`cloak-script.mjs`) são executados em uma sandbox que restringe a superfície da API do Playwright (apenas métodos autorizados em `page`, `browser`, `context` são acessíveis). Nota: as APIs Node.js permanecem disponíveis — para isolamento completo, um `vm.Context` seria necessário. Use `--unsafe` para ignorar a sandbox e a proteção SSRF.
- **Proteção contra path traversal.** Caminhos de `--script` devem estar dentro do diretório da skill. Caminhos absolutos e travessia com `../` são bloqueados.
- **Rate limiting.** 30 requisições/minuto por padrão para prevenir DoS acidental ou ativação anti-bot (use `--no-rate-limit` para desabilitar).
- **Nomes de arquivo seguros.** Capturas de tela usam UUIDs aleatórios em vez de timestamps previsíveis.
- **Supressão de stack trace.** A saída de erros omite stack traces por padrão. Use `--verbose` para depuração.

### Boas práticas

- **Chaves de API.** Use variáveis de ambiente (`$CAMOFOX_API_KEY`) ou `--env-file` para Docker. Nunca cole chaves na linha de comando — elas aparecem em `ps aux` e no histórico do shell.
- **Bind do Docker.** Sempre use o prefixo `127.0.0.1:` para mapeamento de porta (`-p 127.0.0.1:9377:9377`). Nunca exponha em `0.0.0.0`.
- **Codificação de URL.** Scripts determinísticos lidam com a codificação internamente. Sem necessidade de escape manual.
- **Fixação de versões.** Dependências usam versões exatas (sem intervalos `^`) e `package-lock.json` para builds reproduzíveis.

### Auditoria

Execute `bash scripts/audit.sh` para verificar a postura de segurança da sua instalação.

### Riscos residuais

- **Injeção de prompt.** Um agente de IA pode ser enganado a realizar ações prejudiciais. As ferramentas mitigam danos mas não podem impedir um agente completamente comprometido.
- **Supply chain.** CloakBrowser baixa um binário Chromium de `cloakbrowser.dev`. O binário é verificado por SHA-256 mas é proprietário.
- **Automação de navegador.** Qualquer ferramenta com acesso ao navegador tem riscos inerentes. Execute em ambientes isolados quando possível.

## Participe

browser-search é open source e gratuito. Se você achar útil:

- ⭐ **Dê uma estrela no repositório** — ajuda outros a descobri-lo
- 🐛 **Abra uma issue** — reporte bugs ou sugira funcionalidades
- 🔀 **Envie um PR** — corrija, melhore, estenda
- 💬 **Compartilhe** — com sua equipe, no Reddit, Twitter, Discord
- 🧠 **Adapte-o** — faça um fork, ajuste a SKILL.md, torne-o seu

Cada contribuição, por menor que seja, torna isso melhor.

## FAQ

Veja [FAQ.md](../FAQ.md) para perguntas frequentes sobre instalação, arquitetura, decisões de design e problemas comuns.

## Licença

MIT
