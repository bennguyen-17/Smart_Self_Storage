const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/features/portal/components/modals/ContractDetailModal.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Update imports if needed
if (!content.includes("import { formatDate }")) {
    content = content.replace("import React from 'react';", "import React from 'react';\nimport { formatDate } from '@/lib/format';");
}

const oldFallbacks = `  const branchName = contract.branchName || contract.facilityName || 'SmartStorage Cầu Giấy (HN-01)';
  const unitCode = contract.unitCode || contract.unitNumber || 'HN01-G-XL01';
  const startDate = contract.startDate || contract.checkInDate || '01/10/2026';
  const endDate = contract.endDate || contract.expiryDate || contract.checkOutDate || '31/10/2026';
  
  const rentalFee = contract.totalPrice || contract.estimatedTotalRental || contract.rentalFee || 4000000;
  const depositFee = contract.depositAmount || contract.deposit || 3000000;`;

const newFallbacks = `  const branchName = contract.branchName;
  const unitCode = contract.unitCode;
  const startDate = formatDate(contract.startDate);
  const endDate = formatDate(contract.expiryDate || contract.endDate);
  
  const rentalFee = contract.rentalFee || 0;
  const depositFee = contract.depositFee || 0;`;

content = content.replace(oldFallbacks, newFallbacks);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Removed fallbacks from ContractDetailModal");
