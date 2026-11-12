import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Wallet, Settings, LogOut, Shield } from 'lucide-react';
import { logout } from '../services/authService';
import BrandLogo from '../components/BrandLogo';
import { useToast } from '../components/useToast';
import { prefetchRoute } from '../utils/routePrefetch';

export default function MainLayout({ user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    setUser(null);
    toast.info('Bạn đã đăng xuất tài khoản.');
    navigate('/login');
  };

  const navItems = [
    { path: '/nhan-vien', label: 'Tổng quan', icon: Home },
    { path: '/nhan-vien/schedule', label: 'Lịch trực', icon: Calendar },
    { path: '/nhan-vien/expenses', label: 'Chi tiêu', icon: Wallet },
    { path: '/nhan-vien/settings', label: 'Cài đặt', icon: Settings },
  ];

  const accountTag = user?.username || user?.employee_code || user?.email || '';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen shrink-0">
        <div className="p-4 border-b border-slate-200 space-y-2.5">
          <Link to="/nhan-vien">
            <BrandLogo compact />
          </Link>
          <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-200/70">
            <div className="text-xs font-bold text-slate-800 truncate">{user?.name}</div>
            {accountTag && <div className="text-[11px] text-slate-500 truncate">TK: {accountTag}</div>}
          </div>
        </div>

        <nav className="flex-1 p-3.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onMouseEnter={() => prefetchRoute(item.path)}
                onTouchStart={() => prefetchRoute(item.path)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-[#0A192F] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {user?.role === 'admin' && (
            <div className="pt-3 mt-3 border-t border-slate-200">
              <Link
                to="/admin"
                className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl bg-red-50 text-[#E30613] hover:bg-red-100 text-sm font-bold"
              >
                <Shield size={18} />
                <span>Quản lý Nhân viên</span>
              </Link>
            </div>
          )}
        </nav>

        <div className="p-3.5 border-t border-slate-200">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center space-x-3 text-red-600 w-full px-3.5 py-2.5 hover:bg-red-50 rounded-xl text-sm font-semibold cursor-pointer"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-8 overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-20">
          <Link to="/nhan-vien">
            <BrandLogo compact />
          </Link>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#E30613] px-2.5 py-1.5 rounded-lg bg-red-50"
              >
                <Shield size={14} />
                <span>Admin</span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-red-600 px-2.5 py-1.5 rounded-lg bg-slate-100 cursor-pointer"
              aria-label="Đăng xuất"
            >
              <LogOut size={15} />
              <span>Thoát</span>
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
          <Outlet context={{ user, setUser }} />
        </div>
      </main>

      {/* Mobile Bottom Navigation — z-30 so modals (z-[60]) are NEVER occluded */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 grid grid-cols-4 px-1 py-1.5 z-30 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onMouseEnter={() => prefetchRoute(item.path)}
              onTouchStart={() => prefetchRoute(item.path)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
                isActive ? 'text-[#E30613] bg-red-50/70 font-bold' : 'text-slate-500 font-medium'
              }`}
            >
              <Icon size={20} />
              <span className="text-[11px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
