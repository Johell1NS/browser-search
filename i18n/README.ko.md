# browser-search

<p align="center">
  <img src="../img/logoLarge-browser-search.png" alt="browser-search logo" width="80%">
</p>

> **AI 에이전트를 위한 스킬.** OpenCode, Claude Code, Cursor, OpenClaw 등. SearXNG로 웹 검색, Camofox로 브라우징, CloakBrowser로 보호 우회. 모두 셀프호스팅, 무료, 무제한.

## 왜 필요한가

browser-search는 스킬입니다 — OpenCode, Claude Code, Cursor, OpenClaw 등과 같은 AI 에이전트를 위한 명령어 세트입니다. 세 가지 오케스트레이션된 오픈소스 도구를 사용하여 에이전트가 웹을 검색하고 브라우징하는 방법을 가르칩니다.

문제는 무엇인가? 웹은 자동화에 적대적입니다. Cloudflare, Akamai, DataDome 및 기타 안티봇 시스템은 단순한 요청을 차단합니다. 최신 사이트는 무거운 JavaScript, 지연 로딩 및 클라이언트 측 렌더링을 사용합니다. 단일 솔루션만으로는 충분하지 않습니다.

`browser-search`는 **세 가지 오픈소스 도구**를 AI 에이전트를 위해 설계된 단일 검색 및 브라우징 시스템으로 오케스트레이션합니다. 각 도구에는 역할이 있으며, 에스컬레이션 로직, 자동 선택 및 즉시 사용 가능한 통합을 통해 스킬이 오케스트레이션합니다:

1. **[SearXNG](https://github.com/searxng/searxng)** — 검색 단계를 위한 메타검색 엔진 (다중 소스, JSON)
2. **[Camofox](https://github.com/jo-inc/camofox-browser)** — 표준 사이트를 위한 REST API로 탐색 가능한 브라우저
3. **[CloakBrowser](https://github.com/cloakhq/cloakbrowser)** — 안티봇 보호 사이트를 위한 스텔스 브라우저

일반적인 흐름: 에이전트가 먼저 SearXNG로 검색한 다음, Camofox(또는 사이트가 보호된 경우 CloakBrowser)로 결과를 브라우징합니다.

## 이점

- **100% 무료, 셀프호스팅, 무제한.** API 키 구매 불필요, 구독 불필요, 속도 제한 없음. 모든 것이 여러분의 머신, Docker 및 npm에서 실행됩니다. 무제한 사용, 비용 제로.

- **가벼움, 어디서나 실행.** Raspberry Pi에서 구축 및 테스트 완료 — 거기서 실행되면 어디서나 실행됩니다. 최소한의 리소스 소비, 무거운 인프라 불필요, 저전력 하드웨어에서 24/7 실행.

- **검색 + 브라우징이 하나의 키트에.** 수동 통합 불필요. 검색과 브라우징은 두 가지 별개 단계이며, 둘 다 다룹니다.

- **자동 내비게이션 에스컬레이션.** Camofox가 Cloudflare/Akamai에 차단되면 에이전트가 자동으로 CloakBrowser로 전환합니다.

- **스마트 성능.** 검색 단계에는 SearXNG(밀리초). Camofox와 CloakBrowser는 실제로 필요한 사이트를 브라우징하는 데만 사용됩니다.

- **자동 에이전트 선택.** AI 에이전트가 사용할 도구를 결정합니다: 초기 검색에 SearXNG, 브라우징에 Camofox, 보호된 사이트에 CloakBrowser. 인간의 개입 제로.

- **딥 리서치 모드.** 스킬은 에이전트가 표면적인 답변을 넘어서도록 지시합니다: 여러 각도 탐색, 소스 교차 검증, 모든 측면 커버, 절대 지름길을 택하지 않음.

- **완전히 사용자 정의 가능.** SKILL.md는 일반 텍스트입니다. 핵심 규칙을 편집하고, 자신의 규칙을 추가하고, 필요 없는 것을 제거할 수 있습니다. 워크플로우, 팀, 표준에 맞게 조정하세요.

- **네이티브 스텔스.** CloakBrowser는 Cloudflare, Akamai, DataDome, Imperva, PerimeterX 및 DDoS-Guard 챌린지를 자동 감지하고, 콘텐츠를 추출하기 전에 해결될 때까지 기다립니다.

- **모든 에이전트에서 작동.** SKILL.md는 OpenCode용으로 작성되었지만 로직은 모든 AI 에이전트에서 동일합니다. 동일한 README, 동일한 package.json, 모든 것이 어디서나 작동합니다. 에이전트에게 해당 환경에 맞게 스킬을 변환하도록 요청하세요.

## 🏆 최신 기술

이 세 가지 도구는 현재 시장에서 사용 가능한 최신 기술을 대표하기 때문에 선택되었습니다. 이러한 스킬은 진화하도록 설계되었습니다: 더 나은 도구가 등장하면 SKILL.md의 몇 줄만 업데이트하면 교체할 수 있습니다. 🔄

⭐ **저장소에 스타를 달고 팔로우**하여 새로운 도구, 흐름 개선 및 오케스트레이션 업데이트에 대한 최신 정보를 받아보세요. 🚀

## 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    browser-search                        │
│                                                         │
│  ┌──────────────┐                                       │
│  │    검색       │                                       │
│  │               │                                       │
│  │  SearXNG      │  검색 엔진 → URL                     │
│  │  (Docker)     │  JSON 결과, 빠름                     │
│  │  :8080        │                                       │
│  └──────────────┘                                       │
│         │                                                │
│         │ 결과 준비 → 브라우징 시작                       │
│         ↓                                                │
│  ┌─────────────────────────────────────┐                │
│  │          브라우징                    │                │
│  │                                      │                │
│  │  ┌──────────────┐                   │                │
│  │  │   Camofox    │  브라우저 + REST  │                │
│  │  │  (Docker)    │  JS, 클릭, 평가   │                │
│  │  │  :9377       │                   │                │
│  │  └──────┬───────┘                   │                │
│  │         │                           │                │
│  │         │ 차단된 경우                │                │
│  │         ↓                           │                │
│  │  ┌──────────────┐                   │                │
│  │  │ CloakBrowser │  스텔스 Chromium  │                │
│  │  │   (npm)      │  안티봇, 프록시   │                │
│  │  └──────────────┘                   │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## 작동 방식

### 1단계 — SearXNG로 검색

`localhost:8080`에서 Docker 컨테이너 실행. Google, Wikipedia, Bing, DuckDuckGo 등을 동시에 쿼리하는 메타검색 엔진. 제목, 스니펫 및 URL이 포함된 JSON 출력.

**예시:**

```bash
curl -s "http://localhost:8080/search?format=json&q=largest+llm+benchmark+2026"
```

이제 에이전트는 방문할 URL 목록을 가지고 사이트에 따라 Camofox 또는 CloakBrowser로 브라우징할지 자율적으로 결정합니다.

### 2단계 — Camofox로 브라우징

`localhost:9377`에서 Docker 컨테이너 실행. REST API를 통해 완전한 Firefox 브라우저를 노출합니다. 에이전트는 탭 생성, 탐색, 클릭, 스크롤, 임의 JavaScript 실행 및 데이터 구조화가 가능합니다.

**포함:** Mozilla의 Readability.js로 깔끔한 기사 추출, 네비게이션, 사이드바, 광고 제거 (약 70% 토큰 절약).

**주요 명령어:**

```bash
# 탭 생성 및 탐색
curl -s -X POST "http://localhost:9377/tabs" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bot","url":"https://example.com"}'

# 스냅샷 읽기 (접근성 트리)
curl -s "http://localhost:9377/tabs/<tabId>/snapshot?userId=bot"

# JavaScript 실행
curl -s -X POST "http://localhost:9377/tabs/<tabId>/evaluate" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CAMOFOX_API_KEY" \
  -d '{"userId":"bot","expression":"document.title"}'
```

### 3단계 — CloakBrowser로 브라우징 (Camofox가 충분하지 않을 때)

Playwright + `cloakbrowser` 기반 npm 패키지. 고급 핑거프린팅을 갖춘 Chromium 브라우저를 실행하여 Cloudflare, Akamai, DataDome 및 기타 안티봇 시스템을 우회합니다. 대기 및 재시도 기능을 갖춘 자동 챌린지 감지.

**사용 가능한 스크립트:**

- `cloak-fetch.mjs` — 챌린지 감지 기능이 있는 범용 페치
- `cloak-script.mjs` — 사용자 정의 Playwright 스크립트 실행

**예시:**

```bash
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com"
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com" --proxy socks5://... --geoip
```

## 왜 Camofox와 CloakBrowser 둘 다인가?

속도와 스텔스는 트레이드오프이며, 올바른 도구는 사이트에 따라 다르기 때문입니다.

**Camofox — 빠름, 구조화됨, 지속적.**
Camofox는 Camoufox(C++ 수준의 Firefox 포크)를 REST API로 래핑하여 항상 웜 상태인 브라우저를 제공합니다. 약 1~3초의 콜드 스타트 후 모든 요청이 거의 즉각적입니다. 접근성 스냅샷은 원시 HTML보다 약 90% 작으며, 안정적인 요소 참조(e1, e2, ...)로 안정적인 상호작용이 가능합니다. 고급 안티봇 보호를 사용하지 않는 약 90%의 사이트(기사, 문서, 검색 엔진, 표준 웹 페이지)를 처리합니다.

**CloakBrowser — 스텔스, 안티봇, 온디맨드.**
CloakBrowser는 요청당 새 Chromium 인스턴스를 실행합니다(매번 약 1~3초 시작). 고급 핑거프린팅, 프록시 지원, 지리적 위치 및 자동 챌린지 감지를 사용하여 Cloudflare, Akamai, DataDome, Imperva, PerimeterX 및 DDoS-Guard를 우회합니다. Camofox를 차단하는 약 10%의 사이트에 대한 최후의 수단입니다.

**실제 수치:**

| 도구 | Cloudflare 표준 | Cloudflare Turnstile | DataDome |
|---|---|---|---|
| **Camoufox**(Camofox 엔진) | 최대 **~92%** [¹] | **~65-78%** [¹] | **60-75%** [¹] |
| **Playwright Stealth** | ~70-80% [¹] | ~40-55% [¹] | ~30-50% [¹] |

- **CloakBrowser**는 **58개의 C++ 소스 수준 패치**를 적용하고 **0.9 reCAPTCHA v3**(인간 수준, 서버 검증됨)를 점수화하여 Cloudflare Turnstile 및 FingerprintJS를 포함한 모든 주요 안티봇 테스트 통과 [²]
- **Camofox** 콜드 스타트: **약 1~3초**(한 번, 그 후 웜 REST API를 통해 요청당 약 0ms) [³]
- **Playwright/Chromium** 콜드 스타트: **약 0.5~6초**(실행할 때마다, 환경에 따라 다름) [⁴]

Camofox는 빠른 경로를 처리합니다. CloakBrowser는 엣지 케이스를 처리합니다. 함께 웹 전체를 간격 없이 커버합니다. 에이전트가 사용할 도구를 결정합니다.

### 출처

¹ "Camoufox Vs Playwright Stealth: Complete Comparison & Alternatives (2026)" — [blog.send.win](https://blog.send.win/camoufox-vs-playwright-stealth-complete-comparison-alternatives-2026/)
² CloakBrowser README — [github.com/cloakhq/cloakbrowser](https://github.com/cloakhq/cloakbrowser)
³ camoufox-pi README (cold start comparison) — [github.com/MonsieurBarti/camoufox-pi](https://github.com/MonsieurBarti/camoufox-pi)
⁴ Playwright issue #4345 (launch time variability) — [github.com/microsoft/playwright/issues/4345](https://github.com/microsoft/playwright/issues/4345)

## 설치

```bash
git clone https://github.com/johell1ns/browser-search
cd browser-search
npm install
```

이 README를 AI 에이전트에 보여주면 환경과 플랫폼에 맞게 완전히 설치합니다.

**서비스 개요:**

| 서비스 | 방법 | 참조 |
|---|---|---|
| SearXNG | Docker, `:8080` | [docs.searxng.org](https://docs.searxng.org/admin/installation-docker.html) |
| Camofox | Docker, `:9377` | [github.com/jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser) |
| CloakBrowser | npm (포함) | `scripts/cloak/cloak-fetch.mjs` |

**AI 에이전트용 — 다음 파일을 읽으세요:**

| 파일 | 내용 |
|---|---|
| `SKILL.md` | 전체 스킬: 명령어, 에스컬레이션, 문제 해결 |
| `scripts/cloak/cloak-fetch.mjs` | CloakBrowser CLI 사용법 및 모든 옵션 |
| `scripts/setup-dependencies.sh` | 시스템 종속성 |
| `scripts/check-browser-search.sh` | 설치 후 검증 |
| `docker/setup.md` | Docker 설정 팁 |

**참고:** `SKILL.md`는 **OpenCode** 구문(`exec`, `curl`)으로 작성되었습니다. 에이전트가 다른 형식(Claude Code, Cursor 등)을 사용하는 경우, 이를 읽고 스킬을 사용하기 전에 명령어를 에이전트 구문으로 변환하세요.

## 환경 변수

| 변수 | 필요한 경우 | 기본값 |
|---|---|---|
| `CAMOFOX_API_KEY` | Camofox의 evaluate, session, cleanup | — |
| `CAMOFOX_ADMIN_KEY` | Camofox stop 엔드포인트 | — |

## 이 스킬이 하지 않는 것

- **소셜 미디어.** Instagram, Facebook, TikTok, LinkedIn 및 Twitter/X는 로그인이 필요합니다. `browser-search`는 이를 브라우징하지 않습니다.
- **파일 다운로드.** 읽기 전용입니다(명시적 스크린샷 제외).
- **페이월 우회.** 결제 또는 로그인 시스템을 회피하지 않습니다.

## 참여하기

browser-search는 오픈소스이며 무료입니다. 유용하다고 생각하신다면:

- ⭐ **저장소에 스타를** — 다른 사람들이 발견하는 데 도움이 됩니다
- 🐛 **Issue 열기** — 버그 신고 또는 기능 제안
- 🔀 **PR 제출하기** — 수정, 개선, 확장
- 💬 **공유하기** — 팀, Reddit, Twitter, Discord에서
- 🧠 **적응시키기** — 포크하고 SKILL.md를 조정하여 나만의 것으로 만드세요

작은 기여라도 모두 이 프로젝트를 더 좋게 만듭니다.

## 라이선스

MIT
