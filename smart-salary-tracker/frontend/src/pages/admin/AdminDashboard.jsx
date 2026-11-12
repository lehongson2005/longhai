import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Trash2,
  LogOut,
  Search,
  Calculator,
  X,
  Database,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { logout } from '../../services/authService';
import {
  getAdminStats,
  getAdminUsers,
  createAdminUser,
  resetUserPassword,
  deleteAdminUser,
  exportAdminBackup,
  importAdminBackup,
} from '../../services/adminService';
import { clearAllCache } from '../../utils/fastCache';
import { useToast } from '../../components/useToast';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AdminDashboard({ user, setUser }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Create Employee Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    identifier: '',
    employee_code: '',
    password: '123456',
    role: 'employee',
  });
  const [creating, setCreating] = useState(false);

  // Confirm Dialog State
  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Backup & Restore State
  const fileInputRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [restorePreview, setRestorePreview] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const loadData = useCallback(
    async (q = search) => {
      try {
        const [statsRes, usersRes] = await Promise.all([getAdminStats(), getAdminUsers(q)]);
        setStats(statsRes);
        setUsers(usersRes);
      } catch {
        toast.error('Không thể tải danh sách tài khoản.');
      } finally {
        setLoading(false);
      }
    },
    [search, toast]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData(search);
    }, 180);
    return () => clearTimeout(timer);
  }, [loadData, search]);

  const handleLogout = () => {
    logout();
    setUser(null);
    toast.info('Đã đăng xuất tài khoản Quản trị.');
    navigate('/login');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await createAdminUser(form);
      toast.success(res.message || 'Đã tạo tài khoản mới!', 'Thành công');
      setCreateOpen(false);
      setForm({ name: '', identifier: '', employee_code: '', password: '123456', role: 'employee' });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo tài khoản.');
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const res = await resetUserPassword(resetTarget.id, '123456');
      toast.success(res.message, 'Đã đặt lại mật khẩu = 123456');
      setResetTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi đặt lại mật khẩu.');
    } finally {
      setResetting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteAdminUser(deleteTarget.id);
      toast.success(res.message || 'Đã xóa tài khoản.');
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa tài khoản.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportBackup = async () => {
    setExporting(true);
    try {
      const backup = await exportAdminBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const todayStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `longhai-backup-${todayStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(
        `Đã tải file sao lưu gồm ${backup?.data?.users?.length || 0} tài khoản và ${
          backup?.data?.work_schedules?.length || 0
        } ca trực.`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải bản sao lưu.');
    } finally {
      setExporting(false);
    }
  };

  const handleSelectBackupFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed?.data || parsed;
      if (!data || !Array.isArray(data.users) || data.users.length === 0) {
        toast.error('File sao lưu không hợp lệ hoặc không có tài khoản nào.');
        return;
      }
      setRestorePreview({
        fileName: file.name,
        payload: parsed,
        summary: {
          users: data.users.length,
          schedules: Array.isArray(data.work_schedules) ? data.work_schedules.length : 0,
          expenses: Array.isArray(data.expenses) ? data.expenses.length : 0,
        },
      });
    } catch {
      toast.error('Không đọc được file JSON. Vui lòng chọn đúng file sao lưu .json.');
    }
  };

  const handleConfirmRestore = async () => {
    if (!restorePreview) return;
    setRestoring(true);
    try {
      const res = await importAdminBackup(restorePreview.payload);
      clearAllCache();
      toast.success(res.message || 'Khôi phục dữ liệu thành công!', 'Đã khôi phục');
      setRestorePreview(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi khôi phục dữ liệu sao lưu.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-[#0A192F] text-white border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <BrandLogo dark compact />
            </Link>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-bold text-slate-200">
              Quản trị Tài khoản
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="hidden md:inline text-slate-300 mr-1">Xin chào, {user?.name}</span>
            <Link
              to="/nhan-vien"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 font-semibold"
            >
              <Calculator className="w-4 h-4" />
              <span>Tính lương cá nhân</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E30613] hover:bg-[#B8040E] font-bold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase">Tổng tài khoản</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0A192F] mt-1">
              {stats?.totalUsers ?? '-'}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase">Nhân viên bảo vệ</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-1">
              {stats?.totalEmployees ?? '-'}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase">Quản trị Admin</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#E30613] mt-1">
              {stats?.totalAdmins ?? '-'}
            </div>
          </div>
        </div>

        {/* Tip Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-amber-950">
          <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Hỗ trợ nhân viên quên mật khẩu:</strong> Tìm tên / SĐT nhân viên ở danh sách dưới và bấm{' '}
            <span className="font-bold text-[#0A192F]">Đặt lại MK = 123456</span>. Nhân viên sẽ đăng nhập lại ngay bằng{' '}
            <code className="px-1.5 py-0.5 rounded bg-amber-100 font-bold">123456</code>.
          </div>
        </div>

        {/* Database Persistence Status Banner */}
        {stats?.storage && (
          <div
            className={`rounded-2xl p-4 border text-xs sm:text-sm space-y-3 ${
              stats.storage.persistent
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-sky-50 border-sky-200 text-sky-950'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Database
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    stats.storage.persistent ? 'text-emerald-600' : 'text-sky-600'
                  }`}
                />
                <div>
                  {stats.storage.persistent ? (
                    <>
                      <strong>Lưu trữ bền vững ({stats.storage.driver.toUpperCase()}):</strong> Tài khoản, ca trực và
                      chi tiêu được lưu trên cloud, không bị mất khi cập nhật hoặc khởi động lại.
                    </>
                  ) : (
                    <>
                      <strong>Chế độ lưu trữ SQLite (dùng để test):</strong> Nếu chạy trên Render gói Free, dữ liệu
                      mới tạo sẽ tự reset khi deploy lại hoặc server ngủ. Hãy gắn biến{' '}
                      <code className="px-1.5 py-0.5 rounded bg-sky-100 font-bold">DATABASE_URL</code> để lưu vĩnh viễn
                      0đ hoặc tải file sao lưu bên cạnh.
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={exporting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exporting ? 'Đang xuất...' : 'Tải sao lưu (.json)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Khôi phục file</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleSelectBackupFile}
                  className="hidden"
                />

                {!stats.storage.persistent && (
                  <button
                    type="button"
                    onClick={() => setShowGuide((v) => !v)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0A192F] text-white text-xs font-bold cursor-pointer"
                  >
                    <span>Hướng dẫn lưu vĩnh viễn</span>
                    {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {!stats.storage.persistent && showGuide && (
              <div className="bg-white/85 rounded-xl border border-sky-200 p-3.5 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <div className="font-bold text-[#0A192F]">
                  3 bước bật lưu vĩnh viễn 0đ (Neon PostgreSQL + Render đang chạy):
                </div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Vào <strong>neon.tech</strong> → Đăng nhập bằng GitHub/Google → bấm <strong>New Project</strong>{' '}
                    (chọn vùng <strong>Singapore</strong>, gói Free miễn phí vĩnh viễn 1 GB).
                  </li>
                  <li>
                    Trong màn hình Connect của Neon, copy dòng <strong>Connection string</strong> (dạng{' '}
                    <code className="px-1 py-0.5 bg-slate-100 rounded">postgresql://...</code>).
                  </li>
                  <li>
                    Vào <strong>Render Dashboard</strong> → chọn web service → mục <strong>Environment</strong> →{' '}
                    <strong>Add Environment Variable</strong>: Key là{' '}
                    <code className="px-1 py-0.5 bg-slate-100 rounded font-bold">DATABASE_URL</code>, Value là chuỗi vừa
                    copy → <strong>Save Changes</strong>. Nếu trước đó đã có dữ liệu test, bấm{' '}
                    <strong>Khôi phục file</strong> để nạp lại chỉ trong 1 giây.
                  </li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Search & Create Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, tài khoản/SĐT, mã nhân viên..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
            />
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E30613] hover:bg-[#B8040E] text-white text-sm font-bold cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tạo tài khoản nhân viên</span>
          </button>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
            Đang tải danh sách nhân viên...
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
            Không tìm thấy tài khoản nào phù hợp.
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => {
              const loginDisplay = u.username || u.email || u.employee_code || '-';
              const isSelf = Number(u.id) === Number(user?.id);
              return (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-base text-[#0A192F]">{u.name}</span>
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-[#E30613]">
                          <ShieldCheck className="w-3.5 h-3.5" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          <Users className="w-3.5 h-3.5" /> Nhân viên
                        </span>
                      )}
                      {isSelf && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          Đang đăng nhập
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        Tài khoản đăng nhập: <strong className="text-slate-900">{loginDisplay}</strong>
                      </span>
                      {u.employee_code && (
                        <span>
                          Mã NV: <strong className="text-slate-900">{u.employee_code}</strong>
                        </span>
                      )}
                      {u.email && u.username && (
                        <span className="text-xs text-slate-500">Email: {u.email}</span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      Đã chấm {u.schedule_count || 0} ca • Đã ghi {u.expense_count || 0} khoản chi
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setResetTarget(u)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                      <span>Đặt lại MK = 123456</span>
                    </button>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(u)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Employee Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
            <div className="bg-[#0A192F] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base">Tạo tài khoản nhân viên mới</h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 overflow-y-auto text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Trần Văn Bình"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên đăng nhập / SĐT *</label>
                <input
                  type="text"
                  required
                  value={form.identifier}
                  onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  placeholder="VD: 0912345678 hoặc binh01"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã NV (tùy chọn)</label>
                  <input
                    type="text"
                    value={form.employee_code}
                    onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                    placeholder="VD: NV015"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vai trò</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="employee">Nhân viên</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu mặc định</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-[#E30613] hover:bg-[#B8040E] text-white font-bold py-2.5 rounded-xl cursor-pointer disabled:opacity-60"
                >
                  {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Reset Password to 123456 */}
      <ConfirmDialog
        open={Boolean(resetTarget)}
        variant="primary"
        title="Đặt lại mật khẩu về 123456?"
        description={
          resetTarget
            ? `Mật khẩu của nhân viên "${resetTarget.name}" (${
                resetTarget.username || resetTarget.email
              }) sẽ được đặt lại thành 123456 ngay lập tức.`
            : ''
        }
        confirmLabel="Đặt lại thành 123456"
        loading={resetting}
        onConfirm={handleConfirmReset}
        onCancel={() => setResetTarget(null)}
      />

      {/* Confirm Delete User */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        variant="danger"
        title="Xóa tài khoản nhân viên?"
        description={
          deleteTarget
            ? `Tài khoản "${deleteTarget.name}" cùng lịch trực và chi tiêu liên quan sẽ bị xóa vĩnh viễn.`
            : ''
        }
        confirmLabel="Xóa tài khoản"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Confirm Restore Backup */}
      <ConfirmDialog
        open={Boolean(restorePreview)}
        variant="primary"
        title="Khôi phục dữ liệu từ file sao lưu?"
        description={
          restorePreview
            ? `File "${restorePreview.fileName}" có ${restorePreview.summary.users} tài khoản, ${restorePreview.summary.schedules} ca trực và ${restorePreview.summary.expenses} khoản chi tiêu. Hệ thống sẽ cập nhật và bổ sung dữ liệu an toàn mà không làm mất phiên Admin hiện tại.`
            : ''
        }
        confirmLabel="Khôi phục ngay"
        loading={restoring}
        onConfirm={handleConfirmRestore}
        onCancel={() => setRestorePreview(null)}
      />
    </div>
  );
}
