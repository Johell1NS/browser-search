# browser-search

<p align="center">
  <img src="../img/logoLarge-browser-search.png" alt="browser-search logo" width="80%">
</p>

> **面向AI代理的技能。** 适用于OpenCode、Claude Code、Cursor、OpenClaw等。使用SearXNG搜索网页，使用Camofox浏览网页，使用CloakBrowser绕过防护。**抗幻觉设计。** 全部自托管、免费、无限制。

## 为什么存在

browser-search是一项技能——一套为OpenCode、Claude Code、Cursor、OpenClaw等AI代理设计的指令集。它教会你的代理如何使用三个协同工作的开源工具来搜索和浏览网页。

如今，一个试图浏览网页的AI代理就像一个戴着面罩的小偷潜入警察学院。网站的防护系统会拦截它、挑战它、拒绝它。

browser-search扭转了局面：你的代理不再是那个小偷，而是变成了警察局长。不再有笨拙的访问尝试。它之所以能走进每一扇门，是因为它拥有正确的工具。SearXNG负责搜索，Camofox负责浏览，当网站强硬对抗时，CloakBrowser出马。

该技能强制使用确定性脚本，彻底消除模型幻觉，即使是最便宜的模型也不例外。三个工具用自然语言描述，但执行是刚性的：模型既不会用错命令，也不会误解输出。结果是每次查询都能保证成功——技能和确定性脚本引导模型搜遍网络，直到找到答案。

`browser-search`将**三个开源工具**编排成一个专为AI代理设计的搜索和浏览系统。每个工具都有自己的角色，由技能通过升级逻辑、自动选择和即用集成进行编排：

1. **[SearXNG](https://github.com/searxng/searxng)** — 搜索阶段的元搜索引擎（多源，JSON）
2. **[Camofox](https://github.com/jo-inc/camofox-browser)** — 可通过REST API导航的浏览器，适用于标准网站
3. **[CloakBrowser](https://github.com/cloakhq/cloakbrowser)** — 用于受反机器人保护网站的隐形浏览器

典型流程：代理首先使用SearXNG搜索，然后使用Camofox（如果网站受保护则使用CloakBrowser）浏览结果。

## 优势

- **100%免费、自托管、无限制。** 无需购买API密钥，无需订阅，无速率限制。一切在你的机器上运行，Docker和npm。无限使用，零成本。

- **轻量级，随处运行。** 在树莓派上构建和测试——如果能在那里运行，就能在任何地方运行。资源消耗极低，无需重型基础设施，可在低功耗硬件上全天候运行。

- **搜索+浏览一体化。** 无需手动集成。搜索和浏览是两个不同的阶段，两者都已覆盖。

- **自动导航升级。** 如果Camofox被Cloudflare/Akamai拦截，代理会自动切换到CloakBrowser。

- **智能性能。** 搜索阶段使用SearXNG（毫秒级）。Camofox和CloakBrowser仅用于浏览实际需要它们的网站。

- **自动代理选择。** AI代理决定使用哪个工具：SearXNG用于初始搜索，Camofox用于浏览，CloakBrowser用于受保护的网站。无需人工干预。

- **抗幻觉设计。** 该技能的深度研究模式强制执行"先搜索，后回答"的工作流程：代理必须根据实时网络来源验证每个事实主张，交叉引用多个来源，绝不猜测。不再有编造的答案。

- **完全可定制。** SKILL.md是纯文本。你可以编辑核心规则，添加自己的规则，删除不需要的内容。根据你的工作流程、你的团队、你的标准进行调整。

- **原生隐形。** CloakBrowser自动检测Cloudflare、Akamai、DataDome、Imperva、PerimeterX和DDoS-Guard挑战，并在提取内容前等待它们解决。

- **适用于任何代理。** SKILL.md是为OpenCode编写的，但其逻辑适用于任何AI代理。相同的README，相同的package.json，一切随处可用。只需询问你的代理如何根据其环境转换该技能。

## 🏆 技术前沿

选择这三个工具是因为它们代表了当前市场的最高水平。这样的技能设计就是为了不断进化：当更好的工具出现时，只需更新 SKILL.md 中的几行代码即可完成替换。🔄

⭐ **给仓库加星并关注**，随时了解新工具、流程改进和编排更新的最新动态。🚀

## 架构

```
┌─────────────────────────────────────────────────────────┐
│                    browser-search                        │
│                                                         │
│  ┌──────────────┐                                       │
│  │    搜索       │                                       │
│  │               │                                       │
│  │  SearXNG      │  搜索引擎 → URL                      │
│  │  (Docker)     │  JSON结果, 快速                       │
│  │  :8080        │                                       │
│  └──────────────┘                                       │
│         │                                                │
│         │ 结果就绪 → 开始浏览                             │
│         ↓                                                │
│  ┌─────────────────────────────────────┐                │
│  │            浏览                      │                │
│  │                                      │                │
│  │  ┌──────────────┐                   │                │
│  │  │   Camofox    │  浏览器 + REST    │                │
│  │  │  (Docker)    │  JS, 点击, 评估   │                │
│  │  │  :9377       │                   │                │
│  │  └──────┬───────┘                   │                │
│  │         │                           │                │
│  │         │ 如果被拦截                 │                │
│  │         ↓                           │                │
│  │  ┌──────────────┐                   │                │
│  │  │ CloakBrowser │  隐形Chromium     │                │
│  │  │   (npm)      │  反机器人, 代理    │                │
│  │  └──────────────┘                   │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## 工作原理

### 第一阶段 — 使用SearXNG搜索

Docker容器运行在`localhost:8080`。元搜索引擎，同时查询Google、Wikipedia、Bing、DuckDuckGo等多个引擎。JSON输出包含标题、摘要和URL。

**示例：**

```bash
node scripts/searxng/searxng.mjs search "largest llm benchmark 2026"
```

代理现在有了要访问的URL列表，并根据网站自主决定使用Camofox还是CloakBrowser进行浏览。

### 第二阶段 — 使用Camofox浏览

Docker容器运行在`localhost:9377`。通过REST API暴露完整的Firefox浏览器。代理可以创建标签页、导航、点击、滚动、执行任意JavaScript和结构化数据。

**包含：** Mozilla的Readability.js，用于提取干净的文章，去除导航栏、侧边栏和广告（节省约70%的token）。

**主要命令：**

```bash
# Single-URL extraction (Readability.js, auto-fallback to snapshot)
node scripts/camofox/camofox.mjs readability "https://example.com"

# JavaScript evaluation
node scripts/camofox/camofox.mjs evaluate "https://example.com" "document.title"

# Accessibility snapshot
node scripts/camofox/camofox.mjs snapshot "https://example.com"
```

### 第三阶段 — 使用CloakBrowser浏览（当Camofox不够时）

基于Playwright + `cloakbrowser`的npm包。启动具有高级指纹识别的Chromium浏览器，以绕过Cloudflare、Akamai、DataDome和其他反机器人系统。自动检测挑战并带等待和重试。

**可用脚本：**

- `cloak-fetch.mjs` — 通用获取，带挑战检测
- `cloak-script.mjs` — 自定义Playwright脚本执行

**示例：**

```bash
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com"
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com" --proxy socks5://... --geoip

# Markdown output (requires: pip install markitdown)
node scripts/cloak/cloak-fetch.mjs "https://example.com" --format markdown
```

## 为什么同时使用Camofox和CloakBrowser？

因为速度和隐身是一种权衡，正确的工具取决于网站。

**Camofox — 快速、结构化、持久化。**
Camofox将Camoufox（一个C++级别的Firefox分支）封装在一个REST API中，带有始终温热的浏览器。在约1-3秒的冷启动后，每个请求几乎是即时的。其无障碍快照比原始HTML小约90%，具有稳定的元素引用（e1, e2, ...），可实现可靠的交互。它处理约90%不使用高级反机器人保护的网站：文章、文档、搜索引擎、标准网页。

**CloakBrowser — 隐身、反机器人、按需使用。**
CloakBrowser每次请求启动一个新的Chromium实例（每次启动约1-3秒）。它使用高级指纹识别、代理支持、地理位置和自动挑战检测，以绕过Cloudflare、Akamai、DataDome、Imperva、PerimeterX和DDoS-Guard。它是针对约10%拦截Camofox的网站的最后手段。

**实际数据：**

| 工具 | Cloudflare标准 | Cloudflare Turnstile | DataDome |
|---|---|---|---|
| **Camoufox**（Camofox引擎） | 高达 **~92%** [¹] | **~65-78%** [¹] | **60-75%** [¹] |
| **Playwright Stealth** | ~70-80% [¹] | ~40-55% [¹] | ~30-50% [¹] |

- **CloakBrowser** 应用了**58个C++源码级补丁**，得分**0.9 reCAPTCHA v3**（人类级别，服务器验证），通过了包括Cloudflare Turnstile和FingerprintJS在内的所有主要反机器人测试 [²]
- **Camofox** 冷启动：**约1-3秒**（一次性，然后通过温热REST API每次请求约0毫秒）[³]
- **Playwright/Chromium** 冷启动：**约0.5-6秒**（每次启动，因环境而异）[⁴]

Camofox处理快速路径。CloakBrowser处理边缘情况。两者结合覆盖整个网络，不留空白。代理决定使用哪个。

### 来源

¹ "Camoufox Vs Playwright Stealth: Complete Comparison & Alternatives (2026)" — [blog.send.win](https://blog.send.win/camoufox-vs-playwright-stealth-complete-comparison-alternatives-2026/)
² CloakBrowser README — [github.com/cloakhq/cloakbrowser](https://github.com/cloakhq/cloakbrowser)
³ camoufox-pi README (cold start comparison) — [github.com/MonsieurBarti/camoufox-pi](https://github.com/MonsieurBarti/camoufox-pi)
⁴ Playwright issue #4345 (launch time variability) — [github.com/microsoft/playwright/issues/4345](https://github.com/microsoft/playwright/issues/4345)

## 安装

### 步骤 1 — 安装技能

通过一条命令将技能定义安装到你的AI代理中：

```bash
npx skills add Johell1NS/browser-search
```

适用于70多种AI代理，包括OpenCode、Claude Code、Cursor、GitHub Copilot等。

### 步骤 2 — 设置基础设施

```bash
git clone https://github.com/Johell1NS/browser-search
cd browser-search
npm install
```

CloakBrowser 通过 npm 安装。SearXNG 和 Camofox 需要独立的 Docker 容器 — 在使用技能前请确保它们正在运行。

将此README展示给你的AI代理，它将根据你的环境和平台进行完整安装。

browser-search 不提供特定平台的 docker-compose 文件或安装脚本。你的 AI 代理会读取以下参考信息，并根据你的操作系统、架构和环境自动调整设置。

**服务概览：**

| 服务 | 方式 | 参考 |
|---|---|---|
| SearXNG | Docker, `:8080` | [docs.searxng.org](https://docs.searxng.org/admin/installation-docker.html) |
| Camofox | Docker, `:9377` | [github.com/jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser) |
| CloakBrowser | npm（已包含） | `scripts/cloak/cloak-fetch.mjs` |

**供AI代理参考——阅读以下文件：**

| 文件 | 内容 |
|---|---|
| `SKILL.md` | 完整技能：命令、升级、故障排除 |
| `scripts/cloak/cloak-fetch.mjs` | CloakBrowser CLI用法及所有选项 |
| `scripts/setup.sh` | 系统依赖 |
| `scripts/check.sh` | 安装后验证 |
| `docker/setup.md` | Docker设置技巧 |

**注意：** `SKILL.md`是使用**OpenCode**语法（`exec`， `node scripts`）编写的。如果你的代理使用不同的格式（Claude Code、Cursor等），请阅读它并在使用该技能前将命令转换为你的代理语法。

## 环境变量

| 变量 | 适用于 | 默认值 |
|---|---|---|
| `CAMOFOX_API_KEY` | Camofox中的评估、会话、清理 | — |
| `CAMOFOX_ADMIN_KEY` | Camofox停止端点 | — |

## 此技能不做什么

- **社交媒体。** Instagram、Facebook、TikTok、LinkedIn和Twitter/X需要登录。`browser-search`不会尝试浏览它们。
- **下载文件。** 它是只读的（明确的截图除外）。
- **绕过付费墙。** 不规避支付或登录系统。

## 安全

browser-search 包含多层安全加固：

### 内置保护

- **SSRF 防护。** URL 在导航前经过验证 — 内部 IP（`127.x`、`10.x`、`192.168.x`、`169.254.x`）、云元数据端点和 `.internal`/`.local` TLD 均被阻止。DNS 解析也会被检查以防止 DNS 重绑定攻击。
- **脚本沙箱。** 自定义脚本（`cloak-script.mjs`）在限制 Playwright API 接口的沙箱中运行（仅允许访问 `page`、`browser`、`context` 上的白名单方法）。注意：Node.js API 仍然可用 — 完全隔离需要 `vm.Context`。使用 `--unsafe` 绕过沙箱和 SSRF 保护。
- **路径遍历保护。** `--script` 路径必须在技能目录内。绝对路径和 `../` 遍历被阻止。
- **速率限制。** 默认每分钟30次请求 — 防止意外 DoS 或触发反机器人机制（使用 `--no-rate-limit` 禁用）。
- **安全的文件名。** 截图使用随机 UUID 而不是可预测的时间戳。
- **堆栈跟踪抑制。** 错误输出默认省略堆栈跟踪。使用 `--verbose` 进行调试。

### 最佳实践

- **API 密钥。** 使用环境变量（`$CAMOFOX_API_KEY`）或 Docker 的 `--env-file`。切勿在命令行中粘贴密钥 — 它们会出现在 `ps aux` 和 shell 历史记录中。
- **Docker 绑定。** 端口映射时始终使用 `127.0.0.1:` 前缀（`-p 127.0.0.1:9377:9377`）。切勿暴露在 `0.0.0.0`。
- **URL编码。** 确定性脚本在内部处理编码。无需手动转义。
- **版本锁定。** 依赖项使用精确版本（无 `^` 范围）和 `package-lock.json` 以实现可重现的构建。

### 审计

运行 `bash scripts/audit.sh` 验证安装的安全状况。

### 残余风险

- **提示注入。** AI 代理可能被诱骗执行有害操作。工具可以减轻损害，但无法防止完全被攻陷的代理。
- **供应链。** CloakBrowser 从 `cloakbrowser.dev` 下载 Chromium 二进制文件。该二进制文件经过 SHA-256 验证但为专有软件。
- **浏览器自动化。** 任何可以访问浏览器的工具都存在固有风险。尽可能在隔离环境中运行。

## 参与其中

browser-search是开源且免费的。如果你觉得它有用：

- ⭐ **给仓库加星** — 帮助他人发现它
- 🐛 **提交Issue** — 报告错误或建议功能
- 🔀 **提交PR** — 修复、改进、扩展
- 💬 **分享它** — 与你的团队，在Reddit、Twitter、Discord上
- 🧠 **改编它** — Fork它，调整SKILL.md，让它成为你的

每一份贡献，无论多小，都会让它变得更好。

## FAQ

常见问题请参阅 [FAQ.md](../FAQ.md)，涵盖安装、架构、设计决策和常见问题。

## 许可证

MIT
