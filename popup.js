function buildSearchQueryQueue(rawService, rawQueries) {
  let queue = [];
  if (rawQueries && rawQueries.trim().length > 0) {
    queue = rawQueries.split(",").map(q => q.trim()).filter(q => q.length > 2);
  }
  if (queue.length === 0) {
    const service = (rawService || "plumbing").trim();
    const primary = service.split(/and|&|,/)[0].trim() || service;
    queue = [
      `need ${primary}`,
      `looking for ${primary}`,
      `recommend ${primary}`,
      `anyone know ${primary}`
    ];
  }
  return queue;
}

document.addEventListener('DOMContentLoaded', async () => {
  // License View Elements
  const licenseGateView = document.getElementById('licenseGateView');
  const mainAppView = document.getElementById('mainAppView');
  const displayDeviceId = document.getElementById('displayDeviceId');
  const licenseKeyInput = document.getElementById('licenseKeyInput');
  const licenseWebhookUrlInput = document.getElementById('licenseWebhookUrlInput');
  const activateLicenseBtn = document.getElementById('activateLicenseBtn');
  const licenseError = document.getElementById('licenseError');
  const activeUserName = document.getElementById('activeUserName');
  const logoutLicenseBtn = document.getElementById('logoutLicenseBtn');

  // Main App Elements
  const customServiceName = document.getElementById('customServiceName');
  const ctaGoal = document.getElementById('ctaGoal');
  const targetCountry = document.getElementById('targetCountry');
  const contactPhone = document.getElementById('contactPhone');
  const contactLabel = document.getElementById('contactLabel');
  const customInstruction = document.getElementById('customInstruction');
  const searchKeyword = document.getElementById('searchKeyword');
  const dailyLimit = document.getElementById('dailyLimit');
  const minDelay = document.getElementById('minDelay');
  const dailyCounterText = document.getElementById('dailyCounterText');
  const modeBadge = document.getElementById('modeBadge');
  const startAutoBtn = document.getElementById('startAutoBtn');
  const stopAutoBtn = document.getElementById('stopAutoBtn');
  const saveBtn = document.getElementById('saveBtn');
  const clearMemoryBtn = document.getElementById('clearMemoryBtn');
  const status = document.getElementById('status');

  const todayDate = new Date().toISOString().slice(0, 10);

  // 1. Initial Device ID Display
  const currentDeviceId = await getDeviceFingerprint();
  if (displayDeviceId) {
    displayDeviceId.innerText = `Your PC ID: ${currentDeviceId}`;
  }

  // 2. Check License State on Open
  chrome.storage.sync.get([
    'isLicenseActive', 'licenseKey', 'licensedUserName', 'licenseWebhookUrl',
    'customServiceName', 'ctaGoal', 'targetCountry', 'contactPhone', 'customInstruction', 
    'searchKeyword', 'dailyLimit', 'minDelay', 'todayCount', 'lastDate', 'isAutoPilotRunning'
  ], async (data) => {
    if (data.licenseWebhookUrl) {
      licenseWebhookUrlInput.value = data.licenseWebhookUrl;
    }
    if (data.licenseKey) {
      licenseKeyInput.value = data.licenseKey;
    }

    if (data.isLicenseActive && data.licenseKey) {
      // Show Main App initially
      showMainApp(data.licensedUserName || "Licensed User");
      if (data.subscriptionPlan || data.daysRemaining !== undefined || data.expiryDate) {
        updateSubscriptionDisplay({
          plan: data.subscriptionPlan,
          daysRemaining: data.daysRemaining,
          expiryDate: data.expiryDate
        });
      }

      // LIVE REAL-TIME CHECK WITH GOOGLE SHEET: Did Admin Block or Expire this user?
      verifyLicenseKey(data.licenseKey, data.licenseWebhookUrl).then((checkResult) => {
        if (!checkResult.valid) {
          console.warn("[PakDigital AI] License revoked remotely by Admin!");
          chrome.storage.sync.set({ isLicenseActive: false, isAutoPilotRunning: false }, () => {
            showLockGate();
            showError(checkResult.message || "❌ License Suspended by Admin. Access Revoked.");
          });
        } else {
          chrome.storage.sync.set({
            subscriptionPlan: checkResult.plan,
            activatedDate: checkResult.activatedDate,
            daysRemaining: checkResult.daysRemaining,
            expiryDate: checkResult.expiryDate,
            dailyLimit: checkResult.dailyLimit || 40,
            maxProfiles: checkResult.maxProfiles || 1,
            usedProfiles: checkResult.usedProfiles || 1
          });
          updateSubscriptionDisplay(checkResult);
        }
      });
    } else {
      // License not active -> Show Lock Gate
      showLockGate();
    }

    // Load Main App Settings
    if (data.customServiceName) customServiceName.value = data.customServiceName;
    if (data.ctaGoal) ctaGoal.value = data.ctaGoal;
    if (data.targetCountry) targetCountry.value = data.targetCountry;
    if (data.contactPhone) contactPhone.value = data.contactPhone;
    if (data.customInstruction) customInstruction.value = data.customInstruction;
    if (data.searchKeyword) searchKeyword.value = data.searchKeyword;
    if (data.dailyLimit) dailyLimit.value = data.dailyLimit;
    if (data.minDelay) minDelay.value = data.minDelay;

    updatePlaceholders();

    let count = data.todayCount || 0;
    if (data.lastDate !== todayDate) {
      count = 0;
      chrome.storage.sync.set({ todayCount: 0, lastDate: todayDate });
    }

    const limit = data.dailyLimit || 25;
    dailyCounterText.innerText = `${count} / ${limit} Today`;

    if (data.isAutoPilotRunning) {
      setRunningState(true);
    } else {
      setRunningState(false);
    }
  });

  const planBadge = document.getElementById('planBadge');
  const daysRemainingBadge = document.getElementById('daysRemainingBadge');

  function updateSubscriptionDisplay(info) {
    if (!info) return;
    if (planBadge && info.plan) {
      const profText = info.maxProfiles ? ` (${info.usedProfiles || 1}/${info.maxProfiles} Profiles)` : '';
      planBadge.innerText = `💎 Plan: ${info.plan}${profText}`;
    }
    if (daysRemainingBadge) {
      if (info.daysRemaining !== null && info.daysRemaining !== undefined) {
        if (info.daysRemaining <= 0) {
          daysRemainingBadge.innerText = `⚠️ Expired`;
          daysRemainingBadge.style.color = "#ef4444";
        } else if (info.daysRemaining <= 3) {
          daysRemainingBadge.innerText = `⏳ ${info.daysRemaining} Days Left`;
          daysRemainingBadge.style.color = "#f59e0b";
        } else {
          daysRemainingBadge.innerText = `⏳ ${info.daysRemaining} Days Left`;
          daysRemainingBadge.style.color = "#34d399";
        }
      } else if (info.expiryDate) {
        daysRemainingBadge.innerText = `📅 Exp: ${info.expiryDate}`;
        daysRemainingBadge.style.color = "#34d399";
      } else {
        daysRemainingBadge.innerText = `⏳ Active`;
        daysRemainingBadge.style.color = "#34d399";
      }
    }
    if (info.dailyLimit && dailyLimit) {
      dailyLimit.value = info.dailyLimit;
      chrome.storage.sync.set({ dailyLimit: info.dailyLimit });
    }
  }

  const whatsappSupportBtn = document.getElementById('whatsappSupportBtn');
  function updateWhatsAppLink(key) {
    if (!whatsappSupportBtn) return;
    const devId = displayDeviceId ? displayDeviceId.innerText : "My PC";
    const userKey = key || (licenseKeyInput ? licenseKeyInput.value.trim() : "");
    const msg = encodeURIComponent(`Hi PakDigital Admin, I want to activate or renew my AI Lead Agent license.\n${devId}\nKey: ${userKey}`);
    whatsappSupportBtn.href = `https://wa.me/?text=${msg}`;
  }

  function getMaxDailyLimitForPlan(plan) {
    const p = (plan || "").toLowerCase();
    if (p.includes("trial")) return 15;
    if (p.includes("basic")) return 25;
    if (p.includes("pro")) return 50;
    return 150;
  }

  function showMainApp(userName) {
    licenseGateView.style.display = "none";
    mainAppView.style.display = "block";
    activeUserName.innerText = userName || "Verified User";
  }

  function showLockGate() {
    mainAppView.style.display = "none";
    licenseGateView.style.display = "block";
    updateWhatsAppLink();
  }

  // Activate License Button Click
  activateLicenseBtn.addEventListener('click', async () => {
    const key = licenseKeyInput.value.trim().toUpperCase();
    const webhook = licenseWebhookUrlInput.value.trim();

    if (!key) {
      showError("Please enter a valid license key.");
      return;
    }

    activateLicenseBtn.innerText = "Verifying...";
    activateLicenseBtn.disabled = true;

    const result = await verifyLicenseKey(key, webhook);

    activateLicenseBtn.innerText = "🔑 Activate License";
    activateLicenseBtn.disabled = false;

    if (result.valid) {
      chrome.storage.sync.set({
        isLicenseActive: true,
        licenseKey: key,
        licensedUserName: result.name,
        licenseWebhookUrl: webhook,
        registeredDeviceId: result.deviceId,
        subscriptionPlan: result.plan,
        dailyLimit: result.dailyLimit || 40,
        maxProfiles: result.maxProfiles || 1,
        usedProfiles: result.usedProfiles || 1,
        activatedDate: result.activatedDate,
        daysRemaining: result.daysRemaining,
        expiryDate: result.expiryDate
      }, () => {
        showMainApp(result.name);
        updateSubscriptionDisplay(result);
      });
    } else {
      showError(result.message || "Invalid license key or locked to another device.");
    }
  });

  function showError(msg) {
    licenseError.innerText = msg;
    licenseError.style.display = "block";
    updateWhatsAppLink();
  }

  // Logout / Deactivate License Button
  logoutLicenseBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ isLicenseActive: false }, () => {
      showLockGate();
    });
  });

  // Dynamic placeholders based on country & CTA
  function updatePlaceholders() {
    if (ctaGoal.value === 'dm') {
      contactLabel.innerText = "Portfolio / Website";
      contactPhone.placeholder = "e.g. yoursite.com or portfolio link";
      return;
    }

    contactLabel.innerText = "Phone / WhatsApp";
    const country = targetCountry.value;
    if (country === '1' || country === '1_ca') {
      contactPhone.placeholder = "e.g. 855-788-2696";
    } else if (country === '92') {
      contactPhone.placeholder = "e.g. 0300-1234567";
    } else if (country === '44') {
      contactPhone.placeholder = "e.g. 07123-456789";
    } else if (country === '971') {
      contactPhone.placeholder = "e.g. 050-1234567";
    } else if (country === '966') {
      contactPhone.placeholder = "e.g. 050-1234567";
    } else {
      contactPhone.placeholder = "e.g. local phone number";
    }
  }

  ctaGoal.addEventListener('change', updatePlaceholders);
  targetCountry.addEventListener('change', updatePlaceholders);

  // Auto-Sync script to active Facebook tab
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab && activeTab.id && activeTab.url && activeTab.url.includes("facebook.com")) {
    chrome.runtime.sendMessage({ action: "RELOAD_ACTIVE_TAB_SCRIPTS", tabId: activeTab.id });
  }

  function setRunningState(running) {
    if (running) {
      modeBadge.innerText = "Auto-Pilot Active";
      modeBadge.style.color = "#34d399";
      modeBadge.style.borderColor = "#059669";
      startAutoBtn.style.display = "none";
      stopAutoBtn.style.display = "flex";
    } else {
      modeBadge.innerText = "Ready";
      modeBadge.style.color = "#38bdf8";
      modeBadge.style.borderColor = "#0284c7";
      startAutoBtn.style.display = "flex";
      stopAutoBtn.style.display = "none";
    }
  }

  saveBtn.addEventListener('click', () => {
    chrome.storage.sync.get(['subscriptionPlan'], (data) => {
      const maxAllowed = getMaxDailyLimitForPlan(data.subscriptionPlan);
      let chosenLimit = parseInt(dailyLimit.value) || 25;
      if (chosenLimit > maxAllowed) {
        chosenLimit = maxAllowed;
        dailyLimit.value = maxAllowed;
      }
      chrome.storage.sync.set({
        customServiceName: customServiceName.value.trim(),
        ctaGoal: ctaGoal.value,
        targetCountry: targetCountry.value,
        contactPhone: contactPhone.value.trim(),
        customInstruction: customInstruction.value.trim(),
        searchKeyword: searchKeyword.value.trim(),
        dailyLimit: chosenLimit,
        minDelay: parseInt(minDelay.value) || 30
      }, () => {
        status.style.display = "block";
        setTimeout(() => status.style.display = "none", 1500);
      });
    });
  });

  // Clear Lead Memory (allow testing on same posts)
  clearMemoryBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove(['commentedHistory']);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'CLEAR_HISTORY' });
    }
    status.innerText = "✓ Lead Memory Cleared!";
    status.style.display = "block";
    setTimeout(() => {
      status.style.display = "none";
      status.innerText = "✓ Settings Saved!";
    }, 1500);
  });

  // Start Auto-Pilot / Auto-Search
  startAutoBtn.addEventListener('click', async () => {
    const licData = await chrome.storage.sync.get(['isLicenseActive', 'licenseKey', 'licenseWebhookUrl']);
    if (!licData.isLicenseActive || !licData.licenseKey) {
      showLockGate();
      showError("❌ Please activate your license key first.");
      return;
    }

    const check = await verifyLicenseKey(licData.licenseKey, licData.licenseWebhookUrl);
    if (!check.valid) {
      await chrome.storage.sync.set({ isLicenseActive: false, isAutoPilotRunning: false });
      showLockGate();
      showError(check.message || "❌ License Suspended by Admin. Access Revoked.");
      return;
    }

    const service = customServiceName.value.trim();
    const rawQueries = searchKeyword.value.trim();
    const queue = buildSearchQueryQueue(service, rawQueries);
    const firstQuery = queue[0];
    const goal = ctaGoal.value;
    const country = targetCountry.value;
    const phone = contactPhone.value.trim();
    const instruction = customInstruction.value.trim();
    const limit = parseInt(dailyLimit.value) || 25;
    const delay = parseInt(minDelay.value) || 30;

    await chrome.storage.sync.set({
      customServiceName: service,
      ctaGoal: goal,
      targetCountry: country,
      contactPhone: phone,
      customInstruction: instruction,
      searchKeyword: rawQueries,
      searchQueryQueue: queue,
      activeQueryIndex: 0,
      queryStartTime: Date.now(),
      dailyLimit: limit,
      minDelay: delay,
      isAutoPilotRunning: true
    });

    setRunningState(true);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    const fbSearchUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(firstQuery)}&filters=eyJycF9jaHJvbm9fc29ydDoiZXlKaGJHY2lPaUpTVXpJMU5pSjlmUT09In0%3D`;

    chrome.tabs.update(tab.id, { url: fbSearchUrl });
  });

  // Stop Auto-Pilot
  stopAutoBtn.addEventListener('click', async () => {
    await chrome.storage.sync.set({ isAutoPilotRunning: false });
    setRunningState(false);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: "STOP_AUTOPILOT" });
    }
  });
});
