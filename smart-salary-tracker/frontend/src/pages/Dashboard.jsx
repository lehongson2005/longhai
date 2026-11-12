import { useEffect, useState } from 'react';
import { getDashboardData } from '../services/dashboardService';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Wallet, Calendar, Clock, ChevronLeft, ChevronRight, ArrowRight, Layers } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [todayDate] = useState(() => new Date());

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
        if (active) setError('Không thể tải dữ liệu tổng quan.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentMonthDate, todayDate]);

  const handlePrevMonth = () =>
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));

  const formatVND = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  return (
    <div className="space-y-5">
      {/* Header + Month Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A192F]">Tổng quan lương & chi tiêu</h1>
          <p className="text-xs text-slate-500 mt-0.5">Theo dõi giờ trực, thu nhập ước tính và chi tiêu trong tháng</p>
        </div>

        <div className="inline-flex items-center justify-between sm:justify-end gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
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
      </div>

      {loading && !data ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
          Đang tải dữ liệu...
        </div>
      ) : error ? (
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
                  <div className="text-sm font-medium text-slate-700">Thu nhập ước tính</div>
                  <div className="text-[11px] text-slate-500">
                    {data.month.regularHours ?? 0}h chuẩn + {data.month.overtimeHours ?? 0}h tăng ca/lễ
                  </div>
                </div>
                <span className="font-extrabold text-lg text-emerald-700">{formatVND(data.month.income)}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-700">Tổng chi tiêu</span>
                <span className="font-extrabold text-lg text-rose-600">-{formatVND(data.month.expense)}</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-bold text-[#0A192F]">Thực còn lại dự kiến</span>
                <span
                  className={`font-extrabold text-2xl ${
                    data.month.balance < 0 ? 'text-rose-600' : 'text-[#0A192F]'
                  }`}
                >
                  {formatVND(data.month.balance)}
                </span>
              </div>
            </div>

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
    </div>
  );
}
