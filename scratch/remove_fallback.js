const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/features/portal/components/MyStorageTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Remove the hardcoded fallback
content = content.replace(/\{formatDate\(item\.startDate \|\| '2026-09-23'\)\}/g, "{formatDate(item.startDate)}");

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Removed fallback dates");
