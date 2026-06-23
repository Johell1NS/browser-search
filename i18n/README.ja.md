# browser-search

<p align="center">
  <img src="../img/logoLarge-browser-search.png" alt="browser-search logo" width="80%">
</p>

> **AIエージェントのためのスキル。** OpenCode、Claude Code、Cursor、OpenClawなど。SearXNGでウェブ検索、Camofoxでブラウジング、CloakBrowserで保護をバイパス。すべてセルフホスト、無料、無制限。

## なぜ存在するのか

browser-searchはスキルです — OpenCode、Claude Code、Cursor、OpenClawなどのAIエージェントのための命令セットです。3つのオーケストレーションされたオープンソースツールを使って、エージェントがウェブを検索・ブラウジングする方法を教えます。

問題は何か？ウェブは自動化に敵対的です。Cloudflare、Akamai、DataDomeなどのアンチボットシステムは単純なリクエストをブロックします。最新のサイトは重いJavaScript、遅延読み込み、クライアントサイドレンダリングを使用しています。単一の解決策では不十分です。

`browser-search`は**3つのオープンソースツール**を、AIエージェント向けに設計された単一の検索・ブラウジングシステムにオーケストレーションします。各ツールには役割があり、エスカレーションロジック、自動選択、すぐに使える統合によってスキルがオーケストレーションします：

1. **[SearXNG](https://github.com/searxng/searxng)** — 検索フェーズのためのメタサーチエンジン（マルチソース、JSON）
2. **[Camofox](https://github.com/jo-inc/camofox-browser)** — 標準サイト向けのREST API経由で操作可能なブラウザ
3. **[CloakBrowser](https://github.com/cloakhq/cloakbrowser)** — アンチボット保護サイト向けのステルスブラウザ

典型的な流れ：エージェントは最初にSearXNGで検索し、次にCamofox（またはサイトが保護されている場合はCloakBrowser）で結果をブラウジングします。

## 利点

- **100%無料、セルフホスト、無制限。** APIキーの購入不要、サブスクリプション不要、レート制限なし。すべてあなたのマシン、Docker、npmで動作します。無制限の使用、ゼロコスト。

- **軽量、どこでも実行可能。** Raspberry Piで構築・テスト済み — そこで動作すれば、どこでも動作します。最小限のリソース消費、大規模なインフラストラクチャ不要、低電力ハードウェアで24時間365日稼働。

- **検索＋ブラウジングがワンキットに。** 手動統合は不要。検索とブラウジングは2つの異なるフェーズであり、両方ともカバーされています。

- **自動ナビゲーションエスカレーション。** CamofoxがCloudflare/Akamaiにブロックされた場合、エージェントは自動的にCloakBrowserに切り替えます。

- **スマートパフォーマンス。** 検索フェーズにはSearXNG（ミリ秒）。CamofoxとCloakBrowserは実際に必要なサイトのブラウジングにのみ使用されます。

- **自動エージェント選択。** AIエージェントが使用するツールを決定します：初期検索にSearXNG、ブラウジングにCamofox、保護されたサイトにCloakBrowser。人間の介入はゼロ。

- **ディープリサーチモード。** スキルはエージェントに表面的な回答を超えるよう指示します：複数の角度を探求し、ソースを相互検証し、あらゆる側面をカバーし、決して手を抜かない。

- **完全にカスタマイズ可能。** SKILL.mdはプレーンテキストです。コアルールの編集、独自ルールの追加、不要なものの削除が可能。自分のワークフロー、チーム、標準に合わせて調整できます。

- **ネイティブステルス。** CloakBrowserはCloudflare、Akamai、DataDome、Imperva、PerimeterX、DDoS-Guardのチャレンジを自動検出し、それらが解決されるのを待ってからコンテンツを抽出します。

- **任意のエージェントで動作。** SKILL.mdはOpenCode用に書かれていますが、ロジックはどのAIエージェントでも同じです。同じREADME、同じpackage.json、すべてがどこでも機能します。エージェントに、その環境用にスキルを変換するように依頼するだけです。

## 🏆 最先端技術

これら3つのツールは、現在市場で入手可能な最先端を代表するものとして選ばれました。このようなスキルは進化するように設計されています：より良いツールが登場したら、SKILL.mdの数行を更新するだけで交換できます。🔄

⭐ **リポジトリにスターを付けてフォロー**すると、新しいツール、フローの改善、オーケストレーションの更新について最新情報を入手できます。🚀

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    browser-search                        │
│                                                         │
│  ┌──────────────┐                                       │
│  │   検索        │                                       │
│  │               │                                       │
│  │  SearXNG      │  検索エンジン → URL                  │
│  │  (Docker)     │  JSON結果、高速                       │
│  │  :8080        │                                       │
│  └──────────────┘                                       │
│         │                                                │
│         │ 結果準備完了 → ブラウジングへ                   │
│         ↓                                                │
│  ┌─────────────────────────────────────┐                │
│  │          ブラウジング                │                │
│  │                                      │                │
│  │  ┌──────────────┐                   │                │
│  │  │   Camofox    │  ブラウザ+REST    │                │
│  │  │  (Docker)    │  JS、クリック、評価│                │
│  │  │  :9377       │                   │                │
│  │  └──────┬───────┘                   │                │
│  │         │                           │                │
│  │         │ ブロックされた場合        │                │
│  │         ↓                           │                │
│  │  ┌──────────────┐                   │                │
│  │  │ CloakBrowser │  ステルスChromium │                │
│  │  │   (npm)      │  アンチボット、プロキシ│             │
│  │  └──────────────┘                   │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## 仕組み

### フェーズ1 — SearXNGで検索

`localhost:8080`でDockerコンテナ稼働。Google、Wikipedia、Bing、DuckDuckGoなどを同時にクエリするメタサーチエンジン。タイトル、スニペット、URLを含むJSON出力。

**例：**

```bash
curl -s "http://localhost:8080/search?format=json&q=largest+llm+benchmark+2026"
```

エージェントは訪問するURLのリストを取得し、サイトに応じてCamofoxとCloakBrowserのどちらでブラウジングするかを自律的に決定します。

### フェーズ2 — Camofoxでブラウジング

`localhost:9377`でDockerコンテナ稼働。REST APIを通じて完全なFirefoxブラウザを公開。エージェントはタブの作成、ナビゲーション、クリック、スクロール、任意のJavaScriptの実行、データの構造化が可能。

**含まれるもの：** MozillaのReadability.jsによるクリーンな記事抽出、ナビ、サイドバー、広告を除去（約70%のトークン節約）。

**主要コマンド：**

```bash
# タブを作成してナビゲート
curl -s -X POST "http://localhost:9377/tabs" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bot","url":"https://example.com"}'

# スナップショットを読み取り（アクセシビリティツリー）
curl -s "http://localhost:9377/tabs/<tabId>/snapshot?userId=bot"

# JavaScriptを実行
curl -s -X POST "http://localhost:9377/tabs/<tabId>/evaluate" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CAMOFOX_API_KEY" \
  -d '{"userId":"bot","expression":"document.title"}'
```

### フェーズ3 — CloakBrowserでブラウジング（Camofoxが不十分な場合）

Playwright + `cloakbrowser`ベースのnpmパッケージ。高度なフィンガープリンティングを備えたChromiumブラウザを起動し、Cloudflare、Akamai、DataDomeなどのアンチボットシステムをバイパス。待機とリトライを備えた自動チャレンジ検出。

**利用可能なスクリプト：**

- `cloak-fetch.mjs` — チャレンジ検出付きユニバーサルフェッチ
- `cloak-script.mjs` — カスタムPlaywrightスクリプト実行

**例：**

```bash
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com"
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com" --proxy socks5://... --geoip
```

## なぜCamofoxとCloakBrowserの両方なのか？

スピードとステルスはトレードオフの関係であり、適切なツールはサイトによって異なるからです。

**Camofox — 高速、構造化、永続的。**
CamofoxはCamoufox（C++レベルのFirefoxフォーク）をREST APIでラップし、常時ウォームなブラウザを提供します。約1〜3秒のコールドスタート後、すべてのリクエストはほぼ瞬時です。アクセシビリティスナップショットは生のHTMLより約90%小さく、安定した要素参照（e1、e2、...）により信頼性の高いインタラクションが可能です。高度なアンチボット保護を使用しない約90%のサイト（記事、ドキュメント、検索エンジン、標準的なWebページ）を処理します。

**CloakBrowser — ステルス、アンチボット、オンデマンド。**
CloakBrowserはリクエストごとに新しいChromiumインスタンスを起動します（毎回約1〜3秒の起動時間）。高度なフィンガープリンティング、プロキシサポート、地理位置情報、自動チャレンジ検出を使用して、Cloudflare、Akamai、DataDome、Imperva、PerimeterX、DDoS-Guardをバイパスします。Camofoxをブロックする約10%のサイトに対する最後の手段です。

**実世界の数値：**

| ツール | Cloudflare標準 | Cloudflare Turnstile | DataDome |
|---|---|---|---|
| **Camoufox**（Camofoxエンジン） | 最大 **~92%** [¹] | **~65-78%** [¹] | **60-75%** [¹] |
| **Playwright Stealth** | ~70-80% [¹] | ~40-55% [¹] | ~30-50% [¹] |

- **CloakBrowser**は**58のC++ソースレベルパッチ**を適用し、**0.9 reCAPTCHA v3**（人間レベル、サーバー検証済み）をスコアリングし、Cloudflare TurnstileやFingerprintJSを含むすべての主要なアンチボットテストに合格 [²]
- **Camofox**のコールドスタート：**約1〜3秒**（一度だけ、その後はウォームREST API経由でリクエストあたり約0ms）[³]
- **Playwright/Chromium**のコールドスタート：**約0.5〜6秒**（起動ごと、環境によって異なる）[⁴]

Camofoxが高速パスを処理し、CloakBrowserがエッジケースを処理します。両者でウェブ全体を隙間なくカバーします。エージェントがどちらを使用するかを決定します。

### ソース

¹ "Camoufox Vs Playwright Stealth: Complete Comparison & Alternatives (2026)" — [blog.send.win](https://blog.send.win/camoufox-vs-playwright-stealth-complete-comparison-alternatives-2026/)
² CloakBrowser README — [github.com/cloakhq/cloakbrowser](https://github.com/cloakhq/cloakbrowser)
³ camoufox-pi README (cold start comparison) — [github.com/MonsieurBarti/camoufox-pi](https://github.com/MonsieurBarti/camoufox-pi)
⁴ Playwright issue #4345 (launch time variability) — [github.com/microsoft/playwright/issues/4345](https://github.com/microsoft/playwright/issues/4345)

## インストール

```bash
git clone https://github.com/johell1ns/browser-search
cd browser-search
npm install
```

このREADMEをAIエージェントに渡せば、あなたの環境とプラットフォームに合わせた完全なインストールを行います。

**サービス概要：**

| サービス | 方法 | 参照 |
|---|---|---|
| SearXNG | Docker, `:8080` | [docs.searxng.org](https://docs.searxng.org/admin/installation-docker.html) |
| Camofox | Docker, `:9377` | [github.com/jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser) |
| CloakBrowser | npm（含む） | `scripts/cloak/cloak-fetch.mjs` |

**AIエージェント向け — 以下のファイルを読んでください：**

| ファイル | 内容 |
|---|---|
| `SKILL.md` | 完全なスキル：コマンド、エスカレーション、トラブルシューティング |
| `scripts/cloak/cloak-fetch.mjs` | CloakBrowser CLIの使用法と全オプション |
| `scripts/setup-dependencies.sh` | システム依存関係 |
| `scripts/check-browser-search.sh` | インストール後検証 |
| `docker/setup.md` | Dockerセットアップのヒント |

**注意：** `SKILL.md`は**OpenCode**の構文（`exec`、`curl`）で書かれています。エージェントが異なる形式（Claude Code、Cursorなど）を使用する場合は、これを読んでスキルを使用する前にコマンドをエージェントの構文に変換してください。

## 環境変数

| 変数 | 必要な場面 | デフォルト |
|---|---|---|
| `CAMOFOX_API_KEY` | Camofoxのevaluate、session、cleanup | — |
| `CAMOFOX_ADMIN_KEY` | Camofoxのstopエンドポイント | — |

## このスキルがやらないこと

- **ソーシャルメディア。** Instagram、Facebook、TikTok、LinkedIn、Twitter/Xはログインが必要です。`browser-search`はそれらのブラウジングを試みません。
- **ファイルのダウンロード。** 読み取り専用です（明示的なスクリーンショットを除く）。
- **ペイウォールのバイパス。** 支払いやログインシステムを回避しません。

## 参加する

browser-searchはオープンソースで無料です。役に立ったなら：

- ⭐ **リポジトリにスターを** — 他の人が見つけやすくなります
- 🐛 **Issueを開く** — バグ報告や機能提案
- 🔀 **PRを送信する** — 修正、改善、拡張
- 💬 **共有する** — チーム、Reddit、Twitter、Discordで
- 🧠 **適応させる** — フォークしてSKILL.mdを調整し、自分だけのものに

どんなに小さな貢献でも、これを作り上げていきます。

## ライセンス

MIT
