const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/features/portal/components/modals/ContractDetailModal.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace line by line safely using regexes
content = content.replace(/const branchName = .*?;/g, "const branchName = contract.branchName;");
content = content.replace(/const unitCode = .*?;/g, "const unitCode = contract.unitCode;");
content = content.replace(/const startDate = .*?;/g, "const startDate = formatDate(contract.startDate);");
content = content.replace(/const endDate = .*?;/g, "const endDate = formatDate(contract.expiryDate || contract.endDate);");
content = content.replace(/const rentalFee = .*?;/g, "const rentalFee = contract.rentalFee || 0;");
content = content.replace(/const depositFee = .*?;/g, "const depositFee = contract.depositFee || 0;");

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Successfully replaced fallbacks");
