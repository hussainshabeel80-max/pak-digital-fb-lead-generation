const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceDir = __dirname;
const distDir = path.join(workspaceDir, 'webstore_dist');
const zipOutput = 'd:\\PakDigital-WebStore-Clean-Submission.zip';

console.log('🚀 Building 100% Policy-Compliant Chrome Web Store Package...');

// 1. Clean / create dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. JS Files to copy (PURE READABLE CODE - Zero Obfuscation per Chrome Web Store Policy)
const jsFiles = ['ai_engine.js', 'license_manager.js', 'content.js', 'popup.js', 'background.js'];

for (const file of jsFiles) {
  const srcPath = path.join(workspaceDir, file);
  const outPath = path.join(distDir, file);
  
  const content = fs.readFileSync(srcPath, 'utf8');
  
  // Extra safety check: Ensure NO obfuscated hex variables exist
  if (content.includes('_0x')) {
    console.error(`❌ ERROR: Obfuscation detected in ${file}! Aborting.`);
    process.exit(1);
  }

  fs.writeFileSync(outPath, content, 'utf8');
  
  // Syntax check
  try {
    execSync(`node -c "${outPath}"`);
    console.log(`   ✅ ${file} (Clean & Valid Syntax)`);
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

// 4. Create Clean Web Store Zip Archive
console.log(`📦 Packaging clean build to: ${zipOutput}...`);
const psCommand = `powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipOutput}' -Force"`;
execSync(psCommand);

const stats = fs.statSync(zipOutput);
console.log(`🎉 WEB STORE ZIP READY! Size: ${(stats.size / 1024).toFixed(1)} KB`);
console.log(`📍 File Location: ${zipOutput}`);
