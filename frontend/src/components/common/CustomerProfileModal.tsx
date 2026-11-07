import { useState, useEffect } from 'react';
import { getCurrentCustomerProfile, updateCustomerProfile, sendEmailOtp, requestAccountDeletion, cancelAccountDeletion } from '@/features/customer/api/customerService';
import { OTHER_BANK, resolveBankName, splitBankName, VIETNAM_BANKS } from '@/lib/banks';
import { toast } from 'sonner';

const getInitials = (name: string) => {
  if (!name) return 'KH';
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return 'KH';
};

const normalizeBankValue = (value?: string | null) => {
  const trimmed = (value || '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'chưa cập nhật') return '';
  return trimmed;
};

const validateBankInfo = (bankName: string, bankAccountNumber: string, bankAccountName: string) => {
  if (!bankName && !bankAccountNumber && !bankAccountName) return '';
  if (!bankName) return 'Vui lòng nhập tên ngân hàng nhận hoàn cọc.';
  if (!/^\d{6,20}$/.test(bankAccountNumber)) return 'Số tài khoản phải gồm 6–20 chữ số.';
  if (!bankAccountName) return 'Vui lòng nhập tên chủ tài khoản thụ hưởng.';
  return '';
};

const updateLocalSession = (updatedData: any) => {
  try {
    const rawAuth = localStorage.getItem('auth_session');
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      if (parsed?.user) {
        if (updatedData.fullName) {
          parsed.user.fullName = updatedData.fullName;
          parsed.user.name = updatedData.fullName;
        }
        if (updatedData.phone) parsed.user.phone = updatedData.phone;
        if (updatedData.email) parsed.user.email = updatedData.email;
        localStorage.setItem('auth_session', JSON.stringify(parsed));
      }
    }
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (updatedData.fullName) {
        parsed.fullName = updatedData.fullName;
        parsed.name = updatedData.fullName;
      }
      if (updatedData.phone) parsed.phone = updatedData.phone;
      if (updatedData.email) parsed.email = updatedData.email;
      localStorage.setItem('user', JSON.stringify(parsed));
    }
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}
};

export default function CustomerProfileModal({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    bankName: '',
    bankNameCustom: '',
    bankAccountNumber: '',
    bankAccountName: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Trạng thái yêu cầu đóng tài khoản với thời gian ân hạn 30 ngày
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancellingDelete, setIsCancellingDelete] = useState(false);

  const handleRequestDeletion = async () => {
    setIsDeleting(true);
    try {
      const res = await requestAccountDeletion();
      if (res.success) {
        toast.success(res.message);
        setShowDeleteModal(false);
        onClose();
        onLogout();
      } else {
        toast.error(res.message || 'Không thể yêu cầu xóa tài khoản');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi yêu cầu xóa tài khoản';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsCancellingDelete(true);
    try {
      const res = await cancelAccountDeletion();
      if (res.success) {
        toast.success(res.message);
        setProfile((prev: any) => ({ ...prev, deletionScheduledAt: null }));
      } else {
        toast.error(res.message || 'Không thể hủy yêu cầu xóa');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi hủy yêu cầu xóa';
      toast.error(msg);
    } finally {
      setIsCancellingDelete(false);
    }
  };

  // OTP state for email update
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getCurrentCustomerProfile();
        if (res.success && res.data) {
          const bank = splitBankName(res.data.bankName);
          setProfile(res.data);
          setFormData({
            fullName: res.data.fullName || '',
            phone: res.data.phone || '',
            email: res.data.email || '',
            bankName: bank.bankName,
            bankNameCustom: bank.customBankName,
            bankAccountNumber: normalizeBankValue(res.data.bankAccountNumber),
            bankAccountName: normalizeBankValue(res.data.bankAccountName),
          });
        }
      } catch (err) {
        console.error('Lỗi tải hồ sơ khách hàng:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if (showOtpModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, countdown]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    const bank = splitBankName(profile?.bankName);
    setIsEditing(false);
    setShowOtpModal(false);
    setFormData({
      fullName: profile?.fullName || '',
      phone: profile?.phone || '',
      email: profile?.email || '',
      bankName: bank.bankName,
      bankNameCustom: bank.customBankName,
      bankAccountNumber: normalizeBankValue(profile?.bankAccountNumber),
      bankAccountName: normalizeBankValue(profile?.bankAccountName),
    });
  };

  const handleSaveClick = async () => {
    const trimmedName = formData.fullName.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();

    if (!trimmedName) {
      toast.error('Họ và tên không được để trống.');
      return;
    }

    if (!/^0\d{9}$/.test(trimmedPhone)) {
      toast.error('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.');
      return;
    }

    if (!/^[A-Za-z0-9+_.-]+@(.+)$/.test(trimmedEmail)) {
      toast.error('Địa chỉ email không hợp lệ.');
      return;
    }

    const bankName = resolveBankName(formData.bankName, formData.bankNameCustom);
    const bankAccountNumber = formData.bankAccountNumber.trim();
    const bankAccountName = formData.bankAccountName.trim().toUpperCase();

    const bankError = validateBankInfo(bankName, bankAccountNumber, bankAccountName);
    if (bankError) {
      toast.error(bankError);
      return;
    }

    const currentEmail = (profile?.email || '').trim().toLowerCase();
    const isEmailChanged = trimmedEmail !== currentEmail;

    // Trường hợp 1: Có đổi Email -> Gửi OTP về email mới
    if (isEmailChanged) {
      setIsSaving(true);
      try {
        const res = await sendEmailOtp(trimmedEmail, profile?.accountId);
        if (res.success) {
          toast.success(res.message || `Mã OTP đã được gửi đến email ${trimmedEmail}`);
          setOtpInput('');
          setCountdown(60);
          setShowOtpModal(true);
        } else {
          toast.error(res.message || 'Không thể gửi mã OTP tới email mới.');
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi gửi mã OTP.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Trường hợp 2: Không đổi Email (chỉ đổi Họ tên và/hoặc SĐT) -> Lưu trực tiếp
    setIsSaving(true);
    try {
      const res = await updateCustomerProfile({
        accountId: profile?.accountId,
        fullName: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail,
        bankName,
        bankAccountNumber,
        bankAccountName
      });

      const responseData = res?.data || res;
      if (responseData?.success !== false) {
        const updated = responseData?.data || { ...profile, fullName: trimmedName, phone: trimmedPhone };
        setProfile((prev: any) => ({ ...prev, ...updated }));
        updateLocalSession(updated);
        setIsEditing(false);
        toast.success('Cập nhật hồ sơ thành công!');
      } else {
        toast.error(responseData?.message || 'Cập nhật thất bại.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật hồ sơ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedOtp = otpInput.trim();
    if (trimmedOtp.length !== 6) {
      toast.error('Vui lòng nhập đúng mã OTP gồm 6 chữ số.');
      return;
    }

    const bankName = resolveBankName(formData.bankName, formData.bankNameCustom);
    const bankAccountNumber = formData.bankAccountNumber.trim();
    const bankAccountName = formData.bankAccountName.trim().toUpperCase();

    const bankError = validateBankInfo(bankName, bankAccountNumber, bankAccountName);
    if (bankError) {
      toast.error(bankError);
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await updateCustomerProfile({
        accountId: profile?.accountId,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        bankName,
        bankAccountNumber,
        bankAccountName,
        otpCode: trimmedOtp
      });

      const responseData = res?.data || res;
      if (responseData?.success !== false) {
        const updated = responseData?.data || {
          ...profile,
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim().toLowerCase()
        };
        setProfile((prev: any) => ({ ...prev, ...updated }));
        updateLocalSession(updated);
        setShowOtpModal(false);
        setIsEditing(false);
        toast.success('Xác thực email và cập nhật hồ sơ thành công!');
      } else {
        toast.error(responseData?.message || 'Mã OTP không hợp lệ.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi xác thực OTP.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsResendingOtp(true);
    try {
      const res = await sendEmailOtp(formData.email.trim().toLowerCase(), profile?.accountId);
      if (res.success) {
        toast.success('Đã gửi lại mã OTP thành công!');
        setCountdown(60);
      } else {
        toast.error(res.message || 'Không thể gửi lại mã OTP.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi khi gửi lại OTP.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  const avatarText = getInitials(profile?.fullName || 'Khách Hàng');
  const identityNumber = profile?.identityNumber || profile?.cccd || profile?.identityCard || profile?.citizenId || profile?.idCard || 'Chưa cập nhật';

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card-box max-w-md w-full max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl space-y-4 p-5 sm:p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 modal-animate-pop relative">
        
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow">
              <i className="fa-solid fa-id-card"></i>
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">HỒ SƠ KHÁCH HÀNG</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm transition cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <i className="fa-solid fa-spinner animate-spin text-lg mb-2 block text-blue-500"></i>
            Đang tải thông tin khách hàng...
          </div>
        ) : (
          <>
            <div className="relative bg-gradient-to-r from-slate-900 to-blue-950 p-4 sm:p-5 rounded-2xl text-white flex items-center space-x-4 border border-slate-800 shadow-inner">
              
              {/* Nút Sửa đặt bên trong khối tên khách hàng góc phải */}
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-[11px] transition cursor-pointer backdrop-blur-sm shadow-sm"
                >
                  <i className="fa-solid fa-pen mr-1.5"></i> Sửa
                </button>
              )}

              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-400 text-white font-black text-xl flex items-center justify-center shadow-lg border-2 border-blue-300 shrink-0">
                {avatarText}
              </div>
              <div className="min-w-0 flex-1 pr-14">
                <h2 className="font-black text-base text-white truncate">{profile?.fullName}</h2>
                <span className="text-blue-200 text-[11px] font-medium block mt-0.5">Tài khoản khách hàng</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-2.5 text-slate-900 dark:text-white">
                      {/* Dòng 1: Họ và Tên */}
                      <div>
                        <span className="text-slate-500 block text-[10px] mb-1 font-semibold">Họ và Tên:</span>
                        <input 
                          type="text" 
                          value={formData.fullName} 
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          placeholder="Nguyễn Văn A"
                          className="w-full text-xs font-bold px-3.5 py-2 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      {/* Dòng 2: Mã CCCD */}
                      <div>
                        <span className="text-slate-500 flex items-center gap-1 text-[10px] mb-1 font-semibold">
                          <i className="fa-solid text-amber-500 text-[9px]"></i> Mã CCCD:
                        </span>
                        <input 
                          type="text" 
                          value={identityNumber} 
                          disabled
                          title="Số CCCD là thông tin định danh cố định, chỉ được hiệu chỉnh bởi nhân viên tại quầy."
                          className="w-full text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-400 cursor-not-allowed font-mono"
                        />
                      </div>

                      {/* Dòng 3: Số Điện Thoại */}
                      <div>
                        <span className="text-slate-500 block text-[10px] mb-1 font-semibold">Số Điện Thoại:</span>
                        <input 
                          type="text" 
                          value={formData.phone} 
                          onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                          placeholder="0987654321"
                          maxLength={10}
                          className="w-full text-xs font-bold px-3.5 py-2 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                      </div>

                      {/* Dòng 4: Email */}
                      <div>
                        <span className="text-slate-500 block text-[10px] mb-1 font-semibold">Email:</span>
                        <input 
                          type="email" 
                          value={formData.email} 
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="email@example.com"
                          className="w-full text-xs font-bold px-3.5 py-2 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      {/* Dòng 5-7: Thông tin nhận hoàn cọc */}
                      <div className="pt-1 border-t border-slate-200 dark:border-slate-700/70">
                        <span className="text-slate-500 flex items-center gap-1 text-[10px] mb-1 font-semibold">
                          <i className="fa-solid fa-building-columns text-blue-500 text-[9px]"></i> Ngân hàng nhận hoàn cọc:
                        </span>
                        <select
                          value={formData.bankName}
                          onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                          className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                          <option value="">Chọn ngân hàng</option>
                          {VIETNAM_BANKS.map((bank) => (
                            <option key={bank} value={bank}>{bank}</option>
                          ))}
                          <option value={OTHER_BANK}>{OTHER_BANK}</option>
                        </select>
                      </div>

                      {formData.bankName === OTHER_BANK && (
                        <div>
                          <span className="text-slate-500 block text-[10px] mb-1 font-semibold">Tên ngân hàng khác:</span>
                          <input
                            type="text"
                            value={formData.bankNameCustom}
                            onChange={(e) => setFormData({...formData, bankNameCustom: e.target.value})}
                            placeholder="VD: OCB, VIB..."
                            maxLength={100}
                            className="w-full text-xs font-bold px-3.5 py-2 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      )}

                      <div>
                        <span className="text-slate-500 block text-[10px] mb-1 font-semibold">Số tài khoản:</span>
                        <input
                          type="text"
                          value={formData.bankAccountNumber}
                          onChange={(e) => setFormData({...formData, bankAccountNumber: e.target.value.replace(/\D/g, '')})}
                          placeholder="VD: 1029384756"
                          maxLength={20}
                          className="w-full text-xs font-bold px-3.5 py-2 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] mb-1 font-semibold">Chủ tài khoản:</span>
                        <input
                          type="text"
                          value={formData.bankAccountName}
                          onChange={(e) => setFormData({...formData, bankAccountName: e.target.value.toUpperCase()})}
                          placeholder="NGUYEN VAN A"
                          maxLength={100}
                          className="w-full text-xs font-bold px-3.5 py-2 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-slate-900 dark:text-white pt-0.5">
                    {/* Dòng 1: Họ và Tên */}
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider shrink-0">Họ và Tên</span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white text-right" title={profile?.fullName || ''}>{profile?.fullName}</span>
                    </div>

                    {/* Dòng 2: Mã CCCD */}
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider shrink-0">Mã CCCD</span>
                      <span className="font-bold font-mono text-xs text-slate-900 dark:text-white text-right" title={identityNumber || ''}>{identityNumber}</span>
                    </div>

                    {/* Dòng 3: Số Điện Thoại */}
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider shrink-0">Số Điện Thoại</span>
                      <span className="font-bold font-mono text-xs text-slate-900 dark:text-white text-right" title={profile?.phone || ''}>{profile?.phone}</span>
                    </div>

                    {/* Dòng 4: Email */}
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs gap-3">
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider shrink-0">Email</span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white text-right break-all" title={profile?.email || ''}>{profile?.email}</span>
                    </div>

                    {/* Dòng 5-7: Thông tin nhận hoàn cọc */}
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs gap-3">
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider shrink-0">Ngân hàng</span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white text-right" title={normalizeBankValue(profile?.bankName)}>
                        {normalizeBankValue(profile?.bankName) || 'Chưa cập nhật'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs gap-3">
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider shrink-0">Số tài khoản</span>
                      <span className="font-bold font-mono text-xs text-slate-900 dark:text-white text-right" title={normalizeBankValue(profile?.bankAccountNumber)}>
                        {normalizeBankValue(profile?.bankAccountNumber) || 'Chưa cập nhật'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs gap-3">
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider shrink-0">Chủ tài khoản</span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white text-right uppercase" title={normalizeBankValue(profile?.bankAccountName)}>
                        {normalizeBankValue(profile?.bankAccountName) || 'Chưa cập nhật'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Modal nhập OTP xác thực email mới */}
        {showOtpModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl modal-animate-pop">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-lg">
                  <i className="fa-solid fa-shield-keyhole"></i>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Xác thực Email Mới</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mã OTP 6 số đã được gửi tới hòm thư: <strong className="text-blue-600 dark:text-blue-400">{formData.email}</strong>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full text-center tracking-[0.5em] font-mono font-black text-xl py-3 rounded-2xl border-2 border-blue-500 focus:outline-none bg-slate-50 dark:bg-slate-800 dark:text-white"
                  autoFocus
                />
                <div className="flex items-center justify-between text-[11px] mt-2 px-1">
                  <span className="text-slate-400">
                    {countdown > 0 ? `Hết hạn sau: ${countdown}s` : 'Mã OTP đã hết hạn'}
                  </span>
                  <button
                    type="button"
                    disabled={countdown > 0 || isResendingOtp}
                    onClick={handleResendOtp}
                    className="font-bold text-blue-600 hover:text-blue-500 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isResendingOtp ? 'Đang gửi...' : 'Gửi lại mã'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Đổi email khác
                </button>
                <button
                  type="button"
                  disabled={isVerifyingOtp || otpInput.trim().length !== 6}
                  onClick={handleVerifyOtp}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
                >
                  {isVerifyingOtp ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Banner tài khoản đang chờ xóa */}
        {profile?.deletionScheduledAt && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3.5 space-y-2">
            <div className="flex items-start gap-2.5">
              <i className="fa-solid fa-triangle-exclamation text-amber-600 mt-0.5 text-sm shrink-0"></i>
              <div className="text-xs">
                <p className="font-extrabold text-amber-900 dark:text-amber-200">Tài khoản đang trong thời gian chờ xóa</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Dự kiến xóa vĩnh viễn vào ngày: <strong className="font-mono">{new Date(profile.deletionScheduledAt).toLocaleDateString('vi-VN')}</strong> (thời gian ân hạn 30 ngày). Bạn có thể hủy để tiếp tục sử dụng.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isCancellingDelete}
              onClick={handleCancelDeletion}
              className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isCancellingDelete ? <i className="fa-solid fa-spinner animate-spin"></i> : <><i className="fa-solid fa-rotate-left"></i> Hủy yêu cầu xóa tài khoản</>}
            </button>
          </div>
        )}

        {/* Modal xác nhận yêu cầu xóa tài khoản */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl modal-animate-pop">
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-xl">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h4 className="font-black text-base text-slate-900 dark:text-white">Yêu cầu xóa tài khoản</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Hệ thống áp dụng chính sách <strong>Thời gian ân hạn 30 ngày</strong> để bảo vệ dữ liệu người dùng.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5 space-y-2 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">Quy định và quyền lợi:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <li>Chỉ được xóa khi <strong>không còn hợp đồng đang hoạt động/quá hạn</strong> và <strong>không còn hóa đơn nợ</strong>.</li>
                  <li>Tài khoản sẽ được xóa vĩnh viễn và ẩn danh hóa sau <strong>30 ngày</strong> kể từ thời điểm yêu cầu.</li>
                  <li>Trong 30 ngày này, bạn có thể <strong>đăng nhập lại bất kỳ lúc nào để hủy yêu cầu xóa</strong> và tiếp tục sử dụng bình thường.</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleRequestDeletion}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
                >
                  {isDeleting ? <i className="fa-solid fa-spinner animate-spin"></i> : <><i className="fa-solid fa-trash-can"></i> Xác nhận xóa</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nút yêu cầu xóa tài khoản */}
        {!isEditing && !profile?.deletionScheduledAt && (
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/60 dark:hover:bg-rose-950/20 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-trash-can text-[11px]"></i> Yêu cầu đóng tài khoản (Ân hạn 30 ngày)
            </button>
          </div>
        )}

        <div className="pt-2 flex gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer shadow-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer shadow-sm disabled:opacity-70 flex items-center justify-center gap-1.5"
              >
                {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <><i className="fa-solid fa-floppy-disk"></i> Lưu thay đổi</>}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onLogout}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i> Đăng xuất
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
