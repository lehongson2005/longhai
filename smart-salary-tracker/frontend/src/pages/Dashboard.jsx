import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Wallet,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Layers,
  Plus,
  Minus,
  Trash2,
  Copy,
  X,
} from 'lucide-react';
import { getDashboardData, getCachedDashboard } from '../services/dashboardService';
import { getSchedules } from '../services/scheduleService';
import { createAdjustment, deleteAdjustment } from '../services/adjustmentService';
import { useToast } from '../components/useToast';
import ConfirmDialog from '../components/ConfirmDialog';
import { buildPayslipSummary, copyTextToClipboard } from '../utils/payslipText';

const ALLOWANCE_PRESETS = ['Phụ cấp ca đêm', 'Xăng xe / Đi lại', 'Chuyên cần', 'Phụ cấp mục tiêu', 'Thưởng trực'];
const DEDUCTION_PRESETS = ['Ứng lương giữa tháng', 'BHXH / BHYT', 'Đồng phục / Thẻ', 'Khấu trừ khác'];
const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000];

function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

export default function Dashboard() {
  const outletContext = useOutletContext() || {};
  const user = outletContext.user;
  const toast = useToast();

  const [todayDate] = useState(() => new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [data, setData] = useState(() => getCachedDashboard(new Date()));
  const [loading, setLoading] = useState(() => !getCachedDashboard(new Date()));
  const [error, setError] = useState('');

  // Allowance / Deduction Modal
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjType, setAdjType] = useState('ALLOWANCE');
  const [adjTitle, setAdjTitle] = useState('');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjDate, setAdjDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [adjNote, setAdjNote] = useState('');
  const [savingAdj, setSavingAdj] = useState(false);

  // Delete Adjustment Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingAdj, setDeletingAdj] = useState(false);

  // Copy Payslip Modal
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [includeDetails, setIncludeDetails] = useState(false);
  const [monthSchedules, setMonthSchedules] = useState([]);
  const [loadingPayslip, setLoadingPayslip] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await getDashboardData(todayDate, currentMonthDate);
      setData(res);
      setError('');
    } catch {
      setError((prev) => (data ? prev : 'Không thể tải dữ liệu tổng quan.'));
    } finally {
      setLoading(false);
    }
  }, [currentMonthDate, todayDate, data]);

  useEffect(() => {
    let active = true;
    getDashboardData(todayDate, currentMonthDate)
      .then((res) => {
        if (active) {
          setData(res);
          setError('');
        }
      })
      .catch(() => {
        if (active && !getCachedDashboard(currentMonthDate)) {
          setError('Không thể tải dữ liệu tổng quan.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentMonthDate, todayDate]);

  const switchMonth = (offset) => {
    const next = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + offset, 1);
    const cached = getCachedDashboard(next);
    if (cached) setData(cached);
    setCurrentMonthDate(next);
  };

  const handlePrevMonth = () => switchMonth(-1);
  const handleNextMonth = () => switchMonth(1);

  const formatVND = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  const openAdjModal = (type) => {
    setAdjType(type);
    setAdjTitle(type === 'ALLOWANCE' ? ALLOWANCE_PRESETS[0] : DEDUCTION_PRESETS[0]);
    setAdjAmount('');
    setAdjNote('');
    const now = new Date();
    const sameMonth =
      now.getMonth() === currentMonthDate.getMonth() && now.getFullYear() === currentMonthDate.getFullYear();
    setAdjDate(
      format(
        sameMonth ? now : new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 15),
        'yyyy-MM-dd'
      )
    );
    setAdjModalOpen(true);
  };

  const handleSaveAdj = async (e) => {
    e.preventDefault();
    const numericAmount = Number(adjAmount);
    if (!adjTitle.trim()) {
      toast.warning('Vui lòng nhập tên khoản phụ cấp hoặc tạm ứng.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.warning('Số tiền phải lớn hơn 0.');
      return;
    }

    setSavingAdj(true);
    try {
      const res = await createAdjustment({
        type: adjType,
        title: adjTitle.trim(),
        amount: numericAmount,
        adjustment_date: adjDate,
        note: adjNote.trim(),
      });
      toast.success(res.message || 'Đã lưu khoản điều chỉnh lương!');
      setAdjModalOpen(false);
      await loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu khoản điều chỉnh.');
    } finally {
      setSavingAdj(false);
    }
  };

  const handleConfirmDeleteAdj = async () => {
    if (!deleteTarget) return;
    setDeletingAdj(true);
    try {
      await deleteAdjustment(deleteTarget.id);
      toast.success('Đã xóa khoản điều chỉnh lương!');
      setDeleteTarget(null);
      await loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa khoản điều chỉnh.');
    } finally {
      setDeletingAdj(false);
    }
  };

  const handleOpenPayslip = async () => {
    setPayslipOpen(true);
    setLoadingPayslip(true);
    try {
      const m = format(currentMonthDate, 'MM');
      const y = format(currentMonthDate, 'yyyy');
      const rows = await getSchedules(m, y);
      setMonthSchedules(rows);
    } catch {
      setMonthSchedules([]);
    } finally {
      setLoadingPayslip(false);
    }
  };

  const payslipText = data
    ? buildPayslipSummary({
        user,
        month: data.period?.month || currentMonthDate.getMonth() + 1,
        year: data.period?.year || currentMonthDate.getFullYear(),
        dashboardMonth: data.month,
        schedules: monthSchedules,
        includeDailyDetails: includeDetails,
      })
    : '';

  const handleCopyPayslip = async () => {
    if (!payslipText) return;
    const ok = await copyTextToClipboard(payslipText);
    if (ok) {
      toast.success('Đã sao chép bảng công! Dán vào Zalo để gửi ngay.', 'Đã sao chép');
    } else {
      toast.error('Trình duyệt không hỗ trợ tự sao chép, vui lòng bôi đen văn bản để chép.');
    }
  };

  const shiftIncome = data?.month?.shiftIncome ?? data?.month?.income ?? 0;
  const allowances = data?.month?.allowances ?? 0;
  const deductions = data?.month?.deductions ?? 0;
  const netSalary = data?.month?.netSalary ?? data?.month?.income ?? 0;
  const adjustments = data?.month?.adjustments || [];

  return (
    <div className="space-y-5">
      {/* Header + Month Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A192F]">Tổng quan lương & chi tiêu</h1>
          <p className="text-xs text-slate-500 mt-0.5">Theo dõi giờ trực, phụ cấp, tạm ứng và chi tiêu trong tháng</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-[#0A192F] min-w-[115px] text-center">
              Tháng {format(currentMonthDate, 'MM/yyyy')}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
              aria-label="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {data && (
            <button
              type="button"
              onClick={handleOpenPayslip}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-[#0A192F] shadow-xs cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#E30613]" />
              <span>Bảng công Zalo</span>
            </button>
          )}
        </div>
      </div>

      {loading && !data ? (
        <div className="space-y-4 animate-pulse">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-12 bg-slate-100 rounded-xl" />
          </div>
        </div>
      ) : error && !data ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* TODAY SECTION */}
          <section className="bg-white rounded-2xl shadow-xs p-5 border border-slate-200 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E30613]" />
                <h2 className="font-bold text-sm uppercase tracking-wide text-slate-700">
                  Hôm nay • {format(todayDate, 'dd/MM/yyyy')}
                </h2>
              </div>
              {data.today.schedule ? (
                <span className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">
                  Ca {data.today.schedule.code} ({data.today.schedule.total_hours}h)
                </span>
              ) : (
                <Link
                  to="/nhan-vien/schedule"
                  className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs px-3 py-1 rounded-full font-bold"
                >
                  <span>Chưa chấm ca • Bấm để chấm</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 text-center">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                <div className="text-[11px] font-semibold text-emerald-700 mb-1">Lương ca hôm nay</div>
                <div className="font-extrabold text-sm sm:text-base text-emerald-800">
                  {formatVND(data.today.income)}
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
                <div className="text-[11px] font-semibold text-rose-700 mb-1">Đã chi hôm nay</div>
                <div className="font-extrabold text-sm sm:text-base text-rose-700">
                  {formatVND(data.today.expense)}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-600 mb-1">Còn lại hôm nay</div>
                <div
                  className={`font-extrabold text-sm sm:text-base ${
                    data.today.balance < 0 ? 'text-rose-600' : 'text-[#0A192F]'
                  }`}
                >
                  {formatVND(data.today.balance)}
                </div>
              </div>
            </div>
          </section>

          {/* MONTH SUMMARY SECTION */}
          <section className="bg-white rounded-2xl shadow-xs p-5 border border-slate-200 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold text-base text-[#0A192F]">
                Tổng kết Tháng {String(data.period?.month).padStart(2, '0')}/{data.period?.year}
              </h2>
              <div className="inline-flex items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0A192F]" />
                  {data.month.workDays ?? 0} ngày làm
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#E30613]" />
                  {data.month.totalHours ?? 0} giờ
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <div className="text-sm font-medium text-slate-700">Lương theo ca trực</div>
                  <div className="text-[11px] text-slate-500">
                    {data.month.regularHours ?? 0}h chuẩn + {data.month.overtimeHours ?? 0}h tăng ca/lễ
                  </div>
                </div>
                <span className="font-extrabold text-base sm:text-lg text-emerald-700">
                  {formatVND(shiftIncome)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-100 gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">Phụ cấp / Thưởng</span>
                  <button
                    type="button"
                    onClick={() => openAdjModal('ALLOWANCE')}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm</span>
                  </button>
                </div>
                <span className="font-bold text-base text-emerald-700">+{formatVND(allowances)}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-100 gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">Tạm ứng / Khấu trừ</span>
                  <button
                    type="button"
                    onClick={() => openAdjModal('DEDUCTION')}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                    <span>Ghi ứng/trừ</span>
                  </button>
                </div>
                <span className="font-bold text-base text-amber-700">-{formatVND(deductions)}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-100 bg-slate-50 -mx-2 px-3 py-2.5 rounded-xl">
                <span className="text-sm font-bold text-[#0A192F]">Lương thực nhận dự kiến</span>
                <span className="font-extrabold text-lg sm:text-xl text-[#0A192F]">{formatVND(netSalary)}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-700">Tổng chi tiêu cá nhân</span>
                <span className="font-extrabold text-base sm:text-lg text-rose-600">
                  -{formatVND(data.month.expense)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-bold text-[#0A192F]">Còn lại sau chi tiêu</span>
                <span
                  className={`font-extrabold text-2xl ${
                    data.month.balance < 0 ? 'text-rose-600' : 'text-[#0A192F]'
                  }`}
                >
                  {formatVND(data.month.balance)}
                </span>
              </div>
            </div>

            {/* Adjustments list if present */}
            {adjustments.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase">Chi tiết Phụ cấp & Tạm ứng</div>
                <div className="space-y-2">
                  {adjustments.map((adj) => {
                    const isAllowance = adj.type === 'ALLOWANCE';
                    return (
                      <div
                        key={adj.id}
                        className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isAllowance
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {isAllowance ? 'Phụ cấp' : 'Ứng/Trừ'}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate">{adj.title}</span>
                            <span className="text-[11px] text-slate-400">• {formatDateVN(adj.adjustment_date)}</span>
                          </div>
                          {adj.note && <div className="text-[11px] text-slate-500 truncate mt-0.5">{adj.note}</div>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs sm:text-sm font-extrabold ${
                              isAllowance ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {isAllowance ? '+' : '-'}
                            {formatVND(adj.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(adj)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            aria-label="Xóa khoản điều chỉnh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shift Breakdown Chips */}
            {data.month.shiftBreakdown?.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase mb-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Thống kê các ca đã chấm</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.month.shiftBreakdown.map((sb) => (
                    <span
                      key={sb.code}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold"
                    >
                      Ca {sb.code}: <strong>{sb.count}</strong> ({sb.hours}h)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Expense Breakdown */}
            {data.month.expenseBreakdown?.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase">Chi tiêu theo danh mục</div>
                <div className="space-y-2">
                  {data.month.expenseBreakdown.map((item) => {
                    const pct = data.month.expense > 0 ? Math.round((item.total / data.month.expense) * 100) : 0;
                    return (
                      <div key={item.category_name} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <span>{item.category_name}</span>
                          <span>
                            {formatVND(item.total)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* QUICK ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Link
              to="/nhan-vien/schedule"
              className="flex items-center justify-center gap-2 bg-[#0A192F] hover:bg-[#13294B] text-white p-4 rounded-2xl font-bold text-sm shadow-sm transition"
            >
              <Calendar size={19} />
              <span>+ Chấm ca trực</span>
            </Link>
            <Link
              to="/nhan-vien/expenses"
              className="flex items-center justify-center gap-2 bg-[#E30613] hover:bg-[#B8040E] text-white p-4 rounded-2xl font-bold text-sm shadow-sm transition"
            >
              <Wallet size={19} />
              <span>+ Ghi chi tiêu</span>
            </Link>
          </div>
        </>
      )}

      {/* Allowance / Deduction Modal */}
      {adjModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
            <div className="bg-[#0A192F] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base">
                {adjType === 'ALLOWANCE' ? 'Thêm Phụ cấp / Thưởng (+)' : 'Ghi Tạm ứng / Khấu trừ (-)'}
              </h3>
              <button
                type="button"
                onClick={() => setAdjModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdj} className="p-5 space-y-4 overflow-y-auto text-sm">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdjType('ALLOWANCE');
                    setAdjTitle(ALLOWANCE_PRESETS[0]);
                  }}
                  className={`py-2 rounded-xl font-bold text-xs border cursor-pointer ${
                    adjType === 'ALLOWANCE'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  + Phụ cấp / Thưởng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjType('DEDUCTION');
                    setAdjTitle(DEDUCTION_PRESETS[0]);
                  }}
                  className={`py-2 rounded-xl font-bold text-xs border cursor-pointer ${
                    adjType === 'DEDUCTION'
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  - Tạm ứng / Khấu trừ
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Chọn nhanh hoặc nhập tên khoản *</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(adjType === 'ALLOWANCE' ? ALLOWANCE_PRESETS : DEDUCTION_PRESETS).map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setAdjTitle(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                        adjTitle === preset
                          ? 'bg-[#0A192F] border-[#0A192F] text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={adjTitle}
                  onChange={(e) => setAdjTitle(e.target.value)}
                  placeholder="VD: Phụ cấp mục tiêu / Ứng lương"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Số tiền (VNĐ) *</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1000}
                  step="any"
                  required
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  placeholder="VD: 500000"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base font-bold text-[#0A192F]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_AMOUNTS.map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAdjAmount(String(val))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      {val >= 1000000 ? `${val / 1000000}tr` : `${val / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày áp dụng *</label>
                  <input
                    type="date"
                    required
                    value={adjDate}
                    onChange={(e) => setAdjDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ghi chú</label>
                  <input
                    type="text"
                    value={adjNote}
                    onChange={(e) => setAdjNote(e.target.value)}
                    placeholder="Tùy chọn"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setAdjModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingAdj}
                  className="flex-1 bg-[#E30613] hover:bg-[#B8040E] text-white font-bold py-2.5 rounded-xl cursor-pointer disabled:opacity-60"
                >
                  {savingAdj ? 'Đang lưu...' : 'Lưu khoản này'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Payslip Modal */}
      {payslipOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
            <div className="bg-[#0A192F] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base">Bảng công & lương gửi Zalo</h3>
              <button
                type="button"
                onClick={() => setPayslipOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#0A192F] cursor-pointer"
                />
                <span>Kèm danh sách từng ngày đã chấm ({monthSchedules.length} ngày)</span>
              </label>

              {loadingPayslip ? (
                <div className="p-6 text-center text-sm text-slate-500">Đang tổng hợp bảng công...</div>
              ) : (
                <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {payslipText}
                </pre>
              )}

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayslipOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleCopyPayslip}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#E30613] hover:bg-[#B8040E] text-white font-bold py-2.5 px-4 rounded-xl text-sm cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Sao chép để gửi Zalo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa khoản điều chỉnh lương?"
        description={
          deleteTarget
            ? `Xóa "${deleteTarget.title}" trị giá ${formatVND(deleteTarget.amount)}?`
            : ''
        }
        confirmLabel="Xóa khoản này"
        loading={deletingAdj}
        onConfirm={handleConfirmDeleteAdj}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
