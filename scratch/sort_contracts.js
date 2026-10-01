const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/features/portal/components/MyStorageTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const oldCode = `        if (res.success && Array.isArray(res.data)) {
          // Lọc bỏ triệt để các mã mock fix cứng như #HD-2
          const validList = res.data.filter((c: any) => c.contractId !== '#HD-2' && c.rawContractId !== 2);
          setContracts(validList);
        }`;

const newCode = `        if (res.success && Array.isArray(res.data)) {
          // Lọc bỏ triệt để các mã mock fix cứng như #HD-2, đồng thời sắp xếp hợp đồng mới nhất lên đầu (theo ID giảm dần)
          const validList = res.data
            .filter((c: any) => c.contractId !== '#HD-2' && c.rawContractId !== 2)
            .sort((a: any, b: any) => (b.rawContractId || 0) - (a.rawContractId || 0));
          setContracts(validList);
        }`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Successfully sorted contracts");
