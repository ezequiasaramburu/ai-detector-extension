## Contributing – Adding More Platforms

Thanks for helping improve the AI chat detector. This guide explains how to add support for more chat / AI platforms in a safe and consistent way.

### 1. Overview of the detection flow

- **`content.js`** scans the DOM and script tags to detect:
  - Known chat platforms (`PLATFORMS`)
  - Generic AI-related signals (`GENERIC_AI_DOM`)
  - Known AI API domains referenced in scripts (`AI_API_DOMAINS`)
- **`background.js`** watches **network requests** to known AI API endpoints (`AI_API_PATTERNS`) and stores per-tab results.
- **`popup.js`** aggregates all signals into a single verdict and an **“AI likelihood”** percentage for the UI.

When you add a platform or API, you usually touch **`content.js`** and optionally **`background.js`**.

---

### 2. Adding a new chat platform (widget / provider)

Most new integrations are added to the `PLATFORMS` array in `content.js`.

1. Open `content.js` and locate the `PLATFORMS` constant near the top.
2. Add a new object with this shape:

```js
{
  name: "ExampleChat",
  confidence: 80,
  type: "ai_likely", // "ai" | "ai_likely" | "ai_possible" | "human_likely"
  scripts: [
    "cdn.examplechat.com",
    "widget.examplechat.io"
  ],
  dom: [
    "#examplechat-widget",
    ".examplechat-frame"
  ],
  meta: []
}
```

**Guidelines:**

- **`name`**: Human-readable name shown in the popup.
- **`confidence`**:
  - 95–90 → very strong AI association (pure AI bot or LLM platform).
  - 85–70 → commonly AI-assisted but could involve humans.
  - 60–45 → mixed / weak AI evidence (or human-oriented with some bot features).
- **`type`** controls the badge color/label in the popup:
  - `"ai"` → “AI” (red)
  - `"ai_likely"` → “AI Likely” (amber)
  - `"ai_possible"` → “AI Possible” (blue)
  - `"human_likely"` → “Human” (green)
- **`scripts`**:
  - Include **stable substrings** from script URLs (hostnames or unique path segments).
  - Avoid full long URLs that may change (query params, version numbers).
- **`dom`**:
  - Include distinctive DOM selectors (ids/classes) that reliably appear when the widget is loaded.
  - Prefer IDs or unique class names over very generic selectors.

Test by visiting a site that uses the platform, opening the chat, and re-scanning with the popup. You should see a new entry under **“Platform Fingerprints”**.

---

### 3. Adding a new AI API / model provider (network-based)

If a platform makes **direct API calls** to an AI provider (e.g., OpenAI, Anthropic), add it in **two places** when relevant:

#### 3.1. DOM / script-based API domain detection

1. In `content.js`, locate `AI_API_DOMAINS`.
2. Add a new domain string:

```js
"api.new-llm-provider.com",
```

This lets the DOM scan flag pages that reference the API in script tags or inline JS, even if no request happens while scanning.

#### 3.2. Network intercept patterns

1. In `background.js`, locate `AI_API_PATTERNS`.
2. Add a new object:

```js
{ pattern: "api.new-llm-provider.com", label: "New LLM Provider", confidence: 95 },
```

**Guidelines:**

- Use a **substring** that is guaranteed to appear in the request URL.
- Set `confidence` high if the endpoint is clearly an AI model API.

When a request matches this pattern, it will appear under **“Network Intercepts”** and strongly boost the AI likelihood.

---

### 4. Tuning generic AI signals

Generic signals are intentionally weak and should not dominate the verdict by themselves.

- In `content.js`, `GENERIC_AI_DOM` looks like:

```js
{ selector: "[data-bot]", label: "data-bot attribute", score: 20 },
```

To add a new generic indicator:

1. Add a new entry with a **modest `score`** (typically 10–25).
2. Ensure the selector is not so broad that it fires on many unrelated pages.

These scores are aggregated and then combined with stronger platform/API evidence in `popup.js`.

---

### 5. Understanding how your changes affect the verdict

The final **AI likelihood** is computed in `popup.js`:

- All scores from:
  - `networkHits[].confidence`
  - `detectedPlatforms[].confidence`
  - `apiSignals` (each treated as ~90)
  - `genericSignals[].score`
- The extension takes the **maximum score**, then adds a small bonus for multiple signals (up to +10), capped at 99%.
- Thresholds:
  - ≥ 85 → **AI Chat Detected**
  - ≥ 65 → **Likely AI**
  - ≥ 40 → **Possibly AI**
  - < 40 → **Likely Human**

When adding new platforms or signals, choose confidence/score values that make sense within this scale.

---

### 6. Checklist before opening a PR

- [ ] Added new entries to `PLATFORMS`, `AI_API_DOMAINS`, and/or `AI_API_PATTERNS` as appropriate.
- [ ] Verified detection on at least one real site using the new platform/API.
- [ ] Confirmed the popup shows:
  - A clear platform name and badge.
  - A reasonable **AI likelihood** percentage and verdict label.
- [ ] Ran through a few non-AI sites to ensure the new rules don’t cause noisy false positives.

Thank you for contributing and helping make the detector smarter and more transparent.

