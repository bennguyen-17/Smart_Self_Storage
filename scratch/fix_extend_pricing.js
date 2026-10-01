const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/features/portal/components/modals/ExtendContractModal.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace pricing logic line by line to avoid CRLF issues
content = content.replace(/const dailyRate = .*?;/g, "const monthlyRate = unitContext?.rentalFee || 0;");
content = content.replace(/const rawTotal = dailyRate \* effectiveDays;/g, "const rawTotal = (monthlyRate / 30) * effectiveDays;");

// Fix Hạn hiện tại display to use formatDate
content = content.replace(/Hạn hiện tại: \{expiry\}/g, "Hạn hiện tại: {formatDate(expiry)}");
if (!content.includes("import { formatDate }")) {
    content = content.replace("import React", "import { formatDate } from '@/lib/format';\nimport React");
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Successfully replaced pricing logic");
