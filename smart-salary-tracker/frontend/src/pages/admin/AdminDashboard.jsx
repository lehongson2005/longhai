import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  FileText,
  Plus,
  Edit3,
  Trash2,
  LogOut,
  ExternalLink,
  UserCheck,
  X,
  Check,
} from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { logout } from '../../services/authService';
import {
  getAdminStats,
  getAdminJobs,
  createAdminJob,
  updateAdminJob,
  deleteAdminJob,
  getAdminApplications,
  updateApplicationStatus,
  getAdminQuotes,
  updateQuoteStatus,
} from '../../services/adminService';
import { JOB_LOCATIONS, SITE_TYPES } from '../../data/companyData';

const APP_STATUS_LABELS = {
  new: { label: 'Mới tiếp nhận', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Đã liên hệ', color: 'bg-amber-100 text-amber-800' },
  interviewed: { label: 'Đã phỏng vấn', color: 'bg-purple-100 text-purple-800' },
  hired: { label: 'Trúng tuyển', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Chưa phù hợp', color: 'bg-slate-200 text-slate-700' },
};

const QUOTE_STATUS_LABELS = {
  new: { label: 'Yêu cầu mới', color: 'bg-blue-100 text-blue-800' },
  consulting: { label: 'Đang khảo sát', color: 'bg-amber-100 text-amber-800' },
  quoted: { label: 'Đã gửi báo giá', color: 'bg-emerald-100 text-emerald-800' },
  closed: { label: 'Đã đóng', color: 'bg-slate-200 text-slate-700' },
};

const EMPTY_JOB_FORM = {
  title: '',
  department: 'Bảo vệ mục tiêu',
  location: JOB_LOCATIONS[0],
  site_type: SITE_TYPES[0],
  shift_type: 'Ca 12h',
  salary_min: 8000000,
  salary_max: 12000000,
  salary_display: '8.0 - 12 triệu/tháng',
  quantity: 10,
  description: '',
  requirements: 'Nam/Nữ 18–50 tuổi, có CCCD gắn chip, lý lịch rõ ràng. Không yêu cầu kinh nghiệm.',
  benefits: 'Đầy đủ BHXH/BHYT/BHTN, BHTN 24/7, lương tháng 13, hỗ trợ nhà đội miễn phí.',
  is_hot: false,
  status: 'open',
};

export default function AdminDashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications');
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [appFilter, setAppFilter] = useState('all');
  const [quoteFilter, setQuoteFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Job Modal
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [jobForm, setJobForm] = useState(EMPTY_JOB_FORM);
  const [savingJob, setSavingJob] = useState(false);

  // Draft notes map
  const [appNotes, setAppNotes] = useState({});
  const [quoteNotes, setQuoteNotes] = useState({});

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes, appsRes, quotesRes] = await Promise.all([
        getAdminStats(),
        getAdminJobs(),
        getAdminApplications(appFilter),
        getAdminQuotes(quoteFilter),
      ]);
      setStats(statsRes);
      setJobs(jobsRes);
      setApplications(appsRes);
      setQuotes(quotesRes);

      const nextAppNotes = {};
      appsRes.forEach((a) => {
        nextAppNotes[a.id] = a.admin_note || '';
      });
      setAppNotes(nextAppNotes);

      const nextQuoteNotes = {};
      quotesRes.forEach((q) => {
        nextQuoteNotes[q.id] = q.admin_note || '';
      });
      setQuoteNotes(nextQuoteNotes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [appFilter, quoteFilter]);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/');
  };

  const handleApplicationChange = async (id, nextStatus, note) => {
    await updateApplicationStatus(id, { status: nextStatus, admin_note: note });
    showToast('Đã cập nhật trạng thái hồ sơ ứng viên');
    loadAll();
  };

  const handleQuoteChange = async (id, nextStatus, note) => {
    await updateQuoteStatus(id, { status: nextStatus, admin_note: note });
    showToast('Đã cập nhật trạng thái yêu cầu báo giá');
    loadAll();
  };

  const openCreateJob = () => {
    setEditingJobId(null);
    setJobForm(EMPTY_JOB_FORM);
    setJobModalOpen(true);
  };

  const openEditJob = (job) => {
    setEditingJobId(job.id);
    setJobForm({
      title: job.title,
      department: job.department,
      location: job.location,
      site_type: job.site_type,
      shift_type: job.shift_type,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_display: job.salary_display,
      quantity: job.quantity,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      is_hot: job.is_hot === 1,
      status: job.status,
    });
    setJobModalOpen(true);
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    setSavingJob(true);
    try {
      const payload = {
        ...jobForm,
        salary_min: Number(jobForm.salary_min),
        salary_max: Number(jobForm.salary_max),
        quantity: Number(jobForm.quantity),
        is_hot: jobForm.is_hot ? 1 : 0,
      };
      if (editingJobId) {
        await updateAdminJob(editingJobId, payload);
        showToast('Đã cập nhật tin tuyển dụng');
      } else {
        await createAdminJob(payload);
        showToast('Đã đăng tin tuyển dụng mới');
      }
      setJobModalOpen(false);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi lưu tin tuyển dụng');
    } finally {
      setSavingJob(false);
    }
  };

  const handleToggleJobStatus = async (job) => {
    const nextStatus = job.status === 'open' ? 'closed' : 'open';
    await updateAdminJob(job.id, { status: nextStatus });
    showToast(nextStatus === 'open' ? 'Đã mở lại tin tuyển dụng' : 'Đã đóng tin tuyển dụng');
    loadAll();
  };

  const handleDeleteJob = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa tin tuyển dụng này? (Hồ sơ ứng viên đã nộp vẫn được giữ lại)')) {
      await deleteAdminJob(id);
      showToast('Đã xóa tin tuyển dụng');
      loadAll();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-[#0A192F] text-white border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <BrandLogo dark compact />
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-white/10 text-xs font-semibold text-slate-200">
              Cổng Quản trị HR & Kinh doanh
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-sm">
            <span className="hidden md:inline text-slate-300 mr-2">Xin chào, {user?.name}</span>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem Website</span>
            </Link>
            <Link
              to="/nhan-vien"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Cổng Nhân viên</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E30613] hover:bg-[#B8040E] text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {toast && (
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-md flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{toast}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Tin đang tuyển</div>
            <div className="text-3xl font-extrabold text-[#0A192F] mt-1">
              {stats?.openJobs ?? '-'} <span className="text-sm font-normal text-slate-400">/ {stats?.totalJobs ?? '-'}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Ứng viên mới</div>
            <div className="text-3xl font-extrabold text-[#E30613] mt-1">
              {stats?.newApplications ?? '-'}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Tổng hồ sơ ứng tuyển</div>
            <div className="text-3xl font-extrabold text-[#0A192F] mt-1">
              {stats?.totalApplications ?? '-'}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Yêu cầu báo giá mới</div>
            <div className="text-3xl font-extrabold text-amber-600 mt-1">
              {stats?.newQuotes ?? '-'} <span className="text-sm font-normal text-slate-400">/ {stats?.totalQuotes ?? '-'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-[#0A192F] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Hồ sơ ứng viên ({applications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quotes')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === 'quotes'
                ? 'bg-[#0A192F] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Yêu cầu báo giá ({quotes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === 'jobs'
                ? 'bg-[#0A192F] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Quản lý tin tuyển dụng ({jobs.length})</span>
          </button>
        </div>

        {/* TAB 1: APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#0A192F]">Danh sách Ứng viên Ứng tuyển nhanh</h2>
              <select
                value={appFilter}
                onChange={(e) => setAppFilter(e.target.value)}
                className="px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white"
              >
                <option value="all">Tất cả trạng thái</option>
                {Object.entries(APP_STATUS_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="py-10 text-center text-slate-500">Đang tải dữ liệu...</div>
            ) : applications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                Chưa có hồ sơ ứng tuyển nào ở trạng thái này.
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => {
                  const badge = APP_STATUS_LABELS[app.status] || APP_STATUS_LABELS.new;
                  return (
                    <div
                      key={app.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-base text-[#0A192F]">#{app.id} • {app.full_name}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            {app.has_cccd ? 'Đã có CCCD' : 'Chưa có CCCD'}
                            {app.birth_year ? ` • Sinh năm ${app.birth_year}` : ''}
                          </span>
                        </div>
                        <div className="text-sm text-slate-700">
                          SĐT: <a href={`tel:${app.phone}`} className="font-bold text-[#E30613]">{app.phone}</a> • Khu vực: <strong>{app.preferred_location}</strong>
                          {app.preferred_shift ? ` • Ca: ${app.preferred_shift}` : ''}
                        </div>
                        <div className="text-xs text-slate-500">
                          Vị trí ứng tuyển: {app.job_title || 'Ứng tuyển tự do / HR sắp xếp mục tiêu phù hợp'}
                        </div>
                        {app.experience_note && (
                          <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                            Ghi chú ứng viên: {app.experience_note}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:w-[420px] shrink-0">
                        <input
                          type="text"
                          placeholder="Ghi chú HR..."
                          value={appNotes[app.id] ?? ''}
                          onChange={(e) => setAppNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm"
                        />
                        <select
                          value={app.status}
                          onChange={(e) => handleApplicationChange(app.id, e.target.value, appNotes[app.id])}
                          className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-medium"
                        >
                          {Object.entries(APP_STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleApplicationChange(app.id, app.status, appNotes[app.id])}
                          className="px-3.5 py-2 rounded-xl bg-[#0A192F] text-white text-xs font-semibold hover:bg-[#13294B] cursor-pointer"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUOTES */}
        {activeTab === 'quotes' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#0A192F]">Yêu cầu Khảo sát & Báo giá Doanh nghiệp</h2>
              <select
                value={quoteFilter}
                onChange={(e) => setQuoteFilter(e.target.value)}
                className="px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white"
              >
                <option value="all">Tất cả trạng thái</option>
                {Object.entries(QUOTE_STATUS_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            {quotes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                Chưa có yêu cầu báo giá nào ở trạng thái này.
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map((q) => {
                  const badge = QUOTE_STATUS_LABELS[q.status] || QUOTE_STATUS_LABELS.new;
                  return (
                    <div
                      key={q.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-base text-[#0A192F]">#{q.id} • {q.company_name}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-sm text-slate-700">
                          Liên hệ: <strong>{q.contact_name}</strong> • SĐT:{' '}
                          <a href={`tel:${q.phone}`} className="font-bold text-[#E30613]">{q.phone}</a>
                          {q.email ? ` • ${q.email}` : ''}
                        </div>
                        <div className="text-xs text-slate-600">
                          Khu vực: <strong>{q.location}</strong> • Dịch vụ: <strong>{q.service_type}</strong>
                          {q.guard_count ? ` • Dự kiến ${q.guard_count} nhân sự` : ''}
                        </div>
                        {q.notes && (
                          <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                            Nhu cầu: {q.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:w-[420px] shrink-0">
                        <input
                          type="text"
                          placeholder="Ghi chú kinh doanh..."
                          value={quoteNotes[q.id] ?? ''}
                          onChange={(e) => setQuoteNotes((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm"
                        />
                        <select
                          value={q.status}
                          onChange={(e) => handleQuoteChange(q.id, e.target.value, quoteNotes[q.id])}
                          className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-medium"
                        >
                          {Object.entries(QUOTE_STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleQuoteChange(q.id, q.status, quoteNotes[q.id])}
                          className="px-3.5 py-2 rounded-xl bg-[#0A192F] text-white text-xs font-semibold hover:bg-[#13294B] cursor-pointer"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: JOBS */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#0A192F]">Danh sách Tin tuyển dụng</h2>
              <button
                type="button"
                onClick={openCreateJob}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E30613] hover:bg-[#B8040E] text-white text-sm font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Đăng tin tuyển dụng mới</span>
              </button>
            </div>

            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          job.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {job.status === 'open' ? 'Đang tuyển' : 'Đã đóng'}
                      </span>
                      {job.is_hot === 1 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-[#E30613]">
                          Hot
                        </span>
                      )}
                      <span className="text-xs text-slate-500">{job.location} • {job.site_type}</span>
                    </div>
                    <h3 className="font-bold text-base text-[#0A192F]">{job.title}</h3>
                    <div className="text-sm text-slate-600">
                      Mức lương: <strong className="text-emerald-700">{job.salary_display}</strong> • {job.shift_type} • Cần {job.quantity} người
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleJobStatus(job)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      {job.status === 'open' ? 'Đóng tin' : 'Mở lại'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditJob(job)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteJob(job.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Job Modal */}
      {jobModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="bg-[#0A192F] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingJobId ? 'Cập nhật Tin tuyển dụng' : 'Đăng Tin tuyển dụng mới'}
              </h3>
              <button
                type="button"
                onClick={() => setJobModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveJob} className="p-6 overflow-y-auto space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiêu đề vị trí *</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="VD: Nhân viên Bảo vệ Khu Công Nghệ Cao Quận 9"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khu vực</label>
                  <select
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    {JOB_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại mục tiêu</label>
                  <select
                    value={jobForm.site_type}
                    onChange={(e) => setJobForm({ ...jobForm, site_type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    {SITE_TYPES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bộ phận</label>
                  <select
                    value={jobForm.department}
                    onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Bảo vệ mục tiêu">Bảo vệ mục tiêu</option>
                    <option value="Chỉ huy / Giám sát">Chỉ huy / Giám sát</option>
                    <option value="Khối văn phòng">Khối văn phòng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại ca</label>
                  <input
                    type="text"
                    value={jobForm.shift_type}
                    onChange={(e) => setJobForm({ ...jobForm, shift_type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hiển thị lương</label>
                  <input
                    type="text"
                    required
                    value={jobForm.salary_display}
                    onChange={(e) => setJobForm({ ...jobForm, salary_display: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số lượng cần tuyển</label>
                  <input
                    type="number"
                    min={1}
                    value={jobForm.quantity}
                    onChange={(e) => setJobForm({ ...jobForm, quantity: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả công việc *</label>
                <textarea
                  rows={2}
                  required
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Yêu cầu ứng viên</label>
                <textarea
                  rows={2}
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={jobForm.is_hot}
                  onChange={(e) => setJobForm({ ...jobForm, is_hot: e.target.checked })}
                  className="w-4 h-4 accent-[#E30613]"
                />
                <span className="font-medium text-slate-700">Đánh dấu tin Tuyển gấp (Hot)</span>
              </label>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setJobModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingJob}
                  className="flex-1 bg-[#E30613] hover:bg-[#B8040E] text-white font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  {savingJob ? 'Đang lưu...' : editingJobId ? 'Cập nhật tin' : 'Đăng tin ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
