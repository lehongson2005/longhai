import { useState, useEffect } from 'react';
import { getSchedules, saveSchedule } from '../services/scheduleService';
import { getShifts } from '../services/shiftService';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, getDay } from 'date-fns';
import clsx from 'clsx';

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [dayType, setDayType] = useState('NORMAL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    const m = format(currentDate, 'MM');
    const y = format(currentDate, 'yyyy');
    const [schRes, shiftRes] = await Promise.all([
      getSchedules(m, y),
      getShifts()
    ]);
    setSchedules(schRes);
    setShifts(shiftRes);
  };

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getScheduleForDate = (date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    return schedules.find(s => s.work_date === dStr);
  };

  const openModal = (date) => {
    setSelectedDate(date);
    const sch = getScheduleForDate(date);
    if (sch) {
      setSelectedShiftId(sch.shift_id);
      setDayType(sch.day_type);
    } else {
      setSelectedShiftId(shifts[0]?.id || '');
      // Check if sunday
      if (getDay(date) === 0) {
        setDayType('WEEKLY_OFF');
      } else {
        setDayType('NORMAL');
      }
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    await saveSchedule({
      work_date: format(selectedDate, 'yyyy-MM-dd'),
      shift_id: selectedShiftId,
      day_type: dayType,
      notes: ''
    });
    setLoading(false);
    setShowModal(false);
    fetchData();
  };

  // Helper to offset the first day of month (0 = Sunday, 1 = Monday)
  const firstDay = getDay(startOfMonth(currentDate));
  const emptyDays = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <button onClick={handlePrevMonth} className="px-4 py-2 border rounded-lg hover:bg-gray-50">&lt;</button>
        <h2 className="font-bold text-lg">THÁNG {format(currentDate, 'MM/yyyy')}</h2>
        <button onClick={handleNextMonth} className="px-4 py-2 border rounded-lg hover:bg-gray-50">&gt;</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border">
        <div className="grid grid-cols-7 gap-1 text-center font-medium text-sm text-gray-500 mb-2">
          <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="p-2 h-20"></div>
          ))}
          {days.map(day => {
            const sch = getScheduleForDate(day);
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            return (
              <div 
                key={day.toString()} 
                onClick={() => openModal(day)}
                className={clsx(
                  "border rounded-lg p-1 h-20 flex flex-col cursor-pointer transition hover:bg-blue-50",
                  isToday ? "bg-blue-50 border-blue-200" : "bg-white",
                  getDay(day) === 0 ? "bg-red-50" : ""
                )}
              >
                <span className={clsx("text-xs font-semibold self-end", isToday ? "text-blue-600" : "text-gray-700")}>
                  {format(day, 'd')}
                </span>
                {sch && (
                  <div className="mt-auto text-center">
                    <div className="text-sm font-bold text-blue-700">{sch.shift_code}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">Ngày {format(selectedDate, 'dd/MM/yyyy')}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Chọn Ca:</label>
                <select 
                  className="w-full border rounded-lg p-2 focus:ring-blue-500"
                  value={selectedShiftId}
                  onChange={e => setSelectedShiftId(e.target.value)}
                >
                  {shifts.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.total_hours}h)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Loại ngày:</label>
                <select 
                  className="w-full border rounded-lg p-2 focus:ring-blue-500"
                  value={dayType}
                  onChange={e => setDayType(e.target.value)}
                >
                  <option value="NORMAL">Ngày thường</option>
                  <option value="WEEKLY_OFF">Chủ Nhật / Nghỉ tuần</option>
                  <option value="HOLIDAY">Ngày lễ</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
