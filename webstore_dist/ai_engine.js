/**
 * PakDigital AI Comment Generator Engine
 * Multi-Mode, Service-Type Aware & Custom Instruction Engine:
 * 1. Automatic Classification: Digital / Online Services VS Local / Trade Services
 * 2. CTA Goals: "call", "dm", "whatsapp", "call_whatsapp", "call_dm"
 * 3. Dynamic Custom Instruction Blending
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
const CallTemplatesLocal = [
  "We provide professional {service} in your area. Reliable work and fair rates. Please call us at {phone}.",
  "If you are looking for experienced {service}, we can help you out today with guaranteed quality work. Feel free to call {phone}.",
  "Available right away in your area for your {service} needs! Fair pricing, neat work and prompt service. You can call {phone} directly.",
  "We specialize in {service} and can take care of this for you smoothly. Give us a call at {phone}.",
  "Experienced and reliable {service} available today. Happy to assist with this! Call {phone} anytime.",
  "We can handle this {service} job for you professionally with 100% satisfaction. Please call {phone}."
];

const CallTemplatesDigital = [
  "We provide professional {service} with proven results and fair pricing. Please call us at {phone}.",
  "If you are looking for experienced {service} experts, we can help you achieve great results with guaranteed quality. Feel free to call {phone}.",
  "Available right away for your {service} needs! Top quality delivery and prompt communication. You can call {phone} directly.",
  "We specialize in {service} and can take care of this project for you smoothly. Give us a call at {phone}.",
  "Experienced team ready to assist with your {service} requirements today. Happy to help! Call {phone} anytime.",
  "We can handle this {service} requirement for you professionally with 100% satisfaction. Please call {phone}."
];

// --- 2. DM / INBOX ONLY ---
const DmTemplatesLocal = [
  "We provide reliable {service} in your area with fast turnaround. Just sent you a DM with our pricing and details. Please check your inbox!",
  "If you are still looking for dependable help with {service}, I would love to assist. Dropped you a quick direct message. Check inbox please!",
  "Experienced in {service} with fair rates and prompt service. Sent you a quick DM regarding your inquiry. Looking forward to connecting!",
  "We can handle this {service} job for you smoothly. Please check your inbox, I have messaged you complete details.",
  "Just saw your requirement for {service}! Sent you a direct message with an outline and budget-friendly plan. Let's connect in inbox."
];

const DmTemplatesDigital = [
  "We specialize in {service} and have helped multiple clients achieve great results. Just sent you a DM with our portfolio and details. Please check your inbox!",
  "If you are still looking for expert help with {service}, I would love to assist. Dropped you a quick direct message with previous work samples. Check inbox please!",
  "Experienced in {service} with proven track record and fast turnaround. Sent you a quick DM regarding your inquiry. Looking forward to connecting!",
  "We can handle this {service} project for you smoothly. Please check your inbox, I have messaged you complete details and case studies.",
  "Just saw your requirement for {service}! Sent you a direct message with an outline and budget-friendly plan. Let's connect in inbox."
];

// --- 3. WHATSAPP LINK ONLY ---
const WhatsAppTemplatesLocal = [
  "We provide professional {service} in your area with quick response and fair pricing. Chat directly with us on WhatsApp for fast response: {wa_link}",
  "Experienced local team available for your {service} needs today! Feel free to message us on WhatsApp for pricing and availability: {wa_link}",
  "We specialize in quality {service} and are ready to assist you. You can connect with us directly on WhatsApp anytime: {wa_link}",
  "Happy to help you with your {service} needs! Click here to chat with us directly on WhatsApp: {wa_link}"
];

const WhatsAppTemplatesDigital = [
  "We provide professional {service} with quick turnaround, proven results and fair pricing. Chat directly with us on WhatsApp for fast response: {wa_link}",
  "Experienced team available for your {service} requirements today! Feel free to message us on WhatsApp for samples, pricing and details: {wa_link}",
  "We specialize in quality {service} and are ready to assist you. You can connect with us directly on WhatsApp anytime: {wa_link}",
  "Happy to help you with your {service} needs! Click here to chat with our team directly on WhatsApp: {wa_link}"
];

// --- 4. CALL & WHATSAPP COMBO ---
const CallAndWhatsAppTemplatesLocal = [
  "We provide dependable {service} in your area with fast turnaround. Feel free to call or WhatsApp us directly at {phone} ({wa_link}).",
  "Available today in your area for your {service} needs! Fair rates and guaranteed quality. You can reach out by phone or WhatsApp at {phone} ({wa_link}).",
  "We specialize in professional {service} and can assist you right away. Call or WhatsApp us anytime at {phone} ({wa_link}).",
  "Looking for reliable {service} help? We've got you covered with 100% satisfaction. Call or WhatsApp: {phone} ({wa_link})."
];

const CallAndWhatsAppTemplatesDigital = [
  "We provide dependable {service} with fast turnaround and proven results. Feel free to call or WhatsApp us directly at {phone} ({wa_link}).",
  "Available today for your {service} needs! Fair rates, top quality and guaranteed results. You can reach out by phone or WhatsApp at {phone} ({wa_link}).",
  "We specialize in professional {service} and can assist you right away. Call or WhatsApp us anytime at {phone} ({wa_link}).",
  "Looking for reliable {service} experts? We've got you covered with 100% satisfaction. Call or WhatsApp: {phone} ({wa_link})."
];

// --- 5. CALL & DM COMBO ---
const CallAndDmTemplatesLocal = [
  "We provide professional {service} in your area. Feel free to give us a call at {phone} or send me a quick DM if you prefer.",
  "Experienced and ready to help with your {service} needs today. Call {phone} or drop me a direct message anytime.",
  "We can take care of this {service} job smoothly for you. Reach out by calling {phone} or inbox me directly!"
];

const CallAndDmTemplatesDigital = [
  "We provide professional {service} with proven results. Feel free to give us a call at {phone} or send me a quick DM if you prefer.",
  "Experienced team ready to help with your {service} requirements today. Call {phone} or drop me a direct message anytime for samples.",
  "We can take care of this {service} project smoothly for you. Reach out by calling {phone} or inbox me directly!"
];

const Closings = [
  " Have a great day!",
  " Looking forward to helping you out.",
  " Happy to help!",
  " Ready to assist you."
];

// ------------------------------------------------------------------
// INTELLIGENT SERVICE CLASSIFICATION ENGINE
// ------------------------------------------------------------------
const DigitalKeywords = [
  // Amazon & E-commerce Marketplaces
  "amazon", "review", "reviews", "rating", "ratings", "verified review", "seller", "fba", "ebay", 
  "etsy", "shopify", "walmart", "store", "product listing", "dropshipping", "ecommerce", "e-commerce",
  
  // SEO & Digital Marketing
  "seo", "smm", "sem", "ppc", "google ads", "adwords", "meta ads", "facebook ads", "fb ads", 
  "tiktok ads", "social media", "digital marketing", "marketing", "lead generation", "b2b", 
  "backlinks", "guest post", "indexing", "traffic", "citations", "funnel", "landing page",
  
  // Design, Creative & Video
  "graphic", "graphics", "logo", "branding", "ui/ux", "ui", "ux", "banner", "flyer", "photoshop", 
  "illustrator", "video edit", "video editor", "video editing", "animation", "motion graphics", 
  "reels", "shorts", "thumbnails", "youtube", "tiktok", "podcast edit",
  
  // Web & Development
  "web design", "website design", "web development", "web dev", "website", "wordpress", 
  "elementor", "shopify dev", "developer", "coding", "programmer", "software", "app", 
  "mobile app", "fullstack", "frontend", "backend", "python", "php", "react", "node", "bug fix",
  
  // Content & Remote Virtual Work
  "content writing", "copywriting", "copy writer", "article", "blog writing", "translation", 
  "virtual assistant", "va", "data entry", "bookkeeping", "accounting", "excel"
];

function isDigitalService(serviceName) {
  if (!serviceName) return false;
  const s = serviceName.toLowerCase();
  return DigitalKeywords.some(kw => s.includes(kw));
}

function formatServiceTerm(rawService, isDigital) {
  let s = (rawService || "service").trim();
  const lower = s.toLowerCase();

  // If already ends in "services", "service", "solutions", "work"
  if (lower.endsWith("services") || lower.endsWith("service") || lower.endsWith("solutions")) {
    return s;
  }

  // If digital and plural like "amazon reviews" or already descriptive
  if (isDigital) {
    if (lower.includes("review") || lower.includes("rating") || lower.includes("listing")) {
      return s; // e.g. "amazon reviews", "product listing"
    }
    if (lower === "seo" || lower === "smm" || lower === "sem" || lower === "ppc") {
      return `${s} services`;
    }
    return s;
  }

  return `${s} services`;
}

function formatWhatsAppNumber(rawContact, targetCountry) {
  if (!rawContact) return "";
  let clean = rawContact.replace(/[^0-9]/g, "");
  if (!clean) return "";

  const countryDigits = (targetCountry || "1").replace(/[^0-9]/g, "");

  if (countryDigits && targetCountry !== "auto") {
    if (clean.startsWith("0")) {
      clean = clean.slice(1);
    }
    if (!clean.startsWith(countryDigits)) {
      clean = countryDigits + clean;
    }
  }

  return clean;
}

function generateSmartComment(authorName, customService, contactInfo, customNote, ctaGoal, customInstruction, targetCountry) {
  const rawService = (customService || "plumbing").trim();
  const isDigital = isDigitalService(rawService);
  const formattedService = formatServiceTerm(rawService, isDigital);

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

  // 3. Select Base Template List based on CTA Goal & Service Nature (Digital vs Local)
  let list = isDigital ? CallTemplatesDigital : CallTemplatesLocal;
  if (goal === "dm") {
    list = isDigital ? DmTemplatesDigital : DmTemplatesLocal;
  } else if (goal === "whatsapp") {
    list = isDigital ? WhatsAppTemplatesDigital : WhatsAppTemplatesLocal;
  } else if (goal === "call_whatsapp") {
    list = isDigital ? CallAndWhatsAppTemplatesDigital : CallAndWhatsAppTemplatesLocal;
  } else if (goal === "call_dm") {
    list = isDigital ? CallAndDmTemplatesDigital : CallAndDmTemplatesLocal;
  }

  let body = list[Math.floor(Math.random() * list.length)];
  body = body.replace(/{service}/g, formattedService);

  // Extra safety: Guarantee "in your area" never ever leaks into digital services
  if (isDigital) {
    body = body.replace(/\s+in your area\b/gi, "")
               .replace(/\s+in your neighborhood\b/gi, "")
               .replace(/\blocally\b/gi, "with proven results");
  }

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

  // 5. Intelligent Custom Instruction / Perks Blending
  let customPerk = "";
  if (instruction) {
    if (instruction.includes("free estimate") || instruction.includes("free quote")) {
      customPerk += " We offer 100% free estimates.";
    } else if (instruction.includes("discount") || instruction.includes("off")) {
      customPerk += " Special discount available for new clients.";
    } else if (instruction.includes("same day") || instruction.includes("emergency")) {
      customPerk += " Same-day emergency service available.";
    } else {
      // Custom pitch entered by user (e.g. "if you need rating , verified review")
      const rawTrimmed = (customInstruction || "").trim();
      // Remove any trailing or leading punctuation
      let cleaned = rawTrimmed.replace(/^[,;.\s]+|[,;.\s]+$/g, "");
      if (cleaned.length > 3) {
        // Capitalize first letter
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        if (!cleaned.endsWith(".") && !cleaned.endsWith("!")) {
          cleaned += ".";
        }
        customPerk += ` ${cleaned}`;
      }
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
