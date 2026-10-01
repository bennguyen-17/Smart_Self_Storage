const fs = require('fs');
const path = require('path');

const modalsDir = path.join(__dirname, '../frontend/src/features/portal/components/modals');

// 1. Create ExtendPaymentModal
let depositPaymentModal = fs.readFileSync(path.join(modalsDir, 'DepositPaymentModal.tsx'), 'utf-8');
let extendPaymentModal = depositPaymentModal
  .replace(/DepositPaymentModal/g, 'ExtendPaymentModal')
  .replace(/Thanh toán đặt cọc giữ chỗ/g, 'Thanh toán Gia hạn Hợp đồng')
  .replace(/Số tiền cọc:/g, 'Số tiền gia hạn:')
  .replace(/DEP-/g, 'EXT-')
  .replace(/Thời gian giữ chỗ:/g, 'Thời gian giao dịch:')
  .replace(/depositAmount/g, 'extendAmount');
fs.writeFileSync(path.join(modalsDir, 'ExtendPaymentModal.tsx'), extendPaymentModal);

// 2. Create ExtendSuccessModal
let depositSuccessModal = fs.readFileSync(path.join(modalsDir, 'DepositSuccessModal.tsx'), 'utf-8');
let extendSuccessModal = depositSuccessModal
  .replace(/DepositSuccessModal/g, 'ExtendSuccessModal')
  .replace(/ĐẶT CỌC THÀNH CÔNG/g, 'GIA HẠN THÀNH CÔNG')
  .replace(/Số tiền cọc:/g, 'Số tiền gia hạn:')
  .replace(/Ngày nhận kho:/g, 'Ngày bắt đầu gia hạn:')
  .replace(/depositAmount/g, 'extendAmount')
  .replace(/Hoàn tất thủ tục đặt cọc và giữ chỗ thành công/g, 'Cảm ơn quý khách đã gia hạn hợp đồng thuê kho');
fs.writeFileSync(path.join(modalsDir, 'ExtendSuccessModal.tsx'), extendSuccessModal);

// 3. Create ExtendPaymentFlow
let depositPaymentFlow = fs.readFileSync(path.join(modalsDir, 'DepositPaymentFlow.tsx'), 'utf-8');
let extendPaymentFlow = depositPaymentFlow
  .replace(/DepositPaymentFlow/g, 'ExtendPaymentFlow')
  .replace(/DepositPaymentModal/g, 'ExtendPaymentModal')
  .replace(/DepositSuccessModal/g, 'ExtendSuccessModal')
  .replace(/import DraftContractModal from '.\/DraftContractModal';/, '')
  .replace(/const \[step, setStep\] = useState\('CONTRACT'\);/, "const [step, setStep] = useState('PAYMENT');\n  useEffect(() => { handleProceedToPayment(); }, []);")
  .replace(/const depositAmount/g, 'const extendAmount')
  .replace(/depositAmount,/g, 'extendAmount,')
  .replace(/amount=\$\{depositAmount\}/g, 'amount=${extendAmount}')
  .replace(/DEP-/g, 'EXT-')
  .replace(/\{step === 'CONTRACT'[^>]+>/, '') // Remove draft contract modal
  .replace(/onBack=\{.*?\}/, "onBack={onClose}"); // Back goes to close

fs.writeFileSync(path.join(modalsDir, 'ExtendPaymentFlow.tsx'), extendPaymentFlow);

// 4. Update CustomerPortal
const portalFile = path.join(__dirname, '../frontend/src/pages/CustomerPortal.tsx');
let portalContent = fs.readFileSync(portalFile, 'utf-8');

portalContent = portalContent.replace(/import DepositPaymentFlow from '@\/features\/portal\/components\/modals\/DepositPaymentFlow';/, 
  "import DepositPaymentFlow from '@/features/portal/components/modals/DepositPaymentFlow';\nimport ExtendPaymentFlow from '@/features/portal/components/modals/ExtendPaymentFlow';");

portalContent = portalContent.replace(/const \[showDepositFlow, setShowDepositFlow\] = useState\(false\);/,
  "const [showDepositFlow, setShowDepositFlow] = useState(false);\n  const [showExtendPaymentFlow, setShowExtendPaymentFlow] = useState(false);\n  const [extendPaymentData, setExtendPaymentData] = useState<any>(null);");

const oldHandleConfirm = `  const handleConfirmExtendPayment = (extData) => {
    setShowExtendModal(false);
    setDepositBookingData({
      facilityName: \`SmartStorage \${extData.unitCode}\`,
      unitId: extData.unitCode,
      unitSize: \`Size \${extData.size}\`,
      startDate: new Date().toLocaleDateString('vi-VN'),
      depositAmount: extData.finalTotal
    });
    setShowDepositFlow(true);
  };`;

const newHandleConfirm = `  const handleConfirmExtendPayment = (extData) => {
    setShowExtendModal(false);
    setExtendPaymentData({
      facilityName: extData.branch,
      unitId: extData.unitCode,
      unitSize: \`Size \${extData.size}\`,
      startDate: extData.expiry,
      extendAmount: extData.finalTotal
    });
    setShowExtendPaymentFlow(true);
  };`;
portalContent = portalContent.replace(oldHandleConfirm, newHandleConfirm);

const newFlowJSX = `        {showExtendPaymentFlow && extendPaymentData && (
          <ExtendPaymentFlow
            initialBookingData={extendPaymentData}
            onClose={() => setShowExtendPaymentFlow(false)}
            onFinish={() => {
              setShowExtendPaymentFlow(false);
              setMapRefreshTrigger(prev => prev + 1);
            }}
          />
        )}`;
// Insert after showDepositFlow
portalContent = portalContent.replace(/\{\/\* VietQR Deposit Flow Modal \*\/\}/, newFlowJSX + "\n\n        {/* VietQR Deposit Flow Modal */}");

fs.writeFileSync(portalFile, portalContent, 'utf-8');
console.log("Created separate ExtendPaymentFlow");
