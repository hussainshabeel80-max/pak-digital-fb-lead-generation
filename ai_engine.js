/**
 * PakDigital AI Comment Generator Engine
 * Multi-Mode & Custom Instruction Engine:
 * 1. "call": Strict direct calling
 * 2. "dm": Inbox / Direct Message approach
 * 3. "whatsapp": Direct wa.me link insertion
 * 4. "call_whatsapp": Combo - Call & WhatsApp simultaneously
 * 5. "call_dm": Combo - Call or DM
 * 6. "custom": Direct natural language instruction processing
 */

const OpenersWithName = [
  "Hi {name}, ",
  "Hello {name}, ",
  "Hey {name}, ",
  "Hi there {name}, ",
  "Good day {name}, "
];

const OpenersWithoutName = [
  "Hi there, ",
  "Hello, ",
  "Dear Sir/Ma'am, ",
  "Hey there, ",
  "Greetings, "
];

// --- 1. CALL ONLY ---
const CallTemplates = [
  "We provide professional {service} services in your area. Reliable work and fair rates. Please call us at {phone}.",
  "If you are looking for an experienced {service}, we can help you out today with guaranteed quality work. Feel free to call {phone}.",
  "Available right away for your {service} needs! Fair pricing, neat work and prompt service. You can call {phone} directly.",
  "We specialize in {service} services and can take care of this for you smoothly. Give us a call at {phone}.",
  "Experienced and reliable {service} available today. Happy to assist with this! Call {phone} anytime.",
  "We can handle this {service} job for you professionally with 100% satisfaction. Please call {phone}."
];

// --- 2. DM / INBOX ONLY ---
const DmTemplates = [
  "We specialize in {service} and have helped multiple clients achieve great results. Just sent you a DM with our portfolio and details. Please check your inbox!",
  "If you are still looking for expert help with {service}, I would love to assist. Dropped you a quick direct message with previous work samples. Check inbox please!",
  "Experienced in {service} with proven track record and fast turnaround. Sent you a quick DM regarding your inquiry. Looking forward to connecting!",
  "We can handle this {service} project for you smoothly. Please check your inbox, I have messaged you complete details and case studies.",
  "Just saw your requirement for {service}! Sent you a direct message with an outline and budget-friendly plan. Let's connect in inbox."
];

// --- 3. WHATSAPP LINK ONLY ---
const WhatsAppTemplates = [
  "We provide professional {service} services with quick turnaround and fair pricing. Chat directly with us on WhatsApp for fast response: {wa_link}",
  "Experienced team available for your {service} requirements today! Feel free to message us on WhatsApp for pricing and availability: {wa_link}",
  "We specialize in quality {service} and are ready to assist you. You can connect with us directly on WhatsApp anytime: {wa_link}",
  "Happy to help you with your {service} needs! Click here to chat with us directly on WhatsApp: {wa_link}"
];

// --- 4. CALL & WHATSAPP COMBO ---
const CallAndWhatsAppTemplates = [
  "We provide dependable {service} services in your area with fast turnaround. Feel free to call or WhatsApp us directly at {phone} ({wa_link}).",
  "Available today for your {service} needs! Fair rates and guaranteed quality. You can reach out by phone or WhatsApp at {phone} ({wa_link}).",
  "We specialize in professional {service} and can assist you right away. Call or WhatsApp us anytime at {phone} ({wa_link}).",
  "Looking for reliable {service} help? We've got you covered with 100% satisfaction. Call or WhatsApp: {phone} ({wa_link})."
];

// --- 5. CALL & DM COMBO ---
const CallAndDmTemplates = [
  "We provide professional {service} services. Feel free to give us a call at {phone} or send me a quick DM if you prefer.",
  "Experienced and ready to help with your {service} requirements today. Call {phone} or drop me a direct message anytime.",
  "We can take care of this {service} job smoothly for you. Reach out by calling {phone} or inbox me directly!"
];

const Closings = [
  " Have a great day!",
  " Looking forward to helping you out.",
  " Available 7 days a week.",
  " Happy to help!",
  " Ready to assist you."
];

function formatWhatsAppNumber(rawContact, targetCountry) {
  if (!rawContact) return "";
  let clean = rawContact.replace(/[^0-9]/g, "");
  if (!clean) return "";

  const countryDigits = (targetCountry || "1").replace(/[^0-9]/g, "");

  if (countryDigits && targetCountry !== "auto") {
    // If entered number starts with leading 0 (e.g. 03001234567, 07123456789, 0501234567), strip it
    if (clean.startsWith("0")) {
      clean = clean.slice(1);
    }
    // If it doesn't already start with the country code, prepend it
    if (!clean.startsWith(countryDigits)) {
      clean = countryDigits + clean;
    }
  }

  return clean;
}

function generateSmartComment(authorName, customService, contactInfo, customNote, ctaGoal, customInstruction, targetCountry) {
  const service = (customService || "plumbing").trim();
  let goal = ctaGoal || "call";
  const contact = (contactInfo || "").trim();
  const instruction = (customInstruction || "").toLowerCase().trim();
  const country = targetCountry || "1";

  // 1. Pick Greeting
  let opener = "";
  if (authorName && authorName.trim().length > 0) {
    const firstName = authorName.trim().split(" ")[0];
    const template = OpenersWithName[Math.floor(Math.random() * OpenersWithName.length)];
    opener = template.replace("{name}", firstName);
  } else {
    opener = OpenersWithoutName[Math.floor(Math.random() * OpenersWithoutName.length)];
  }

  // 2. Intelligent Custom Instruction Parsing
  if (instruction) {
    const wantsCall = instruction.includes("call") || instruction.includes("phone") || instruction.includes("number");
    const wantsWa = instruction.includes("whatsapp") || instruction.includes("wa");
    const wantsDm = (instruction.includes("dm") || instruction.includes("inbox") || instruction.includes("message")) &&
                    !instruction.includes("no dm") && !instruction.includes("don't dm") && !instruction.includes("dont dm") && !instruction.includes("dm na");

    if (wantsCall && wantsWa && !wantsDm) {
      goal = "call_whatsapp";
    } else if (wantsCall && wantsDm) {
      goal = "call_dm";
    } else if (wantsWa && !wantsCall) {
      goal = "whatsapp";
    } else if (wantsDm && !wantsCall && !wantsWa) {
      goal = "dm";
    } else if (wantsCall && !wantsWa && !wantsDm) {
      goal = "call";
    }
  }

  // 3. Select Base Template List
  let list = CallTemplates;
  if (goal === "dm") {
    list = DmTemplates;
  } else if (goal === "whatsapp") {
    list = WhatsAppTemplates;
  } else if (goal === "call_whatsapp") {
    list = CallAndWhatsAppTemplates;
  } else if (goal === "call_dm") {
    list = CallAndDmTemplates;
  }

  let body = list[Math.floor(Math.random() * list.length)];
  body = body.replace(/{service}/g, service);

  // Format clean WhatsApp Link with Universal Country Code
  const cleanWaNumber = formatWhatsAppNumber(contact, country);
  const waLink = cleanWaNumber ? `https://wa.me/${cleanWaNumber}` : "WhatsApp link";

  // 4. Inject Contact & Links
  if (goal === "call") {
    if (contact) {
      body = body.replace(/{phone}/g, contact);
    } else {
      body = body.replace(/at {phone}|call us at {phone}|to call {phone}|call {phone} directly|call {phone}|call {phone} anytime/gi, "call us today");
    }
    body = body.replace(/\btext\b/gi, "call").replace(/\bdm\b/gi, "call").replace(/\bwhatsapp\b/gi, "call");
  } else if (goal === "whatsapp") {
    body = body.replace(/{wa_link}/g, waLink);
  } else if (goal === "call_whatsapp") {
    if (contact) {
      body = body.replace(/{phone}/g, contact);
      body = body.replace(/{wa_link}/g, waLink);
    } else {
      body = body.replace(/{phone}/g, "our team").replace(/\({wa_link}\)/g, "");
    }
  } else if (goal === "call_dm") {
    body = body.replace(/{phone}/g, contact || "us");
  } else if (goal === "dm") {
    if (contact && (contact.startsWith("http") || contact.includes("."))) {
      body += ` (Portfolio: ${contact})`;
    }
  }

  // 5. Custom Perks Injection
  let customPerk = "";
  if (instruction) {
    if (instruction.includes("free estimate") || instruction.includes("free quote")) {
      customPerk += " We offer 100% free estimates.";
    } else if (instruction.includes("discount") || instruction.includes("off")) {
      customPerk += " Special discount available for new clients.";
    } else if (instruction.includes("same day") || instruction.includes("emergency")) {
      customPerk += " Same-day emergency service available.";
    }
  }

  // 6. Closing
  let closing = "";
  if (customNote && customNote.trim().length > 0) {
    closing = ` (${customNote.trim()})`;
  } else {
    closing = Closings[Math.floor(Math.random() * Closings.length)];
  }

  return opener + body + customPerk + closing;
}
