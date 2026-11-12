import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getMe } from './services/authService';

import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    let active = true;
    getMe()
      .then((data) => {
        if (active) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen flex-col gap-3 items-center justify-center bg-slate-50 text-slate-600 font-medium">
        <div className="h-8 w-8 rounded-full border-3 border-slate-200 border-t-[#E30613] animate-spin" />
        <span className="text-sm">Đang tải hệ thống tính lương Long Hải...</span>
      </div>
    );
  }

  const defaultAuthHome = user ? (user.role === 'admin' ? '/admin' : '/nhan-vien') : '/login';

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={defaultAuthHome} replace />} />

        {/* Auth */}
        <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to={defaultAuthHome} replace />} />
        <Route
          path="/register"
          element={!user ? <Register setUser={setUser} /> : <Navigate to={defaultAuthHome} replace />}
        />

        {/* Employee Salary & Expense Portal */}
        <Route path="/nhan-vien" element={user ? <MainLayout user={user} setUser={setUser} /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Admin User Management Portal */}
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
