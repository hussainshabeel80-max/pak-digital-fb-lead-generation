/**
 * PakDigital License, Subscription & Profile Gate - Google Apps Script
 * Supports: 
 *  1. Hardware Machine Locking (DeviceId)
 *  2. Multi-Profile Quota Control (MaxProfiles on same PC)
 *  3. Admin Custom Daily Limits (DailyLimit)
 *  4. Auto-Recording ActivatedDate + Auto-Expiry Subscriptions
 *  5. 1-Click Admin Menu Key Generator (With Optional Auto-Email & WhatsApp Delivery!)
 * 
 * Columns in Google Sheet:
 * Col A: Sr No (1, 2, 3...)
 * Col B: Key (e.g. PAK-ALI-101)
 * Col C: Name (e.g. Ali Agent)
 * Col D: Status (Active / Blocked)
 * Col E: DeviceId (Auto-filled on first PC activation)
 * Col F: ActivatedDate (Auto-filled on first activation: YYYY-MM-DD)
 * Col G: ExpiryDate (e.g. 2026-12-07 or Auto 30 days if blank)
 * Col H: Plan (e.g. Starter, Pro, Agency, VIP)
 * Col I: DailyLimit (Admin choice! e.g. 40, 80, 150)
 * Col J: MaxProfiles (Admin choice! e.g. 1, 3, 5 - Default: 1)
 * Col K: ActiveProfiles (Auto-managed: PRF-XXXX, PRF-YYYY)
 * Col L: Email (Optional)
 * Col M: WhatsApp (Optional)
 */

// ------------------------------------------------------------------
// 1. ONE-CLICK ADMIN MENU IN GOOGLE SHEETS
// ------------------------------------------------------------------
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("⚡ PakDigital Admin")
    .addItem("🔑 Generate Starter Key (40 Leads/Day, 1 Profile)", "generateStarterKey")
    .addItem("🚀 Generate Pro Key (80 Leads/Day, 3 Profiles)", "generateProKey")
    .addItem("👑 Generate Agency Key (180 Leads/Day, 10 Profiles)", "generateAgencyKey")
    .addItem("🎁 Generate 3-Day Free Trial Key", "generateTrialKey")
    .addToUi();
}

function generateLicenseRow(planName, dailyLimit, maxProfiles, daysValid) {
  var ui = SpreadsheetApp.getUi();

  // 1. Client Name (Required)
  var namePrompt = ui.prompt("⚡ Step 1/3: Client Name", "Enter Client / Employee Name (e.g. Asad Realtor):", ui.ButtonSet.OK_CANCEL);
  if (namePrompt.getSelectedButton() !== ui.Button.OK) return;
  var clientName = namePrompt.getResponseText().trim();
  if (!clientName) {
    ui.alert("⚠️ Client name cannot be empty.");
    return;
  }

  // 2. Client Email (Optional - Leave blank to skip email)
  var emailPrompt = ui.prompt("⚡ Step 2/3: Client Email (Optional)", "Enter Client Email to auto-send key (Leave BLANK if you don't want to send email):", ui.ButtonSet.OK_CANCEL);
  var clientEmail = (emailPrompt.getSelectedButton() === ui.Button.OK) ? emailPrompt.getResponseText().trim() : "";

  // 3. Client WhatsApp (Optional - Leave blank to skip WhatsApp)
  var waPrompt = ui.prompt("⚡ Step 3/3: Client WhatsApp (Optional)", "Enter Client WhatsApp with Country Code (e.g. 923001234567 - Leave BLANK if not needed):", ui.ButtonSet.OK_CANCEL);
  var clientPhone = (waPrompt.getSelectedButton() === ui.Button.OK) ? waPrompt.getResponseText().trim() : "";

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  // Next Sr No
  var nextSrNo = data.length;

  // Clean key: PAK-[NAME]-RANDOM
  var cleanPrefix = clientName.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "USER";
  var randomDigits = Math.floor(1000 + Math.random() * 9000);
  var generatedKey = "PAK-" + cleanPrefix + "-" + randomDigits;

  var now = new Date();
  var expiryStr = "";
  if (daysValid > 0) {
    var expDate = new Date(now.getTime() + (daysValid * 24 * 60 * 60 * 1000));
    var ey = expDate.getFullYear();
    var em = String(expDate.getMonth() + 1).padStart(2, '0');
    var ed = String(expDate.getDate()).padStart(2, '0');
    expiryStr = ey + "-" + em + "-" + ed;
  }

  // Append new row: [Sr No, Key, Name, Status, DeviceId, ActivatedDate, ExpiryDate, Plan, DailyLimit, MaxProfiles, ActiveProfiles, Email, WhatsApp]
  sheet.appendRow([
    nextSrNo,
    generatedKey,
    clientName,
    "Active",
    "", // DeviceId blank until first activation
    "", // ActivatedDate blank until first activation
    expiryStr,
    planName,
    dailyLimit,
    maxProfiles,
    "", // ActiveProfiles blank until profiles register
    clientEmail,
    clientPhone
  ]);

  // Optional: Auto-Send Welcome Email if email provided
  var emailStatus = "Skipped (No email provided)";
  if (clientEmail && clientEmail.includes("@")) {
    try {
      var subject = "⚡ Your PakDigital AI Facebook Lead Agent License: " + generatedKey;
      var htmlMsg = 
        "<div style='font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;'>" +
        "<h2 style='color: #4f46e5; margin-top: 0;'>Welcome to PakDigital AI Lead Agent!</h2>" +
        "<p>Hi <b>" + clientName + "</b>,</p>" +
        "<p>Your commercial enterprise Facebook AI Lead Generation license is now active!</p>" +
        "<div style='background: #f8fafc; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0;'>" +
        "<p style='margin: 4px 0;'>🔑 <b>License Key:</b> <code style='font-size: 16px; color: #1e1b4b; background: #e0e7ff; padding: 3px 8px; border-radius: 4px; font-weight: bold;'>" + generatedKey + "</code></p>" +
        "<p style='margin: 4px 0;'>💎 <b>Plan:</b> " + planName + " (" + dailyLimit + " Leads/Day)</p>" +
        "<p style='margin: 4px 0;'>💻 <b>Allowed Chrome Profiles:</b> " + maxProfiles + " Profile(s)</p>" +
        "<p style='margin: 4px 0;'>📅 <b>Expiry Date:</b> " + (expiryStr || "Lifetime") + "</p>" +
        "</div>" +
        "<h3>🚀 Quick Setup in 2 Minutes:</h3>" +
        "<ol>" +
        "<li>Download and unzip your extension folder.</li>" +
        "<li>Open Chrome and go to <code>chrome://extensions</code></li>" +
        "<li>Turn on <b>Developer Mode</b> (top-right) and click <b>Load unpacked</b>.</li>" +
        "<li>Open the extension, paste your key: <b>" + generatedKey + "</b> and click <b>Activate</b>!</li>" +
        "</ol>" +
        "<p style='color: #64748b; font-size: 12px; margin-top: 25px;'>Need assistance? Contact your PakDigital representative anytime.</p>" +
        "</div>";

      GmailApp.sendEmail(clientEmail, subject, "", { htmlBody: htmlMsg, name: "PakDigital AI Agent" });
      emailStatus = "✅ Sent to " + clientEmail;
    } catch (err) {
      emailStatus = "⚠️ Error sending email: " + err.message;
    }
  }

  // Optional: Auto WhatsApp Link if phone provided
  var waStatus = "Skipped (No number provided)";
  var waLink = "";
  var cleanPhone = "";
  if (clientPhone) {
    cleanPhone = clientPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "92" + cleanPhone.slice(1);
    } else if (cleanPhone.length === 10 && cleanPhone.startsWith("3")) {
      cleanPhone = "92" + cleanPhone;
    }

    var waText = encodeURIComponent(
      "⚡ *Welcome to PakDigital AI Lead Agent!*\n\n" +
      "Hi *" + clientName + "*,\n" +
      "Your license key has been activated:\n\n" +
      "🔑 *License Key:* " + generatedKey + "\n" +
      "💎 *Plan:* " + planName + " (" + dailyLimit + " Leads/Day)\n" +
      "💻 *Chrome Profiles:* " + maxProfiles + " Profile(s)\n" +
      "📅 *Expiry Date:* " + (expiryStr || "Lifetime") + "\n\n" +
      "To activate, paste your key inside the Chrome extension. Happy lead hunting!"
    );
    waLink = "https://wa.me/" + cleanPhone + "?text=" + waText;
    waStatus = "✅ Ready";
  }

  // Prepared plain text message for 1-Click Copy
  var plainMsg = "⚡ Welcome to PakDigital AI Lead Agent!\n\n" +
                 "Hi " + clientName + ",\n" +
                 "Your license key has been activated:\n\n" +
                 "🔑 License Key: " + generatedKey + "\n" +
                 "💎 Plan: " + planName + " (" + dailyLimit + " Leads/Day)\n" +
                 "💻 Chrome Profiles: " + maxProfiles + " Profile(s)\n" +
                 "📅 Expiry Date: " + (expiryStr || "Lifetime") + "\n\n" +
                 "To activate, paste your key inside the Chrome extension. Happy lead hunting!";

  var escapedMsg = plainMsg.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");

  var htmlContent = 
    "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; padding: 5px; color: #0f172a;'>" +
      "<div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px;'>" +
        "<div style='font-size: 15px; font-weight: 700; color: #4338ca;'>🔑 Key: <code style='background: #e0e7ff; padding: 2px 6px; border-radius: 4px; font-size: 16px;'>" + generatedKey + "</code></div>" +
        "<div style='font-size: 11px; color: #64748b; margin-top: 5px;'>👤 " + clientName + " | 💎 " + planName + " (" + dailyLimit + "/day) | 📅 " + (expiryStr || "Lifetime") + "</div>" +
        "<div style='font-size: 11px; color: #16a34a; margin-top: 4px;'>✉️ Email: " + emailStatus + "</div>" +
      "</div>" +

      "<label style='font-size: 11px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;'>📋 Ready Message (Paste into your open WhatsApp):</label>" +
      "<textarea id='msgArea' readonly style='width: 100%; height: 110px; box-sizing: border-box; padding: 8px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: monospace; resize: none; background: #ffffff;'>" + plainMsg + "</textarea>" +

      "<div style='display: flex; gap: 8px; margin-top: 14px;'>" +
        "<button id='copyBtn' onclick='doCopy()' style='flex: 1; padding: 10px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer;'>📋 Copy Message (1-Click)</button>" +
        (waLink ? "<a href='" + waLink + "' target='_blank' style='padding: 10px 14px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center;'>💬 Open WhatsApp</a>" : "") +
      "</div>" +

      "<div id='copyNotice' style='font-size: 11px; color: #16a34a; font-weight: 600; margin-top: 8px; text-align: center; display: none;'>✓ Copied to clipboard! Go to your WhatsApp tab and press Ctrl + V</div>" +

      "<script>" +
        "function doCopy() {" +
          "var el = document.getElementById('msgArea');" +
          "el.select();" +
          "document.execCommand('copy');" +
          "var btn = document.getElementById('copyBtn');" +
          "btn.innerText = '✅ Copied! Now Paste in WhatsApp';" +
          "btn.style.background = '#10b981';" +
          "document.getElementById('copyNotice').style.display = 'block';" +
        "}" +
      "</script>" +
    "</div>";

  var htmlOutput = HtmlService.createHtmlOutput(htmlContent).setWidth(430).setHeight(320);
  ui.showModalDialog(htmlOutput, "✅ Package Activated Successfully!");
}

function generateStarterKey() {
  generateLicenseRow("Starter", 40, 1, 30);
}

function generateProKey() {
  generateLicenseRow("Pro", 80, 3, 30);
}

function generateAgencyKey() {
  generateLicenseRow("Agency", 180, 10, 30);
}

function generateTrialKey() {
  generateLicenseRow("Trial", 20, 1, 3);
}

// ------------------------------------------------------------------
// 2. REMOTE VERIFICATION WEBHOOK
// ------------------------------------------------------------------
function doGet(e) {
  var key = (e.parameter.key || "").trim().toUpperCase();
  var deviceId = (e.parameter.deviceId || "").trim();
  var profileId = (e.parameter.profileId || "").trim();

  if (!key) {
    return createJsonResponse({ valid: false, message: "Missing License Key" });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
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

  // Header lookup
  for (var c = 0; c < data[0].length; c++) {
    var h = data[0][c].toString().toLowerCase();
    if (h.includes("activat") || h.includes("start") || h.includes("created")) activatedColIndex = c;
    else if (h.includes("expir") || h.includes("valid") || h.includes("end")) expiryColIndex = c;
    else if (h.includes("plan") || h.includes("tier")) planColIndex = c;
    else if (h.includes("daily") || h.includes("limit")) dailyLimitColIndex = c;
    else if (h.includes("maxprof") || h.includes("profiles")) maxProfilesColIndex = c;
    else if (h.includes("activeprof") || h.includes("usedprof")) activeProfilesColIndex = c;
  }

  for (var i = 1; i < data.length; i++) {
    var rowKey = data[i][keyColIndex] ? data[i][keyColIndex].toString().trim().toUpperCase() : "";
    var rowName = data[i][nameColIndex] ? data[i][nameColIndex].toString().trim() : "Licensed User";
    var rowStatus = data[i][statusColIndex] ? data[i][statusColIndex].toString().trim().toLowerCase() : "";
    var rowDeviceId = data[i][deviceColIndex] ? data[i][deviceColIndex].toString().trim() : "";
    var rowActivated = activatedColIndex < data[i].length && data[i][activatedColIndex] ? data[i][activatedColIndex] : "";
    var rowExpiry = expiryColIndex < data[i].length && data[i][expiryColIndex] ? data[i][expiryColIndex] : "";
    var rowPlan = planColIndex < data[i].length && data[i][planColIndex] ? data[i][planColIndex].toString().trim() : "Monthly";
    
    // Flexible DailyLimit (From Sheet!)
    var rowDailyLimit = 40;
    if (dailyLimitColIndex < data[i].length && data[i][dailyLimitColIndex]) {
      var parsedLimit = parseInt(data[i][dailyLimitColIndex]);
      if (!isNaN(parsedLimit) && parsedLimit > 0) rowDailyLimit = parsedLimit;
    }

    // Flexible MaxProfiles (From Sheet!)
    var rowMaxProfiles = 1;
    if (maxProfilesColIndex < data[i].length && data[i][maxProfilesColIndex]) {
      var parsedProf = parseInt(data[i][maxProfilesColIndex]);
      if (!isNaN(parsedProf) && parsedProf > 0) rowMaxProfiles = parsedProf;
    }

    var rowActiveProfilesStr = activeProfilesColIndex < data[i].length && data[i][activeProfilesColIndex] ? data[i][activeProfilesColIndex].toString().trim() : "";

    if (rowKey === key) {
      // 1. Check if Blocked by Admin
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

      // 2. Hardware PC Lock Check
      if (!rowDeviceId) {
        // First Time PC Activation -> Lock to this machine!
        sheet.getRange(i + 1, deviceColIndex + 1).setValue(deviceId);

        // Auto-fill ActivatedDate
        if (activatedColIndex > -1 && !rowActivated) {
          sheet.getRange(i + 1, activatedColIndex + 1).setValue(todayStr);
          rowActivated = todayStr;
        }

        // Auto-fill ExpiryDate (30 days) if empty
        if (expiryColIndex > -1 && !rowExpiry) {
          var autoExp = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
          var expY = autoExp.getFullYear();
          var expM = String(autoExp.getMonth() + 1).padStart(2, '0');
          var expD = String(autoExp.getDate()).padStart(2, '0');
          var autoExpStr = expY + "-" + expM + "-" + expD;
          sheet.getRange(i + 1, expiryColIndex + 1).setValue(autoExpStr);
          rowExpiry = autoExpStr;
        }
      } else if (rowDeviceId !== deviceId) {
        // PC Mismatch
        return createJsonResponse({
          valid: false,
          message: "❌ Device Mismatch! This license key is locked to another computer."
        });
      }

      // 3. Multi-Profile Quota Management on Same PC
      var profileList = rowActiveProfilesStr ? rowActiveProfilesStr.split(",").map(function(s) { return s.trim(); }).filter(Boolean) : [];
      if (profileId) {
        var isAlreadyRegistered = profileList.indexOf(profileId) > -1;
        if (!isAlreadyRegistered) {
          if (profileList.length >= rowMaxProfiles) {
            return createJsonResponse({
              valid: false,
              message: "❌ Chrome Profile Limit Reached! Your plan allows maximum " + rowMaxProfiles + " profile(s) on this PC. Contact Admin to upgrade."
            });
          }
          // Register new profile slot!
          profileList.push(profileId);
          if (activeProfilesColIndex > -1) {
            sheet.getRange(i + 1, activeProfilesColIndex + 1).setValue(profileList.join(", "));
          }
        }
      }

      // 4. Format Dates
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

      // 5. Success! Return full dynamic controls
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
