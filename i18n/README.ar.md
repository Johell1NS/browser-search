# بحث-المتصفح

<p align="center">
  <img src="../img/logoLarge-browser-search.png" alt="browser-search logo" width="80%">
</p>

> **مهارة لوكلاء الذكاء الاصطناعي.** OpenCode، Claude Code، Cursor، OpenClaw وغيرهم. ابحث في الويب باستخدام SearXNG، تصفح باستخدام Camofox، تجاوز الحماية باستخدام CloakBrowser. كل شيء مستضاف ذاتياً، مجاني، غير محدود.

## لماذا هي موجودة

browser-search هي مهارة — مجموعة تعليمات لوكلاء الذكاء الاصطناعي مثل OpenCode وClaude Code وCursor وOpenClaw وغيرهم. إنها تعلم وكيلك كيفية البحث والتصفح في الويب باستخدام ثلاث أدوات مفتوحة المصدر منسقة.

المشكلة؟ الويب معادٍ للأتمتة. Cloudflare وAkamai وDataDome وأنظمة مكافحة البوت الأخرى تمنع الطلبات البسيطة. المواقع الحديثة تستخدم JavaScript ثقيلاً وتحميلاً بطيئاً وعرضاً من جانب العميل. حل واحد لا يكفي.

`browser-search` ينسق **ثلاث أدوات مفتوحة المصدر** في نظام بحث وتصفح واحد مصمم لوكلاء الذكاء الاصطناعي. كل أداة لها دورها، يتم تنسيقها بواسطة المهارة مع منطق التصعيد والاختيار التلقائي والتكامل الجاهز للاستخدام:

1. **[SearXNG](https://github.com/searxng/searxng)** — محرك بحث وصفي لمرحلة البحث (متعدد المصادر، JSON)
2. **[Camofox](https://github.com/jo-inc/camofox-browser)** — متصفح يمكن الوصول إليه عبر REST API للمواقع القياسية
3. **[CloakBrowser](https://github.com/cloakhq/cloakbrowser)** — متصفح متخفي للمواقع المحمية بمكافحة البوت

التدفق النموذجي: يبحث الوكيل أولاً باستخدام SearXNG، ثم يتصفح النتائج باستخدام Camofox (أو CloakBrowser إذا كان الموقع محمياً).

## الفوائد

- **مجاني 100%، مستضاف ذاتياً، غير محدود.** لا حاجة لشراء مفاتيح API، لا اشتراكات، لا حدود للمعدل. كل شيء يعمل على جهازك، Docker وnpm. استخدام غير محدود، تكلفة صفرية.

- **خفيف، يعمل في أي مكان.** تم بناؤه واختباره على Raspberry Pi — إذا كان يعمل هناك، فإنه يعمل في كل مكان. استهلاك موارد ضئيل، لا حاجة لبنية تحتية ثقيلة، يعمل 24/7 على أجهزة منخفضة الطاقة.

- **بحث + تصفح في حزمة واحدة.** لا حاجة لتكامل يدوي. البحث والتصفح مرحلتان متميزتان، كلتاهما مغطاة.

- **تصعيد تلقائي للتنقل.** إذا تم حظر Camofox بواسطة Cloudflare/Akamai، يتحول الوكيل تلقائياً إلى CloakBrowser.

- **أداء ذكي.** SearXNG لمرحلة البحث (ملي ثانية). Camofox وCloakBrowser يُستخدمان فقط لتصفح المواقع التي تحتاج ذلك فعلاً.

- **اختيار تلقائي للوكيل.** وكيل الذكاء الاصطناعي يقرر أي أداة يستخدم: SearXNG للبحث الأولي، Camofox للتصفح، CloakBrowser إذا كان الموقع محمياً. تدخل بشري صفري.

- **وضع البحث العميق.** المهارة توجه الوكيل لتجاوز الإجابات السطحية: استكشاف زوايا متعددة، التحقق من المصادر بشكل متقاطع، تغطية كل جانب، وعدم أخذ اختصارات أبداً.

- **قابل للتخصيص بالكامل.** SKILL.md هو نص عادي. يمكنك تحرير القواعد الأساسية، إضافة قواعدك الخاصة، إزالة ما لا تحتاجه. كيّفه مع سير عملك، فريقك، معاييرك.

- **تخفي أصلي.** CloakBrowser يكتشف تلقائياً تحديات Cloudflare وAkamai وDataDome وImperva وPerimeterX وDDoS-Guard، وينتظر حلها قبل استخراج المحتوى.

- **يعمل مع أي وكيل.** SKILL.md مكتوب لـ OpenCode، لكن المنطق متطابق لأي وكيل ذكاء اصطناعي. نفس README، نفس package.json، كل شيء يعمل في كل مكان. فقط اطلب من وكيلك تحويل المهارة لبيئته.

## 🏆 أحدث ما توصلت إليه التكنولوجيا

تم اختيار هذه الأدوات الثلاث لأنها تمثل أحدث ما توصلت إليه التكنولوجيا المتاحة اليوم. مثل هذه المهارة مصممة لتتطور: عندما تظهر أدوات أفضل، كل ما يتطلبه الأمر هو تحديث SKILL.md لاستبدالها. 🔄

⭐ **ضع نجمة على المستودع وتابع** لتبقى على اطلاع دائم بالأدوات الجديدة وتحسينات التدفق وتحديثات التنسيق. 🚀

## البنية

```
┌─────────────────────────────────────────────────────────┐
│                    browser-search                        │
│                                                         │
│  ┌──────────────┐                                       │
│  │    بحث       │                                       │
│  │               │                                       │
│  │  SearXNG      │  محركات البحث ← URLs                 │
│  │  (Docker)     │  نتائج JSON، سريعة                   │
│  │  :8080        │                                       │
│  └──────────────┘                                       │
│         │                                                │
│         │ النتائج جاهزة → للتصفح                         │
│         ↓                                                │
│  ┌─────────────────────────────────────┐                │
│  │          تصفح                       │                │
│  │                                      │                │
│  │  ┌──────────────┐                   │                │
│  │  │   Camofox    │  متصفح + REST    │                │
│  │  │  (Docker)    │  JS، نقرة، تقييم  │                │
│  │  │  :9377       │                   │                │
│  │  └──────┬───────┘                   │                │
│  │         │                           │                │
│  │         │ إذا تم الحظر              │                │
│  │         ↓                           │                │
│  │  ┌──────────────┐                   │                │
│  │  │ CloakBrowser │  Chromium متخفي   │                │
│  │  │   (npm)      │  مضاد للبوت، وكيل │                │
│  │  └──────────────┘                   │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## كيف يعمل

### المرحلة 1 — البحث باستخدام SearXNG

حاوية Docker على `localhost:8080`. محرك بحث وصفي يستعلم Google وWikipedia وBing وDuckDuckGo والعديد من الآخرين في وقت واحد. مخرجات JSON مع عناوين ومقتطفات وروابط URL.

**مثال:**

```bash
curl -s "http://localhost:8080/search?format=json&q=largest+llm+benchmark+2026"
```

الوكيل لديه الآن قائمة عناوين URL لزيارتها ويقرر بشكل مستقل ما إذا كان سيتصفحها باستخدام Camofox أو CloakBrowser بناءً على الموقع.

### المرحلة 2 — التصفح باستخدام Camofox

حاوية Docker على `localhost:9377`. يعرض متصفح Firefox كاملاً عبر REST API. يمكن للوكيل إنشاء علامات تبويب، والتنقل، والنقر، والتمرير، وتنفيذ JavaScript عشوائي، وهيكلة البيانات.

**يشمل:** Readability.js من Mozilla لاستخراج مقالات نظيفة، مع إزالة التنقل والشريط الجانبي والإعلانات (توفير ~70% من الرموز).

**الأوامر الرئيسية:**

```bash
# إنشاء علامة تبويب والتنقل
curl -s -X POST "http://localhost:9377/tabs" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bot","url":"https://example.com"}'

# قراءة لقطة (شجرة الوصول)
curl -s "http://localhost:9377/tabs/<tabId>/snapshot?userId=bot"

# تنفيذ JavaScript
curl -s -X POST "http://localhost:9377/tabs/<tabId>/evaluate" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CAMOFOX_API_KEY" \
  -d '{"userId":"bot","expression":"document.title"}'
```

### المرحلة 3 — التصفح باستخدام CloakBrowser (عندما لا يكون Camofox كافياً)

حزمة npm مبنية على Playwright + `cloakbrowser`. تطلق متصفح Chromium ببصمة رقمية متقدمة لتجاوز Cloudflare وAkamai وDataDome وأنظمة مكافحة البوت الأخرى. كشف تلقائي للتحديات مع الانتظار وإعادة المحاولة.

**البرامج النصية المتاحة:**

- `cloak-fetch.mjs` — جلب عالمي مع كشف التحديات
- `cloak-script.mjs` — تنفيذ برنامج Playwright مخصص

**مثال:**

```bash
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com"
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com" --proxy socks5://... --geoip
```

## لماذا كل من Camofox وCloakBrowser؟

لأن السرعة والتخفي هما مقايضة، والأداة المناسبة تعتمد على الموقع.

**Camofox — سريع، منظم، دائم.**
Camofox يغلف Camoufox (شوكة Firefox على مستوى C++) في REST API مع متصفح دافئ دائماً. بعد بدء بارد ~1-3ث، كل طلب يكاد يكون فورياً. لقطات الوصول الخاصة به أصغر بنسبة ~90% من HTML الخام، مع مراجع عناصر مستقرة (e1، e2، ...) للتفاعل الموثوق. يتعامل مع ~90% من المواقع التي لا تستخدم حماية متقدمة لمكافحة البوت: المقالات، المستندات، محركات البحث، صفحات الويب القياسية.

**CloakBrowser — متخفي، مضاد للبوت، عند الطلب.**
CloakBrowser يطلق مثيل Chromium جديد لكل طلب (~1-3ث بدء في كل مرة). يستخدم بصمة رقمية متقدمة، دعم وكيل، تحديد الموقع الجغرافي، وكشف التحديات التلقائي لتجاوز Cloudflare وAkamai وDataDome وImperva وPerimeterX وDDoS-Guard. إنه الملاذ الأخير لـ ~10% من المواقع التي تحظر Camofox.

**أرقام من العالم الحقيقي:**

| الأداة | Cloudflare قياسي | Cloudflare Turnstile | DataDome |
|---|---|---|---|
| **Camoufox** (محرك Camofox) | حتى **~92%** [¹] | **~65-78%** [¹] | **60-75%** [¹] |
| **Playwright Stealth** | ~70-80% [¹] | ~40-55% [¹] | ~30-50% [¹] |

- **CloakBrowser** يطبق **58 تصحيحاً على مستوى كود مصدر C++** ويحقق **0.9 reCAPTCHA v3** (مستوى بشري، تم التحقق منه بالخادم)، مجتازاً جميع اختبارات مكافحة البوت الرئيسية بما في ذلك Cloudflare Turnstile وFingerprintJS [²]
- **Camofox** بدء بارد: **~1-3ث** (مرة واحدة، ثم ~0ملث لكل طلب عبر REST API دافئ) [³]
- **Playwright/Chromium** بدء بارد: **~0.5-6ث** (كل إطلاق، يختلف حسب البيئة) [⁴]

Camofox يتعامل مع المسار السريع. CloakBrowser يتعامل مع الحالات الحدية. معاً يغطيان الويب بأكمله دون ثغرات. الوكيل يقرر أي منهما يستخدم.

### المصادر

¹ "Camoufox Vs Playwright Stealth: Complete Comparison & Alternatives (2026)" — [blog.send.win](https://blog.send.win/camoufox-vs-playwright-stealth-complete-comparison-alternatives-2026/)
² CloakBrowser README — [github.com/cloakhq/cloakbrowser](https://github.com/cloakhq/cloakbrowser)
³ camoufox-pi README (cold start comparison) — [github.com/MonsieurBarti/camoufox-pi](https://github.com/MonsieurBarti/camoufox-pi)
⁴ Playwright issue #4345 (launch time variability) — [github.com/microsoft/playwright/issues/4345](https://github.com/microsoft/playwright/issues/4345)

## التثبيت

```bash
git clone https://github.com/johell1ns/browser-search
cd browser-search
npm install
```

أظهر هذا README لوكيل الذكاء الاصطناعي الخاص بك لتثبيت كامل مصمم خصيصاً لبيئتك ومنصتك.

**نظرة عامة على الخدمات:**

| الخدمة | الطريقة | المرجع |
|---|---|---|
| SearXNG | Docker، `:8080` | [docs.searxng.org](https://docs.searxng.org/admin/installation-docker.html) |
| Camofox | Docker، `:9377` | [github.com/jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser) |
| CloakBrowser | npm (مضمن) | `scripts/cloak/cloak-fetch.mjs` |

**لوكيل الذكاء الاصطناعي — اقرأ هذه الملفات:**

| الملف | ما يحتويه |
|---|---|
| `SKILL.md` | المهارة الكاملة: الأوامر، التصعيد، استكشاف الأخطاء |
| `scripts/cloak/cloak-fetch.mjs` | استخدام واجهة CLI لـ CloakBrowser وجميع الخيارات |
| `scripts/setup-dependencies.sh` | تبعيات النظام |
| `scripts/check-browser-search.sh` | التحقق بعد التثبيت |
| `docker/setup.md` | نصائح إعداد Docker |

**ملاحظة:** `SKILL.md` مكتوب بناء جملة **OpenCode** (`exec`، `curl`). إذا كان وكيلك يستخدم تنسيقاً مختلفاً (Claude Code، Cursor، إلخ)، اقرأه وحوّل الأوامر إلى بناء جملة وكيلك قبل استخدام المهارة.

## متغيرات البيئة

| المتغير | مطلوب لـ | الافتراضي |
|---|---|---|
| `CAMOFOX_API_KEY` | evaluate، session، cleanup في Camofox | — |
| `CAMOFOX_ADMIN_KEY` | نقطة إيقاف Camofox | — |

## ما لا تفعله هذه المهارة

- **وسائل التواصل الاجتماعي.** Instagram وFacebook وTikTok وLinkedIn وTwitter/X تتطلب تسجيل الدخول. `browser-search` لا يحاول تصفحها.
- **تحميل الملفات.** هو للقراءة فقط (باستثناء لقطات الشاشة الصريحة).
- **تجاوز جدران الدفع.** لا يتجاوز أنظمة الدفع أو تسجيل الدخول.

## شارك

browser-search مفتوح المصدر ومجاني. إذا وجدته مفيداً:

- ⭐ **ضع نجمة على المستودع** — يساعد الآخرين على اكتشافه
- 🐛 **افتح issue** — أبلغ عن الأخطاء أو اقترح ميزات
- 🔀 **أرسل PR** — أصلح، حسن، وسع
- 💬 **شاركه** — مع فريقك، على Reddit، Twitter، Discord
- 🧠 **كيّفه** — انسخ المستودع، عدّل SKILL.md، اجعله ملكك

كل مساهمة، مهما كانت صغيرة، تجعله أفضل.

## الترخيص

MIT
