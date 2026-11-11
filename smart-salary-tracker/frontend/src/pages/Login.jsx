import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { login } from '../services/authService';
import BrandLogo from '../components/BrandLogo';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showDemoHelpers = import.meta.env.VITE_ENABLE_DEMO_LOGIN !== 'false';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      setUser(data.user);
      if (data.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/nhan-vien');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#0A192F]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ Long Hải Securitas</span>
        </Link>
      </div>

      <div className="mb-6 flex flex-col items-center">
        <BrandLogo />
        <p className="text-slate-500 mt-3 text-sm text-center">
          Cổng Nhân viên (Chấm ca & Lương) và Quản trị Tuyển dụng HR
        </p>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md border border-slate-200">
        <h2 className="text-xl font-bold text-[#0A192F] mb-6 text-center">Đăng nhập hệ thống</h2>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm text-center px-3 py-2 rounded-xl">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@securitaslonghai.vn"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0A192F] hover:bg-[#13294B] text-white py-3 rounded-xl font-semibold transition cursor-pointer"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {showDemoHelpers && (
          <div className="mt-6 pt-5 border-t border-slate-200 space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
              Tài khoản dùng thử nhanh
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('nhanvien@securitaslonghai.vn', '123456')}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-[#0A192F] cursor-pointer"
              >
                NV Bảo vệ (Cổng NV)
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@securitaslonghai.vn', 'Admin@123')}
                className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-[#E30613] cursor-pointer"
              >
                Quản trị HR (Admin)
              </button>
            </div>
          </div>
        )}

        <p className="mt-5 text-center text-sm text-slate-600">
          Nhân viên mới chưa có tài khoản?{' '}
          <Link to="/register" className="text-[#E30613] font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
