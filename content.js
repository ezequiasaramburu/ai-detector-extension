// ============================================================
// content.js – DOM Scanner + Script Tag Scanner
// Runs in the context of every page
// ============================================================

const PLATFORMS = [
  // ── Dedicated AI / bot platforms ──────────────────────────
  { name: "Intercom",       confidence: 75, type: "ai_possible",
    scripts: ["widget.intercom.io", "js.intercomcdn.com"],
    dom: ["#intercom-container", ".intercom-messenger-frame", "[data-intercom]"],
    meta: [] },

  { name: "Drift",          confidence: 85, type: "ai_likely",
    scripts: ["js.driftt.com", "drift.com/drift-frame"],
    dom: ["#drift-widget", ".drift-frame-controller", "#drift-frame-chat"],
    meta: [] },

  { name: "Tidio",          confidence: 90, type: "ai_likely",
    scripts: ["code.tidio.co", "widget.tidio.com"],
    dom: ["#tidio-chat", "#tidio_chat_iframe", ".tidio-1"],
    meta: [] },

  { name: "Freshchat",      confidence: 85, type: "ai_likely",
    scripts: ["wchat.freshchat.com", "assets.freshservice.com"],
    dom: ["#fc_frame", ".fc-widget-normal", "#freshchat-container"],
    meta: [] },

  { name: "Zendesk Chat",   confidence: 70, type: "ai_possible",
    scripts: ["static.zdassets.com", "ekr.zdassets.com"],
    dom: ["#launcher", ".zEWidget-launcher", "[data-garden-id]"],
    meta: [] },

  { name: "LiveChat",       confidence: 60, type: "ai_possible",
    scripts: ["cdn.livechatinc.com", "secure.livechatinc.com"],
    dom: ["#chat-widget-container", ".chat-widget", "#livechat-compact-view"],
    meta: [] },

  { name: "HubSpot Chat",   confidence: 75, type: "ai_possible",
    scripts: ["js.hs-scripts.com", "js.hsleadflows.net", "chatflows.hubspot.com"],
    dom: ["#hubspot-messages-iframe-container", ".HubSpotConversations"],
    meta: [] },

  { name: "Crisp Chat",     confidence: 70, type: "ai_possible",
    scripts: ["client.crisp.chat", "settings.crisp.chat"],
    dom: ["#crisp-chatbox", ".crisp-client", "[data-id^='crisp']"],
    meta: [] },

  { name: "ChatBot.com",    confidence: 95, type: "ai",
    scripts: ["cdn.chatbot.com", "app.chatbot.com"],
    dom: ["[id^='chatbot']", ".chatbot-bubble", "#chatbot-chat"],
    meta: [] },

  { name: "Dialogflow (Google)", confidence: 90, type: "ai",
    scripts: ["dialogflow.googleapis.com", "bot-iframe.dialogflow.com"],
    dom: ["df-messenger", "[agent-id]"],
    meta: [] },

  { name: "Amazon Lex",     confidence: 95, type: "ai",
    scripts: ["lex.amazonaws.com", "amazon-connect"],
    dom: ["#amazon-connect-chat-widget", ".amazon-connect-chat"],
    meta: [] },

  { name: "Salesforce Einstein Bot", confidence: 90, type: "ai",
    scripts: ["salesforceliveagent.com", "service.force.com", "chat.salesforce.com"],
    dom: [".embeddedServiceHelpButton", ".embeddedServiceSidebar", "#esw-modaloverlay"],
    meta: [] },

  { name: "ManyChat",       confidence: 95, type: "ai",
    scripts: ["widget.manychat.com", "mccdn.me"],
    dom: ["#mc-chat-widget", ".mc-widget"],
    meta: [] },

  { name: "Landbot",        confidence: 95, type: "ai",
    scripts: ["cdn.landbot.io", "landbot.io/landbot"],
    dom: ["#landbot-container", ".LandbotLivechat"],
    meta: [] },

  { name: "Botpress",       confidence: 95, type: "ai",
    scripts: ["cdn.botpress.cloud", "mediafiles.botpress.cloud"],
    dom: ["#bp-widget", ".bpw-floating-button"],
    meta: [] },

  { name: "Rasa",           confidence: 90, type: "ai",
    scripts: ["rasa.io", "rasa-webchat"],
    dom: ["#rasa-chat-widget", ".rasa-chat"],
    meta: [] },

  { name: "OpenAI / Custom GPT", confidence: 95, type: "ai",
    scripts: ["api.openai.com", "cdn.oaistatic.com", "platform.openai.com"],
    dom: ["[data-testid*='bot']", ".gpt-chat", "[class*='openai']"],
    meta: [] },

  { name: "Claude / Anthropic", confidence: 95, type: "ai",
    scripts: ["api.anthropic.com", "claude.ai"],
    dom: ["[class*='claude']", "[data-claude]"],
    meta: [] },

  { name: "Cohere",         confidence: 95, type: "ai",
    scripts: ["api.cohere.ai", "cohere.com"],
    dom: [],
    meta: [] },

  { name: "Voiceflow",      confidence: 90, type: "ai",
    scripts: ["cdn.voiceflow.com", "general-runtime.voiceflow.com"],
    dom: ["vf-chat-widget", "#voiceflow-chat"],
    meta: [] },

  { name: "Ada Support",    confidence: 90, type: "ai",
    scripts: ["static.ada.support", "ada.support"],
    dom: ["#ada-embed", "#ada-chat-frame", ".ada-embed-frame"],
    meta: [] },

  { name: "Kustomer",       confidence: 75, type: "ai_possible",
    scripts: ["cdn.kustomer.com"],
    dom: ["#kustomer-ui-sdk-iframe"],
    meta: [] },

  { name: "Gorgias",        confidence: 75, type: "ai_possible",
    scripts: ["config.gorgias.chat"],
    dom: ["#gorgias-chat-container"],
    meta: [] },

  { name: "Olark",          confidence: 55, type: "human_likely",
    scripts: ["static.olark.com"],
    dom: ["#olark-container", "#habla_window_div"],
    meta: [] },

  { name: "Tawk.to",        confidence: 45, type: "human_likely",
    scripts: ["embed.tawk.to"],
    dom: ["#tawkchat-minified-box", ".tawk-min-container"],
    meta: [] },
];

// Generic AI signals in DOM (lower confidence)
const GENERIC_AI_DOM = [
  { selector: "[data-bot]",           label: "data-bot attribute",      score: 20 },
  { selector: "[data-chatbot]",       label: "data-chatbot attribute",  score: 20 },
  { selector: "[aria-label*='bot' i]",label: "aria bot label",          score: 15 },
  { selector: "[class*='chatbot' i]", label: "chatbot class",           score: 15 },
  { selector: "[class*='ai-chat' i]", label: "ai-chat class",           score: 20 },
  { selector: "[id*='bot-' i]",       label: "bot- id prefix",          score: 10 },
  { selector: "[id*='-bot' i]",       label: "-bot id suffix",          score: 10 },
];

// Known AI API domains in script src or XHR patterns
const AI_API_DOMAINS = [
  "api.openai.com",
  "api.anthropic.com",
  "api.cohere.ai",
  "dialogflow.googleapis.com",
  "lex.amazonaws.com",
  "luis.cognitiveservices.azure.com",
  "api.wit.ai",
  "runtime.lex.us-east-1.amazonaws.com",
  "bot-runtime.use1a.aws.amazon.com",
  "general-runtime.voiceflow.com",
  "api.botpress.io",
  "copilot.tidio.com",
];

function scanPage() {
  const results = {
    detectedPlatforms: [],
    genericSignals: [],
    apiSignals: [],
    scriptMatches: [],
    timestamp: Date.now(),
  };

  const allScripts = Array.from(document.querySelectorAll("script[src]"))
    .map(s => s.src.toLowerCase());
  const allInlineScripts = Array.from(document.querySelectorAll("script:not([src])"))
    .map(s => s.textContent.toLowerCase());
  const pageSource = document.documentElement.innerHTML.toLowerCase();

  // ── 1. Platform fingerprinting ─────────────────────────────
  for (const platform of PLATFORMS) {
    let matched = false;
    let matchedVia = [];

    // Check script URLs
    for (const pattern of platform.scripts) {
      if (allScripts.some(src => src.includes(pattern)) ||
          allInlineScripts.some(txt => txt.includes(pattern)) ||
          pageSource.includes(pattern)) {
        matched = true;
        matchedVia.push(`script: ${pattern}`);
      }
    }

    // Check DOM selectors
    for (const sel of platform.dom) {
      try {
        if (document.querySelector(sel)) {
          matched = true;
          matchedVia.push(`DOM: ${sel}`);
        }
      } catch (_) {}
    }

    if (matched) {
      results.detectedPlatforms.push({
        name: platform.name,
        confidence: platform.confidence,
        type: platform.type,
        matchedVia,
      });
    }
  }

  // ── 2. Generic DOM signals ─────────────────────────────────
  for (const signal of GENERIC_AI_DOM) {
    try {
      if (document.querySelector(signal.selector)) {
        results.genericSignals.push({ label: signal.label, score: signal.score });
      }
    } catch (_) {}
  }

  // ── 3. Script-based API domain detection ──────────────────
  for (const domain of AI_API_DOMAINS) {
    if (allScripts.some(src => src.includes(domain)) ||
        pageSource.includes(domain)) {
      results.apiSignals.push(domain);
    }
  }

  return results;
}

// Run scan and send results to background / popup via chrome.runtime
const scanResults = scanPage();

chrome.runtime.sendMessage({
  type: "SCAN_RESULTS",
  data: scanResults,
  url: window.location.href,
});

// Also listen for popup requesting fresh scan
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "REQUEST_SCAN") {
    sendResponse({ data: scanPage(), url: window.location.href });
  }
  return true;
});
