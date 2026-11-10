// Background Service Worker with Auto-Sync Engine

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  setupContextMenu();
});

function setupContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "generate-ai-comment-menu",
      title: "⚡ Generate AI Comment (PakDigital)",
      contexts: ["all"]
    });
  });
}

// Handle Context Menu Click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generate-ai-comment-menu" && tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "DO_RIGHT_CLICK_COMMENT" }, (res) => {
      if (chrome.runtime.lastError) {
        // Auto-reinject latest content scripts on the fly!
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["ai_engine.js", "content.js"]
        }, () => {
          chrome.tabs.sendMessage(tab.id, { action: "DO_RIGHT_CLICK_COMMENT" });
        });
      }
    });
  }
});

// Auto-Sync signal from popup
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "RELOAD_ACTIVE_TAB_SCRIPTS" && req.tabId) {
    chrome.scripting.executeScript({
      target: { tabId: req.tabId },
      files: ["ai_engine.js", "content.js"]
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
