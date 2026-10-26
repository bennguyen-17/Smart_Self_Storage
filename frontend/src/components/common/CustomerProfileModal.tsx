import { useState, useEffect } from 'react';
import { getCurrentCustomerProfile, updateCustomerProfile, sendEmailOtp } from '@/features/customer/api/customerService';
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
  const [formData, setFormData] = useState({ fullName: '', phone: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);

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
          setProfile(res.data);
          setFormData({
            fullName: res.data.fullName || '',
            phone: res.data.phone || '',
            email: res.data.email || ''
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
    setIsEditing(false);
    setShowOtpModal(false);
    setFormData({
      fullName: profile?.fullName || '',
      phone: profile?.phone || '',
      email: profile?.email || ''
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
        email: trimmedEmail
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

    setIsVerifyingOtp(true);
    try {
      const res = await updateCustomerProfile({
        accountId: profile?.accountId,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
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
      <div className="card-box max-w-md w-full rounded-3xl border shadow-2xl overflow-hidden space-y-4 p-5 sm:p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 modal-animate-pop relative">
        
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
