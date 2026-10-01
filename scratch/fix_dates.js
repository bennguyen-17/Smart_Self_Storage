const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/features/portal/components/MyStorageTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace date formats
content = content.replace(/\{item\.startDate \|\| '23\/09\/2026'\}/g, '{formatDate(item.startDate)}');
content = content.replace(/\{item\.expiryDate\}/g, '{formatDate(item.expiryDate)}');

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Replaced successfully!");
