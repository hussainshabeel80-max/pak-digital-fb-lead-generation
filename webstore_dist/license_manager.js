/**
 * PakDigital License & Device Lock Manager
 * Generates stable hardware fingerprint across all Chrome profiles on the same machine
 * Validates against your Live Google Sheet License Gate
 */

// Permanent Production Google Sheet Webhook URL
const PRODUCTION_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxUgbVoR3o_6UvSoj-XVJtt3UxELGLiEq_x1486Qiz4tx0_RhjLDnKfsQPw72IcnhyBjg/exec";

// Universal hardware/machine fingerprint generator (Identical across all Chrome profiles on same PC)
async function getDeviceFingerprint() {
  const parts = [
    navigator.platform || "unknown",
    navigator.hardwareConcurrency || "4",
    screen.width + "x" + screen.height,
    screen.colorDepth || "24",
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  ];

  // Canvas fingerprint component
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 30;
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(10, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("PakDigital-Agent-2026", 2, 15);
    parts.push(canvas.toDataURL().slice(-40));
  } catch (e) {
    parts.push("canvas-fallback");
  }

  const rawString = parts.join("###");
  
  // Fast hash generator
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }

  const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  return `PC-${hexHash.slice(0, 4)}-${hexHash.slice(4, 8)}`;
}

async function getProfileToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["pakDigitalProfileToken"], (res) => {
      if (res.pakDigitalProfileToken) {
        resolve(res.pakDigitalProfileToken);
      } else {
        const token = "PRF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        chrome.storage.local.set({ pakDigitalProfileToken: token }, () => resolve(token));
      }
    });
  });
}

// Master demo keys for offline/immediate owner testing
const MasterKeys = {
  "PAK-MASTER-ADMIN": { name: "Owner / Admin", status: "active", master: true }
};

/**
 * Validate License Key against Live Google Sheet API
 */
async function verifyLicenseKey(licenseKey, customWebhookUrl) {
  const cleanKey = (licenseKey || "").trim().toUpperCase();
  if (!cleanKey) {
    return { valid: false, message: "Please enter a license key." };
  }

  const deviceId = await getDeviceFingerprint();
  const profileId = await getProfileToken();

  // 1. Check Master Admin Key
  if (MasterKeys[cleanKey]) {
    return {
      valid: true,
      name: MasterKeys[cleanKey].name,
      key: cleanKey,
      deviceId: deviceId,
      profileId: profileId,
      plan: "Owner VIP (Unlimited)",
      dailyLimit: 1000,
      maxProfiles: 99,
      usedProfiles: 1,
      message: "Admin Master License Verified!"
    };
  }

  // 2. Check Live Google Sheet
  const endpoint = customWebhookUrl || PRODUCTION_WEBHOOK_URL;
  try {
    const url = `${endpoint}?key=${encodeURIComponent(cleanKey)}&deviceId=${encodeURIComponent(deviceId)}&profileId=${encodeURIComponent(profileId)}&action=VERIFY`;
    const res = await fetch(url);
    const data = await res.json();

    if (data && data.valid) {
      return {
        valid: true,
        name: data.name || "Licensed User",
        key: cleanKey,
        deviceId: deviceId,
        profileId: profileId,
        plan: data.plan || "Monthly",
        dailyLimit: data.dailyLimit || 40,
        maxProfiles: data.maxProfiles || 1,
        usedProfiles: data.usedProfiles || 1,
        activatedDate: data.activatedDate || "",
        expiryDate: data.expiryDate || "",
        daysRemaining: data.daysRemaining,
        message: data.message || "License Verified & Locked to your PC!"
      };
    } else {
      return {
        valid: false,
        isExpired: data ? !!data.isExpired : false,
        message: data ? data.message : "Invalid license key or locked to another PC."
      };
    }
  } catch (err) {
    console.warn("Webhook validation error:", err);
    return { valid: false, message: "Failed to connect to license server. Check your internet connection." };
  }
}
