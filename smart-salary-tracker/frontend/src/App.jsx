import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getMe } from './services/authService';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import MainLayout from './layouts/MainLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ServicesPage from './pages/public/ServicesPage';
import RecruitmentPage from './pages/public/RecruitmentPage';
import ContactPage from './pages/public/ContactPage';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Employee Portal Pages
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';

// Admin HR Portal
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then((data) => {
          setUser(data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-600 font-medium">
        Đang tải hệ thống Long Hải Securitas...
      </div>
    );
  }

  const defaultAuthHome = user?.role === 'admin' ? '/admin' : '/nhan-vien';

  return (
    <Router>
      <Routes>
        {/* Public Corporate & Recruitment Website */}
        <Route element={<PublicLayout user={user} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/gioi-thieu" element={<AboutPage />} />
          <Route path="/dich-vu" element={<ServicesPage />} />
          <Route path="/tuyen-dung" element={<RecruitmentPage />} />
          <Route path="/lien-he" element={<ContactPage />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to={defaultAuthHome} replace />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={defaultAuthHome} replace />} />

        {/* Protected Employee Portal */}
        <Route path="/nhan-vien" element={user ? <MainLayout user={user} setUser={setUser} /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Protected Admin HR Portal */}
        <Route
          path="/admin"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role === 'admin' ? (
              <AdminDashboard user={user} setUser={setUser} />
            ) : (
              <Navigate to="/nhan-vien" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
