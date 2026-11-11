import { useEffect, useState } from 'react';
import {
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Users,
  X,
} from 'lucide-react';
import {
  JOB_LOCATIONS,
  RECRUITMENT_BENEFITS,
  RECRUITMENT_STANDARDS,
  SITE_TYPES,
} from '../../data/companyData';
import { getPublicJobs } from '../../services/publicService';
import SalaryEstimatorWidget from '../../components/SalaryEstimatorWidget';
import QuickApplyModal from '../../components/QuickApplyModal';

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('all');
  const [siteTypeFilter, setSiteTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [detailJob, setDetailJob] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyJob, setApplyJob] = useState(null);
  const [initialShift, setInitialShift] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPublicJobs({
      location: locationFilter,
      site_type: siteTypeFilter,
      q: searchQuery,
    })
      .then((data) => {
        if (active) setJobs(data);
      })
      .catch(() => {
        if (active) setJobs([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [locationFilter, siteTypeFilter, searchQuery]);

  const handleOpenApply = (job = null, shiftPref = '') => {
    setApplyJob(job);
    setInitialShift(shiftPref);
    setApplyOpen(true);
  };

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-[#0A192F] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>TUYỂN DỤNG TRỰC TIẾP • KHÔNG THU PHÍ • KHÔNG CẦN KINH NGHIỆM</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold">
              Tuyển dụng Bảo vệ & Chỉ huy Mục tiêu Toàn quốc
            </h1>
            <p className="text-slate-300 text-base">
              Thu nhập 7.5 – 12.3 triệu/tháng, nhận lương đúng hạn ngày 5 qua ATM, đầy đủ BHXH và BHTN 24/7, hỗ trợ nhà đội miễn phí cho nhân viên ở xa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenApply(null)}
            className="shrink-0 bg-[#E30613] hover:bg-[#B8040E] text-white font-bold px-6 py-3.5 rounded-xl shadow-lg transition cursor-pointer"
          >
            Đăng ký ứng tuyển ngay (30 giây)
          </button>
        </div>
      </section>

      {/* Benefits & Standards */}
      <section className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xl font-extrabold text-[#0A192F]">Quyền lợi Nhân viên Long Hải</h2>
          <ul className="space-y-2.5 text-sm text-slate-700">
            {RECRUITMENT_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xl font-extrabold text-[#0A192F]">Tiêu chuẩn & Hồ sơ Đơn giản</h2>
          <ul className="space-y-2.5 text-sm text-slate-700">
            {RECRUITMENT_STANDARDS.map((s) => (
              <li key={s} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0A192F] shrink-0 mt-0.5" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <strong>Cảnh báo lừa đảo:</strong> Long Hải Securitas chỉ tuyển dụng trực tiếp, không thu phí hồ sơ, không giữ tiền cọc đồng phục qua môi giới trung gian.
          </div>
        </div>
      </section>

      {/* Salary Estimator */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <SalaryEstimatorWidget onApplyWithShift={(shiftLabel) => handleOpenApply(null, shiftLabel)} />
      </section>

      {/* Filter & Job Board */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-[#0A192F]">Danh sách Mục tiêu Đang Tuyển</h2>
          <p className="text-sm text-slate-600 mt-1">
            Lọc theo khu vực gần nơi bạn ở để chọn vị trí phù hợp nhất.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo từ khóa (ngân hàng, KCN, đội trưởng...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
            />
          </div>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
          >
            <option value="all">Tất cả khu vực</option>
            {JOB_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select
            value={siteTypeFilter}
            onChange={(e) => setSiteTypeFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
          >
            <option value="all">Tất cả loại mục tiêu</option>
            {SITE_TYPES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Đang tải danh sách việc làm...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <p className="text-slate-600 font-medium">
              Chưa tìm thấy vị trí khớp với bộ lọc hiện tại.
            </p>
            <button
              type="button"
              onClick={() => handleOpenApply(null)}
              className="inline-flex items-center px-4 py-2 bg-[#E30613] text-white text-sm font-semibold rounded-xl cursor-pointer"
            >
              Để lại thông tin để HR sắp xếp mục tiêu gần nhà
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {job.is_hot === 1 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-[#E30613]">
                        Tuyển gấp
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {job.department}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800">
                      {job.site_type}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#0A192F]">{job.title}</h3>

                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#E30613]" /> {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#0A192F]" /> {job.shift_type}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#0A192F]" /> Tuyển {job.quantity} người
                    </span>
                  </div>

                  <div className="text-base font-extrabold text-emerald-700">
                    Thu nhập: {job.salary_display}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDetailJob(job)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-[#0A192F] hover:bg-slate-50 transition cursor-pointer"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenApply(job)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#E30613] hover:bg-[#B8040E] text-white text-sm font-bold transition cursor-pointer"
                  >
                    Ứng tuyển nhanh
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Job Detail Modal */}
      {detailJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#0A192F] text-white px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-[#FF4D58] font-bold uppercase">{detailJob.department}</div>
                <h3 className="text-lg font-bold mt-0.5">{detailJob.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailJob(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs text-slate-500">Khu vực</div>
                  <div className="font-bold text-[#0A192F]">{detailJob.location}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Loại mục tiêu</div>
                  <div className="font-bold text-[#0A192F] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> {detailJob.site_type}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Mức thu nhập</div>
                  <div className="font-bold text-emerald-700">{detailJob.salary_display}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#0A192F] mb-1">Mô tả công việc</h4>
                <p className="leading-relaxed">{detailJob.description}</p>
              </div>
              <div>
                <h4 className="font-bold text-[#0A192F] mb-1">Yêu cầu ứng viên</h4>
                <p className="leading-relaxed">{detailJob.requirements}</p>
              </div>
              <div>
                <h4 className="font-bold text-[#0A192F] mb-1">Quyền lợi & Chế độ</h4>
                <p className="leading-relaxed">{detailJob.benefits}</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                type="button"
                onClick={() => setDetailJob(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-sm cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const j = detailJob;
                  setDetailJob(null);
                  handleOpenApply(j);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#E30613] hover:bg-[#B8040E] text-white font-bold text-sm cursor-pointer"
              >
                Ứng tuyển vị trí này ngay
              </button>
            </div>
          </div>
        </div>
      )}

      <QuickApplyModal
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        selectedJob={applyJob}
        initialShift={initialShift}
      />
    </div>
  );
}
