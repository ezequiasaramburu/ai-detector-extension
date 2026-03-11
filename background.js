// ============================================================
// background.js – Service Worker
// Intercepts network requests to known AI API endpoints
// and stores per-tab scan results
// ============================================================

const AI_API_PATTERNS = [
  { pattern: "api.openai.com",                     label: "OpenAI API",           confidence: 95 },
  { pattern: "api.anthropic.com",                  label: "Anthropic (Claude) API",confidence: 95 },
  { pattern: "api.cohere.ai",                      label: "Cohere API",            confidence: 95 },
  { pattern: "dialogflow.googleapis.com",          label: "Google Dialogflow",     confidence: 90 },
  { pattern: "lex.amazonaws.com",                  label: "Amazon Lex",            confidence: 90 },
  { pattern: "runtime.lex",                        label: "Amazon Lex Runtime",    confidence: 90 },
  { pattern: "luis.cognitiveservices.azure.com",   label: "Azure LUIS / CLU",      confidence: 90 },
  { pattern: "directline.botframework.com",        label: "Microsoft Bot Framework",confidence: 90 },
  { pattern: "api.wit.ai",                         label: "Wit.ai (Meta NLP)",     confidence: 85 },
  { pattern: "general-runtime.voiceflow.com",      label: "Voiceflow Runtime",     confidence: 90 },
  { pattern: "chat.openai.com",                    label: "ChatGPT",               confidence: 95 },
  { pattern: "api.botpress.io",                    label: "Botpress API",          confidence: 90 },
  { pattern: "rasa.io",                            label: "Rasa NLU",              confidence: 90 },
  { pattern: "api.ada.support",                    label: "Ada Support API",       confidence: 90 },
  { pattern: "api.drift.com",                      label: "Drift AI API",          confidence: 85 },
  { pattern: "app.tidio.co/api",                   label: "Tidio Bot API",         confidence: 85 },
];

// In-memory store: tabId → { networkHits, domResults }
const tabData = {};

// ── Network request watcher ──────────────────────────────────
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url.toLowerCase();
    const tabId = details.tabId;
    if (tabId < 0) return;

    for (const entry of AI_API_PATTERNS) {
      if (url.includes(entry.pattern)) {
        if (!tabData[tabId]) tabData[tabId] = { networkHits: [], domResults: null };
        // Avoid duplicate entries
        const alreadyRecorded = tabData[tabId].networkHits.some(h => h.label === entry.label);
        if (!alreadyRecorded) {
          tabData[tabId].networkHits.push({
            label: entry.label,
            confidence: entry.confidence,
            url: details.url,
            timestamp: Date.now(),
          });
          // Update badge
          updateBadge(tabId);
        }
        break;
      }
    }
  },
  { urls: ["<all_urls>"] }
);

// ── Receive DOM scan results from content script ─────────────
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "SCAN_RESULTS" && sender.tab) {
    const tabId = sender.tab.id;
    if (!tabData[tabId]) tabData[tabId] = { networkHits: [], domResults: null };
    tabData[tabId].domResults = msg.data;
    updateBadge(tabId);
  }
});

// ── Popup requests combined results ─────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_TAB_DATA") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) { sendResponse({ error: "No active tab" }); return; }
      const data = tabData[tabs[0].id] || { networkHits: [], domResults: null };
      sendResponse({ data, tabId: tabs[0].id, url: tabs[0].url });
    });
    return true; // async
  }

  if (msg.type === "REQUEST_FRESH_SCAN") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) { sendResponse({ error: "No active tab" }); return; }
      chrome.tabs.sendMessage(tabs[0].id, { type: "REQUEST_SCAN" }, (response) => {
        if (chrome.runtime.lastError || !response) {
          sendResponse({ error: "Content script not ready" });
          return;
        }
        const tabId = tabs[0].id;
        if (!tabData[tabId]) tabData[tabId] = { networkHits: [], domResults: null };
        tabData[tabId].domResults = response.data;
        updateBadge(tabId);
        sendResponse({ data: tabData[tabId] });
      });
    });
    return true;
  }
});

// ── Clear data when tab navigates ───────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    tabData[tabId] = { networkHits: [], domResults: null };
    chrome.action.setBadgeText({ text: "", tabId });
  }
});

// ── Badge helper ─────────────────────────────────────────────
function updateBadge(tabId) {
  const data = tabData[tabId];
  if (!data) return;

  const hasNetwork = data.networkHits && data.networkHits.length > 0;
  const hasDom = data.domResults &&
    (data.domResults.detectedPlatforms.length > 0 ||
     data.domResults.apiSignals.length > 0);

  if (hasNetwork || hasDom) {
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444", tabId });
    chrome.action.setBadgeText({ text: "AI", tabId });
  }
}
