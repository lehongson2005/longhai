import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  getSchedules,
  getCachedSchedules,
  saveSchedule,
  bulkSaveSchedule,
  deleteSchedule,
} from '../services/scheduleService';
import { getShifts, getCachedShifts, createShift, deleteShift } from '../services/shiftService';
import { getSettings, getCachedSettings } from '../services/settingsService';
import { getDashboardData } from '../services/dashboardService';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, addDays } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Clock,
  CalendarDays,
  Coins,
  CalendarRange,
  Copy,
  Plus,
} from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '../components/useToast';
import { buildPayslipSummary, copyTextToClipboard } from '../utils/payslipText';

const DAY_TYPE_OPTIONS = [
  { value: 'NORMAL', label: 'Ngày thường', hint: '8h chuẩn • OT theo đơn giá' },
  { value: 'WEEKLY_OFF', label: 'Chủ Nhật', hint: 'Nhân 200%' },
  { value: 'HOLIDAY', label: 'Ngày Lễ', hint: '8h 200% • Sau 8h 300%' },
];

const WEEKDAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const WEEKDAY_PILLS = [
  { day: 1, label: 'T2' },
  { day: 2, label: 'T3' },
  { day: 3, label: 'T4' },
  { day: 4, label: 'T5' },
  { day: 5, label: 'T6' },
  { day: 6, label: 'T7' },
  { day: 0, label: 'CN' },
];

function estimatePay(hours, dayType, hourRate, otRate) {
  if (!hours || hours <= 0) return 0;
  if (dayType === 'WEEKLY_OFF') return Math.round(hours * hourRate * 2);
  if (dayType === 'HOLIDAY') {
    const first8 = Math.min(8, hours);
    const beyond8 = Math.max(0, hours - 8);
    return Math.round(first8 * hourRate * 2 + beyond8 * hourRate * 3);
  }
  const regular = Math.min(8, hours);
  const ot = Math.max(0, hours - 8);
  const effectiveOt = Number(otRate) > 0 ? Number(otRate) : hourRate * 1.5;
  return Math.round(regular * hourRate + ot * effectiveOt);
}

function getShiftBadgeStyle(totalHours, code) {
  if (code === 'Nghỉ' || totalHours === 0) return 'bg-slate-200 text-slate-700';
  if (totalHours === 4) return 'bg-amber-100 text-amber-900 border border-amber-300';
  if (totalHours === 8) return 'bg-blue-100 text-blue-900';
  if (totalHours === 12) return 'bg-indigo-100 text-indigo-900';
  return 'bg-purple-100 text-purple-900';
}

export default function Schedule() {
  const outletContext = useOutletContext() || {};
  const user = outletContext.user;

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [todayStr] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [schedules, setSchedules] = useState(
    () => getCachedSchedules(format(new Date(), 'MM'), format(new Date(), 'yyyy')) || []
  );
  const [shifts, setShifts] = useState(() => getCachedShifts() || []);
  const [hourRate, setHourRate] = useState(() => Number(getCachedSettings()?.standard_hour_rate || 25529));
  const [otRate, setOtRate] = useState(() => Number(getCachedSettings()?.overtime_rate || 38293));

  // Single day modal
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [dayType, setDayType] = useState('NORMAL');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Bulk schedule modal
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkStart, setBulkStart] = useState('');
  const [bulkEnd, setBulkEnd] = useState('');
  const [bulkWeekdays, setBulkWeekdays] = useState([1, 2, 3, 4, 5, 6]);
  const [bulkShiftId, setBulkShiftId] = useState('');
  const [bulkDayMode, setBulkDayMode] = useState('AUTO');
  const [bulkOnlyEmpty, setBulkOnlyEmpty] = useState(true);
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  // Copy payslip modal
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [dashboardSnapshot, setDashboardSnapshot] = useState(null);
  const [loadingPayslip, setLoadingPayslip] = useState(false);

  // Custom shifts modal
  const [customShiftOpen, setCustomShiftOpen] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customName, setCustomName] = useState('');
  const [customTotalHours, setCustomTotalHours] = useState('6');
  const [savingCustomShift, setSavingCustomShift] = useState(false);
  const [deletingShiftId, setDeletingShiftId] = useState(null);

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
      if (settingsRes?.overtime_rate) {
        setOtRate(Number(settingsRes.overtime_rate));
      }
    } catch {
      toast.error('Không thể tải dữ liệu lịch trực.');
    }
  }, [currentDate, toast]);

  useEffect(() => {
    let active = true;
    const m = format(currentDate, 'MM');
    const y = format(currentDate, 'yyyy');
    Promise.all([getSchedules(m, y), getShifts(), getSettings()])
      .then(([schRes, shiftRes, settingsRes]) => {
        if (!active) return;
        setSchedules(schRes);
        setShifts(shiftRes);
        if (settingsRes?.standard_hour_rate) {
          setHourRate(Number(settingsRes.standard_hour_rate));
        }
        if (settingsRes?.overtime_rate) {
          setOtRate(Number(settingsRes.overtime_rate));
        }
      })
      .catch(() => {
        if (active && !getCachedSchedules(m, y)) {
          toast.error('Không thể tải dữ liệu lịch trực.');
        }
      });
    return () => {
      active = false;
    };
  }, [currentDate, toast]);

  const switchMonth = (offset) => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    const cached = getCachedSchedules(format(next, 'MM'), format(next, 'yyyy'));
    if (cached) setSchedules(cached);
    setCurrentDate(next);
  };

  const handlePrevMonth = () => switchMonth(-1);
  const handleNextMonth = () => switchMonth(1);

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

  const openBulkModal = () => {
    const mStart = startOfMonth(currentDate);
    const mEnd = endOfMonth(currentDate);
    setBulkStart(format(mStart, 'yyyy-MM-dd'));
    setBulkEnd(format(mEnd, 'yyyy-MM-dd'));
    setBulkWeekdays([1, 2, 3, 4, 5, 6]);
    const defaultShift = shifts.find((s) => s.code === 'A') || shifts[0];
    setBulkShiftId(defaultShift?.id || '');
    setBulkDayMode('AUTO');
    setBulkOnlyEmpty(true);
    setBulkNotes('');
    setBulkOpen(true);
  };

  const applyBulkPresetRange = (preset) => {
    const mStart = startOfMonth(currentDate);
    const mEnd = endOfMonth(currentDate);
    if (preset === 'MONTH') {
      setBulkStart(format(mStart, 'yyyy-MM-dd'));
      setBulkEnd(format(mEnd, 'yyyy-MM-dd'));
    } else if (preset === 'HALF_1') {
      setBulkStart(format(mStart, 'yyyy-MM-dd'));
      setBulkEnd(format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 15), 'yyyy-MM-dd'));
    } else if (preset === 'HALF_2') {
      setBulkStart(format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 16), 'yyyy-MM-dd'));
      setBulkEnd(format(mEnd, 'yyyy-MM-dd'));
    } else if (preset === 'WEEK_7') {
      const base = new Date();
      setBulkStart(format(base, 'yyyy-MM-dd'));
      setBulkEnd(format(addDays(base, 6), 'yyyy-MM-dd'));
    }
  };

  const toggleBulkWeekday = (dayNum) => {
    setBulkWeekdays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const bulkTargetDates = useMemo(() => {
    if (!bulkStart || !bulkEnd || bulkWeekdays.length === 0) return [];
    const s = new Date(`${bulkStart}T00:00:00`);
    const e = new Date(`${bulkEnd}T00:00:00`);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return [];
    const diffDays = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 62) return [];
    const existingSet = new Set(schedules.map((sch) => sch.work_date));
    return eachDayOfInterval({ start: s, end: e })
      .filter((d) => bulkWeekdays.includes(getDay(d)))
      .map((d) => format(d, 'yyyy-MM-dd'))
      .filter((dStr) => (bulkOnlyEmpty ? !existingSet.has(dStr) : true));
  }, [bulkStart, bulkEnd, bulkWeekdays, bulkOnlyEmpty, schedules]);

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkShiftId) {
      toast.warning('Vui lòng chọn ca trực muốn áp dụng.');
      return;
    }
    if (bulkTargetDates.length === 0) {
      toast.warning('Không có ngày nào phù hợp để chấm trong khoảng đã chọn.');
      return;
    }

    setBulkSaving(true);
    try {
      const res = await bulkSaveSchedule({
        dates: bulkTargetDates,
        shift_id: bulkShiftId,
        day_type_mode: bulkDayMode,
        overwrite: !bulkOnlyEmpty,
        notes: bulkNotes,
      });
      toast.success(res.message || `Đã chấm ${bulkTargetDates.length} ngày!`, 'Chấm ca hàng loạt');
      setBulkOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi chấm ca nhiều ngày.');
    } finally {
      setBulkSaving(false);
    }
  };

  const handleOpenPayslip = async () => {
    setPayslipOpen(true);
    setLoadingPayslip(true);
    try {
      const snap = await getDashboardData(new Date(), currentDate);
      setDashboardSnapshot(snap);
    } catch {
      toast.error('Không thể tổng hợp dữ liệu tháng.');
    } finally {
      setLoadingPayslip(false);
    }
  };

  const payslipText = dashboardSnapshot
    ? buildPayslipSummary({
        user,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        dashboardMonth: dashboardSnapshot.month,
        schedules,
        includeDailyDetails: includeDetails,
      })
    : '';

  const handleCopyPayslip = async () => {
    if (!payslipText) return;
    const ok = await copyTextToClipboard(payslipText);
    if (ok) {
      toast.success('Đã sao chép bảng công! Dán vào Zalo để gửi ngay.', 'Đã sao chép');
    } else {
      toast.error('Không thể tự sao chép, vui lòng bôi đen nội dung để chép.');
    }
  };

  const openCustomShiftModal = () => {
    setCustomCode('');
    setCustomName('');
    setCustomTotalHours('6');
    setCustomShiftOpen(true);
  };

  const handleCreateCustomShift = async (e) => {
    e.preventDefault();
    const code = customCode.trim();
    const hours = Number(customTotalHours);
    if (!code) {
      toast.warning('Vui lòng nhập mã ca (VD: C2, Đ6).');
      return;
    }
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
      toast.warning('Số giờ phải từ 0 đến 24 giờ.');
      return;
    }
    const regHours = Math.min(8, hours);
    const otHours = Math.max(0, hours - 8);
    setSavingCustomShift(true);
    try {
      const res = await createShift({
        code,
        name: customName.trim() || `Ca ${code}`,
        total_hours: hours,
        regular_hours: regHours,
        overtime_hours: otHours,
      });
      toast.success(res.message || `Đã thêm ca "${code}" (${hours}h)`, 'Ca trực riêng');
      setCustomCode('');
      setCustomName('');
      await fetchData();
      if (res?.id && showModal) {
        setSelectedShiftId(res.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm ca trực riêng.');
    } finally {
      setSavingCustomShift(false);
    }
  };

  const handleDeleteCustomShift = async (shiftItem) => {
    setDeletingShiftId(shiftItem.id);
    try {
      const res = await deleteShift(shiftItem.id);
      toast.success(res.message || `Đã xóa ca "${shiftItem.code}"`);
      await fetchData();
      if (Number(selectedShiftId) === Number(shiftItem.id)) {
        const fallback = shifts.find((s) => s.id !== shiftItem.id && s.code === 'A') || shifts[0];
        if (fallback) setSelectedShiftId(fallback.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa ca riêng.');
    } finally {
      setDeletingShiftId(null);
    }
  };

  const customShifts = shifts.filter((s) => s.user_id != null);
  const parsedCustomHours = Math.max(0, Math.min(24, Number(customTotalHours) || 0));

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
  const previewPay = estimatePay(activeShiftObj?.total_hours || 0, dayType, hourRate, otRate);

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
          <p className="text-[11px] text-slate-500">Chạm từng ngày để chấm hoặc dùng Chấm nhiều ngày</p>
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
            <span>Tiền ca</span>
          </div>
          <div className="text-sm sm:text-lg font-extrabold text-emerald-700 mt-0.5 truncate">
            {formatVND(monthStats.salary)}
          </div>
        </div>
      </div>

      {/* Quick Tools: Bulk Schedule, Copy Payslip & Custom Shifts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={openBulkModal}
          className="inline-flex items-center justify-center gap-2 bg-[#0A192F] hover:bg-[#13294B] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
        >
          <CalendarRange className="w-4 h-4" />
          <span>Chấm nhiều ngày</span>
        </button>

        <button
          type="button"
          onClick={handleOpenPayslip}
          className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-[#0A192F] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
        >
          <Copy className="w-4 h-4 text-[#E30613]" />
          <span>Sao chép bảng công</span>
        </button>

        <button
          type="button"
          onClick={openCustomShiftModal}
          className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-[#0A192F] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>Ca riêng ({customShifts.length})</span>
        </button>
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

      {/* Single Day Shift Picker Modal */}
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    1. Chọn ca trực
                  </label>
                  <button
                    type="button"
                    onClick={openCustomShiftModal}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm ca riêng</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {shifts.map((s) => {
                    const active = Number(selectedShiftId) === Number(s.id);
                    const isFourHour = s.total_hours === 4;
                    const isCustom = s.user_id != null;
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setSelectedShiftId(s.id)}
                        className={clsx(
                          'p-2.5 rounded-xl border text-center transition cursor-pointer relative',
                          active
                            ? 'border-[#E30613] bg-red-50 ring-2 ring-[#E30613]/40'
                            : isCustom
                            ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                            : isFourHour
                            ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        )}
                      >
                        {isCustom && (
                          <span className="absolute top-1 right-1 text-[9px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">
                            Riêng
                          </span>
                        )}
                        <div className="font-extrabold text-sm text-[#0A192F] truncate">{s.code}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {s.total_hours > 0 ? `${s.total_hours} tiếng` : 'Nghỉ'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

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

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900">
                  Tiền công ước tính ({activeShiftObj?.code || '-'} • {activeShiftObj?.total_hours || 0}h):
                </span>
                <span className="text-base font-extrabold text-emerald-700">{formatVND(previewPay)}</span>
              </div>

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

      {/* Bulk Shift Scheduling Modal */}
      {bulkOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 z-[60]">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden">
            <div className="bg-[#0A192F] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-base">Chấm ca nhanh nhiều ngày</h3>
                <p className="text-xs text-slate-300">Tiết kiệm thời gian chấm cả tuần hoặc cả tháng</p>
              </div>
              <button
                type="button"
                onClick={() => setBulkOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  1. Chọn nhanh khoảng ngày
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => applyBulkPresetRange('MONTH')}
                    className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 cursor-pointer"
                  >
                    Cả tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBulkPresetRange('HALF_1')}
                    className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 cursor-pointer"
                  >
                    1 → 15
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBulkPresetRange('HALF_2')}
                    className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 cursor-pointer"
                  >
                    16 → hết
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBulkPresetRange('WEEK_7')}
                    className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 cursor-pointer"
                  >
                    7 ngày tới
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Từ ngày</label>
                    <input
                      type="date"
                      required
                      value={bulkStart}
                      onChange={(e) => setBulkStart(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Đến ngày</label>
                    <input
                      type="date"
                      required
                      value={bulkEnd}
                      onChange={(e) => setBulkEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    2. Các thứ áp dụng
                  </label>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setBulkWeekdays([1, 2, 3, 4, 5, 6])}
                      className="font-bold text-[#0A192F] hover:underline cursor-pointer"
                    >
                      T2–T7
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkWeekdays([0, 1, 2, 3, 4, 5, 6])}
                      className="font-bold text-[#E30613] hover:underline cursor-pointer"
                    >
                      Cả tuần
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAY_PILLS.map((wp) => {
                    const active = bulkWeekdays.includes(wp.day);
                    return (
                      <button
                        type="button"
                        key={wp.day}
                        onClick={() => toggleBulkWeekday(wp.day)}
                        className={clsx(
                          'py-2 rounded-lg text-xs font-bold border cursor-pointer',
                          active
                            ? 'bg-[#0A192F] border-[#0A192F] text-white'
                            : 'bg-white border-slate-200 text-slate-500'
                        )}
                      >
                        {wp.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  3. Chọn ca trực áp dụng
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {shifts.map((s) => {
                    const active = Number(bulkShiftId) === Number(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setBulkShiftId(s.id)}
                        className={clsx(
                          'p-2 rounded-xl border text-center cursor-pointer',
                          active
                            ? 'border-[#E30613] bg-red-50 ring-2 ring-[#E30613]/40'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        )}
                      >
                        <div className="font-extrabold text-xs text-[#0A192F]">{s.code}</div>
                        <div className="text-[10px] text-slate-500">{s.total_hours > 0 ? `${s.total_hours}h` : 'Nghỉ'}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  4. Loại ngày tính công
                </label>
                <select
                  value={bulkDayMode}
                  onChange={(e) => setBulkDayMode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs sm:text-sm font-medium"
                >
                  <option value="AUTO">Tự động (T2–T7 ngày thường, Chủ Nhật x200%)</option>
                  <option value="NORMAL">Tất cả tính Ngày thường</option>
                  <option value="WEEKLY_OFF">Tất cả tính Chủ Nhật (200%)</option>
                  <option value="HOLIDAY">Tất cả tính Ngày Lễ (200%–300%)</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="Ghi chú chung (tùy chọn, VD: Mục tiêu KCN)"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={bulkOnlyEmpty}
                  onChange={(e) => setBulkOnlyEmpty(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#0A192F] cursor-pointer"
                />
                <span>Chỉ điền vào ngày còn trống (giữ nguyên các ngày đã chấm)</span>
              </label>

              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-blue-950">
                Sẽ áp dụng cho <strong>{bulkTargetDates.length}</strong> ngày trong khoảng đã chọn.
              </div>

              <div className="pt-1 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setBulkOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={bulkSaving || bulkTargetDates.length === 0}
                  className="flex-1 bg-[#E30613] hover:bg-[#B8040E] text-white font-bold py-2.5 rounded-xl cursor-pointer disabled:opacity-60"
                >
                  {bulkSaving ? 'Đang chấm ca...' : `Chấm ${bulkTargetDates.length} ngày`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Payslip Modal */}
      {payslipOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 z-[60]">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden">
            <div className="bg-[#0A192F] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base">Sao chép bảng công tháng {format(currentDate, 'MM/yyyy')}</h3>
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
                <span>Kèm danh sách từng ngày đã chấm ({schedules.length} ngày)</span>
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

      {/* Custom Shift Manager Modal */}
      {customShiftOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 z-[65]">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden">
            <div className="bg-[#0A192F] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-base">Quản lý ca trực riêng</h3>
                <p className="text-xs text-slate-300">Thêm ca đặc thù (VD: 6h, 10h, 14h...) dùng riêng cho bạn</p>
              </div>
              <button
                type="button"
                onClick={() => setCustomShiftOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
              <form onSubmit={handleCreateCustomShift} className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-600">Thêm ca riêng mới</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="custom-shift-code" className="block text-xs font-bold text-slate-700 mb-1">
                      Mã ca *
                    </label>
                    <input
                      id="custom-shift-code"
                      type="text"
                      required
                      maxLength={20}
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      placeholder="VD: C6, K10"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-shift-hours" className="block text-xs font-bold text-slate-700 mb-1">
                      Số giờ làm *
                    </label>
                    <input
                      id="custom-shift-hours"
                      type="number"
                      required
                      min={0}
                      max={24}
                      step={0.5}
                      value={customTotalHours}
                      onChange={(e) => setCustomTotalHours(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="custom-shift-name" className="block text-xs font-bold text-slate-700 mb-1">
                    Tên mô tả <span className="text-slate-400 font-normal">(tùy chọn)</span>
                  </label>
                  <input
                    id="custom-shift-name"
                    type="text"
                    maxLength={60}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="VD: Ca tăng cường 6 tiếng"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm"
                  />
                </div>

                <div className="text-[11px] text-slate-600 bg-white rounded-xl border border-slate-200 px-3 py-2">
                  Cách tính ngày thường: <strong>{Math.min(8, parsedCustomHours)}h</strong> chuẩn +{' '}
                  <strong>{Math.max(0, parsedCustomHours - 8)}h</strong> tăng ca ={' '}
                  <strong className="text-emerald-700">
                    {formatVND(estimatePay(parsedCustomHours, 'NORMAL', hourRate, otRate))}
                  </strong>
                </div>

                <button
                  type="submit"
                  disabled={savingCustomShift}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-[#0A192F] hover:bg-[#13294B] text-white font-bold py-2.5 rounded-xl text-sm cursor-pointer disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  <span>{savingCustomShift ? 'Đang thêm...' : 'Thêm ca trực này'}</span>
                </button>
              </form>

              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ca riêng đã tạo ({customShifts.length})
                </div>
                {customShifts.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    Bạn chưa tạo ca riêng nào. Ngoài 11 ca mặc định (B1, B2, A, B, C, A1, C1, AB, H, R, Nghỉ), bạn có
                    thể tự thêm ca khác ở biểu mẫu phía trên.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customShifts.map((cs) => (
                      <div
                        key={cs.id}
                        className="flex items-center justify-between gap-2 bg-emerald-50/70 border border-emerald-200 rounded-xl px-3.5 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="font-extrabold text-[#0A192F] truncate">
                            {cs.code} <span className="font-semibold text-xs text-slate-600">• {cs.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {cs.total_hours}h ({cs.regular_hours}h chuẩn + {cs.overtime_hours}h OT)
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomShift(cs)}
                          disabled={deletingShiftId === cs.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{deletingShiftId === cs.id ? 'Đang xóa...' : 'Xóa'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCustomShiftOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
