# 🤖 Is This AI? – Chrome Extension

Detects whether a customer service or live chat widget on any website is powered by AI.

## Features

- **Platform Fingerprinting** – Recognizes 20+ known AI chat platforms (Intercom, Drift, Tidio, Dialogflow, Amazon Lex, OpenAI, Claude, Salesforce Einstein, etc.)
- **Network Interception** – Monitors live API calls to known AI endpoints in real-time
- **DOM & Script Analysis** – Scans page source, script tags, and HTML attributes for AI signals
- **Confidence Score** – Gives a clear verdict with a percentage confidence level
- **Toolbar Badge** – Shows a red "AI" badge on the extension icon when AI is detected

## Detected Platforms

| Platform | AI Level |
|---|---|
| ChatBot.com, Landbot, Botpress, Rasa | Confirmed AI |
| Drift, Tidio, Freshchat, Salesforce Einstein | Likely AI |
| Intercom, Zendesk, HubSpot, Crisp | Possibly AI |
| Olark, Tawk.to | Likely Human |
| Custom OpenAI / Claude / Cohere integrations | Confirmed AI (via network) |

## Installation (Developer Mode)

1. Download or clone this folder
2. Open Chrome → go to `chrome://extensions/`
3. Enable **Developer Mode** (top-right toggle)
4. Click **"Load unpacked"**
5. Select this folder

The extension icon will appear in your toolbar.

## Usage

1. Visit any website with a chat widget
2. Click the **"Is This AI?"** extension icon
3. View the verdict, confidence score, and detailed signal breakdown
4. Use the **↻** button to re-scan after opening a chat window

## How it works

```
Page loads
    ├── content.js runs → scans DOM + scripts + HTML source
    │       └── sends results to background.js
    │
    ├── background.js monitors all network requests
    │       └── flags calls to known AI API endpoints
    │
    └── popup.html/js
            └── reads combined results → renders verdict + confidence
```

## Extending

To add a new platform, add an entry to the `PLATFORMS` array in `content.js`:

```js
{ name: "MyPlatform", confidence: 90, type: "ai",
  scripts: ["cdn.myplatform.com"],
  dom: ["#myplatform-chat"],
  meta: [] }
```

`type` can be: `"ai"`, `"ai_likely"`, `"ai_possible`, `"human_likely"`.

See `CONTRIBUTING.md` for detailed guidelines on adding platforms and AI providers.

## License

This project is open source under the **MIT License**. See the `LICENSE` file for details.
