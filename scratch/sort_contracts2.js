const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/features/portal/components/MyStorageTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace the line "const validList = res.data.filter((c: any) => c.contractId !== '#HD-2' && c.rawContractId !== 2);"
// with the filtered and sorted version
content = content.replace(
  /const validList = res.data\.filter\(\(c: any\) => c\.contractId !== '#HD-2' && c\.rawContractId !== 2\);/g,
  "const validList = res.data.filter((c: any) => c.contractId !== '#HD-2' && c.rawContractId !== 2).sort((a: any, b: any) => (b.rawContractId || 0) - (a.rawContractId || 0));"
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Successfully sorted contracts (take 2)");
