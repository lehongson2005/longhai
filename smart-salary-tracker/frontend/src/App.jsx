import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import api from './services/api';
import { getMe, getCachedUser, logout } from './services/authService';
import {
  loadLogin,
  loadRegister,
  loadMainLayout,
  loadDashboard,
  loadSchedule,
  loadExpenses,
  loadSettings,
  loadAdminDashboard,
} from './utils/routePrefetch';

const Login = lazy(loadLogin);
const Register = lazy(loadRegister);
const MainLayout = lazy(loadMainLayout);
const Dashboard = lazy(loadDashboard);
const Schedule = lazy(loadSchedule);
const Expenses = lazy(loadExpenses);
const Settings = lazy(loadSettings);
const AdminDashboard = lazy(loadAdminDashboard);

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-3 animate-pulse">
        <div className="h-8 w-44 mx-auto bg-slate-200 rounded-xl" />
        <div className="h-32 bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="h-4 w-1/3 bg-slate-200 rounded" />
          <div className="h-6 w-2/3 bg-slate-100 rounded" />
        </div>
        <div className="h-24 bg-white border border-slate-200 rounded-2xl" />
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token') && !getCachedUser()));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      api.get('/health').catch(() => {});
      return;
    }
    let active = true;
    getMe()
      .then((data) => {
        if (active) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 401 || status === 404) {
          logout();
          if (active) setUser(null);
        }
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      void loadSchedule();
      void loadExpenses();
      void loadSettings();
    }, 600);
    return () => clearTimeout(timer);
  }, [user]);

  if (loading) {
    return <PageSkeleton />;
  }

  const defaultAuthHome = user ? (user.role === 'admin' ? '/admin' : '/nhan-vien') : '/login';

  return (
    <Router>
      <Suspense fallback={<PageSkeleton />}>
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
      </Suspense>
    </Router>
  );
}

export default App;
