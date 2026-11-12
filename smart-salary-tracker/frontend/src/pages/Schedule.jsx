import { useState, useEffect, useCallback } from 'react';
import { getSchedules, saveSchedule, deleteSchedule } from '../services/scheduleService';
import { getShifts } from '../services/shiftService';
import { getSettings } from '../services/settingsService';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Trash2, X, Clock, CalendarDays, Coins } from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '../components/useToast';

const DAY_TYPE_OPTIONS = [
  { value: 'NORMAL', label: 'Ngày thường', hint: '8h chuẩn • OT 150%' },
  { value: 'WEEKLY_OFF', label: 'Chủ Nhật', hint: 'Nhân 200%' },
  { value: 'HOLIDAY', label: 'Ngày Lễ', hint: '8h 200% • Sau 8h 300%' },
];

const WEEKDAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function estimatePay(hours, dayType, hourRate) {
  if (!hours || hours <= 0) return 0;
  if (dayType === 'WEEKLY_OFF') return Math.round(hours * hourRate * 2);
  if (dayType === 'HOLIDAY') {
    const first8 = Math.min(8, hours);
    const beyond8 = Math.max(0, hours - 8);
    return Math.round(first8 * hourRate * 2 + beyond8 * hourRate * 3);
  }
  const regular = Math.min(8, hours);
  const ot = Math.max(0, hours - 8);
  return Math.round(regular * hourRate + ot * hourRate * 1.5);
}

function getShiftBadgeStyle(totalHours, code) {
  if (code === 'Nghỉ' || totalHours === 0) return 'bg-slate-200 text-slate-700';
  if (totalHours === 4) return 'bg-amber-100 text-amber-900 border border-amber-300';
  if (totalHours === 8) return 'bg-blue-100 text-blue-900';
  if (totalHours === 12) return 'bg-indigo-100 text-indigo-900';
  return 'bg-purple-100 text-purple-900';
}

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [todayStr] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [schedules, setSchedules] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [hourRate, setHourRate] = useState(25529);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [dayType, setDayType] = useState('NORMAL');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      const m = format(currentDate, 'MM');
      const y = format(currentDate, 'yyyy');
      const [schRes, shiftRes, settingsRes] = await Promise.all([
        getSchedules(m, y),
        getShifts(),
        getSettings(),
      ]);
      setSchedules(schRes);
      setShifts(shiftRes);
      if (settingsRes?.standard_hour_rate) {
        setHourRate(Number(settingsRes.standard_hour_rate));
      }
    } catch {
      toast.error('Không thể tải dữ liệu lịch trực.');
    }
  }, [currentDate, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handlePrevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getScheduleForDate = (date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    return schedules.find((s) => s.work_date === dStr);
  };

  const openModal = (date) => {
    setSelectedDate(date);
    const sch = getScheduleForDate(date);
    if (sch) {
      setSelectedShiftId(sch.shift_id);
      setDayType(sch.day_type);
      setNotes(sch.notes || '');
    } else {
      const defaultShift = shifts.find((s) => s.code === 'A') || shifts[0];
      setSelectedShiftId(defaultShift?.id || '');
      setDayType(getDay(date) === 0 ? 'WEEKLY_OFF' : 'NORMAL');
      setNotes('');
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedShiftId) {
      toast.warning('Vui lòng chọn một ca trực.');
      return;
    }
    setSaving(true);
    try {
      const res = await saveSchedule({
        work_date: format(selectedDate, 'yyyy-MM-dd'),
        shift_id: selectedShiftId,
        day_type: dayType,
        notes,
      });
      toast.success(
        `${res.message || 'Đã lưu ca trực'} — Ngày ${format(selectedDate, 'dd/MM/yyyy')}`,
        'Lưu lịch trực'
      );
      setShowModal(false);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu ca trực.');
    } finally {
      setSaving(false);
    }
  };

  const existingSchedule = selectedDate ? getScheduleForDate(selectedDate) : null;

  const handleDeleteSchedule = async () => {
    if (!existingSchedule) return;
    setDeleting(true);
    try {
      await deleteSchedule(existingSchedule.id);
      toast.success(`Đã xóa ca ngày ${format(selectedDate, 'dd/MM/yyyy')}`, 'Đã xóa ca');
      setShowModal(false);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa ca trực.');
    } finally {
      setDeleting(false);
    }
  };

  const firstDay = getDay(startOfMonth(currentDate));
  const emptyDays = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 });

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  const monthStats = schedules.reduce(
    (acc, s) => {
      if ((s.shift_hours || 0) > 0) acc.days += 1;
      acc.hours += Number(s.shift_hours) || 0;
      acc.salary += Number(s.estimated_salary) || 0;
      return acc;
    },
    { days: 0, hours: 0, salary: 0 }
  );

  const activeShiftObj = shifts.find((s) => Number(s.id) === Number(selectedShiftId));
  const previewPay = estimatePay(activeShiftObj?.total_hours || 0, dayType, hourRate);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Month Header */}
      <div className="flex justify-between items-center bg-white p-3.5 sm:p-4 rounded-2xl shadow-xs border border-slate-200">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
          aria-label="Tháng trước"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="text-center">
          <h1 className="font-extrabold text-base sm:text-lg text-[#0A192F]">
            LỊCH TRỰC THÁNG {format(currentDate, 'MM/yyyy')}
          </h1>
          <p className="text-[11px] text-slate-500">Chạm vào từng ngày để chấm ca (có ca 4 tiếng B1, B2)</p>
        </div>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
          aria-label="Tháng sau"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* Month Summary Strip */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 text-center shadow-xs">
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <CalendarDays className="w-3.5 h-3.5 text-[#0A192F]" />
            <span>Ngày làm</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-[#0A192F] mt-0.5">{monthStats.days}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 text-center shadow-xs">
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Tổng giờ</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-[#0A192F] mt-0.5">{monthStats.hours}h</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 text-center shadow-xs">
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Coins className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ước tính lương</span>
          </div>
          <div className="text-sm sm:text-lg font-extrabold text-emerald-700 mt-0.5 truncate">
            {formatVND(monthStats.salary)}
          </div>
        </div>
      </div>

      {/* Shift Legend */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 px-1">
        <span className="font-semibold text-slate-700">Ký hiệu ca:</span>
        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold">
          B1 / B2 (4h)
        </span>
        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold">A / B / C (8h)</span>
        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-bold">A1 / C1 / H / R (12h)</span>
        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-bold">AB (16h)</span>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-xs p-3 sm:p-4 border border-slate-200">
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 mb-2">
          <div>T2</div>
          <div>T3</div>
          <div>T4</div>
          <div>T5</div>
          <div>T6</div>
          <div>T7</div>
          <div className="text-[#E30613]">CN</div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="h-20 sm:h-24 rounded-xl bg-slate-50/50" />
          ))}

          {days.map((day) => {
            const sch = getScheduleForDate(day);
            const isToday = format(day, 'yyyy-MM-dd') === todayStr;
            const isSunday = getDay(day) === 0;

            return (
              <button
                type="button"
                key={day.toISOString()}
                onClick={() => openModal(day)}
                className={clsx(
                  'border rounded-xl p-1 sm:p-1.5 h-20 sm:h-24 flex flex-col justify-between text-left cursor-pointer transition hover:border-[#0A192F]',
                  isToday
                    ? 'ring-2 ring-[#0A192F] border-[#0A192F] bg-blue-50/40'
                    : isSunday
                    ? 'bg-red-50/40 border-red-100'
                    : 'bg-white border-slate-200'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  {sch?.day_type === 'HOLIDAY' ? (
                    <span className="text-[9px] font-bold px-1 rounded bg-[#E30613] text-white">Lễ</span>
                  ) : sch?.day_type === 'WEEKLY_OFF' ? (
                    <span className="text-[9px] font-bold px-1 rounded bg-orange-100 text-orange-800">CN</span>
                  ) : (
                    <span />
                  )}
                  <span
                    className={clsx(
                      'text-xs font-bold',
                      isToday ? 'text-[#0A192F]' : isSunday ? 'text-[#E30613]' : 'text-slate-700'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {sch ? (
                  <div className="w-full space-y-0.5 text-center">
                    <div
                      className={clsx(
                        'text-[11px] sm:text-xs font-extrabold rounded-md py-0.5 px-1 truncate',
                        getShiftBadgeStyle(sch.shift_hours, sch.shift_code)
                      )}
                    >
                      {sch.shift_code} {sch.shift_hours > 0 ? `• ${sch.shift_hours}h` : ''}
                    </div>
                    {sch.estimated_salary > 0 && (
                      <div className="text-[9px] sm:text-[10px] font-semibold text-emerald-700 truncate">
                        {Math.round(sch.estimated_salary / 1000)}k
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-300 text-center pb-1">+</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Shift Picker Modal (z-[60] so mobile nav z-30 never covers it) */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 z-[60]">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden">
            <div className="bg-[#0A192F] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-base">
                  Chấm ca ngày {format(selectedDate, 'dd/MM/yyyy')}
                </h3>
                <p className="text-xs text-slate-300">{WEEKDAY_NAMES[getDay(selectedDate)]}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* 1. Shift Grid */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  1. Chọn ca trực
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {shifts.map((s) => {
                    const active = Number(selectedShiftId) === Number(s.id);
                    const isFourHour = s.total_hours === 4;
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setSelectedShiftId(s.id)}
                        className={clsx(
                          'p-2.5 rounded-xl border text-center transition cursor-pointer relative',
                          active
                            ? 'border-[#E30613] bg-red-50 ring-2 ring-[#E30613]/40'
                            : isFourHour
                            ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        )}
                      >
                        <div className="font-extrabold text-sm text-[#0A192F]">{s.code}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {s.total_hours > 0 ? `${s.total_hours} tiếng` : 'Nghỉ'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Day Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  2. Loại ngày tính công
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DAY_TYPE_OPTIONS.map((opt) => {
                    const active = dayType === opt.value;
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setDayType(opt.value)}
                        className={clsx(
                          'p-2.5 rounded-xl border text-center transition cursor-pointer',
                          active
                            ? 'border-[#0A192F] bg-[#0A192F] text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <div className="font-bold text-xs">{opt.label}</div>
                        <div className={clsx('text-[10px] mt-0.5', active ? 'text-slate-300' : 'text-slate-400')}>
                          {opt.hint}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  3. Ghi chú (tùy chọn)
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Trực cổng chính / tăng ca B1"
                />
              </div>

              {/* Live Pay Preview */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900">
                  Tiền công ước tính ({activeShiftObj?.code || '-'} • {activeShiftObj?.total_hours || 0}h):
                </span>
                <span className="text-base font-extrabold text-emerald-700">{formatVND(previewPay)}</span>
              </div>

              {/* Sticky Footer Actions */}
              <div className="pt-2 flex items-center gap-2.5 border-t border-slate-100">
                {existingSchedule && (
                  <button
                    type="button"
                    onClick={handleDeleteSchedule}
                    disabled={deleting || saving}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold cursor-pointer disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{deleting ? 'Đang xóa...' : 'Xóa ca'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#13294B] text-white text-sm font-bold cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Đang lưu...' : 'Lưu ca trực'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
