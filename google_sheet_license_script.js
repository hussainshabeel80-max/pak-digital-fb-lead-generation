/**
 * PakDigital License, Subscription & Profile Gate - Google Apps Script
 * Supports: 
 *  1. All-in-One Single Dialog Creator (Laptop & Mobile Browser Supported!)
 *  2. Custom License Key Edit & Auto-Suggestion
 *  3. Dynamic Chrome Profile Quotas (Kam ya Zyada: 1, 2, 3, 5, etc.)
 *  4. 1-Click "Copy Details" Button (for existing WhatsApp Web tabs)
 *  5. Direct WhatsApp Link Button with Auto "92" Country Code Formatting
 *  6. Hardware PC Locking + Remote Verification Webhook
 */

// ------------------------------------------------------------------
// 1. ONE-CLICK ADMIN MENU IN GOOGLE SHEETS
// ------------------------------------------------------------------
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("⚡ PakDigital Admin")
    .addItem("✨ Generate License (All-In-One Form)", "openAllInOneForm")
    .addSeparator()
    .addItem("🔑 Starter Key (20 Leads, 2 Profiles - 3K)", "openStarterForm")
    .addItem("🚀 Pro Key (30 Leads, 5 Profiles - 5K)", "openProForm")
    .addItem("👑 Agency Key (30 Leads, 15 Profiles - 10K)", "openAgencyForm")
    .addItem("🎁 3-Day Free Trial Key", "openTrialForm")
    .addToUi();
}

function openAllInOneForm() { openLicenseForm("Starter"); }
function openStarterForm() { openLicenseForm("Starter"); }
function openProForm() { openLicenseForm("Pro"); }
function openAgencyForm() { openLicenseForm("Agency"); }
function openTrialForm() { openLicenseForm("Trial"); }

// Backward-compatibility aliases (purana menu ho tab bhi error nahi aayega)
function generateStarterKey() { openStarterForm(); }
function generateProKey() { openProForm(); }
function generateAgencyKey() { openAgencyForm(); }
function generateTrialKey() { openTrialForm(); }

function openLicenseForm(presetPlan) {
  var htmlContent = getLicenseFormHtml(presetPlan || "Starter");
  var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(500)
    .setHeight(620);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "⚡ PakDigital AI License Creator");
}

// ------------------------------------------------------------------
// 2. CORE ROW CREATOR (USED BY BOTH MODAL DIALOG & WEBHOOK)
// ------------------------------------------------------------------
function getLicenseSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Licenses") || ss.getSheetByName("Sheet1") || ss.getSheetByName("License");
  if (!sheet && ss.getSheets().length > 0) {
    sheet = ss.getSheets()[0];
  }
  return sheet;
}

function createLicenseRowDirect(clientName, customKey, planName, dailyLimit, maxProfiles, daysValid, clientPhone, clientEmail) {
  var name = (clientName || "").trim();
  if (!name) name = "Client User";

  var finalKey = (customKey || "").trim().toUpperCase();
  if (!finalKey) {
    var cleanPrefix = name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "USER";
    var randomDigits = Math.floor(1000 + Math.random() * 9000);
    finalKey = "PAK-" + cleanPrefix + "-" + randomDigits;
  }

  var plan = (planName || "Starter").trim();
  var limit = parseInt(dailyLimit) || 40;
  var profiles = parseInt(maxProfiles) || 1;
  var days = parseInt(daysValid);
  if (isNaN(days)) days = 30;

  var phone = (clientPhone || "").trim();
  var email = (clientEmail || "").trim();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getLicenseSheet(ss);
  var data = sheet.getDataRange().getValues();

  var now = new Date();
  var expiryStr = "";
  var expiryDisplay = "Lifetime";
  var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (days > 0) {
    var expDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    var ey = expDate.getFullYear();
    var em = String(expDate.getMonth() + 1).padStart(2, '0');
    var ed = String(expDate.getDate()).padStart(2, '0');
    expiryStr = ey + "-" + em + "-" + ed;
    expiryDisplay = ed + "-" + monthNames[expDate.getMonth()] + "-" + ey;
  }

  var profileText = profiles === 1 ? "1 Chrome Profile" : (profiles + " Chrome Profiles");

  // Exact Clean Welcome Message Template
  var plainMsg = 
    "⚡ Welcome to PakDigital AI Facebook Lead Agent!\n\n" +
    "Hi " + name + ",\n" +
    "Aapka commercial enterprise AI Lead Agent license activate ho chuka hai:\n\n" +
    "🔑 License Key: " + finalKey + "\n" +
    "💎 Plan: " + plan + " (" + limit + " Leads / Day)\n" +
    "💻 Allowed Profiles: " + profileText + "\n" +
    "📅 Expiry Date: " + expiryDisplay + "\n\n" +
    "🚀 Chalane Ka Tareeqa:\n" +
    "1. Chrome me PakDigital AI extension open karein.\n" +
    "2. Apni License Key paste karein aur \"Activate\" dabayein.\n" +
    "3. Apna phone number aur service set karke Auto-Pilot start karein!\n\n" +
    "Kisi bhi help ya renewal ke liye aap direct yahan rabta kar sakte hain.";

  // Clean WhatsApp Number (Handles 03xx -> 923xx)
  var waLink = "";
  if (phone) {
    var cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "92" + cleanPhone.slice(1);
    } else if (cleanPhone.length === 10 && cleanPhone.startsWith("3")) {
      cleanPhone = "92" + cleanPhone;
    }
    var waText = encodeURIComponent(plainMsg);
    waLink = "https://wa.me/" + cleanPhone + "?text=" + waText;
  }

  // Deduplication Check: Prevent duplicate row if this exact key is already in the sheet
  if (data.length > 1) {
    var keyColIdx = 1;
    for (var c = 0; c < data[0].length; c++) {
      var h = data[0][c].toString().toLowerCase();
      if (h.includes("key") || h.includes("license")) { keyColIdx = c; break; }
    }
    for (var r = 1; r < data.length; r++) {
      var existingKey = data[r][keyColIdx] ? data[r][keyColIdx].toString().trim().toUpperCase() : "";
      if (existingKey === finalKey) {
        return {
          success: true,
          duplicate: true,
          key: finalKey,
          name: name,
          plan: plan,
          dailyLimit: limit,
          maxProfiles: profiles,
          profileText: profileText,
          expiry: expiryDisplay,
          plainMsg: plainMsg,
          waLink: waLink
        };
      }
    }
  }

  var nextSrNo = data.length;

  // Append new row: [Sr No, Key, Name, Status, DeviceId, ActivatedDate, ExpiryDate, Plan, DailyLimit, MaxProfiles, ActiveProfiles, Email, WhatsApp]
  sheet.appendRow([
    nextSrNo,
    finalKey,
    name,
    "Active",
    "", // DeviceId
    "", // ActivatedDate
    expiryStr,
    plan,
    limit,
    profiles,
    "", // ActiveProfiles
    email,
    phone
  ]);

  return {
    success: true,
    key: finalKey,
    name: name,
    plan: plan,
    dailyLimit: limit,
    maxProfiles: profiles,
    profileText: profileText,
    expiry: expiryDisplay,
    plainMsg: plainMsg,
    waLink: waLink
  };
}

function createLicenseFromForm(payload) {
  try {
    return createLicenseRowDirect(
      payload.clientName,
      payload.licenseKey,
      payload.planName,
      payload.dailyLimit,
      payload.maxProfiles,
      payload.daysValid,
      payload.clientPhone,
      payload.clientEmail
    );
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ------------------------------------------------------------------
// 3. ALL-IN-ONE SINGLE DIALOG HTML BUILDER
// ------------------------------------------------------------------
function getLicenseFormHtml(initialPlan) {
  var defPlan = initialPlan || "Starter";
  var defProfiles = 2;
  var defLimit = 20;
  var defDays = 30;
  if (defPlan === "Pro") {
    defProfiles = 5;
    defLimit = 30;
  } else if (defPlan === "Agency") {
    defProfiles = 15;
    defLimit = 30;
  } else if (defPlan === "Trial") {
    defProfiles = 1;
    defLimit = 15;
    defDays = 3;
  }

  return '<!DOCTYPE html>' +
  '<html>' +
  '<head>' +
  '<meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<style>' +
  '  * { box-sizing: border-box; }' +
  '  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 14px; background: #ffffff; color: #0f172a; font-size: 13px; }' +
  '  .title-bar { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }' +
  '  .title-bar h2 { margin: 0; font-size: 16px; color: #1e1b4b; display: flex; align-items: center; gap: 6px; }' +
  '  .form-group { margin-bottom: 11px; }' +
  '  label { display: block; font-weight: 600; font-size: 12px; color: #334155; margin-bottom: 3px; }' +
  '  .sub-label { font-size: 11px; color: #64748b; font-weight: normal; margin-left: 4px; }' +
  '  input[type="text"], input[type="number"], select { width: 100%; padding: 8px 10px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 13px; outline: none; transition: border-color 0.2s; background: #f8fafc; }' +
  '  input[type="text"]:focus, input[type="number"]:focus, select:focus { border-color: #3b82f6; background: #ffffff; }' +
  '  .key-row { display: flex; gap: 6px; }' +
  '  .btn-rnd { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; border-radius: 6px; padding: 0 10px; font-size: 11px; font-weight: bold; cursor: pointer; white-space: nowrap; }' +
  '  .row-2 { display: flex; gap: 10px; }' +
  '  .row-2 > div { flex: 1; }' +
  '  .row-3 { display: flex; gap: 8px; }' +
  '  .row-3 > div { flex: 1; }' +
  '  .btn-submit { width: 100%; padding: 12px; background: #2563eb; color: #ffffff; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 10px; box-shadow: 0 2px 4px rgba(37,99,235,0.3); }' +
  '  .btn-submit:hover { background: #1d4ed8; }' +
  '  .btn-submit:disabled { background: #94a3b8; cursor: not-allowed; }' +
  '  /* Result Card Styling */' +
  '  #resultView { display: none; }' +
  '  .res-badge { background: #f8fafc; border: 1.5px solid #c7d2fe; border-radius: 8px; padding: 10px; margin-bottom: 10px; text-align: center; }' +
  '  .key-pill { background: #e0e7ff; color: #1e1b4b; padding: 4px 12px; border-radius: 6px; font-family: monospace; font-size: 16px; font-weight: 800; border: 1px solid #a5b4fc; display: inline-block; margin-top: 4px; }' +
  '  .res-meta { font-size: 11px; color: #475569; margin-top: 6px; }' +
  '  .msg-box { width: 100%; height: 180px; padding: 10px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, monospace; font-size: 11.5px; line-height: 1.45; resize: none; background: #ffffff; color: #1e293b; }' +
  '  .btn-actions { display: flex; gap: 8px; margin-top: 10px; }' +
  '  .btn-copy { flex: 1; padding: 11px; background: #2563eb; color: #ffffff; border: none; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; text-align: center; box-shadow: 0 1px 3px rgba(37,99,235,0.3); }' +
  '  .btn-wa { padding: 11px 16px; background: #25D366; color: #ffffff; border: none; border-radius: 6px; font-weight: 700; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(37,211,102,0.3); }' +
  '  .btn-back { width: 100%; padding: 8px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; margin-top: 8px; }' +
  '  .status-line { font-size: 11.5px; font-weight: 600; margin-top: 6px; text-align: center; min-height: 16px; }' +
  '  .tip { font-size: 10.5px; color: #64748b; margin-top: 4px; text-align: center; }' +
  '</style>' +
  '</head>' +
  '<body>' +
  '  <!-- 1. INPUT FORM VIEW -->' +
  '  <div id="formView">' +
  '    <div class="title-bar">' +
  '      <h2>⚡ PakDigital AI License Creator</h2>' +
  '      <span style="font-size: 11px; color: #16a34a; font-weight: bold;">● Active Sheet</span>' +
  '    </div>' +

  '    <div class="form-group">' +
  '      <label>Client / Buyer Name: *</label>' +
  '      <input type="text" id="clientName" placeholder="e.g. Rizwan, Asad" oninput="onNameInput()" autofocus>' +
  '    </div>' +

  '    <div class="form-group">' +
  '      <label>License Key: <span class="sub-label">(Auto-suggested ya apni marzi se likhein)</span></label>' +
  '      <div class="key-row">' +
  '        <input type="text" id="licenseKey" placeholder="PAK-RIZW-2089" style="font-family: monospace; font-weight: bold; text-transform: uppercase;">' +
  '        <button type="button" id="btnRandomize" class="btn-rnd">🎲 New</button>' +
  '      </div>' +
  '    </div>' +
  '' +
  '    <div class="form-group">' +
  '      <label>Package Plan:</label>' +
  '      <select id="planSelect">' +
  '        <option value="Starter"' + (initialPlan === 'Starter' ? ' selected' : '') + '>Starter (20 Leads/Day, 2 Profiles - Rs 3,000)</option>' +
  '        <option value="Pro"' + (initialPlan === 'Pro' ? ' selected' : '') + '>Pro (30 Leads/Day, 5 Profiles - Rs 5,000)</option>' +
  '        <option value="Agency"' + (initialPlan === 'Agency' ? ' selected' : '') + '>Agency (30 Leads/Day, 15 Profiles - Rs 10,000)</option>' +
  '        <option value="Trial"' + (initialPlan === 'Trial' ? ' selected' : '') + '>Trial (15 Leads/Day, 1 Profile - 3 Days)</option>' +
  '        <option value="Custom">Custom (Apni marzi ka naya plan banayein)</option>' +
  '      </select>' +
  '    </div>' +
  '' +
  '    <div class="form-group" id="customPlanGroup" style="display: none;">' +
  '      <label>Custom Plan Name: <span class="sub-label">(e.g. VIP Deal, 3-Month Pack)</span></label>' +
  '      <input type="text" id="customPlanName" placeholder="e.g. VIP Enterprise">' +
  '    </div>' +
  '' +
  '    <div class="form-group">' +
  '      <div class="row-3">' +
  '        <div>' +
  '          <label>Allowed Profiles: <span class="sub-label">(Kam/Zyada)</span></label>' +
  '          <input type="number" id="maxProfiles" value="' + defProfiles + '" min="1" max="100">' +
  '        </div>' +
  '        <div>' +
  '          <label>Daily Leads:</label>' +
  '          <input type="number" id="dailyLimit" value="' + defLimit + '" min="5" max="1000">' +
  '        </div>' +
  '        <div>' +
  '          <label>Days Valid:</label>' +
  '          <input type="number" id="daysValid" value="' + defDays + '" min="1" max="3650">' +
  '        </div>' +
  '      </div>' +
  '      <div class="tip" style="text-align: left; margin-top: 3px;">💡 <b>Allowed Profiles:</b> Is client ke laptop par kitne Chrome profiles allow karne hain (1, 2, 3, etc.)</div>' +
  '    </div>' +
  '' +
  '    <div class="row-2">' +
  '      <div class="form-group">' +
  '        <label>WhatsApp Number: <span class="sub-label">(Optional)</span></label>' +
  '        <input type="text" id="clientPhone" placeholder="03151708943">' +
  '      </div>' +
  '      <div class="form-group">' +
  '        <label>Client Email: <span class="sub-label">(Optional)</span></label>' +
  '        <input type="text" id="clientEmail" placeholder="client@gmail.com">' +
  '      </div>' +
  '    </div>' +
  '' +
  '    <div id="statusNotice" class="status-line"></div>' +
  '    <button id="btnSubmit" type="button" class="btn-submit" onclick="submitForm()">⚡ Generate & Activate License</button>' +
  '  </div>' +
  '' +
  '  <!-- 2. RESULT / WELCOME SMS VIEW -->' +
  '  <div id="resultView">' +
  '    <div class="title-bar">' +
  '      <h2>✅ License Successfully Created!</h2>' +
  '      <span style="font-size: 11px; color: #16a34a; font-weight: bold;">● Saved in Sheet</span>' +
  '    </div>' +
  '' +
  '    <div class="res-badge">' +
  '      <div style="font-size: 11px; color: #64748b; font-weight: 600;">ACTIVE LICENSE KEY</div>' +
  '      <div id="resKeyBadge" class="key-pill">PAK-XXXX-0000</div>' +
  '      <div id="resMeta" class="res-meta">👤 Rizwan | 💎 Starter (40 Leads/Day) | 💻 1 Profile</div>' +
  '    </div>' +
  '' +
  '    <label style="font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">📋 Ready Welcome Message (Ready to Copy/Send):</label>' +
  '    <textarea id="resMsgArea" class="msg-box" readonly></textarea>' +
  '' +
  '    <div class="btn-actions">' +
  '      <button id="resCopyBtn" type="button" class="btn-copy" onclick="copyResultMsg()">📋 Copy Details (1-Click)</button>' +
  '      <a id="resWaLink" href="#" target="_blank" class="btn-wa" style="display: none;">💬 Open WhatsApp</a>' +
  '    </div>' +
  '' +
  '    <div id="resHint" class="status-line" style="color: #16a34a; display: none;">✓ Copied to clipboard! Go to your WhatsApp tab and press Ctrl + V</div>' +
  '    <div class="tip">Tip: Laptop par WhatsApp already open hai to bas "Copy Details" dabayein aur apne WhatsApp tab me Ctrl+V karein.</div>' +
  '' +
  '    <button id="btnBack" type="button" class="btn-back" onclick="resetForm()">➕ Generate Another License</button>' +
  '  </div>' +
  '' +
  '  <script>' +
  '    var isKeyManuallyEdited = false;' +
  '    var isSubmitting = false;' +
  '' +
  '    function initForm() {' +
  '      var licKeyEl = document.getElementById("licenseKey");' +
  '      if (licKeyEl) {' +
  '        licKeyEl.addEventListener("input", function() { isKeyManuallyEdited = this.value.trim().length > 0; });' +
  '      }' +
  '      var cNameEl = document.getElementById("clientName");' +
  '      if (cNameEl) cNameEl.addEventListener("input", onNameInput);' +
  '      var btnRnd = document.getElementById("btnRandomize");' +
  '      if (btnRnd) btnRnd.addEventListener("click", randomizeKey);' +
  '      var plSel = document.getElementById("planSelect");' +
  '      if (plSel) plSel.addEventListener("change", applyPlanPreset);' +
  '      var btnCp = document.getElementById("resCopyBtn");' +
  '      if (btnCp) btnCp.addEventListener("click", copyResultMsg);' +
  '      var btnBk = document.getElementById("btnBack");' +
  '      if (btnBk) btnBk.addEventListener("click", resetForm);' +
  '      applyPlanPreset();' +
  '    }' +
  '' +
  '    if (document.readyState === "loading") {' +
  '      document.addEventListener("DOMContentLoaded", initForm);' +
  '    } else {' +
  '      initForm();' +
  '    }' +

  '    function onNameInput() {' +
  '      var name = document.getElementById("clientName").value.trim();' +
  '      if (!isKeyManuallyEdited && name.length >= 2) {' +
  '        var prefix = name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "USER";' +
  '        var rnd = Math.floor(1000 + Math.random() * 9000);' +
  '        document.getElementById("licenseKey").value = "PAK-" + prefix + "-" + rnd;' +
  '      }' +
  '    }' +

  '    function randomizeKey() {' +
  '      var name = document.getElementById("clientName").value.trim();' +
  '      var prefix = name ? name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) : "USER";' +
  '      if (!prefix) prefix = "PAK";' +
  '      var rnd = Math.floor(1000 + Math.random() * 9000);' +
  '      document.getElementById("licenseKey").value = "PAK-" + prefix + "-" + rnd;' +
  '      isKeyManuallyEdited = true;' +
  '    }' +

  '    function applyPlanPreset() {' +
  '      var p = document.getElementById("planSelect").value;' +
  '      var customGrp = document.getElementById("customPlanGroup");' +
  '      if (p === "Custom") {' +
  '        if (customGrp) customGrp.style.display = "block";' +
  '      } else {' +
  '        if (customGrp) customGrp.style.display = "none";' +
  '      }' +
  '      if (p === "Starter") {' +
  '        document.getElementById("maxProfiles").value = 2;' +
  '        document.getElementById("dailyLimit").value = 20;' +
  '        document.getElementById("daysValid").value = 30;' +
  '      } else if (p === "Pro") {' +
  '        document.getElementById("maxProfiles").value = 5;' +
  '        document.getElementById("dailyLimit").value = 30;' +
  '        document.getElementById("daysValid").value = 30;' +
  '      } else if (p === "Agency") {' +
  '        document.getElementById("maxProfiles").value = 15;' +
  '        document.getElementById("dailyLimit").value = 30;' +
  '        document.getElementById("daysValid").value = 30;' +
  '      } else if (p === "Trial") {' +
  '        document.getElementById("maxProfiles").value = 1;' +
  '        document.getElementById("dailyLimit").value = 15;' +
  '        document.getElementById("daysValid").value = 3;' +
  '      }' +
  '    }' +

  '    function submitForm() {' +
  '      if (isSubmitting) return;' +
  '      var status = document.getElementById("statusNotice");' +
  '      var nameEl = document.getElementById("clientName");' +
  '      var name = nameEl ? nameEl.value.trim() : "";' +
  '      if (!name) {' +
  '        status.innerHTML = "<span style=\'color:#dc2626;\'>⚠️ Please enter Client Name above!</span>";' +
  '        nameEl.focus();' +
  '        return;' +
  '      }' +
  '      isSubmitting = true;' +
  '      var btn = document.getElementById("btnSubmit");' +
  '      btn.disabled = true;' +
  '      btn.innerText = "⏳ Generating & Saving to Sheet...";' +
  '      status.innerHTML = "<span style=\'color:#2563eb;\'>⏳ Saving license to Google Sheet...</span>";' +

  '      var selectedPlan = document.getElementById("planSelect") ? document.getElementById("planSelect").value : "Starter";' +
  '      var customName = document.getElementById("customPlanName") ? document.getElementById("customPlanName").value.trim() : "";' +
  '      var finalPlanName = (selectedPlan === "Custom" && customName) ? customName : selectedPlan;' +
  '' +
  '      var payload = {' +
  '        clientName: name,' +
  '        licenseKey: (document.getElementById("licenseKey") ? document.getElementById("licenseKey").value.trim() : ""),' +
  '        planName: finalPlanName,' +
  '        maxProfiles: (document.getElementById("maxProfiles") ? document.getElementById("maxProfiles").value : 1),' +
  '        dailyLimit: (document.getElementById("dailyLimit") ? document.getElementById("dailyLimit").value : 40),' +
  '        daysValid: (document.getElementById("daysValid") ? document.getElementById("daysValid").value : 30),' +
  '        clientPhone: (document.getElementById("clientPhone") ? document.getElementById("clientPhone").value.trim() : ""),' +
  '        clientEmail: (document.getElementById("clientEmail") ? document.getElementById("clientEmail").value.trim() : "")' +
  '      };' +

  '      if (typeof google !== "undefined" && google.script && google.script.run) {' +
  '        google.script.run' +
  '          .withSuccessHandler(onSuccess)' +
  '          .withFailureHandler(onError)' +
  '          .createLicenseFromForm(payload);' +
  '      } else {' +
  '        /* Fallback for standalone browser */' +
  '        var query = "action=CREATE_LICENSE&name=" + encodeURIComponent(payload.clientName) +' +
  '                    "&key=" + encodeURIComponent(payload.licenseKey) +' +
  '                    "&plan=" + encodeURIComponent(payload.planName) +' +
  '                    "&profiles=" + encodeURIComponent(payload.maxProfiles) +' +
  '                    "&limit=" + encodeURIComponent(payload.dailyLimit) +' +
  '                    "&days=" + encodeURIComponent(payload.daysValid) +' +
  '                    "&phone=" + encodeURIComponent(payload.clientPhone) +' +
  '                    "&email=" + encodeURIComponent(payload.clientEmail);' +
  '        fetch(window.location.href.split("?")[0] + "?" + query)' +
  '          .then(function(r){ return r.json(); })' +
  '          .then(onSuccess)' +
  '          .catch(onError);' +
  '      }' +
  '    }' +

  '    function onSuccess(res) {' +
  '      isSubmitting = false;' +
  '      var btn = document.getElementById("btnSubmit");' +
  '      btn.disabled = false;' +
  '      btn.innerText = "⚡ Generate & Activate License";' +
  '' +
  '      if (!res || !res.success) {' +
  '        document.getElementById("statusNotice").innerHTML = "<span style=\'color:#dc2626;\'>⚠️ " + (res && res.message ? res.message : "Error saving row") + "</span>";' +
  '        return;' +
  '      }' +
  '' +
  '      document.getElementById("formView").style.display = "none";' +
  '      document.getElementById("resultView").style.display = "block";' +
  '' +
  '      document.getElementById("resKeyBadge").innerText = res.key;' +
  '      document.getElementById("resMeta").innerText = "👤 " + res.name + " | 💎 " + res.plan + " (" + res.dailyLimit + "/day) | 💻 " + res.profileText + " | 📅 " + res.expiry;' +
  '      document.getElementById("resMsgArea").value = res.plainMsg;' +
  '' +
  '      var waBtn = document.getElementById("resWaLink");' +
  '      if (res.waLink) {' +
  '        waBtn.href = res.waLink;' +
  '        waBtn.style.display = "inline-flex";' +
  '      } else {' +
  '        waBtn.style.display = "none";' +
  '      }' +
  '    }' +
  '' +
  '    function onError(err) {' +
  '      isSubmitting = false;' +
  '      var btn = document.getElementById("btnSubmit");' +
  '      btn.disabled = false;' +
  '      btn.innerText = "⚡ Generate & Activate License";' +
  '      document.getElementById("statusNotice").innerHTML = "<span style=\'color:#dc2626;\'>⚠️ Request failed: " + err + "</span>";' +
  '    }' +

  '    function copyResultMsg() {' +
  '      var t = document.getElementById("resMsgArea");' +
  '      t.select();' +
  '      t.setSelectionRange(0, 99999);' +
  '      try {' +
  '        navigator.clipboard.writeText(t.value);' +
  '      } catch(e) {' +
  '        document.execCommand("copy");' +
  '      }' +
  '      var b = document.getElementById("resCopyBtn");' +
  '      b.innerText = "✅ Copied! Now Paste in WhatsApp";' +
  '      b.style.background = "#16a34a";' +
  '      document.getElementById("resHint").style.display = "block";' +
  '    }' +

  '    function resetForm() {' +
  '      document.getElementById("clientName").value = "";' +
  '      document.getElementById("licenseKey").value = "";' +
  '      document.getElementById("clientPhone").value = "";' +
  '      document.getElementById("clientEmail").value = "";' +
  '      document.getElementById("statusNotice").innerHTML = "";' +
  '      document.getElementById("resHint").style.display = "none";' +
  '      isKeyManuallyEdited = false;' +
  '      applyPlanPreset();' +
  '      document.getElementById("resultView").style.display = "none";' +
  '      document.getElementById("formView").style.display = "block";' +
  '      document.getElementById("clientName").focus();' +
  '    }' +

  '    /* Initialize preset on load */' +
  '    applyPlanPreset();' +
  '  </script>' +
  '</body>' +
  '</html>';
}

// ------------------------------------------------------------------
// 4. REMOTE VERIFICATION WEBHOOK + WEB API
// ------------------------------------------------------------------
function getHotLeadsSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Hot Leads") || ss.getSheetByName("HotLeads") || ss.getSheetByName("Leads") || ss.getSheetByName("Hot Lead") || ss.getSheetByName("hot leads");
  if (!sheet) {
    sheet = ss.insertSheet("Hot Leads");
    sheet.appendRow([
      "Sr No",
      "Timestamp",
      "Service",
      "Customer Name",
      "🔗 Clickable Post Link",
      "Post Text",
      "Auto Reply / Comment",
      "Alert Phone",
      "Status"
    ]);
    sheet.getRange("A1:I1").setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 60);
    sheet.setColumnWidth(2, 140);
    sheet.setColumnWidth(3, 130);
    sheet.setColumnWidth(4, 140);
    sheet.setColumnWidth(5, 200);
    sheet.setColumnWidth(6, 280);
    sheet.setColumnWidth(7, 280);
    sheet.setColumnWidth(8, 120);
    sheet.setColumnWidth(9, 100);
  }
  return sheet;
}

function saveHotLeadDirect(licenseKey, service, author, postUrl, postText, alertPhone, commentText) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var leadsSheet = getHotLeadsSheet(ss);
  var data = leadsSheet.getDataRange().getValues();

  var cleanPostUrl = (postUrl || "").trim();
  if (!cleanPostUrl) {
    return { success: false, message: "Missing Post URL" };
  }

  var now = new Date();
  var timeStr = Utilities.formatDate(now, "GMT+5", "yyyy-MM-dd HH:mm:ss");
  var cleanAuthor = (author || "Customer").trim();
  var cleanService = (service || "Services").trim();
  var cleanSnippet = (postText || "").trim().slice(0, 300);
  var cleanComment = (commentText || "").trim();
  var cleanKey = (licenseKey || "").trim().toUpperCase();
  var cleanPhone = (alertPhone || "").trim();
  var linkFormula = '=HYPERLINK("' + cleanPostUrl + '", "🔗 Open Facebook Post")';

  var statusVal = "New Lead";
  if (cleanComment.includes("Silent") || cleanComment.includes("Sniper")) {
    statusVal = "🎯 Alerted";
  } else if (cleanComment.length > 5) {
    statusVal = "✅ Commented";
  }

  // 1. Dynamic Column Detection from Row 1 Headers
  if (data.length > 0 && data[0].length > 0) {
    var headers = data[0];
    var urlColIdx = -1;

    for (var c = 0; c < headers.length; c++) {
      var h = headers[c].toString().toLowerCase();
      if (h.includes("link") || h.includes("url")) {
        urlColIdx = c;
        break;
      }
    }

    // Deduplication check on detected URL column
    if (urlColIdx !== -1) {
      for (var r = 1; r < data.length; r++) {
        var existingCell = data[r][urlColIdx] ? data[r][urlColIdx].toString().trim() : "";
        if (existingCell.includes(cleanPostUrl) && cleanPostUrl.length > 20) {
          return { success: true, duplicate: true, message: "Lead already recorded." };
        }
      }
    }

    var nextSrNo = data.length;
    var rowValues = new Array(headers.length);

    for (var i = 0; i < headers.length; i++) {
      var head = headers[i].toString().toLowerCase().trim();
      if (head.includes("sr") || head.includes("no") || head.includes("#")) {
        rowValues[i] = nextSrNo;
      } else if (head.includes("time") || head.includes("date")) {
        rowValues[i] = timeStr;
      } else if (head.includes("service") || head.includes("niche")) {
        rowValues[i] = cleanService;
      } else if (head.includes("customer") || head.includes("author") || head.includes("name") || head.includes("client")) {
        rowValues[i] = cleanAuthor;
      } else if (head.includes("link") || head.includes("url")) {
        rowValues[i] = linkFormula;
      } else if (head.includes("comment") || head.includes("reply") || head.includes("auto reply") || head.includes("ai reply")) {
        rowValues[i] = cleanComment || "🎯 Silent Alert (No Comment)";
      } else if (head.includes("post") || head.includes("text") || head.includes("preview") || head.includes("snippet")) {
        rowValues[i] = cleanSnippet;
      } else if (head.includes("key")) {
        rowValues[i] = cleanKey;
      } else if (head.includes("phone") || head.includes("wa") || head.includes("whatsapp")) {
        rowValues[i] = cleanPhone;
      } else if (head.includes("status")) {
        rowValues[i] = statusVal;
      } else {
        rowValues[i] = "";
      }
    }

    leadsSheet.appendRow(rowValues);
  } else {
    // Blank sheet fallback
    var defaultHeaders = ["Sr No", "Timestamp", "Service", "Customer Name", "🔗 Clickable Post Link", "Post Text", "Auto Reply / Comment", "Alert Phone", "Status"];
    leadsSheet.appendRow(defaultHeaders);
    leadsSheet.getRange("A1:I1").setBackground("#1e1b4b").setFontColor("#ffffff").setFontWeight("bold");
    leadsSheet.setFrozenRows(1);
    leadsSheet.appendRow([1, timeStr, cleanService, cleanAuthor, linkFormula, cleanSnippet, cleanComment || "🎯 Silent Alert (No Comment)", cleanPhone, statusVal]);
  }

  var waAlertLink = "";
  if (cleanPhone) {
    var rawPhone = cleanPhone.replace(/[^0-9]/g, "");
    if (rawPhone.startsWith("03")) rawPhone = "92" + rawPhone.slice(1);
    var waMsg = "🚨 NEW HOT LEAD DETECTED!\n\n" +
                "👤 Customer: " + cleanAuthor + "\n" +
                "💼 Service: " + cleanService + "\n" +
                "📝 Post: \"" + cleanSnippet.slice(0, 150) + "...\"\n\n" +
                (cleanComment ? "💬 AI Reply: \"" + cleanComment.slice(0, 150) + "...\"\n\n" : "") +
                "🔗 Open Post: " + cleanPostUrl;
    waAlertLink = "https://wa.me/" + rawPhone + "?text=" + encodeURIComponent(waMsg);
  }

  return {
    success: true,
    duplicate: false,
    srNo: nextSrNo,
    timestamp: timeStr,
    author: cleanAuthor,
    service: cleanService,
    postUrl: cleanPostUrl,
    waAlertLink: waAlertLink,
    message: "Lead saved successfully to Hot Leads sheet!"
  };
}

function doGet(e) {
  // 1. MOBILE/BROWSER ACCESS: If opened in a browser without parameters, show Creator Form!
  if (!e || !e.parameter || Object.keys(e.parameter).length === 0) {
    var htmlContent = getLicenseFormHtml("Starter");
    return HtmlService.createHtmlOutput(htmlContent)
      .setTitle("⚡ PakDigital License Admin")
      .addMetaTag("viewport", "width=device-width, initial-scale=1")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // 2. DIRECT API LICENSE CREATOR (Fallback from Web Form)
  if (e.parameter.action === "CREATE_LICENSE") {
    var created = createLicenseRowDirect(
      e.parameter.name,
      e.parameter.key,
      e.parameter.plan,
      e.parameter.limit,
      e.parameter.profiles,
      e.parameter.days,
      e.parameter.phone,
      e.parameter.email
    );
    return createJsonResponse(created);
  }

  // 3. SAVE HOT LEAD ENDPOINT
  if (e.parameter.action === "SAVE_LEAD") {
    var saved = saveHotLeadDirect(
      e.parameter.key,
      e.parameter.service,
      e.parameter.author,
      e.parameter.postUrl,
      e.parameter.postText,
      e.parameter.phone,
      e.parameter.comment
    );
    return createJsonResponse(saved);
  }

  // 3. EXTENSION LICENSE VERIFICATION
  var key = (e.parameter.key || "").trim().toUpperCase();
  var deviceId = (e.parameter.deviceId || "").trim();
  var profileId = (e.parameter.profileId || "").trim();

  if (!key) {
    return createJsonResponse({ valid: false, message: "Missing License Key" });
  }

  var sheet = getLicenseSheet();
  var data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    return createJsonResponse({ valid: false, message: "Sheet has no license rows." });
  }

  // Detect column indices dynamically
  var headerA = data[0][0].toString().toLowerCase();
  var hasSrNo = headerA.includes("sr") || headerA.includes("no") || headerA.includes("#");

  var keyColIndex = hasSrNo ? 1 : 0;
  var nameColIndex = hasSrNo ? 2 : 1;
  var statusColIndex = hasSrNo ? 3 : 2;
  var deviceColIndex = hasSrNo ? 4 : 3;
  var activatedColIndex = hasSrNo ? 5 : 4;
  var expiryColIndex = hasSrNo ? 6 : 5;
  var planColIndex = hasSrNo ? 7 : 6;
  var dailyLimitColIndex = hasSrNo ? 8 : 7;
  var maxProfilesColIndex = hasSrNo ? 9 : 8;
  var activeProfilesColIndex = hasSrNo ? 10 : 9;

  for (var c = 0; c < data[0].length; c++) {
    var h = data[0][c].toString().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (h.includes("key") || h.includes("license")) keyColIndex = c;
    else if (h.includes("name") || h.includes("client")) nameColIndex = c;
    else if (h.includes("status") || h.includes("state")) statusColIndex = c;
    else if (h.includes("device") || h.includes("hardware") || h.includes("pcid")) deviceColIndex = c;
    else if (h.includes("activat") || h.includes("start") || h.includes("created")) activatedColIndex = c;
    else if (h.includes("expir") || h.includes("valid") || h.includes("end")) expiryColIndex = c;
    else if (h.includes("plan") || h.includes("tier")) planColIndex = c;
    else if (h.includes("daily") || h.includes("limit")) dailyLimitColIndex = c;
    else if (h.includes("active") || h.includes("used") || h.includes("ctiveprof")) activeProfilesColIndex = c;
    else if (h.includes("max") || h.includes("allow") || h.includes("quota")) maxProfilesColIndex = c;
  }

  for (var i = 1; i < data.length; i++) {
    var rowKey = data[i][keyColIndex] ? data[i][keyColIndex].toString().trim().toUpperCase() : "";
    var rowName = data[i][nameColIndex] ? data[i][nameColIndex].toString().trim() : "Licensed User";
    var rowStatus = data[i][statusColIndex] ? data[i][statusColIndex].toString().trim().toLowerCase() : "";
    var rowDeviceId = data[i][deviceColIndex] ? data[i][deviceColIndex].toString().trim() : "";
    var rowActivated = activatedColIndex < data[i].length && data[i][activatedColIndex] ? data[i][activatedColIndex] : "";
    var rowExpiry = expiryColIndex < data[i].length && data[i][expiryColIndex] ? data[i][expiryColIndex] : "";
    var rowPlan = planColIndex < data[i].length && data[i][planColIndex] ? data[i][planColIndex].toString().trim() : "Monthly";
    
    var rowDailyLimit = 40;
    if (dailyLimitColIndex < data[i].length && data[i][dailyLimitColIndex] !== undefined && data[i][dailyLimitColIndex] !== "") {
      var parsedLimit = parseInt(data[i][dailyLimitColIndex].toString().trim());
      if (!isNaN(parsedLimit) && parsedLimit > 0) rowDailyLimit = parsedLimit;
    }

    var rowMaxProfiles = 1;
    if (maxProfilesColIndex < data[i].length && data[i][maxProfilesColIndex] !== undefined && data[i][maxProfilesColIndex] !== "") {
      var parsedProf = parseInt(data[i][maxProfilesColIndex].toString().trim());
      if (!isNaN(parsedProf) && parsedProf > 0) rowMaxProfiles = parsedProf;
    }

    var rowActiveProfilesStr = activeProfilesColIndex < data[i].length && data[i][activeProfilesColIndex] ? data[i][activeProfilesColIndex].toString().trim() : "";

    if (rowKey === key) {
      if (rowStatus !== "active") {
        return createJsonResponse({
          valid: false,
          message: "❌ License Blocked by Admin. Please contact PakDigital."
        });
      }

      var now = new Date();
      var yyyy = now.getFullYear();
      var mm = String(now.getMonth() + 1).padStart(2, '0');
      var dd = String(now.getDate()).padStart(2, '0');
      var todayStr = yyyy + "-" + mm + "-" + dd;

      if (!rowDeviceId) {
        sheet.getRange(i + 1, deviceColIndex + 1).setValue(deviceId);

        if (activatedColIndex > -1 && !rowActivated) {
          sheet.getRange(i + 1, activatedColIndex + 1).setValue(todayStr);
          rowActivated = todayStr;
        }

        if (expiryColIndex > -1 && !rowExpiry) {
          var autoExp = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
          var expY = autoExp.getFullYear();
          var expM = String(autoExp.getMonth() + 1).padStart(2, '0');
          var expD = String(autoExp.getDate()).padStart(2, '0');
          var autoExpStr = expY + "-" + expM + "-" + expD;
          sheet.getRange(i + 1, expiryColIndex + 1).setValue(autoExpStr);
          rowExpiry = autoExpStr;
        }
      } else if (rowDeviceId.toUpperCase() !== deviceId.toUpperCase()) {
        return createJsonResponse({
          valid: false,
          message: "❌ Device Mismatch! This license key is locked to another computer."
        });
      }

      var profileList = rowActiveProfilesStr ? rowActiveProfilesStr.split(",").map(function(s) { return s.trim(); }).filter(Boolean) : [];
      if (profileId) {
        var cleanProfileId = profileId.toUpperCase();
        var upperList = profileList.map(function(s) { return s.toUpperCase(); });
        var isAlreadyRegistered = upperList.indexOf(cleanProfileId) > -1;
        if (!isAlreadyRegistered) {
          if (profileList.length >= rowMaxProfiles) {
            return createJsonResponse({
              valid: false,
              message: "❌ Chrome Profile Limit Reached! Your plan allows maximum " + rowMaxProfiles + " profile(s) on this PC. Contact Admin to upgrade."
            });
          }
          profileList.push(profileId);
          if (activeProfilesColIndex > -1) {
            sheet.getRange(i + 1, activeProfilesColIndex + 1).setValue(profileList.join(", "));
          }
        }
      }

      var activatedFormatted = "";
      if (rowActivated) {
        var actDate = (rowActivated instanceof Date) ? rowActivated : new Date(rowActivated.toString().trim());
        if (!isNaN(actDate.getTime())) {
          var aY = actDate.getFullYear();
          var aM = String(actDate.getMonth() + 1).padStart(2, '0');
          var aD = String(actDate.getDate()).padStart(2, '0');
          activatedFormatted = aY + "-" + aM + "-" + aD;
        }
      }

      var isExpired = false;
      var daysRemaining = null;
      var expiryFormatted = "";

      if (rowExpiry) {
        var expDate = (rowExpiry instanceof Date) ? rowExpiry : new Date(rowExpiry.toString().trim());
        if (!isNaN(expDate.getTime())) {
          expDate.setHours(23, 59, 59, 999);
          var diffMs = expDate.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          var eY = expDate.getFullYear();
          var eM = String(expDate.getMonth() + 1).padStart(2, '0');
          var eD = String(expDate.getDate()).padStart(2, '0');
          expiryFormatted = eY + "-" + eM + "-" + eD;

          if (diffMs <= 0) isExpired = true;
        }
      }

      if (isExpired) {
        return createJsonResponse({
          valid: false,
          isExpired: true,
          name: rowName,
          plan: rowPlan,
          activatedDate: activatedFormatted,
          expiryDate: expiryFormatted,
          message: "⚠️ Subscription Expired on " + expiryFormatted + "! Please contact Admin to renew."
        });
      }

      return createJsonResponse({
        valid: true,
        name: rowName,
        status: "active",
        plan: rowPlan,
        dailyLimit: rowDailyLimit,
        maxProfiles: rowMaxProfiles,
        usedProfiles: profileList.length || 1,
        activatedDate: activatedFormatted,
        expiryDate: expiryFormatted,
        daysRemaining: daysRemaining,
        message: "License verified successfully!"
      });
    }
  }

  return createJsonResponse({
    valid: false,
    message: "❌ Invalid License Key. Please check with Admin."
  });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
