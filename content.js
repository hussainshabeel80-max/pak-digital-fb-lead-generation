/**
 * Facebook Content Script - Commercial Auto-Pilot with Real Comment Clicker & Fresh Lead Filter
 */

console.log("[PakDigital AI Agent] Pro Real-Click Engine Active!");

let lastRightClickedElement = null;
let isAutoPilotActive = false;
let autoPilotTimer = null;
let scanAttemptsWithoutMatch = 0;
let commentsOnCurrentQuery = 0;

// Permanent history: ONLY stores posts where we ACTUALLY left a comment!
const actuallyCommentedPostKeys = new Set();

chrome.storage.local.get(["commentedHistory"], (data) => {
  if (data.commentedHistory && Array.isArray(data.commentedHistory)) {
    data.commentedHistory.forEach(k => actuallyCommentedPostKeys.add(k));
  }
});

// Temporary in-memory set for posts skipped during current tab session
const currentSessionSkipped = new Set();

function markPostAsCommented(key) {
  if (!key) return;
  actuallyCommentedPostKeys.add(key);
  chrome.storage.local.set({ commentedHistory: Array.from(actuallyCommentedPostKeys) });
}

document.addEventListener("contextmenu", (e) => {
  lastRightClickedElement = e.target;
}, true);

// ------------------------------------------------------------------
// AUTO-RESUME ENGINE
// ------------------------------------------------------------------
let isResuming = false;
function checkAndAutoResume() {
  if (isResuming || isAutoPilotActive) return;
  chrome.storage.sync.get(["isAutoPilotRunning"], (data) => {
    if (data.isAutoPilotRunning && !isAutoPilotActive && !isResuming) {
      isResuming = true;
      console.log("[PakDigital AI] Auto-Pilot state is active, resuming scanner!");
      startAutoPilot();
      setTimeout(() => { isResuming = false; }, 3000);
    }
  });
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(checkAndAutoResume, 2000);
} else {
  window.addEventListener("DOMContentLoaded", () => setTimeout(checkAndAutoResume, 2000));
}
setTimeout(checkAndAutoResume, 4000);

// ------------------------------------------------------------------
// AUTO-KEYWORD EXPANSION DICTIONARY
// ------------------------------------------------------------------
const ServiceSynonyms = {
  hvac: ["hvac", "ac", "a/c", "cooling", "heating", "air condition", "air conditioner", "furnace", "thermostat", "boiler", "heat pump", "ventilation", "freon", "duct"],
  ac: ["ac", "a/c", "hvac", "cooling", "air conditioner", "air condition", "thermostat", "compressor", "freon"],
  plumber: ["plumb", "plumber", "plumbing", "pipe", "drain", "water heater", "toilet", "tap", "sink", "faucet", "sewer", "leak", "clog", "sump pump", "flooding"],
  roofing: ["roof", "roofer", "roofing", "shingle", "gutter", "flashing", "chimney", "water damage", "leak", "ceiling leak", "soffit", "fascia"],
  electrician: ["electric", "electrician", "wire", "wiring", "breaker", "fuse", "panel", "lighting", "outlet", "power outage", "short circuit"],
  cleaning: ["clean", "cleaning", "cleaner", "maid", "deep clean", "housekeeping", "carpet clean", "pressure wash", "power wash"],
  seo: ["seo", "ranking", "google rank", "traffic", "backlinks", "audit", "optimization", "search engine"],
  "web design": ["web design", "website", "wordpress", "shopify", "developer", "redesign", "landing page", "web dev", "frontend"],
  landscaping: ["lawn", "grass", "mow", "mowing", "landscaping", "tree removal", "tree trimming", "yard", "garden", "fence", "yard cleanup", "overgrown", "mulch", "edging"]
};

function getExpandedKeywords(userQuery) {
  const clean = (userQuery || "").toLowerCase().trim();
  const result = new Set();

  result.add(clean);
  clean.split(/[\s,]+/).forEach(w => {
    if (w.length > 1) result.add(w);
  });

  for (const [key, list] of Object.entries(ServiceSynonyms)) {
    if (clean.includes(key)) {
      list.forEach(item => result.add(item));
    }
  }

  return Array.from(result);
}

// ------------------------------------------------------------------
// POST FRESHNESS & COMMENTS SATURATION FILTER
// ------------------------------------------------------------------
const CHRONO_SORT_FILTER = "eyJycF9jaHJvbm9fc29ydCI6IntcIm5hbWVcIjpcImNocm9ub3NvcnRcIixcImFyZ3NcIjpcIlwifSJ9";

function isPostFresh(postEl, maxHours) {
  if (!postEl) return true;
  const limitHours = (typeof maxHours === "number" && maxHours > 0) ? maxHours : 8;

  const timeLinks = postEl.querySelectorAll('a[href*="/posts/"], a[href*="/permalink/"], a[href*="story_fbid"], abbr, span[id*="jsc_c"], a[role="link"] > span');
  let timeText = "";
  for (const el of timeLinks) {
    const txt = (el.innerText || "").trim().toLowerCase();
    if (txt.length > 0 && txt.length < 35) {
      timeText += " " + txt;
    }
  }

  if (!timeText.trim()) {
    timeText = (postEl.innerText || "").slice(0, 300).toLowerCase();
  }

  // 1. Reject clearly old posts (days, weeks, months, years)
  const oldPatterns = [
    /\byesterday\b/,
    /\b\d+\s*(?:d|day|days)\b/,
    /\b\d+\s*(?:w|wk|week|weeks)\b/,
    /\b\d+\s*(?:mo|month|months)\b/,
    /\b\d+\s*(?:y|yr|years?)\b/,
    /\b202[0-5]\b/,
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d+/,
    /\b\d+\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/
  ];

  for (const p of oldPatterns) {
    if (p.test(timeText)) {
      return false; // Skip old post
    }
  }

  // 2. Reject posts older than limitHours (e.g. "21h", "18h", "12 hours ago")
  const hourMatch = timeText.match(/\b(\d+)\s*(?:h|hr|hrs|hours?)\b/);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1], 10);
    if (!isNaN(hours) && hours > limitHours) {
      return false;
    }
  }

  return true;
}

function getPostExistingComments(postEl) {
  if (!postEl) return 0;
  const text = (postEl.innerText || "").slice(0, 1500);

  // Match e.g. "12 comments", "1 comment", "5 replies", "8 answers"
  const commentMatch = text.match(/\b(\d+[\d,]*)\s*(?:comments?|replies|answers?)\b/i);
  if (commentMatch) {
    const raw = commentMatch[1].replace(/,/g, "");
    const count = parseInt(raw, 10);
    return isNaN(count) ? 0 : count;
  }

  // Check visible rendered comments in this post
  const visible = postEl.querySelectorAll('div[aria-label*="comment by" i], div[role="article"] div[role="article"]');
  if (visible.length > 0) return visible.length;

  return 0;
}

function ensureRecentPostsFilterActive() {
  try {
    const filterSection = document.querySelector('div[aria-label*="filter" i], div[role="navigation"], div.x1iyjqo2');
    const container = filterSection || document;
    const candidates = container.querySelectorAll('div[role="radio"], div[role="checkbox"], div[role="switch"], div[role="button"], span');
    for (const el of candidates) {
      const text = (el.innerText || "").trim().toLowerCase();
      const aria = (el.getAttribute("aria-label") || "").toLowerCase();
      if (text === "recent posts" || text === "most recent" || aria.includes("recent posts") || aria.includes("most recent")) {
        const clickable = el.closest('div[role="radio"], div[role="checkbox"], div[role="button"], label') || el;
        const isChecked = clickable.getAttribute("aria-checked") === "true";
        if (!isChecked) {
          console.log("[PakDigital AI] Activating 'Recent Posts' filter in Facebook sidebar!");
          clickable.click();
          return true;
        }
      }
    }
  } catch (e) {}
  return false;
}

// ------------------------------------------------------------------
// DEEP INTENT & ENTITY VERIFICATION
// ------------------------------------------------------------------
const SellerAndMarketingWords = [
  "social media marketing", "content creation", "content creator", "business owners who need",
  "if you are a business owner", "grow your business", "scale your business", "marketing agency",
  "b2b leads", "if you are a roofer", "if you are a plumber", "if you are hvac", "this is for you!",
  "looking for 5 business", "looking for clients", "coaching program", "mentor program", "free webinar",
  "we are hiring", "now hiring", "job vacancy", "send cv", "submit resume", "monthly salary",
  "crypto investment", "forex trading", "real estate investing", "wholesale properties"
];

const RealProblemKeywords = [
  "need", "looking", "seeking", "wanted", "hire", "recommend", "recommendations", "iso ", "in search of",
  "anyone know", "anybody know", "anyone recommend", "who does", "who can", "suggestions",
  "recs", "help with", "in search of", "requesting", "can someone", "could someone",
  "repair", "fix", "install", "replace", "estimate", "quote", "emergency", "cost to", "price to",
  "not working", "broken", "damaged", "leak", "leaking", "clogged", "fair rate", "affordable", "reliable",
  "mow", "mowing", "lawn", "grass", "yard work", "yard cleanup", "overgrown", "landscap", "tree trimming",
  "tree removal", "hedge", "edging", "mulch", "leaf removal", "cleanup", "cut my", "mow my", "cut yard", "backyard", "front yard"
];

function isGenuineCustomerPost(postText, customService) {
  const text = (postText || "").toLowerCase();
  const service = (customService || "").toLowerCase();
  const isDigital = service.includes("seo") || service.includes("web");

  // 1. Strict Marketing Reject
  for (const word of SellerAndMarketingWords) {
    if (isDigital && (word.includes("seo") || word.includes("agency"))) continue;
    if (text.includes(word)) return false;
  }

  // 2. Must contain genuine problem/need signal
  const hasProblemSignal = RealProblemKeywords.some(w => text.includes(w));
  if (!hasProblemSignal) return false;

  // 3. Must match user service keywords
  const expandedList = getExpandedKeywords(customService);
  const matchesService = expandedList.some(kw => text.includes(kw));

  return matchesService;
}

// ------------------------------------------------------------------
// Name Extractor
// ------------------------------------------------------------------
const BlockedWords = [
  "find", "search", "chat", "message", "facebook", "group", "post", "user", 
  "active", "end-to-end", "learn", "like", "comment", "share", "reply", 
  "write", "answer", "view", "most", "relevant", "newest", "all", "photos",
  "the", "a", "an", "mr", "mrs", "dr", "inc", "llc", "ventures", "services", "company",
  "bay", "area", "construction", "buy", "sell", "contractors", "network", "community",
  "companies", "join"
];

function cleanAndValidateName(raw) {
  if (!raw) return "";
  let str = raw.trim();

  if (str.includes("·") || str.includes("•")) {
    const parts = str.split(/[·•]/);
    str = parts[0].trim();
  }

  if (str.includes("'s post")) str = str.replace("'s post", "").trim();
  str = str.replace(/\d+$/, "").trim();

  const words = str.split(/[\s_.]+/);
  let firstName = words[0];

  if (!firstName || BlockedWords.includes(firstName.toLowerCase())) {
    if (words.length > 1 && !BlockedWords.includes(words[1].toLowerCase())) {
      firstName = words[1];
    } else {
      return "";
    }
  }

  if (/^\d+$/.test(firstName) || firstName.length < 2 || firstName.length > 20) {
    return "";
  }

  return firstName;
}

function findAuthorName(scopeElement) {
  const scope = scopeElement || (lastRightClickedElement ? lastRightClickedElement.closest('div[role="article"], div[data-pagelet*="FeedUnit"], div.x1yztbdb, div[role="dialog"]') : document);

  if (!scope) return "";

  const links = scope.querySelectorAll('a[href*="/user/"], a[href*="/profile.php"], a[role="link"]');
  for (const a of links) {
    const href = (a.getAttribute("href") || "").toLowerCase();
    const text = (a.innerText || "").trim();

    if (href.includes("/groups/") && !href.includes("/user/")) {
      continue;
    }
    if (/join|like|comment|share|reply|photo|video|group/i.test(text)) {
      continue;
    }

    const clean = cleanAndValidateName(text);
    if (clean) return clean;
  }

  const userAuthor = scope.querySelectorAll('span.x1lliihq > strong > span, div.x1heor9g a strong, strong a, h3 a, h4 a');
  for (const el of userAuthor) {
    const parentA = el.closest('a');
    if (parentA) {
      const href = (parentA.getAttribute("href") || "").toLowerCase();
      if (href.includes("/groups/") && !href.includes("/user/")) {
        continue;
      }
    }
    const clean = cleanAndValidateName(el.innerText);
    if (clean) return clean;
  }

  const modalHeaders = scope.querySelectorAll('h2, span[dir="auto"], h1');
  for (const el of modalHeaders) {
    if (el.innerText && el.innerText.includes("'s post")) {
      const clean = cleanAndValidateName(el.innerText);
      if (clean) return clean;
    }
  }

  return "";
}

function findTargetBox() {
  if (lastRightClickedElement) {
    const directBox = lastRightClickedElement.closest(`
      div[contenteditable="true"],
      div[role="textbox"],
      div[aria-label*="Message" i],
      div[aria-label*="answer" i],
      div[aria-label*="comment" i],
      textarea
    `);
    if (directBox) return directBox;
  }

  if (document.activeElement && (document.activeElement.isContentEditable || document.activeElement.getAttribute("role") === "textbox")) {
    return document.activeElement;
  }

  const box = document.querySelector(`
    div[role="dialog"] div[contenteditable="true"][role="textbox"],
    div[role="dialog"] div[aria-label*="answer" i],
    div[role="dialog"] div[aria-label*="comment" i],
    div[contenteditable="true"][role="textbox"]
  `);

  return box;
}

// ------------------------------------------------------------------
// REAL TYPING & SUBMISSION ENGINE (For Facebook Lexical Editor)
// ------------------------------------------------------------------
let isCommentInserting = false;

function findBlueSendButton(box) {
  const container = box.closest('div[role="article"], form, div[role="dialog"], div.x1yztbdb, div[data-pagelet*="FeedUnit"]') || document;
  const candidates = container.querySelectorAll('div[role="button"]');
  for (const btn of candidates) {
    if (btn === box) continue;
    const aria = (btn.getAttribute("aria-label") || "").toLowerCase();
    if (aria.includes("comment") || aria.includes("send") || aria.includes("submit") || aria.includes("post") || aria.includes("enter to")) {
      return btn;
    }
    const svg = btn.querySelector('svg');
    if (svg) {
      const html = svg.outerHTML || "";
      // Facebook brand blues: #0866FF, #1877F2, #0064e0, rgb(8, 102, 255), rgb(24, 119, 242)
      if (html.includes("0866FF") || html.includes("1877F2") || html.includes("0064e0") || html.includes("8, 102, 255") || html.includes("24, 119, 242")) {
        return btn;
      }
    }
  }
  return null;
}

function extractPostUrl(postEl) {
  if (!postEl) return window.location.href;
  const links = postEl.querySelectorAll('a[href*="/posts/"], a[href*="/permalink/"], a[href*="fbid="], a[href*="/watch/"], a[href*="/videos/"], a[href*="/groups/"]');
  for (const a of links) {
    const href = a.href || "";
    if (href.includes("/posts/") || href.includes("/permalink/") || href.includes("fbid=")) {
      try {
        const u = new URL(href);
        return `${u.origin}${u.pathname}`;
      } catch(e) {
        return href.split("?")[0];
      }
    }
  }
  return window.location.href;
}

function playLeadAlertChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) {}
}

function reportHotLeadToSheet(settings, postUrl, authorName, postSnippet, commentText) {
  try {
    const key = (settings && settings.licenseKey) ? settings.licenseKey : "";
    const isSniperAlert = settings && settings.sniperMode === "alert_only";
    const service = (isSniperAlert && settings.sniperServiceName && settings.sniperServiceName.trim())
      ? settings.sniperServiceName.trim()
      : ((settings && settings.customServiceName) ? settings.customServiceName : "Service");
    const phone = (settings && (settings.alertWhatsAppPhone || settings.contactPhone)) ? (settings.alertWhatsAppPhone || settings.contactPhone) : "";
    const webhook = (settings && settings.customSheetWebhook) ? settings.customSheetWebhook : (settings && settings.licenseWebhookUrl ? settings.licenseWebhookUrl : (typeof PRODUCTION_WEBHOOK_URL !== "undefined" ? PRODUCTION_WEBHOOK_URL : ""));

    if (!webhook) return;
    const cleanSnippet = (postSnippet || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, 300);
    const cleanComment = (commentText || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, 300);
    const url = `${webhook}?action=SAVE_LEAD&key=${encodeURIComponent(key)}&service=${encodeURIComponent(service)}&author=${encodeURIComponent(authorName)}&postUrl=${encodeURIComponent(postUrl)}&postText=${encodeURIComponent(cleanSnippet)}&comment=${encodeURIComponent(cleanComment)}&phone=${encodeURIComponent(phone)}`;

    fetch(url)
      .then(r => r.json())
      .then(res => {
        console.log("[PakDigital AI] Lead recorded in Sheet:", res);
        if (res.success && !res.duplicate) {
          const statusEl = document.getElementById("pakdigital-hud-status");
          if (statusEl) statusEl.innerHTML = `🎯 <span style="color:#34d399;">Hot Lead Saved:</span> <b>${authorName || 'Customer'}</b>`;
        }
      })
      .catch(err => console.warn("[PakDigital AI] Lead webhook error:", err));
  } catch(e) {}
}

function insertAndSubmitComment(box, text, shouldPressEnter) {
  if (!box || isCommentInserting) return false;
  isCommentInserting = true;

  try {
    box.focus();

    // 1. Wipe & Clear box completely first (prevents any duplicate text)
    try {
      document.execCommand("selectAll", false, null);
      document.execCommand("delete", false, null);
    } catch (err) {}

    // 2. Insert text strictly ONCE
    document.execCommand("insertText", false, text);

    // Verify after short delay; only if completely blank, insert once via textContent
    setTimeout(() => {
      const currentText = (box.innerText || box.textContent || "").trim();
      if (!currentText || currentText.length === 0) {
        const targetP = box.querySelector('p') || box;
        targetP.textContent = text;
        box.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, data: text }));
      }

      // 3. Submit if Auto-Pilot
      if (shouldPressEnter) {
        setTimeout(() => {
          box.focus();
          const enterProps = {
            bubbles: true,
            cancelable: true,
            composed: true,
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13
          };
          box.dispatchEvent(new KeyboardEvent("keydown", enterProps));
          box.dispatchEvent(new KeyboardEvent("keypress", enterProps));
          box.dispatchEvent(new KeyboardEvent("keyup", enterProps));

          // Also click the Blue Send Arrow button visible on screen
          setTimeout(() => {
            const sendBtn = findBlueSendButton(box);
            if (sendBtn) {
              const clickTarget = sendBtn.closest('div[role="button"]') || sendBtn;
              clickTarget.click();
            }
            box.blur();
            isCommentInserting = false;
          }, 350);
        }, 500);
      } else {
        isCommentInserting = false;
      }
    }, 150);

    return true;
  } catch (e) {
    console.error("[PakDigital AI] insertAndSubmitComment error:", e);
    isCommentInserting = false;
    return false;
  }
}

// ------------------------------------------------------------------
// MANUAL RIGHT CLICK (With Real-Time Admin Block Check)
// ------------------------------------------------------------------
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "DO_RIGHT_CLICK_COMMENT") {
    const box = findTargetBox();
    if (!box) {
      alert("Please click inside the comment or message box first, then right-click!");
      sendResponse({ success: false });
      return true;
    }

    chrome.storage.sync.get([
      "isLicenseActive", "licenseKey", "licenseWebhookUrl",
      "customServiceName", "contactPhone", "customNote", "ctaGoal", "customInstruction", "targetCountry"
    ], async (settings) => {
      if (!settings.isLicenseActive || !settings.licenseKey) {
        alert("🔒 PakDigital AI Agent: License Not Activated!\nPlease click the extension icon in your Chrome toolbar and activate your License Key.");
        sendResponse({ success: false });
        return;
      }

      // LIVE REAL-TIME CHECK WITH GOOGLE SHEET (Immediately blocks unauthorized / blocked users)
      try {
        const verifyRes = await verifyLicenseKey(settings.licenseKey, settings.licenseWebhookUrl);
        if (!verifyRes.valid) {
          chrome.storage.sync.set({ isLicenseActive: false, isAutoPilotRunning: false });
          alert(`🔒 PakDigital AI Agent: Access Revoked!\n${verifyRes.message || "Your license has been suspended or blocked by Admin."}`);
          sendResponse({ success: false });
          return;
        }
      } catch (err) {
        console.warn("[PakDigital AI] Live check error:", err);
      }

      const postScope = box.closest('div[role="article"], div[data-pagelet*="FeedUnit"], div.x1yztbdb, div[role="dialog"]') ||
                        lastRightClickedElement?.closest('div[role="article"], div[data-pagelet*="FeedUnit"], div.x1yztbdb, div[role="dialog"]');

      const authorName = findAuthorName(postScope);
      const service = settings.customServiceName || "plumbing";
      const phone = settings.contactPhone || "";
      const note = settings.customNote || "";
      const goal = settings.ctaGoal || "call";
      const instruction = settings.customInstruction || "";
      const country = settings.targetCountry || "1";

      const comment = generateSmartComment(authorName, service, phone, note, goal, instruction, country);
      insertAndSubmitComment(box, comment, false);

      updateDailyCount();
      sendResponse({ success: true, comment });
    });
    return true;
  }

  if (req.action === "START_AUTOPILOT") {
    startAutoPilot();
    sendResponse({ success: true });
    return true;
  }

  if (req.action === "STOP_AUTOPILOT") {
    stopAutoPilot();
    sendResponse({ success: true });
    return true;
  }

  if (req.action === "CLEAR_HISTORY") {
    actuallyCommentedPostKeys.clear();
    currentSessionSkipped.clear();
    chrome.storage.local.remove(["commentedHistory"], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

function updateDailyCount(cb) {
  const todayDate = new Date().toISOString().slice(0, 10);
  chrome.storage.sync.get(["todayCount", "lastDate"], (data) => {
    let count = data.todayCount || 0;
    if (data.lastDate !== todayDate) {
      count = 0;
    }
    count++;
    chrome.storage.sync.set({ todayCount: count, lastDate: todayDate }, () => {
      if (cb) cb(count);
    });
  });
}

// ------------------------------------------------------------------
// LUXURY FLOATING HUD ON SCREEN
// ------------------------------------------------------------------
function showAutoPilotBadge(statusText, countInfo, extraMeta) {
  let badge = document.getElementById("pakdigital-auto-badge");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "pakdigital-auto-badge";
    badge.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 18px;
      border-radius: 12px;
      background: #0f172a;
      border: 1px solid #334155;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-width: 270px;
      color: #f8fafc;
      transition: all 0.3s ease;
    `;

    badge.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 8px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
          <span style="font-size: 12px; font-weight: 700; color: #818cf8;">PakDigital AI Auto-Pilot</span>
        </div>
        <button id="pakdigital-hud-stop" style="background: #ef4444; color: white; border: none; border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 700; cursor: pointer;">⏹ Stop</button>
      </div>
      <div id="pakdigital-hud-status" style="font-size: 11px; color: #cbd5e1; font-weight: 500;">Initializing...</div>
      <div id="pakdigital-hud-meta" style="font-size: 10px; color: #94a3b8; margin-top: 4px;"></div>
      <div id="pakdigital-hud-count" style="font-size: 10px; color: #34d399; margin-top: 4px; font-weight: 600;">Active Session</div>
    `;

    document.body.appendChild(badge);

    document.getElementById("pakdigital-hud-stop").addEventListener("click", () => {
      stopAutoPilot();
    });
  }

  const statusEl = document.getElementById("pakdigital-hud-status");
  if (statusEl && statusText) statusEl.innerHTML = statusText;

  const countEl = document.getElementById("pakdigital-hud-count");
  if (countEl && countInfo) countEl.innerText = countInfo;

  const metaEl = document.getElementById("pakdigital-hud-meta");
  if (metaEl && extraMeta) metaEl.innerHTML = extraMeta;
}

function removeAutoPilotBadge() {
  const badge = document.getElementById("pakdigital-auto-badge");
  if (badge) badge.remove();
}

async function startAutoPilot() {
  if (isAutoPilotActive) return;

  chrome.storage.sync.get(["isLicenseActive", "licenseKey", "licenseWebhookUrl", "sniperMode"], async (data) => {
    if (!data.isLicenseActive || !data.licenseKey) {
      alert("🔒 PakDigital AI Agent: License Not Activated!\nPlease click the extension icon and enter your license key to activate.");
      stopAutoPilot();
      return;
    }

    try {
      const verifyRes = await verifyLicenseKey(data.licenseKey, data.licenseWebhookUrl);
      if (!verifyRes.valid) {
        chrome.storage.sync.set({ isLicenseActive: false, isAutoPilotRunning: false });
        alert(`🔒 PakDigital AI Agent: Access Revoked!\n${verifyRes.message || "Your license has been suspended or blocked by Admin."}`);
        stopAutoPilot();
        return;
      }
    } catch (err) {}

    isAutoPilotActive = true;
    scanAttemptsWithoutMatch = 0;
    commentsOnCurrentQuery = 0;
    const badgeTitle = data.sniperMode === "alert_only"
      ? "🎯 Live Lead Sniper: Scanning Leads (Silent Alert Mode)..."
      : "🚀 Auto-Pilot Active: Scanning Leads...";
    showAutoPilotBadge(badgeTitle, "Initializing...");
    runAutoPilotCycle();
  });
}

function stopAutoPilot() {
  isAutoPilotActive = false;
  if (autoPilotTimer) clearTimeout(autoPilotTimer);
  chrome.storage.sync.set({ isAutoPilotRunning: false });

  const statusEl = document.getElementById("pakdigital-hud-status");
  if (statusEl) statusEl.innerHTML = "<span style='color: #ef4444;'>Auto-Pilot Stopped</span>";

  setTimeout(removeAutoPilotBadge, 2500);
}

function getPostFingerprint(postEl) {
  const link = postEl.querySelector('a[href*="/posts/"], a[href*="/permalink/"], a[href*="story_fbid"]');
  if (link && link.href) {
    return link.href.split("?")[0];
  }
  const author = findAuthorName(postEl);
  const textSample = (postEl.innerText || "").slice(0, 80).replace(/\s+/g, " ").trim();
  return (author + "_" + textSample);
}

function hasAlreadyCommented(postEl, myContact) {
  const fullText = (postEl.innerText || "").toLowerCase();
  if (myContact && myContact.length > 5) {
    const clean = myContact.replace(/[\s-]/g, "").toLowerCase();
    const cleanText = fullText.replace(/[\s-]/g, "");
    if (cleanText.includes(clean)) return true;
  }
  if (fullText.includes("available 7 days a week") || fullText.includes("check your inbox") || fullText.includes("100% satisfaction")) {
    return true;
  }
  return false;
}

// ------------------------------------------------------------------
// COMMERCIAL AUTO-PILOT CYCLE (With Verified Real-Click Activation)
// ------------------------------------------------------------------
async function runAutoPilotCycle() {
  if (!isAutoPilotActive) return;

  chrome.storage.sync.get([
    "isLicenseActive", "licenseKey", "licenseWebhookUrl",
    "customServiceName", "contactPhone", "customNote", "dailyLimit", "minDelay", "todayCount", 
    "ctaGoal", "customInstruction", "targetCountry", "searchQueryQueue", "activeQueryIndex", "queryStartTime",
    "sniperMode", "sniperServiceName", "enableChimeAlert", "alertWhatsAppPhone", "customSheetWebhook",
    "maxExistingComments", "maxPostAgeHours", "sniperMaxComments", "sniperMaxAge"
  ], async (settings) => {
    if (!isAutoPilotActive) return;

    if (!settings.isLicenseActive || !settings.licenseKey) {
      stopAutoPilot();
      showAutoPilotBadge("<span style='color: #ef4444;'>🔒 License Not Active</span>", "Stopped");
      return;
    }

    // LIVE REAL-TIME CHECK WITH GOOGLE SHEET (Immediately aborts if Admin set to Blocked)
    try {
      const verifyRes = await verifyLicenseKey(settings.licenseKey, settings.licenseWebhookUrl);
      if (!verifyRes.valid) {
        chrome.storage.sync.set({ isLicenseActive: false, isAutoPilotRunning: false });
        showAutoPilotBadge("<span style='color: #ef4444;'>🔒 License Blocked by Admin</span>", "Stopped");
        stopAutoPilot();
        alert(`🔒 PakDigital AI Agent: Access Revoked!\n${verifyRes.message || "Your license has been suspended or blocked by Admin."}`);
        return;
      }
    } catch (err) {
      console.warn("[PakDigital AI] Live check error:", err);
    }

    const limit = settings.dailyLimit || 25;
    const count = settings.todayCount || 0;
    const myContact = settings.contactPhone || "";
    const isSniperAlertOnly = settings.sniperMode === "alert_only";
    const myService = (isSniperAlertOnly && settings.sniperServiceName && settings.sniperServiceName.trim())
      ? settings.sniperServiceName.trim()
      : (settings.customServiceName || "plumbing");
    const myGoal = settings.ctaGoal || "call";
    const instruction = settings.customInstruction || "";
    const myCountry = settings.targetCountry || "1";

    const countInfo = `Sent Today: ${count} / ${limit} Leads`;

    if (count >= limit) {
      showAutoPilotBadge("🛡️ Daily safety limit reached! Paused safely.", countInfo);
      stopAutoPilot();
      return;
    }

    // 1. Manage Query Queue & Active Query
    let queue = settings.searchQueryQueue;
    if (!queue || !Array.isArray(queue) || queue.length === 0) {
      const primary = myService.split(/and|&|,/)[0].trim() || myService;
      queue = [`need ${primary}`, `looking for ${primary}`, `recommend ${primary}`];
    }

    let queryIdx = settings.activeQueryIndex || 0;
    if (queryIdx >= queue.length) queryIdx = 0;
    const currentQuery = queue[queryIdx];

    // 2. Query Rotation Check:
    // Minimum 2.5 minutes (150s) OR 3 to 5 comments posted on this query!
    const ROTATION_TIME_MS = 2.5 * 60 * 1000;
    const startTime = settings.queryStartTime || Date.now();
    const elapsed = Date.now() - startTime;
    const remainingSeconds = Math.max(0, Math.round((ROTATION_TIME_MS - elapsed) / 1000));
    const minsLeft = Math.floor(remainingSeconds / 60);
    const secsLeft = remainingSeconds % 60;
    const timerStr = `${minsLeft}m ${secsLeft < 10 ? '0' : ''}${secsLeft}s`;
    const metaInfo = `🔍 Query [${queryIdx + 1}/${queue.length}]: "<b>${currentQuery}</b>"<br>⏱️ Rotate in: ${timerStr} (Comments: ${commentsOnCurrentQuery}/3)`;

    const shouldRotate = (elapsed >= ROTATION_TIME_MS && scanAttemptsWithoutMatch >= 5) || 
                         (commentsOnCurrentQuery >= 3) || 
                         (elapsed >= (4 * 60 * 1000));

    if (shouldRotate) {
      const nextIdx = (queryIdx + 1) % queue.length;
      const nextQuery = queue[nextIdx];
      commentsOnCurrentQuery = 0;
      scanAttemptsWithoutMatch = 0;

      showAutoPilotBadge(`🔄 Rotating to next query: <b>"${nextQuery}"</b>...`, countInfo, metaInfo);

      chrome.storage.sync.set({
        activeQueryIndex: nextIdx,
        queryStartTime: Date.now()
      }, () => {
        setTimeout(() => {
          const nextUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(nextQuery)}&filters=${CHRONO_SORT_FILTER}`;
          window.location.href = nextUrl;
        }, 1500);
      });
      return;
    }

    // 3. Ensure Facebook is strictly on "Posts" tab (Never stay on "All")
    if (window.location.pathname.includes("/search/top") || (!window.location.pathname.includes("/search/posts") && window.location.pathname.includes("/search/"))) {
      showAutoPilotBadge("Switching to Recent Posts Tab...", countInfo, metaInfo);
      window.location.href = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(currentQuery)}&filters=${CHRONO_SORT_FILTER}`;
      return;
    }

    // 4. Force "Recent Posts" Filter in Facebook Left Sidebar if present
    ensureRecentPostsFilterActive();

    // 5. Scan Visible Feed / Posts
    const postContainers = document.querySelectorAll(`
      div[role="feed"] > div,
      div[role="article"],
      div[data-pagelet*="FeedUnit"],
      div[data-pagelet*="Search"],
      div.x1yztbdb
    `);

    let targetPost = null;
    let targetTrigger = null;
    let targetPostKey = null;

    for (const post of postContainers) {
      if (!post.innerText || post.innerText.length < 30) continue;

      const key = getPostFingerprint(post);
      // Skip if actually commented previously, or skipped in this tab session
      if (!key || actuallyCommentedPostKeys.has(key) || currentSessionSkipped.has(key)) continue;

      // 1. Freshness check: Skip if older than max allowed hours (e.g. 8h or 4h)
      const maxAge = isSniperAlertOnly
        ? (settings.sniperMaxAge || settings.maxPostAgeHours || 8)
        : (settings.maxPostAgeHours || 8);

      if (!isPostFresh(post, maxAge)) {
        currentSessionSkipped.add(key);
        continue;
      }

      // 2. Saturation check: Skip if post already has too many comments!
      const maxComments = isSniperAlertOnly
        ? (settings.sniperMaxComments || settings.maxExistingComments || 5)
        : (settings.maxExistingComments || 5);

      const existingComments = getPostExistingComments(post);
      if (existingComments > maxComments) {
        currentSessionSkipped.add(key);
        showAutoPilotBadge(`⏭️ Skipped: Post has ${existingComments} comments (max ${maxComments})`, countInfo, metaInfo);
        continue;
      }

      // Verify Genuine Customer Intent
      if (!isGenuineCustomerPost(post.innerText, myService)) {
        currentSessionSkipped.add(key);
        continue;
      }

      if (hasAlreadyCommented(post, myContact)) {
        actuallyCommentedPostKeys.add(key);
        continue;
      }

      // Check if real contenteditable editor is ALREADY mounted and active
      const activeContentEditable = post.querySelector('div[contenteditable="true"][role="textbox"]');
      if (activeContentEditable) {
        targetPost = post;
        targetTrigger = { type: 'ALREADY_ACTIVE', el: activeContentEditable };
        targetPostKey = key;
        break;
      }

      // Otherwise, find the comment trigger (strictly excluding 3-dots / action menus)
      const allButtons = post.querySelectorAll('div[aria-label*="Write a comment" i], div[aria-label="Comment" i], div[aria-label="Leave a comment" i], div[role="button"]');
      let clickTrigger = null;

      for (const btn of allButtons) {
        const label = (btn.getAttribute("aria-label") || "").toLowerCase();
        const txt = (btn.innerText || "").toLowerCase();
        // Skip three dots / action / menu buttons
        if (label.includes("action") || label.includes("more") || label.includes("menu") || label.includes("option")) continue;
        if (txt.includes("save") || txt.includes("report") || txt.includes("hide") || txt.includes("share") || txt.includes("like")) continue;

        if (label.includes("comment") || txt.includes("comment") || txt.includes("write an answer") || label.includes("answer")) {
          clickTrigger = btn;
          break;
        }
      }

      if (clickTrigger) {
        const actualBtn = clickTrigger.closest('div[role="button"]') || clickTrigger;
        targetPost = post;
        targetTrigger = { type: 'NEEDS_CLICK', el: actualBtn };
        targetPostKey = key;
        break;
      }
    }

    if (targetPost && targetTrigger && targetPostKey) {
      scanAttemptsWithoutMatch = 0;

      const postUrl = extractPostUrl(targetPost);
      const authorName = findAuthorName(targetPost);

      // 1. Play Lead Alert Chime if enabled
      if (settings.enableChimeAlert !== false) {
        playLeadAlertChime();
      }

      // 2. Check Sniper Mode: Alert Only VS Auto-Comment
      if (settings.sniperMode === "alert_only") {
        // Record lead with Sniper note
        reportHotLeadToSheet(settings, postUrl, authorName, targetPost.innerText, "🎯 Silent Sniper (Alert Only - No Comment)");

        showAutoPilotBadge(`🔔 Sniped Lead for <b>${authorName || 'Customer'}</b>! (Alert Saved to Sheet)`, countInfo, metaInfo);
        markPostAsCommented(targetPostKey);
        commentsOnCurrentQuery++;

        setTimeout(() => {
          window.scrollBy({ top: 500, behavior: "smooth" });
        }, 1500);

        const baseDelay = Math.max(15, settings.minDelay || 30);
        const randomExtra = Math.floor(Math.random() * 10);
        const nextWait = baseDelay + randomExtra;

        let secondsLeft = nextWait;
        const countdownInterval = setInterval(() => {
          if (!isAutoPilotActive) {
            clearInterval(countdownInterval);
            return;
          }
          secondsLeft--;
          showAutoPilotBadge(`🔔 Lead Alerted! Waiting: ${secondsLeft}s for next scan...`, countInfo, metaInfo);
          if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            if (isAutoPilotActive) runAutoPilotCycle();
          }
        }, 1000);
        return;
      }

      showAutoPilotBadge("🎯 Matching Lead Found! Opening comment box...", countInfo, metaInfo);
      targetPost.scrollIntoView({ behavior: "smooth", block: "center" });

      const doTypeAndSubmit = (realBox) => {
        const authorName = findAuthorName(targetPost);
        const note = settings.customNote || "";

        showAutoPilotBadge(`✍️ Typing comment for <b>${authorName || 'Customer'}</b>...`, countInfo, metaInfo);

        const comment = generateSmartComment(authorName, myService, myContact, note, myGoal, instruction, myCountry);
        insertAndSubmitComment(realBox, comment, true);

        // Save Lead to Google Sheet WITH the exact posted AI comment!
        reportHotLeadToSheet(settings, postUrl, authorName, targetPost.innerText, comment);

        // Mark as commented ONLY after real typing happens!
        markPostAsCommented(targetPostKey);
        commentsOnCurrentQuery++;

        updateDailyCount((newCount) => {
          setTimeout(() => {
            window.scrollBy({ top: 600, behavior: "smooth" });
          }, 1500);

          const baseDelay = Math.max(15, settings.minDelay || 30);
          const randomExtra = Math.floor(Math.random() * 10);
          const nextWait = baseDelay + randomExtra;

          let secondsLeft = nextWait;
          const countdownInterval = setInterval(() => {
            if (!isAutoPilotActive) {
              clearInterval(countdownInterval);
              return;
            }
            showAutoPilotBadge(`⏱️ Safe Delay: Next lead in <b>${secondsLeft}s</b>`, `Sent: ${newCount} / ${limit}`, metaInfo);
            secondsLeft--;
            if (secondsLeft <= 0) clearInterval(countdownInterval);
          }, 1000);

          autoPilotTimer = setTimeout(() => {
            runAutoPilotCycle();
          }, nextWait * 1000);
        });
      };

      if (targetTrigger.type === 'ALREADY_ACTIVE') {
        setTimeout(() => doTypeAndSubmit(targetTrigger.el), 800);
      } else {
        // Human click to trigger Facebook's real contenteditable editor!
        targetTrigger.el.click();
        targetTrigger.el.focus();

        let retries = 0;
        const checkEditorMounted = setInterval(() => {
          retries++;
          const realEditor = targetPost.querySelector('div[contenteditable="true"][role="textbox"]') ||
                             document.querySelector('div[role="dialog"] div[contenteditable="true"][role="textbox"]');

          if (realEditor) {
            clearInterval(checkEditorMounted);
            setTimeout(() => doTypeAndSubmit(realEditor), 600);
          } else if (retries > 10) {
            clearInterval(checkEditorMounted);
            currentSessionSkipped.add(targetPostKey);
            runAutoPilotCycle();
          }
        }, 400);
      }
    } else {
      scanAttemptsWithoutMatch++;
      showAutoPilotBadge(`🔍 Scrolling for leads... (Pass ${scanAttemptsWithoutMatch})`, countInfo, metaInfo);

      window.scrollBy({ top: 850, behavior: "smooth" });
      autoPilotTimer = setTimeout(runAutoPilotCycle, 3500);
    }
  });
}
