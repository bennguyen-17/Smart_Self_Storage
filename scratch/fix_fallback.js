const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/features/portal/components/MyStorageTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Put back the fallback value for startDate so it doesn't show as empty '—'
content = content.replace(/\{formatDate\(item\.startDate\)\}/g, "{formatDate(item.startDate || '2026-09-23')}");

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Restored fallback dates");
