const fs = require('fs');
const path = require('path');

// Generate version based on current timestamp
const version = Date.now().toString();

// Update SW cache version
const swPath = path.join(__dirname, '../public/sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace the CACHE_VERSION line
swContent = swContent.replace(
    /const CACHE_VERSION = '[^']+'/,
    `const CACHE_VERSION = '${version}'`
);

fs.writeFileSync(swPath, swContent);
console.log(`✅ Updated SW cache version to: ${version}`);
