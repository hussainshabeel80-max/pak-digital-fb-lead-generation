const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { execSync } = require('child_process');

const workspaceDir = __dirname;
const distDir = path.join(workspaceDir, 'build_dist');
const zipOutput = 'd:\\PakDigital-AI-Lead-Agent.zip';

console.log('🔒 Starting Enterprise Military-Grade Protection Build...');

// 1. Clean / create dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. High-security obfuscation settings (safe for Chrome MV3 Extensions)
const obfuscatorOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  numbersToExpressions: true,
  simplify: true,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.85,
  splitStrings: true,
  splitStringsChunkLength: 4,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false, // Preserves global declarations needed across extension scripts
  selfDefending: true,  // Prevents code formatting / beautification tampering
  debugProtection: true // Blocks F12 developer inspection
};

const jsFiles = ['ai_engine.js', 'license_manager.js', 'content.js', 'popup.js', 'background.js'];

for (const file of jsFiles) {
  const srcPath = path.join(workspaceDir, file);
  if (!fs.existsSync(srcPath)) continue;

  console.log(`🛡️  Encrypting & Scrambling: ${file}...`);
  const rawCode = fs.readFileSync(srcPath, 'utf8');
  
  const obfuscatedResult = JavaScriptObfuscator.obfuscate(rawCode, obfuscatorOptions);
  const outPath = path.join(distDir, file);
  fs.writeFileSync(outPath, obfuscatedResult.getObfuscatedCode(), 'utf8');

  // Verify syntax with node
  try {
    execSync(`node -c "${outPath}"`);
    console.log(`   ✅ ${file} successfully secured and syntax-verified.`);
  } catch (err) {
    console.error(`   ❌ Syntax error in ${file}:`, err.message);
    process.exit(1);
  }
}

// 3. Copy manifest, popup.html and icons
console.log('📋 Copying manifest.json, popup.html & icons...');
fs.copyFileSync(path.join(workspaceDir, 'manifest.json'), path.join(distDir, 'manifest.json'));
fs.copyFileSync(path.join(workspaceDir, 'popup.html'), path.join(distDir, 'popup.html'));

const distIconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(distIconsDir)) fs.mkdirSync(distIconsDir, { recursive: true });
const srcIconsDir = path.join(workspaceDir, 'icons');
if (fs.existsSync(srcIconsDir)) {
  fs.readdirSync(srcIconsDir).forEach(iconFile => {
    fs.copyFileSync(path.join(srcIconsDir, iconFile), path.join(distIconsDir, iconFile));
  });
}

// Verify that google_sheet_license_script.js is NEVER copied to dist
if (fs.existsSync(path.join(distDir, 'google_sheet_license_script.js'))) {
  fs.unlinkSync(path.join(distDir, 'google_sheet_license_script.js'));
}

// 4. Create Production Zip Archive
console.log(`📦 Packaging locked build to: ${zipOutput}...`);
const psCommand = `powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipOutput}' -Force"`;
execSync(psCommand);

const stats = fs.statSync(zipOutput);
console.log(`🎉 BUILD COMPLETE! Production Zip Size: ${(stats.size / 1024).toFixed(1)} KB`);
