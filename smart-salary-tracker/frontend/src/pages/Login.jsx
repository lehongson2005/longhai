import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';
import { login } from '../services/authService';
import BrandLogo from '../components/BrandLogo';
import { useToast } from '../components/useToast';

export default function Login({ setUser }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const showDemoHelpers = import.meta.env.VITE_ENABLE_DEMO_LOGIN !== 'false';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(identifier, password);
      setUser(data.user);
      toast.success(`Chào mừng ${data.user.name}!`, 'Đăng nhập thành công');
      if (data.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/nhan-vien');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại.';
      setError(msg);
      toast.error(msg, 'Không thể đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoId, demoPass, label) => {
    setIdentifier(demoId);
    setPassword(demoPass);
    setError('');
    toast.info(`Đã điền tài khoản ${label} (${demoId} / ${demoPass}). Nhấn "Đăng nhập" để vào.`, 'Tài khoản test');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-red-50/40 flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 flex flex-col items-center">
        <BrandLogo />
        <p className="text-slate-600 mt-2.5 text-sm text-center max-w-xs">
          Chấm ca trực (B1, B2, A, B, C, A1, C1, AB), tính lương & quản lý chi tiêu cá nhân
        </p>
      </div>

      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200/80 space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-[#0A192F]">Đăng nhập</h1>
          <p className="text-xs text-slate-500 mt-1">Dùng tên đăng nhập, số điện thoại, mã NV hoặc email</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3.5 py-2.5 rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tên đăng nhập / SĐT / Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F] text-sm"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="VD: nv1, 0909123456 hoặc admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F] text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0A192F] hover:bg-[#13294B] text-white py-3 rounded-xl font-bold transition cursor-pointer disabled:opacity-60 shadow-sm"
          >
            {loading ? 'Đang kiểm tra...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Forgot password guidance */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
          <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Quên mật khẩu?</strong> Nhắn cho Quản lý / Admin để đặt lại mật khẩu mặc định là{' '}
            <code className="px-1.5 py-0.5 rounded bg-amber-100 font-bold text-amber-950">123456</code>, sau đó vào{' '}
            <em>Cài đặt</em> đổi lại mật khẩu mới.
          </p>
        </div>

        {showDemoHelpers && (
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
              Điền nhanh tài khoản dùng thử
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemoAccount('nv1', '123456', 'Nhân viên')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A192F]">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nhân viên mẫu</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  TK: <strong>nv1</strong> • MK: <strong>123456</strong>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('admin', 'admin123', 'Admin')}
                className="p-2.5 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100/70 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#E30613]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Quản trị Admin</span>
                </div>
                <div className="text-[11px] text-slate-700 mt-0.5">
                  TK: <strong>admin</strong> • MK: <strong>admin123</strong>
                </div>
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 text-center border-t border-slate-100">
          <span className="text-sm text-slate-600">Nhân viên mới chưa có tài khoản? </span>
          <Link to="/register" className="text-sm text-[#E30613] font-bold hover:underline">
            Tự tạo tài khoản ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
