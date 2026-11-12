export const loadLogin = () => import('../pages/Login');
export const loadRegister = () => import('../pages/Register');
export const loadMainLayout = () => import('../layouts/MainLayout');
export const loadDashboard = () => import('../pages/Dashboard');
export const loadSchedule = () => import('../pages/Schedule');
export const loadExpenses = () => import('../pages/Expenses');
export const loadSettings = () => import('../pages/Settings');
export const loadAdminDashboard = () => import('../pages/admin/AdminDashboard');

export function prefetchRoute(path) {
  if (path === '/nhan-vien') return loadDashboard();
  if (path === '/nhan-vien/schedule') return loadSchedule();
  if (path === '/nhan-vien/expenses') return loadExpenses();
  if (path === '/nhan-vien/settings') return loadSettings();
  if (path === '/admin') return loadAdminDashboard();
  if (path === '/register') return loadRegister();
  return null;
}
