const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/features/portal/components/MyStorageTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Insert rentalFee into all onOpenExtendModal calls
content = content.replace(/size: item\.size,\n\s*unitCode: item\.unitCode/g, "size: item.size,\n                                          unitCode: item.unitCode,\n                                          rentalFee: item.rentalFee");

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated MyStorageTab");
