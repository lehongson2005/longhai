import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getSettings, getCachedSettings, updateSettings } from '../services/settingsService';
import { changePassword, updateProfile } from '../services/authService';
import { Calculator, Save, Lock, Eye, EyeOff, UserRound } from 'lucide-react';
import { useToast } from '../components/useToast';

export default function Settings() {
  const outletContext = useOutletContext() || {};
  const user = outletContext.user;
  const setUser = outletContext.setUser;
  const cachedSettings = getCachedSettings();
  const [settings, setSettings] = useState(
    () =>
      cachedSettings || {
        base_salary: '',
        standard_work_days: '',
        standard_hour_rate: '',
        overtime_rate: '',
        weekly_off_rate: '',
        holiday_rate: '',
      }
  );
  const [loading, setLoading] = useState(() => !cachedSettings);
  const [saving, setSaving] = useState(false);

  // Profile edit state
  const [profileName, setProfileName] = useState(() => user?.name || '');
  const [profileCode, setProfileCode] = useState(() => user?.employee_code || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const toast = useToast();

  useEffect(() => {
    let active = true;
    getSettings()
      .then((res) => {
        if (active && res) setSettings(res);
      })
      .catch(() => {
        if (active) toast.error('Không thể tải cấu hình lương.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutoCalcRates = () => {
    const base = Number(settings.base_salary);
    const days = Number(settings.standard_work_days);
    if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(days) || days <= 0) {
      toast.warning('Vui lòng nhập Lương cơ bản và Số công chuẩn hợp lệ trước.');
      return;
    }
    const hourRate = Math.round(base / days / 8);
    const otRate = Math.round(hourRate * 1.5);
    const sundayRate = Math.round(hourRate * 2);
    setSettings((prev) => ({
      ...prev,
      standard_hour_rate: hourRate,
      overtime_rate: otRate,
      weekly_off_rate: sundayRate,
    }));
    toast.info(`Đã tính đơn giá giờ = ${hourRate.toLocaleString('vi-VN')} ₫/h. Nhấn "Lưu cấu hình" để áp dụng.`);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        base_salary: Number(settings.base_salary),
        standard_work_days: Number(settings.standard_work_days),
        standard_hour_rate: Number(settings.standard_hour_rate),
        overtime_rate: Number(settings.overtime_rate),
        weekly_off_rate: Number(settings.weekly_off_rate || Number(settings.standard_hour_rate) * 2),
        holiday_rate: Number(settings.holiday_rate || 2),
      });
      toast.success('Đã lưu cấu hình mức lương thành công!', 'Đã cập nhật');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu cấu hình lương.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.warning('Họ và tên không được để trống.');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await updateProfile({ name: profileName.trim(), employee_code: profileCode.trim() });
      if (res?.user && typeof setUser === 'function') {
        setUser(res.user);
      }
      toast.success(res.message || 'Đã cập nhật thông tin cá nhân!', 'Hồ sơ tài khoản');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật thông tin cá nhân.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      toast.warning('Mật khẩu mới phải từ 4 ký tự trở lên.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('Xác nhận mật khẩu mới chưa khớp.');
      return;
    }
    setChangingPass(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      toast.success(res.message || 'Đổi mật khẩu thành công!', 'Bảo mật tài khoản');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đổi mật khẩu.');
    } finally {
      setChangingPass(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
        Đang tải cài đặt...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A192F]">Cài đặt lương & tài khoản</h1>
        <p className="text-xs text-slate-500 mt-0.5">Cập nhật thông tin cá nhân, đơn giá tính lương và đổi mật khẩu</p>
      </div>

      {/* Profile Settings Card */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-extrabold text-base text-[#0A192F]">1. Thông tin cá nhân</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tên đăng nhập hiện tại:{' '}
              <strong className="text-slate-800">{user?.username || user?.email || user?.employee_code || '-'}</strong>
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
            <UserRound className="w-3.5 h-3.5 text-[#0A192F]" />
            <span>{user?.role === 'admin' ? 'Quản trị Admin' : 'Nhân viên'}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="settings-profile-name" className="block text-sm font-semibold text-slate-700 mb-1">
              Họ và tên *
            </label>
            <input
              id="settings-profile-name"
              type="text"
              required
              maxLength={100}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F] text-sm"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="VD: Nguyễn Văn Bảo"
            />
          </div>
          <div>
            <label htmlFor="settings-profile-code" className="block text-sm font-semibold text-slate-700 mb-1">
              Mã nhân viên <span className="text-slate-400 font-normal">(tùy chọn)</span>
            </label>
            <input
              id="settings-profile-code"
              type="text"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F] text-sm"
              value={profileCode}
              onChange={(e) => setProfileCode(e.target.value)}
              placeholder="VD: LH-102"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="inline-flex items-center justify-center gap-2 bg-[#0A192F] hover:bg-[#13294B] text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          <span>{savingProfile ? 'Đang lưu...' : 'Lưu thông tin cá nhân'}</span>
        </button>
      </form>

      {/* Salary Settings Card */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-extrabold text-base text-[#0A192F]">2. Cấu hình đơn giá lương</h2>
          <button
            type="button"
            onClick={handleAutoCalcRates}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#0A192F] cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Tự tính đơn giá theo Lương cơ bản</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Lương cơ bản (VNĐ)</label>
            <input
              type="number"
              name="base_salary"
              required
              min={0}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              value={settings.base_salary}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Số công chuẩn / tháng</label>
            <input
              type="number"
              name="standard_work_days"
              required
              min={1}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              value={settings.standard_work_days}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn giá giờ chuẩn (VNĐ/giờ)</label>
            <input
              type="number"
              name="standard_hour_rate"
              required
              min={1}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              value={settings.standard_hour_rate}
              onChange={handleChange}
            />
            <p className="text-[11px] text-slate-500 mt-1">Áp dụng trực tiếp khi tính công ca B1/B2 (4h), A/B/C (8h)...</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn giá OT / tăng ca (VNĐ/giờ)</label>
            <input
              type="number"
              name="overtime_rate"
              required
              min={0}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              value={settings.overtime_rate}
              onChange={handleChange}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Áp dụng trực tiếp cho các giờ vượt 8h trong ngày thường (ca A1, C1, AB, H, R).
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 bg-[#0A192F] hover:bg-[#13294B] text-white px-6 py-3 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình lương'}</span>
        </button>
      </form>

      {/* Change Password Card */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6 space-y-4">
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={user?.username || user?.employee_code || user?.email || ''}
          readOnly
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base text-[#0A192F]">3. Đổi mật khẩu đăng nhập</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nếu vừa được Admin đặt lại mật khẩu về <code className="font-bold">123456</code>, hãy đổi mật khẩu riêng tại đây.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPass((p) => !p)}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 cursor-pointer"
            aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Mật khẩu hiện tại</label>
            <input
              name="current-password"
              type={showPass ? 'text' : 'password'}
              required
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="VD: 123456"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Mật khẩu mới</label>
            <input
              name="new-password"
              type={showPass ? 'text' : 'password'}
              required
              minLength={4}
              autoComplete="new-password"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Từ 4 ký tự trở lên"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Nhập lại mật khẩu mới</label>
            <input
              name="confirm-password"
              type={showPass ? 'text' : 'password'}
              required
              minLength={4}
              autoComplete="new-password"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={changingPass}
          className="inline-flex items-center justify-center gap-2 bg-[#E30613] hover:bg-[#B8040E] text-white px-6 py-3 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-60"
        >
          <Lock className="w-4 h-4" />
          <span>{changingPass ? 'Đang cập nhật...' : 'Đổi mật khẩu'}</span>
        </button>
      </form>
    </div>
  );
}
