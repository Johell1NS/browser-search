# browser-search

<p align="center">
  <a href="https://skills.sh/Johell1NS/browser-search"><img src="https://skills.sh/b/Johell1NS/browser-search" alt="skills.sh"></a>
</p>

<p align="center">
  <img src="../img/logoLarge-browser-search.png" alt="browser-search logo" width="80%">
</p>

> **AI एजेंटों के लिए एक स्किल।** OpenCode, Claude Code, Cursor, OpenClaw और अन्य। SearXNG के साथ वेब पर खोजें, Camofox के साथ ब्राउज़ करें, CloakBrowser के साथ सुरक्षा को बायपास करें। **डिज़ाइन द्वारा एंटी-हैलुसिनेशन।** पूरी तरह से self-hosted, मुफ़्त, असीमित।

## यह क्यों मौजूद है

browser-search एक SKILL है — OpenCode, Claude Code, Cursor, OpenClaw और अन्य जैसे AI एजेंटों के लिए निर्देशों का एक सेट। यह आपके एजेंट को सिखाता है कि तीन ऑर्केस्ट्रेटेड ओपन सोर्स टूल का उपयोग करके वेब पर कैसे खोजें और ब्राउज़ करें।

समस्या? वेब ऑटोमेशन के लिए शत्रुतापूर्ण है। Cloudflare, Akamai, DataDome और अन्य एंटी-बॉट सिस्टम सरल अनुरोधों को ब्लॉक करते हैं। आधुनिक साइटें भारी JavaScript, लेज़ी लोडिंग और क्लाइंट-साइड रेंडरिंग का उपयोग करती हैं। एक ही समाधान पर्याप्त नहीं है।

`browser-search` **तीन ओपन सोर्स टूल** को एक एकल खोज और ब्राउज़िंग सिस्टम में ऑर्केस्ट्रेट करता है जो AI एजेंटों के लिए डिज़ाइन किया गया है। प्रत्येक टूल की अपनी भूमिका है, जिसे स्किल द्वारा एस्केलेशन लॉजिक, स्वचालित चयन और उपयोग के लिए तैयार एकीकरण के साथ ऑर्केस्ट्रेट किया गया है:

1. **[SearXNG](https://github.com/searxng/searxng)** — खोज चरण के लिए मेटासर्च इंजन (मल्टी-सोर्स, JSON)
2. **[Camofox](https://github.com/jo-inc/camofox-browser)** — मानक साइटों के लिए REST API के माध्यम से नेविगेट किया जा सकने वाला ब्राउज़र
3. **[CloakBrowser](https://github.com/cloakhq/cloakbrowser)** — एंटी-बॉट संरक्षित साइटों के लिए स्टील्थ ब्राउज़र

सामान्य प्रवाह: एजेंट पहले SearXNG से खोजता है, फिर Camofox (या CloakBrowser यदि साइट संरक्षित है) के साथ परिणामों को ब्राउज़ करता है।

## लाभ

- **100% मुफ़्त, self-hosted, असीमित।** खरीदने के लिए कोई API कुंजी नहीं, कोई सब्सक्रिप्शन नहीं, कोई दर सीमा नहीं। सब कुछ आपकी मशीन पर, Docker और npm पर चलता है। असीमित उपयोग, शून्य लागत।

- **हल्का, कहीं भी चलता है।** Raspberry Pi पर बनाया और परीक्षण किया गया — यदि यह वहाँ चलता है, तो यह हर जगह चलता है। न्यूनतम संसाधन खपत, कोई भारी बुनियादी ढाँचा आवश्यक नहीं, कम-शक्ति वाले हार्डवेयर पर 24/7 चलता है।

- **एक किट में खोज + ब्राउज़िंग।** किसी मैन्युअल एकीकरण की आवश्यकता नहीं। खोज और ब्राउज़िंग दो अलग-अलग चरण हैं, दोनों कवर किए गए हैं।

- **स्वचालित नेविगेशन एस्केलेशन।** यदि Camofox Cloudflare/Akamai द्वारा ब्लॉक हो जाता है, तो एजेंट स्वचालित रूप से CloakBrowser पर स्विच करता है।

- **स्मार्ट प्रदर्शन।** खोज चरण के लिए SearXNG (मिलीसेकंड)। Camofox और CloakBrowser केवल उन साइटों को ब्राउज़ करने के लिए उपयोग किए जाते हैं जिन्हें वास्तव में इसकी आवश्यकता है।

- **स्वचालित एजेंट चयन।** AI एजेंट तय करता है कि कौन सा टूल उपयोग करना है: प्रारंभिक खोज के लिए SearXNG, ब्राउज़िंग के लिए Camofox, यदि साइट संरक्षित है तो CloakBrowser। शून्य मानव हस्तक्षेप।

- **डिज़ाइन द्वारा एंटी-हैलुसिनेशन।** स्किल का डीप रिसर्च मोड "पहले खोजें, फिर उत्तर दें" वर्कफ़्लो लागू करता है: एजेंट को प्रत्येक तथ्यात्मक दावे को लाइव वेब स्रोतों के खिलाफ सत्यापित करना चाहिए, कई कोणों को क्रॉस-रेफरेंस करना चाहिए, और कभी अनुमान नहीं लगाना चाहिए। अब और मनगढ़ंत उत्तर नहीं।

- **पूरी तरह से अनुकूलन योग्य।** SKILL.md सादा टेक्स्ट है। आप मुख्य नियमों को संपादित कर सकते हैं, अपने खुद के जोड़ सकते हैं, जो आपको चाहिए उसे हटा सकते हैं। इसे अपने वर्कफ़्लो, अपनी टीम, अपने मानकों के अनुसार अनुकूलित करें।

- **नेटिव स्टील्थ।** CloakBrowser स्वचालित रूप से Cloudflare, Akamai, DataDome, Imperva, PerimeterX और DDoS-Guard चुनौतियों का पता लगाता है, और सामग्री निकालने से पहले उनके हल होने की प्रतीक्षा करता है।

- **किसी भी एजेंट के साथ काम करता है।** SKILL.md OpenCode के लिए लिखी गई है, लेकिन तर्क किसी भी AI एजेंट के लिए समान है। एक ही README, एक ही package.json, सब कुछ हर जगह काम करता है। बस अपने एजेंट से पूछें कि स्किल को उसके वातावरण में कैसे बदलना है।

## 🏆 अत्याधुनिक

ये तीन टूल चुने गए क्योंकि वे आज उपलब्ध अत्याधुनिक तकनीक का प्रतिनिधित्व करते हैं। इस तरह की एक स्किल विकसित होने के लिए डिज़ाइन की गई है: जब बेहतर टूल सामने आते हैं, तो SKILL.md को अपडेट करना ही उन्हें बदलने के लिए पर्याप्त है। 🔄

⭐ **रिपो को स्टार करें और फ़ॉलो करें** ताकि नए टूल, प्रवाह सुधार और समय के साथ ऑर्केस्ट्रेशन अपडेट पर अपडेटेड रहें। 🚀

## आर्किटेक्चर

```
┌─────────────────────────────────────────────────────────┐
│                    browser-search                        │
│                                                         │
│  ┌──────────────┐                                       │
│  │    Search     │                                       │
│  │               │                                       │
│  │  SearXNG      │  search engines → URLs               │
│  │  (Docker)     │  JSON results, fast                  │
│  │  :8080        │                                       │
│  └──────────────┘                                       │
│         │                                                │
│         │ results ready → to browse                      │
│         ↓                                                │
│  ┌─────────────────────────────────────┐                │
│  │           Browsing                   │                │
│  │                                      │                │
│  │  ┌──────────────┐                   │                │
│  │  │   Camofox    │  browser + REST   │                │
│  │  │  (Docker)    │  JS, click, eval  │                │
│  │  │  :9377       │                   │                │
│  │  └──────┬───────┘                   │                │
│  │         │                           │                │
│  │         │ if blocked                │                │
│  │         ↓                           │                │
│  │  ┌──────────────┐                   │                │
│  │  │ CloakBrowser │  stealth Chromium │                │
│  │  │   (npm)      │  anti-bot, proxy  │                │
│  │  └──────────────┘                   │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

## यह कैसे काम करता है

### चरण 1 — SearXNG के साथ खोजें

`localhost:8080` पर Docker कंटेनर। मेटासर्च इंजन जो Google, Wikipedia, Bing, DuckDuckGo और कई अन्य को एक साथ क्वेरी करता है। शीर्षकों, स्निपेट और URL के साथ JSON आउटपुट।

**उदाहरण:**

```bash
curl -s "http://localhost:8080/search?format=json&q=largest+llm+benchmark+2026"
```

एजेंट के पास अब विज़िट करने के लिए URL की एक सूची है और वह स्वायत्त रूप से तय करता है कि साइट के आधार पर उन्हें Camofox या CloakBrowser से ब्राउज़ करना है या नहीं।

### चरण 2 — Camofox के साथ ब्राउज़ करें

`localhost:9377` पर Docker कंटेनर। REST API के माध्यम से एक पूर्ण Firefox ब्राउज़र को उजागर करता है। एजेंट टैब बना सकता है, नेविगेट कर सकता है, क्लिक कर सकता है, स्क्रॉल कर सकता है, मनमाना JavaScript निष्पादित कर सकता है और डेटा संरचित कर सकता है।

**शामिल है:** साफ़ लेख निकालने के लिए Mozilla का Readability.js, नेविगेशन, साइडबार और विज्ञापन हटाना (~70% टोकन बचत)।

**मुख्य कमांड:**

```bash
# टैब बनाएं और नेविगेट करें
curl -s -X POST "http://localhost:9377/tabs" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bot","url":"https://example.com"}'

# स्नैपशॉट पढ़ें (एक्सेसिबिलिटी ट्री)
curl -s "http://localhost:9377/tabs/<tabId>/snapshot?userId=bot"

# JavaScript निष्पादित करें
curl -s -X POST "http://localhost:9377/tabs/<tabId>/evaluate" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CAMOFOX_API_KEY" \
  -d '{"userId":"bot","expression":"document.title"}'
```

### चरण 3 — CloakBrowser के साथ ब्राउज़ करें (जब Camofox पर्याप्त न हो)

Playwright + `cloakbrowser` पर आधारित npm पैकेज। Cloudflare, Akamai, DataDome और अन्य एंटी-बॉट सिस्टम को बायपास करने के लिए उन्नत फ़िंगरप्रिंटिंग के साथ एक Chromium ब्राउज़र लॉन्च करता है। प्रतीक्षा और पुनः प्रयास के साथ स्वचालित चैलेंज डिटेक्शन।

**उपलब्ध स्क्रिप्ट:**

- `cloak-fetch.mjs` — चैलेंज डिटेक्शन के साथ यूनिवर्सल फ़ेच
- `cloak-script.mjs` — कस्टम Playwright स्क्रिप्ट निष्पादन

**उदाहरण:**

```bash
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com"
node scripts/cloak/cloak-fetch.mjs "https://protected-site.com" --proxy socks5://... --geoip
```

## Camofox और CloakBrowser दोनों क्यों?

क्योंकि गति और स्टील्थ एक समझौता है, और सही टूल साइट पर निर्भर करता है।

**Camofox — तेज़, संरचित, स्थायी।**
Camofox Camoufox (Firefox का C++-स्तरीय फ़ोर्क) को एक REST API में लपेटता है जिसमें हमेशा-गर्म ब्राउज़र होता है। ~1-3s कोल्ड स्टार्ट के बाद, हर अनुरोध लगभग तुरंत होता है। इसके एक्सेसिबिलिटी स्नैपशॉट कच्चे HTML से ~90% छोटे होते हैं, जिनमें विश्वसनीय इंटरैक्शन के लिए स्थिर एलिमेंट रेफरेंस (e1, e2, ...) होते हैं। यह ~90% साइटों को संभालता है जो उन्नत एंटी-बॉट सुरक्षा का उपयोग नहीं करती हैं: लेख, दस्तावेज़, खोज इंजन, मानक वेब पेज।

**CloakBrowser — स्टील्थ, एंटी-बॉट, ऑन-डिमांड।**
CloakBrowser प्रति अनुरोध एक नया Chromium इंस्टेंस लॉन्च करता है (हर बार ~1-3s स्टार्टअप)। यह Cloudflare, Akamai, DataDome, Imperva, PerimeterX और DDoS-Guard को बायपास करने के लिए उन्नत फ़िंगरप्रिंटिंग, प्रॉक्सी सपोर्ट, जियोआईपी और स्वचालित चैलेंज डिटेक्शन का उपयोग करता है। यह ~10% साइटों के लिए अंतिम विकल्प है जो Camofox को ब्लॉक करती हैं।

**वास्तविक दुनिया के आंकड़े:**

| टूल | Cloudflare standard | Cloudflare Turnstile | DataDome |
|---|---|---|---|
| **Camoufox** (Camofox इंजन) | **~92%** तक [¹] | **~65-78%** [¹] | **60-75%** [¹] |
| **Playwright Stealth** | ~70-80% [¹] | ~40-55% [¹] | ~30-50% [¹] |

- **CloakBrowser** **58 C++ स्रोत-स्तरीय पैच** लागू करता है और **0.9 reCAPTCHA v3** (मानव-स्तरीय, सर्वर-सत्यापित) स्कोर करता है, जो Cloudflare Turnstile और FingerprintJS सहित सभी प्रमुख एंटी-बॉट परीक्षणों को पास करता है [²]
- **Camofox** कोल्ड स्टार्ट: **~1-3s** (एक बार, फिर वार्म REST API के माध्यम से ~0ms प्रति अनुरोध) [³]
- **Playwright/Chromium** कोल्ड स्टार्ट: **~0.5-6s** (हर लॉन्च, वातावरण के अनुसार भिन्न) [⁴]

Camofox तेज़ पथ को संभालता है। CloakBrowser किनारे के मामलों को संभालता है। साथ में वे बिना किसी अंतराल के पूरे वेब को कवर करते हैं। एजेंट तय करता है कि किसका उपयोग करना है।

### स्रोत

¹ "Camoufox Vs Playwright Stealth: Complete Comparison & Alternatives (2026)" — [blog.send.win](https://blog.send.win/camoufox-vs-playwright-stealth-complete-comparison-alternatives-2026/)
² CloakBrowser README — [github.com/cloakhq/cloakbrowser](https://github.com/cloakhq/cloakbrowser)
³ camoufox-pi README (cold start comparison) — [github.com/MonsieurBarti/camoufox-pi](https://github.com/MonsieurBarti/camoufox-pi)
⁴ Playwright issue #4345 (launch time variability) — [github.com/microsoft/playwright/issues/4345](https://github.com/microsoft/playwright/issues/4345)

## स्थापना

### त्वरित स्थापना (केवल SKILL.md)

एक ही कमांड से अपने AI एजेंट में स्किल परिभाषा स्थापित करें:

```bash
npx skills add Johell1NS/browser-search
```

यह OpenCode, Claude Code, Cursor, GitHub Copilot और अन्य सहित 70+ AI एजेंटों के साथ काम करता है।

### पूर्ण सेटअप (बुनियादी ढाँचे के साथ)

```bash
git clone https://github.com/Johell1NS/browser-search
cd browser-search
npm install
```

यह README अपने AI एजेंट को दिखाएँ ताकि आपके वातावरण और प्लेटफ़ॉर्म के अनुरूप पूर्ण स्थापना हो सके।

**सेवाओं का अवलोकन:**

| सेवा | कैसे | संदर्भ |
|---|---|---|
| SearXNG | Docker, `:8080` | [docs.searxng.org](https://docs.searxng.org/admin/installation-docker.html) |
| Camofox | Docker, `:9377` | [github.com/jo-inc/camofox-browser](https://github.com/jo-inc/camofox-browser) |
| CloakBrowser | npm (शामिल) | `scripts/cloak/cloak-fetch.mjs` |

**AI एजेंट के लिए — ये फ़ाइलें पढ़ें:**

| फ़ाइल | इसमें क्या है |
|---|---|
| `SKILL.md` | पूर्ण स्किल: कमांड, एस्केलेशन, समस्या निवारण |
| `scripts/cloak/cloak-fetch.mjs` | CloakBrowser CLI उपयोग और सभी विकल्प |
| `scripts/setup-dependencies.sh` | सिस्टम निर्भरताएँ |
| `scripts/check-browser-search.sh` | स्थापना के बाद सत्यापन |
| `docker/setup.md` | Docker सेटअप टिप्स |

**नोट:** `SKILL.md` **OpenCode** सिंटैक्स (`exec`, `curl`) के लिए लिखी गई है। यदि आपका एजेंट कोई अलग फ़ॉर्मेट (Claude Code, Cursor, आदि) का उपयोग करता है, तो इसे पढ़ें और स्किल का उपयोग करने से पहले कमांड को अपने एजेंट के सिंटैक्स में बदलें।

## पर्यावरण चर

| वेरिएबल | किसके लिए आवश्यक | डिफ़ॉल्ट |
|---|---|---|
| `CAMOFOX_API_KEY` | Camofox में evaluate, session, cleanup | — |
| `CAMOFOX_ADMIN_KEY` | Camofox stop एंडपॉइंट | — |

## यह स्किल क्या नहीं करती

- **सोशल मीडिया।** Instagram, Facebook, TikTok, LinkedIn और Twitter/X में लॉगिन आवश्यक है। `browser-search` उन्हें ब्राउज़ करने का प्रयास नहीं करता।
- **फ़ाइलें डाउनलोड करना।** यह केवल पढ़ने योग्य है (स्पष्ट स्क्रीनशॉट को छोड़कर)।
- **पेवॉल को बायपास करना।** भुगतान या लॉगिन सिस्टम को दरकिनार नहीं करता।

## शामिल हों

browser-search ओपन सोर्स और मुफ़्त है। यदि आप इसे उपयोगी पाते हैं:

- ⭐ **रिपो को स्टार करें** — दूसरों को इसे खोजने में मदद करता है
- 🐛 **एक इश्यू खोलें** — बग रिपोर्ट करें या सुविधाएँ सुझाएँ
- 🔀 **PR सबमिट करें** — ठीक करें, सुधारें, विस्तारित करें
- 💬 **इसे साझा करें** — अपनी टीम के साथ, Reddit, Twitter, Discord पर
- 🧠 **इसे अनुकूलित करें** — फ़ोर्क करें, SKILL.md को ट्वीक करें, इसे अपना बनाएँ

हर छोटा योगदान, चाहे कितना भी छोटा हो, इसे बेहतर बनाता है।

## लाइसेंस

MIT
