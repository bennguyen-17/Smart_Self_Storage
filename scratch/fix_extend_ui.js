const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/features/portal/components/modals/ExtendContractModal.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace text-title with text-slate-900 dark:text-white
content = content.replace(/text-title/g, 'text-slate-900 dark:text-white');

// Replace text-muted with text-slate-500 dark:text-slate-400
content = content.replace(/text-muted/g, 'text-slate-500 dark:text-slate-400');

// Fix pricing logic to use rentalFee
const oldPricingLogic = `  const dailyRate = unitDailyRates[size] || 200000;
  const rawTotal = dailyRate * effectiveDays;`;

const newPricingLogic = `  const monthlyRate = unitContext?.rentalFee || 6000000;
  const rawTotal = (monthlyRate / 30) * effectiveDays;`;

content = content.replace(oldPricingLogic, newPricingLogic);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Fixed ExtendContractModal");
