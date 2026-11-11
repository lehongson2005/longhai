import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Wallet, Settings, LogOut, Globe, Shield } from 'lucide-react';
import { logout } from '../services/authService';
import BrandLogo from '../components/BrandLogo';

export default function MainLayout({ user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/');
  };

  const navItems = [
    { path: '/nhan-vien', label: 'Tổng quan', icon: Home },
    { path: '/nhan-vien/schedule', label: 'Lịch trực', icon: Calendar },
    { path: '/nhan-vien/expenses', label: 'Chi tiêu', icon: Wallet },
    { path: '/nhan-vien/settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-68 bg-white border-r border-slate-200 min-h-screen">
        <div className="p-4 border-b border-slate-200 space-y-2">
          <Link to="/">
            <BrandLogo compact />
          </Link>
          <p className="text-xs text-slate-500 pt-1">
            Cổng nhân viên • <strong className="text-slate-700">{user?.name}</strong>
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#0A192F] text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-200 space-y-1.5">
            <Link
              to="/"
              className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
            >
              <Globe size={18} />
              <span>Trang chủ Long Hải</span>
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-[#E30613] hover:bg-red-50 text-sm font-semibold"
              >
                <Shield size={18} />
                <span>Quản trị HR</span>
              </Link>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center space-x-3 text-red-600 w-full px-4 py-2.5 hover:bg-red-50 rounded-xl font-medium cursor-pointer"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10">
          <Link to="/">
            <BrandLogo compact />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs font-semibold text-slate-600 px-2.5 py-1.5 rounded-lg bg-slate-100">
              Web công ty
            </Link>
            <button type="button" onClick={handleLogout} className="text-slate-500 cursor-pointer">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-lg ${
                isActive ? 'text-[#E30613]' : 'text-slate-500'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
