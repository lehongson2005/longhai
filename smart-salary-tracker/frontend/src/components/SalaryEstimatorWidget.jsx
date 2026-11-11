import { useEffect, useState } from 'react';
import { Calculator, Clock, CalendarDays, Coins, ArrowRight } from 'lucide-react';
import { estimateSalary } from '../services/publicService';

const formatVND = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

export default function SalaryEstimatorWidget({ onApplyWithShift }) {
  const [shiftHours, setShiftHours] = useState(12);
  const [normalDays, setNormalDays] = useState(22);
  const [sundayDays, setSundayDays] = useState(4);
  const [holidayDays, setHolidayDays] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(25529);
  const [mealAllowancePerDay, setMealAllowancePerDay] = useState(30000);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await estimateSalary({
          shiftHours,
          normalDays,
          sundayDays,
          holidayDays,
          hourlyRate,
          mealAllowancePerDay,
        });
        if (active) setResult(res);
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Không thể ước tính lương. Vui lòng kiểm tra số ngày.');
          setResult(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [shiftHours, normalDays, sundayDays, holidayDays, hourlyRate, mealAllowancePerDay]);

  const totalDays = Number(normalDays) + Number(sundayDays) + Number(holidayDays);

  const shiftLabel =
    shiftHours === 8 ? 'Ca 8h (A/B/C)' : shiftHours === 12 ? 'Ca 12h (A1/C1)' : 'Ca 16h (AB)';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-[#0A192F] text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E30613]/20 text-[#FF4D58]">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Công cụ Ước tính Thu nhập Bảo vệ</h3>
            <p className="text-xs text-slate-300">
              Tính minh bạch theo quy chuẩn ca trực (OT 150% • Chủ Nhật 200% • Lễ 200%/300%)
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-200 w-fit">
          Dữ liệu tham khảo
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              1. Chọn loại ca làm việc
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { hours: 8, name: 'Ca 8 giờ', code: 'Ca A / B / C' },
                { hours: 12, name: 'Ca 12 giờ', code: 'Ca A1 / C1' },
                { hours: 16, name: 'Ca 16 giờ', code: 'Ca tăng cường AB' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.hours}
                  onClick={() => setShiftHours(opt.hours)}
                  className={`p-3 rounded-xl border text-left transition ${
                    shiftHours === opt.hours
                      ? 'border-[#E30613] bg-red-50/70 ring-1 ring-[#E30613]'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-sm text-[#0A192F]">{opt.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{opt.code}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Số ngày thường
              </label>
              <input
                type="number"
                min={0}
                max={31}
                value={normalDays}
                onChange={(e) => setNormalDays(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              />
              <p className="text-[11px] text-slate-400 mt-1">8h chuẩn + OT 150%</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Số ngày Chủ Nhật
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={sundayDays}
                onChange={(e) => setSundayDays(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              />
              <p className="text-[11px] text-slate-400 mt-1">Nhân hệ số 200%</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Số ngày Lễ / Tết
              </label>
              <input
                type="number"
                min={0}
                max={15}
                value={holidayDays}
                onChange={(e) => setHolidayDays(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              />
              <p className="text-[11px] text-slate-400 mt-1">8h đầu 200%, sau 8h 300%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Đơn giá giờ chuẩn (VNĐ)
              </label>
              <input
                type="number"
                min={10000}
                step={500}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Math.max(1000, parseInt(e.target.value || '25529', 10)))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Phụ cấp cơm ca / ngày (VNĐ)
              </label>
              <input
                type="number"
                min={0}
                step={5000}
                value={mealAllowancePerDay}
                onChange={(e) => setMealAllowancePerDay(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              />
            </div>
          </div>

          {totalDays > 31 && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Tổng số ngày công trong tháng hiện đang là {totalDays} ngày (tối đa 31 ngày).
            </div>
          )}
        </div>

        {/* Summary Output */}
        <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Thu nhập dự kiến / tháng
            </div>
            {error ? (
              <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
            ) : (
              <>
                <div className="mt-2 text-3xl font-extrabold text-[#E30613]">
                  {loading && !result ? 'Đang tính...' : formatVND(result?.estimatedTotal)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-[#0A192F]" /> {result?.totalDays ?? totalDays} công
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#0A192F]" /> {result?.totalHours ?? totalDays * shiftHours} giờ trực
                  </span>
                </div>

                {result && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-2.5 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Ngày thường ({result.breakdown.normal.days} công)</span>
                      <span className="font-semibold text-slate-900">
                        {formatVND(result.breakdown.normal.totalSalary)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Chủ Nhật 200% ({result.breakdown.sunday.days} công)</span>
                      <span className="font-semibold text-slate-900">
                        {formatVND(result.breakdown.sunday.totalSalary)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Ngày Lễ ({result.breakdown.holiday.days} công)</span>
                      <span className="font-semibold text-slate-900">
                        {formatVND(result.breakdown.holiday.totalSalary)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-600" /> Phụ cấp cơm ca
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatVND(result.breakdown.mealAllowance.total)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200">
            <p className="text-[11px] text-slate-500 mb-3">
              * Chưa bao gồm phụ cấp tiếng Anh, thưởng thâm niên & thưởng lương tháng 13.
            </p>
            {onApplyWithShift && (
              <button
                type="button"
                onClick={() => onApplyWithShift(shiftLabel)}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#0A192F] hover:bg-[#13294B] text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                <span>Ứng tuyển với {shiftLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
