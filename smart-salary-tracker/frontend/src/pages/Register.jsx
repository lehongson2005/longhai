import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { register } from '../services/authService';
import BrandLogo from '../components/BrandLogo';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, employeeCode);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
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
          Đăng ký tài khoản Cổng Nhân viên Bảo vệ
        </p>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md border border-slate-200">
        <h2 className="text-xl font-bold text-[#0A192F] mb-6 text-center">Tạo tài khoản mới</h2>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm text-center px-3 py-2 rounded-xl">
            {error}
          </div>
        )}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mã nhân viên (tùy chọn)</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="VD: LH-NV102"
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
            className="w-full bg-[#E30613] hover:bg-[#B8040E] text-white py-3 rounded-xl font-semibold transition cursor-pointer"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-[#0A192F] font-semibold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
