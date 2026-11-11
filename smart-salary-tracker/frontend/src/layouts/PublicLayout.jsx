import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Phone, UserCheck, Shield, Briefcase, FileText } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { BRANCHES, COMPANY_INFO } from '../data/companyData';

const CURRENT_YEAR = new Date().getFullYear();

export default function PublicLayout({ user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Trang chủ' },
    { path: '/gioi-thieu', label: 'Giới thiệu' },
    { path: '/dich-vu', label: 'Dịch vụ an ninh' },
    { path: '/tuyen-dung', label: 'Tuyển dụng' },
    { path: '/lien-he', label: 'Liên hệ' },
  ];

  const portalPath = user ? (user.role === 'admin' ? '/admin' : '/nhan-vien') : '/login';
  const portalLabel = user
    ? user.role === 'admin'
      ? 'Quản trị HR'
      : 'Cổng nhân viên'
    : 'Cổng nhân viên';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Info Bar */}
      <div className="bg-[#0A192F] text-slate-200 text-xs py-2 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="font-medium text-white">
              Thành viên Tập đoàn An ninh Securitas AB (Thụy Điển)
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-300">
              {COMPANY_INFO.hqAddress}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href={COMPANY_INFO.hotlineHref} className="inline-flex items-center gap-1.5 text-white hover:text-[#FF4D58] font-semibold">
              <Phone className="w-3.5 h-3.5 text-[#E30613]" />
              Hotline: {COMPANY_INFO.hotline}
            </a>
            <span className="hidden sm:inline text-slate-300">{COMPANY_INFO.email}</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-18 flex items-center justify-between gap-4">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <BrandLogo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    active
                      ? 'text-[#E30613] bg-red-50'
                      : 'text-slate-700 hover:text-[#0A192F] hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2.5">
            {user?.role === 'admin' && (
              <Link
                to="/nhan-vien"
                className="px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Tính lương NV
              </Link>
            )}
            <Link
              to={portalPath}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-[#0A192F] hover:bg-slate-100 transition"
            >
              <UserCheck className="w-4 h-4 text-[#0A192F]" />
              <span>{portalLabel}</span>
            </Link>
            <Link
              to="/tuyen-dung"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E30613] hover:bg-[#B8040E] text-white text-sm font-bold shadow-xs transition"
            >
              <Briefcase className="w-4 h-4" />
              <span>Ứng tuyển ngay</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700"
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-2 shadow-lg">
            {navLinks.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${
                    active ? 'bg-red-50 text-[#E30613]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to={portalPath}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-[#0A192F]"
              >
                {portalLabel}
              </Link>
              <Link
                to="/lien-he"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-xl bg-[#0A192F] text-white text-sm font-semibold"
              >
                Yêu cầu báo giá dịch vụ
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Page Body */}
      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#0A192F] text-slate-300 pt-14 pb-24 lg:pb-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <BrandLogo dark />
            <p className="text-sm text-slate-300 leading-relaxed">
              {COMPANY_INFO.fullName} — Tiên phong dịch vụ bảo vệ chuyên nghiệp tại Việt Nam từ năm 1995, liên doanh Tập đoàn Securitas AB (Thụy Điển).
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg">
              <Shield className="w-4 h-4" />
              <span>Tuyển dụng trực tiếp – Không thu phí</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Điều hướng</h4>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="hover:text-white transition">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to={portalPath} className="hover:text-white transition">
                  {portalLabel}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-white font-bold mb-4">Trụ sở & Hệ thống Chi nhánh</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {BRANCHES.map((b) => (
                <div key={b.region} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
                  <div className="font-semibold text-white">{b.region}</div>
                  <div className="text-slate-300">{b.address}</div>
                  <div className="text-slate-200 font-medium">Hotline: {b.phone}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
          <div>© {CURRENT_YEAR} {COMPANY_INFO.fullName}. Tham khảo thông tin từ securitaslonghai.vn.</div>
          <div>Sứ mệnh: &ldquo;{COMPANY_INFO.slogan}&rdquo;</div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 grid grid-cols-3 divide-x divide-slate-200 shadow-lg">
        <a
          href={COMPANY_INFO.hotlineHref}
          className="flex flex-col items-center justify-center py-2.5 text-xs font-semibold text-[#0A192F]"
        >
          <Phone className="w-4 h-4 text-[#E30613] mb-0.5" />
          <span>Gọi Hotline</span>
        </a>
        <Link
          to="/tuyen-dung"
          className="flex flex-col items-center justify-center py-2.5 text-xs font-semibold text-[#E30613]"
        >
          <Briefcase className="w-4 h-4 mb-0.5" />
          <span>Ứng tuyển</span>
        </Link>
        <Link
          to="/lien-he"
          className="flex flex-col items-center justify-center py-2.5 text-xs font-semibold text-[#0A192F]"
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span>Báo giá</span>
        </Link>
      </div>
    </div>
  );
}
