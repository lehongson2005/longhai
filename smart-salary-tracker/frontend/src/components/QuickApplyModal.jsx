import { useEffect, useState } from 'react';
import { X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { submitApplication } from '../services/publicService';
import { JOB_LOCATIONS } from '../data/companyData';

const BASE_SHIFT_OPTIONS = [
  'Ca 8h (A/B/C)',
  'Ca 12h (A1/C1)',
  'Ca 16h (AB)',
  'Ca 8h / 12h linh hoạt',
  'Giờ hành chính (Chỉ huy/VP)',
];

export default function QuickApplyModal({ isOpen, onClose, selectedJob = null, initialShift = '' }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [preferredLocation, setPreferredLocation] = useState(JOB_LOCATIONS[0]);
  const [preferredShift, setPreferredShift] = useState('Ca 12h (A1/C1)');
  const [hasCccd, setHasCccd] = useState(true);
  const [experienceNote, setExperienceNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSubmitted(null);
      if (selectedJob?.location) {
        setPreferredLocation(selectedJob.location);
      }
      if (initialShift) {
        setPreferredShift(initialShift);
      } else if (selectedJob?.shift_type) {
        setPreferredShift(selectedJob.shift_type);
      } else {
        setPreferredShift('Ca 12h (A1/C1)');
      }
    }
  }, [isOpen, selectedJob, initialShift]);

  const shiftOptions =
    preferredShift && !BASE_SHIFT_OPTIONS.includes(preferredShift)
      ? [preferredShift, ...BASE_SHIFT_OPTIONS]
      : BASE_SHIFT_OPTIONS;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await submitApplication({
        job_id: selectedJob?.id || null,
        full_name: fullName,
        phone,
        birth_year: birthYear ? Number(birthYear) : null,
        preferred_location: preferredLocation,
        preferred_shift: preferredShift,
        has_cccd: hasCccd,
        experience_note: experienceNote,
      });
      setSubmitted(res);
      setFullName('');
      setPhone('');
      setBirthYear('');
      setExperienceNote('');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="bg-[#0A192F] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Ứng tuyển nhanh trong 30 giây</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {selectedJob ? selectedJob.title : 'Đăng ký ứng tuyển trực tiếp vào Long Hải Securitas'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-[#0A192F]">Đã tiếp nhận hồ sơ ứng tuyển!</h4>
              <p className="text-sm text-slate-600">{submitted.message}</p>
              <div className="inline-block bg-slate-100 px-4 py-2 rounded-xl text-sm font-semibold text-[#0A192F]">
                Mã hồ sơ: #{submitted.id}
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-[#0A192F] text-white py-3 rounded-xl font-semibold hover:bg-[#13294B] cursor-pointer"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Cam kết tuyển dụng trực tiếp — Tuyệt đối KHÔNG thu bất kỳ khoản phí nào.</span>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3.5 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Họ và tên <span className="text-[#E30613]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Số điện thoại <span className="text-[#E30613]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0909 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Khu vực mong muốn <span className="text-[#E30613]">*</span>
                  </label>
                  <select
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                  >
                    {JOB_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                    <option value="Tỉnh thành khác">Tỉnh thành khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ca làm việc mong muốn
                  </label>
                  <select
                    value={preferredShift}
                    onChange={(e) => setPreferredShift(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                  >
                    {shiftOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Năm sinh</label>
                  <input
                    type="number"
                    min={1960}
                    max={2009}
                    placeholder="Ví dụ: 1994"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                  />
                </div>
                <label className="flex items-center gap-2.5 pt-5 cursor-pointer text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={hasCccd}
                    onChange={(e) => setHasCccd(e.target.checked)}
                    className="w-4 h-4 accent-[#E30613]"
                  />
                  <span>Đã có CCCD gắn chip</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ghi chú thêm (kinh nghiệm, khu vực ở, cần nhà đội...)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Đã từng làm bảo vệ tòa nhà 1 năm / Cần bố trí nhà đội..."
                  value={experienceNote}
                  onChange={(e) => setExperienceNote(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E30613] hover:bg-[#B8040E] disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl transition cursor-pointer"
              >
                {loading ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ ứng tuyển ngay'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
