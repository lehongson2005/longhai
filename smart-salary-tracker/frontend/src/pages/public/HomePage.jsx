import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Cpu,
  Users,
  Award,
  ArrowRight,
  MapPin,
  Briefcase,
  CheckCircle2,
  PhoneCall,
} from 'lucide-react';
import {
  COMPANY_INFO,
  STATS,
  CORE_VALUES,
  SECURITY_SERVICES,
  NOTABLE_CLIENTS,
} from '../../data/companyData';
import { getPublicJobs } from '../../services/publicService';
import QuickApplyModal from '../../components/QuickApplyModal';

export default function HomePage() {
  const [hotJobs, setHotJobs] = useState([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    getPublicJobs()
      .then((jobs) => setHotJobs(jobs.slice(0, 4)))
      .catch(() => setHotJobs([]));
  }, []);

  const handleOpenApply = (job = null) => {
    setSelectedJob(job);
    setApplyOpen(true);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-[#0A192F] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#E30613_0%,transparent_45%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-slate-200">
              <span className="h-2 w-2 rounded-full bg-[#E30613]" />
              <span>Công ty Bảo vệ Long Hải • Liên doanh Securitas AB (Thụy Điển)</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {COMPANY_INFO.slogan}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Từ năm 1995, Long Hải Securitas kết hợp lực lượng bảo vệ chính quy được đào tạo theo giáo trình chuyên nghiệp với công nghệ an ninh tiên tiến — bảo vệ an toàn cho hàng trăm nhà máy FDI, tòa nhà, ngân hàng và cơ quan ngoại giao trên toàn quốc.
            </p>

            <div className="flex flex-wrap gap-3.5 pt-2">
              <Link
                to="/lien-he"
                className="inline-flex items-center gap-2 bg-[#E30613] hover:bg-[#B8040E] text-white font-bold px-6 py-3.5 rounded-xl shadow-lg transition"
              >
                <span>Yêu cầu khảo sát & Báo giá</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/tuyen-dung"
                className="inline-flex items-center gap-2 bg-white text-[#0A192F] hover:bg-slate-100 font-bold px-6 py-3.5 rounded-xl transition"
              >
                <Briefcase className="w-4 h-4 text-[#E30613]" />
                <span>Tìm việc bảo vệ (7.5 – 12.3 triệu)</span>
              </Link>
            </div>
          </div>

          {/* Right Highlight Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-300">Hai kênh kết nối nhanh</div>
                  <div className="text-lg font-bold text-white mt-0.5">Khách hàng & Ứng viên</div>
                </div>
                <ShieldCheck className="w-9 h-9 text-[#E30613]" />
              </div>

              <div className="space-y-3">
                <Link
                  to="/dich-vu"
                  className="block p-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white">Doanh nghiệp thuê bảo vệ</div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Giải pháp mục tiêu cố định, an ninh điện tử, tuần tra cơ động & áp tải tài sản.
                  </p>
                </Link>

                <button
                  type="button"
                  onClick={() => handleOpenApply(null)}
                  className="w-full text-left p-4 rounded-xl bg-[#E30613]/20 hover:bg-[#E30613]/30 border border-[#E30613]/50 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white">Ứng tuyển nhanh trong 30 giây</div>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs text-slate-200 mt-1">
                    Tuyển thẳng không thu phí • Có nhà đội • Lương ngày 5 qua ATM • Đóng đủ BHXH.
                  </p>
                </button>

                <Link
                  to="/nhan-vien"
                  className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white">Cổng nhân viên Long Hải</div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Nhân viên đang làm việc đăng nhập chấm ca, ước tính lương & theo dõi chi tiêu.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((item) => (
            <div key={item.label} className="border-l-4 border-[#E30613] pl-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0A192F]">{item.value}</div>
              <div className="font-bold text-sm text-slate-800 mt-1">{item.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Services Preview */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#E30613]">
              Giải pháp An ninh Toàn diện
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A192F] mt-1">
              Dịch vụ Bảo vệ Chuyên nghiệp Chuẩn Quốc tế
            </h2>
          </div>
          <Link
            to="/dich-vu"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0A192F] hover:text-[#E30613]"
          >
            <span>Xem tất cả dịch vụ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SECURITY_SERVICES.slice(0, 4).map((service, idx) => {
            const Icons = [Building2, Cpu, Users, Award];
            const Icon = Icons[idx % Icons.length];
            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-[#0A192F] flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#E30613]">
                    {service.badge}
                  </span>
                  <h3 className="font-bold text-lg text-[#0A192F] mt-1 mb-2">{service.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{service.summary}</p>
                </div>
                <Link
                  to="/dich-vu"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#0A192F] hover:text-[#E30613]"
                >
                  <span>Tìm hiểu chi tiết</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-[#0A192F] text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF4D58]">
              Văn hóa Doanh nghiệp Securitas
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2">
              Ba Giá trị Cốt lõi Dẫn lối Mọi Ca trực
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CORE_VALUES.map((val, i) => (
              <div key={val.key} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FF4D58] uppercase tracking-wider">
                    0{i + 1} • {val.english}
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E30613]" />
                </div>
                <h3 className="text-xl font-bold text-white">{val.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{val.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Recruitment Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5 md:mt-0" />
            <div>
              <div className="font-bold text-emerald-950">
                Tuyển dụng trực tiếp tại Long Hải Securitas — Cam kết KHÔNG thu phí
              </div>
              <p className="text-sm text-emerald-800">
                Không yêu cầu kinh nghiệm • Đào tạo nghiệp vụ miễn phí • Bố trí mục tiêu gần nhà hoặc hỗ trợ nhà đội miễn phí.
              </p>
            </div>
          </div>
          <Link
            to="/tuyen-dung"
            className="shrink-0 inline-flex items-center gap-2 bg-[#E30613] hover:bg-[#B8040E] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
          >
            <span>Tính thử lương & Xem việc</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0A192F]">Vị trí Đang Tuyển Gấp</h2>
            <p className="text-sm text-slate-600 mt-1">
              Điền thông tin ứng tuyển nhanh chỉ trong 30 giây, không cần CV phức tạp.
            </p>
          </div>
          <Link to="/tuyen-dung" className="text-sm font-bold text-[#E30613] hover:underline">
            Xem tất cả vị trí
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {hotJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-[#0A192F]/40 transition flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {job.is_hot === 1 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-[#E30613]">
                      Tuyển gấp
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                    {job.site_type}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-[#0A192F]">{job.title}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#E30613]" /> {job.location}
                  </span>
                  <span className="font-bold text-emerald-700">{job.salary_display}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">{job.shift_type} • Cần {job.quantity} người</span>
                <button
                  type="button"
                  onClick={() => handleOpenApply(job)}
                  className="px-4 py-2 rounded-xl bg-[#0A192F] hover:bg-[#13294B] text-white text-sm font-semibold transition cursor-pointer"
                >
                  Ứng tuyển nhanh
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clients & Contact CTA */}
      <section className="bg-white border-t border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 space-y-10">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A192F]">
              Đối tác & Khách hàng Tiêu biểu Tin tưởng Long Hải Securitas
            </h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {NOTABLE_CLIENTS.map((client) => (
                <span
                  key={client}
                  className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  {client}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#0A192F] to-[#13294B] rounded-2xl p-8 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-extrabold">Cần tư vấn phương án bảo vệ cho doanh nghiệp?</h3>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">
                Đội ngũ chuyên gia an ninh Long Hải sẵn sàng khảo sát thực tế và đề xuất báo giá tối ưu trong 24 giờ.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <a
                href={COMPANY_INFO.hotlineHref}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 font-semibold text-sm"
              >
                <PhoneCall className="w-4 h-4 text-[#FF4D58]" />
                <span>{COMPANY_INFO.hotline}</span>
              </a>
              <Link
                to="/lien-he"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#E30613] hover:bg-[#B8040E] font-bold text-sm"
              >
                <span>Nhận báo giá ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <QuickApplyModal
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        selectedJob={selectedJob}
      />
    </div>
  );
}
