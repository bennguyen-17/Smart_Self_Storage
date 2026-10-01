const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/features/portal/components/modals/ExtendPaymentFlow.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace("  return (\r\n    <>\r\n      }\r\n      {step === 'PAYMENT'", "  return (\r\n    <>\r\n      {step === 'PAYMENT'");
content = content.replace("  return (\n    <>\n      }\n      {step === 'PAYMENT'", "  return (\n    <>\n      {step === 'PAYMENT'");
fs.writeFileSync(filePath, content, 'utf-8');
