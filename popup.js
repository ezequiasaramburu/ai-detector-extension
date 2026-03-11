// ============================================================
// popup.js – Renders detection results in the popup UI
// ============================================================

const app = document.getElementById("app");
const refreshBtn = document.getElementById("refreshBtn");

// ── Compute overall verdict from combined data ───────────────
function computeVerdict(data) {
  const { networkHits = [], domResults } = data;
  const platforms = domResults?.detectedPlatforms || [];
  const apiSignals = domResults?.apiSignals || [];
  const genericSignals = domResults?.genericSignals || [];

  // Collect all confidence scores
  const scores = [];

  for (const hit of networkHits) scores.push(hit.confidence);
  for (const p of platforms) scores.push(p.confidence);
  for (const _ of apiSignals) scores.push(90);
  for (const s of genericSignals) scores.push(s.score);

  if (scores.length === 0) {
    return { level: "none", confidence: 0, label: "No AI Detected",
      desc: "No known AI chat platform or API signals were found on this page.",
      emoji: "✅", color: "#22c55e" };
  }

  // Weighted max (highest single evidence + partial boost from multiple)
  const maxScore = Math.max(...scores);
  const boost = Math.min((scores.length - 1) * 3, 10);
  const confidence = Math.min(maxScore + boost, 99);

  if (confidence >= 85) {
    return { level: "ai", confidence, label: "AI Chat Detected",
      desc: "Strong evidence of an AI-powered chatbot or virtual assistant on this page.",
      emoji: "🤖", color: "#ef4444" };
  } else if (confidence >= 65) {
    return { level: "likely", confidence, label: "Likely AI",
      desc: "This chat platform commonly uses AI. It may be AI-assisted or have a bot first-responder.",
      emoji: "⚠️", color: "#f59e0b" };
  } else if (confidence >= 40) {
    return { level: "possible", confidence, label: "Possibly AI",
      desc: "Some weak signals detected. Could be AI-assisted, but not confirmed.",
      emoji: "🔍", color: "#38bdf8" };
  } else {
    return { level: "low", confidence, label: "Likely Human",
      desc: "Signals suggest this chat may be handled by a human agent.",
      emoji: "🙋", color: "#22c55e" };
  }
}

// ── Render the full results UI ───────────────────────────────
function render(data, url) {
  const verdict = computeVerdict(data);
  const { networkHits = [], domResults } = data;
  const platforms = domResults?.detectedPlatforms || [];
  const apiSignals = domResults?.apiSignals || [];
  const genericSignals = domResults?.genericSignals || [];

  const totalSignals = platforms.length + networkHits.length + apiSignals.length;
  const scanTime = domResults?.timestamp
    ? new Date(domResults.timestamp).toLocaleTimeString()
    : "—";

  const hostname = url ? (() => { try { return new URL(url).hostname; } catch(_) { return url; } })() : "—";

  let html = "";

  // Verdict card
  html += `
    <div class="verdict" style="--verdict-color: ${verdict.color}">
      <div class="verdict-label">Verdict</div>
      <div class="verdict-main">
        <div class="verdict-emoji">${verdict.emoji}</div>
        <div>
          <div class="verdict-text">${verdict.label}</div>
          <div class="verdict-desc">${verdict.desc}</div>
        </div>
      </div>
      <div class="confidence-row">
        <div class="confidence-label">AI likelihood</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${verdict.confidence}%"></div>
        </div>
        <div class="confidence-pct">${verdict.confidence}%</div>
      </div>
    </div>`;

  // Platform matches
  if (platforms.length > 0) {
    html += `<div class="section"><div class="section-title">Platform Fingerprints</div>`;
    for (const [i, p] of platforms.entries()) {
      const badgeClass = p.type === "ai" ? "badge-ai"
        : p.type === "ai_likely" ? "badge-likely"
        : p.type === "ai_possible" ? "badge-possible"
        : "badge-human";
      const badgeLabel = p.type === "ai" ? "AI"
        : p.type === "ai_likely" ? "AI Likely"
        : p.type === "ai_possible" ? "AI Possible"
        : "Human";
      const dotColor = p.type === "ai" ? "#ef4444"
        : p.type === "ai_likely" ? "#f59e0b"
        : p.type === "ai_possible" ? "#38bdf8"
        : "#22c55e";
      const via = p.matchedVia?.slice(0, 2).join(" · ") || "";

      html += `
        <div class="detection-item" style="animation-delay:${i * 0.05}s">
          <div class="detection-dot" style="background:${dotColor}"></div>
          <div style="flex:1;min-width:0">
            <div class="detection-name">${p.name}</div>
            ${via ? `<div class="detection-via">${via}</div>` : ""}
          </div>
          <div class="detection-badge ${badgeClass}">${badgeLabel}</div>
        </div>`;
    }
    html += `</div>`;
  }

  // Network hits
  if (networkHits.length > 0) {
    html += `<div class="section"><div class="section-title">Network Intercepts</div>`;
    for (const [i, hit] of networkHits.entries()) {
      html += `
        <div class="detection-item" style="animation-delay:${i * 0.05}s">
          <div class="detection-dot" style="background:#a78bfa"></div>
          <div style="flex:1;min-width:0">
            <div class="detection-name">${hit.label}</div>
            <div class="detection-via">Live API call detected</div>
          </div>
          <div class="detection-badge badge-network">LIVE</div>
        </div>`;
    }
    html += `</div>`;
  }

  // API domain signals from DOM scan
  if (apiSignals.length > 0) {
    html += `<div class="section"><div class="section-title">API Domains Found in Page</div>`;
    for (const [i, domain] of apiSignals.entries()) {
      html += `
        <div class="detection-item" style="animation-delay:${i * 0.05}s">
          <div class="detection-dot" style="background:#a78bfa"></div>
          <div class="detection-name" style="font-family:'Space Mono',monospace;font-size:11px">${domain}</div>
          <div class="detection-badge badge-network">SCRIPT</div>
        </div>`;
    }
    html += `</div>`;
  }

  // Generic signals (only show if no platforms found)
  if (genericSignals.length > 0 && platforms.length === 0) {
    html += `<div class="section"><div class="section-title">Generic Signals</div>`;
    for (const [i, s] of genericSignals.entries()) {
      html += `
        <div class="detection-item" style="animation-delay:${i * 0.05}s">
          <div class="detection-dot" style="background:#6b7280"></div>
          <div class="detection-name">${s.label}</div>
          <div class="detection-badge badge-possible">WEAK</div>
        </div>`;
    }
    html += `</div>`;
  }

  // Empty state
  if (totalSignals === 0 && genericSignals.length === 0) {
    html += `
      <div class="empty">
        <div class="empty-icon">🔍</div>
        No chat widget signals detected on this page.<br>
        <span style="font-size:11px">Try opening a chat window first, then re-scan.</span>
      </div>`;
  }

  // URL bar + footer
  html += `
    <div style="margin-top:10px"></div>
    <div class="url-bar">${hostname}</div>
    <div class="footer">
      <div class="footer-row">
        <span class="footer-scan">Scanned at ${scanTime}</span>
        <span>${totalSignals} signal${totalSignals !== 1 ? "s" : ""}</span>
      </div>
      <div class="footer-row footer-meta">
        <span>Developed by <a href="https://ezequias.me" target="_blank" rel="noopener noreferrer">ezequias</a></span>
      </div>
    </div>`;

  app.innerHTML = html;
}

// ── Fetch data from background ───────────────────────────────
function loadData() {
  app.innerHTML = `
    <div class="loading">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <div style="margin-top:10px">Scanning page…</div>
    </div>`;

  chrome.runtime.sendMessage({ type: "GET_TAB_DATA" }, (response) => {
    if (chrome.runtime.lastError || !response || response.error) {
      app.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div>Could not scan this page.<br><span style="font-size:11px">Try refreshing the page and reopening the extension.</span></div>`;
      return;
    }
    render(response.data, response.url);
  });
}

// ── Refresh / re-scan ────────────────────────────────────────
refreshBtn.addEventListener("click", () => {
  refreshBtn.classList.add("spinning");
  setTimeout(() => refreshBtn.classList.remove("spinning"), 600);

  chrome.runtime.sendMessage({ type: "REQUEST_FRESH_SCAN" }, (response) => {
    if (chrome.runtime.lastError || !response || response.error) {
      loadData(); // fallback to stored data
      return;
    }
    chrome.runtime.sendMessage({ type: "GET_TAB_DATA" }, (res) => {
      if (res && res.data) render(res.data, res.url);
    });
  });
});

// ── Init ─────────────────────────────────────────────────────
loadData();
