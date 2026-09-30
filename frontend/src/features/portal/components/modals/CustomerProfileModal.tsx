import { useState, useEffect } from 'react';
import { getCurrentCustomerProfile } from '@/features/portal/services/customerService';
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

export default function CustomerProfileModal({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getCurrentCustomerProfile();
        if (res.success && res.data) {
          setProfile(res.data);
          setFormData({
            fullName: res.data.fullName || 'Khách Hàng',
            email: res.data.email || 'Chưa cập nhật'
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

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      fullName: profile?.fullName || 'Khách Hàng',
      email: profile?.email || 'Chưa cập nhật'
    });
  };

  const handleSaveClick = () => {
    setIsSaving(true);
    setTimeout(() => {
      setProfile((prev: any) => ({
        ...prev,
        fullName: formData.fullName,
        email: formData.email
      }));
      setIsSaving(false);
      setIsEditing(false);
      toast.success("Đã cập nhật Họ tên & Email thành công!");
    }, 600);
  };

  const avatarText = getInitials(profile?.fullName || 'Khách Hàng');
  const identityNumber = profile?.identityNumber || profile?.cccd || profile?.identityCard || profile?.citizenId || profile?.idCard || 'Chưa cập nhật';
  const phone = profile?.phone || 'Chưa cập nhật';
  const isVerified = profile?.isVerified ?? true;
  const verificationBadge = profile?.verificationBadge || (isVerified ? 'ĐÃ XÁC THỰC THÔNG TIN' : 'CHƯA XÁC THỰC THÔNG TIN');

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
                {isVerified ? (
                  <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full inline-block mt-0.5">
                    <i className="fa-solid fa-shield-check mr-1"></i> {verificationBadge}
                  </span>
                ) : (
                  <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full inline-block mt-0.5">
                    <i className="fa-solid fa-circle-exclamation mr-1"></i> {verificationBadge}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">
                  Thông tin Cá nhân & Liên hệ
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-900 dark:text-white">
                      <div>
                        <span className="text-slate-500 block text-[10px] mb-1 font-semibold">Họ và Tên:</span>
                        <input 
                          type="text" 
                          value={formData.fullName} 
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] mb-1 font-semibold">Mã CCCD:</span>
                        <input 
                          type="text" 
                          value={identityNumber} 
                          disabled
                          className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-400 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] mb-1 font-semibold">Số Điện Thoại:</span>
                        <input 
                          type="text" 
                          value={phone} 
                          disabled
                          className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-slate-400 cursor-not-allowed"
                        />
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[10px] mb-1 font-semibold">Email:</span>
                        <input 
                          type="email" 
                          value={formData.email} 
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold italic">
                      * Số điện thoại và Mã CCCD chỉ được thay đổi trực tiếp tại chi nhánh.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-slate-900 dark:text-white pt-1">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Họ và Tên</span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">{profile?.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Mã CCCD</span>
                      <span className="font-bold font-mono text-xs text-slate-900 dark:text-white block">{identityNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Số Điện Thoại</span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">{profile?.phone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Email</span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">{profile?.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="pt-2 flex gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer shadow-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer shadow-sm disabled:opacity-70 flex items-center justify-center"
              >
                {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <><i className="fa-solid fa-floppy-disk mr-1.5"></i> Lưu thay đổi</>}
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
