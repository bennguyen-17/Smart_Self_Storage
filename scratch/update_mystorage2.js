const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/features/portal/components/MyStorageTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace size: item.size,\s*unitCode: item.unitCode
// with size: item.size, unitCode: item.unitCode, rentalFee: item.rentalFee
content = content.replace(/size: item\.size,[\s\r\n]*unitCode: item\.unitCode/g, "size: item.size,\n                                          unitCode: item.unitCode,\n                                          rentalFee: item.rentalFee");

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated MyStorageTab correctly");
