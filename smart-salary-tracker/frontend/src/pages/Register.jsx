import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, BadgeCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { register } from '../services/authService';
import BrandLogo from '../components/BrandLogo';
import { useToast } from '../components/useToast';

const REMEMBER_KEY = 'remembered_identifier';

export default function Register({ setUser }) {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await register({
        name,
        identifier,
        password,
        employee_code: employeeCode,
      });
      if (rememberId && identifier.trim()) {
        localStorage.setItem(REMEMBER_KEY, identifier.trim());
      }
      setUser(res.user);
      toast.success(`Chào mừng ${res.user.name}! Bạn có thể bắt đầu chấm ca và tính lương.`, 'Tạo tài khoản thành công');
      navigate('/nhan-vien');
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.';
      setError(msg);
      toast.error(msg, 'Không thể tạo tài khoản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-red-50/40 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mb-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#0A192F]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang Đăng nhập</span>
        </Link>
      </div>

      <div className="mb-5 flex flex-col items-center">
        <BrandLogo />
      </div>

      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200/80 space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-[#0A192F]">Nhân viên tự tạo tài khoản</h1>
          <p className="text-xs text-slate-500 mt-1">
            Đăng ký nhanh bằng tên ngắn hoặc số điện thoại (không bắt buộc email)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3.5 py-2.5 rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Họ và tên *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reg-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F] text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn Hùng"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-username" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tên đăng nhập hoặc SĐT *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reg-username"
                name="username"
                type="text"
                required
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F] text-sm"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="VD: 0909123456 hoặc hung01"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Viết liền không khoảng trắng để dễ nhớ khi đăng nhập</p>
          </div>

          <div>
            <label htmlFor="reg-code" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Mã nhân viên <span className="text-slate-400 font-normal">(không bắt buộc)</span>
            </label>
            <div className="relative">
              <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reg-code"
                name="employee_code"
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F] text-sm"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="VD: LH-102"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Mật khẩu *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reg-password"
                name="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={4}
                autoComplete="new-password"
                className="w-full pl-10 pr-11 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F] text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 4 ký tự (VD: 123456)"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Trình duyệt có thể gợi ý tự lưu mật khẩu để lần sau đăng nhập nhanh hơn.
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberId}
              onChange={(e) => setRememberId(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 accent-[#0A192F] cursor-pointer"
            />
            <span>Nhớ tên đăng nhập cho lần đăng nhập sau</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E30613] hover:bg-[#B8040E] text-white py-3 rounded-xl font-bold transition cursor-pointer disabled:opacity-60 shadow-sm"
          >
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản & Bắt đầu tính lương'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 pt-1">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-[#0A192F] font-bold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
