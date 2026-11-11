import { Link } from 'react-router-dom';
import { ShieldCheck, Award, MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import { BRANCHES, COMPANY_INFO, CORE_VALUES, STATS, TIMELINE } from '../../data/companyData';

export default function AboutPage() {
  return (
    <div>
      {/* Header Banner */}
      <section className="bg-[#0A192F] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF4D58]">
            Về chúng tôi • {COMPANY_INFO.englishName}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            {COMPANY_INFO.fullName}
          </h1>
          <p className="text-slate-300 max-w-3xl text-base leading-relaxed">
            Hơn ba thập kỷ hình thành và phát triển từ năm 1995, Long Hải Securitas là biểu tượng tiên phong của dịch vụ bảo vệ chuyên nghiệp tại Việt Nam, kết hợp kỷ luật truyền thống với tiêu chuẩn quản trị an ninh toàn cầu từ Securitas AB (Thụy Điển).
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-2xl font-extrabold text-[#E30613]">{s.value}</div>
              <div className="font-bold text-[#0A192F] text-sm mt-1">{s.label}</div>
              <div className="text-xs text-slate-500 mt-1">{s.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* History Timeline */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-extrabold text-[#0A192F] mb-8">Cột mốc Lịch sử Phát triển</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIMELINE.map((item) => (
            <div key={item.year} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-[#E30613] font-bold text-xs">
                {item.year}
              </span>
              <h3 className="font-bold text-lg text-[#0A192F]">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Standards & Training */}
      <section className="bg-slate-100 py-14 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-white rounded-2xl p-7 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <Award className="w-7 h-7 text-[#E30613]" />
              <h2 className="text-xl font-extrabold text-[#0A192F]">
                Chuẩn Chất lượng ISO 9001 & Tuyển chọn Nhân sự
              </h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Long Hải Securitas vận hành hệ thống quản lý chất lượng đạt chuẩn quốc tế <strong>ISO 9001</strong>, tuân thủ đầy đủ quy định pháp luật Việt Nam về kinh doanh dịch vụ bảo vệ.
            </p>
            <ul className="space-y-2.5 text-sm text-slate-700">
              <li className="flex gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Lực lượng nòng cốt xuất thân từ bộ đội xuất ngũ, công an phục viên và nhân sự có lý lịch trong sạch.</span>
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>100% nhân viên mới được huấn luyện nghiệp vụ bảo vệ, PCCC, sơ cấp cứu và giao tiếp theo giáo trình chuyên sâu trước khi nhận mục tiêu.</span>
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Đội tuần tra cơ động và giám sát khu vực kiểm tra chéo 24/7 tại mọi mục tiêu.</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#0A192F] text-white rounded-2xl p-7 space-y-5">
            <h2 className="text-xl font-extrabold">3 Giá trị Cốt lõi</h2>
            <div className="space-y-4">
              {CORE_VALUES.map((v) => (
                <div key={v.key} className="border-l-2 border-[#E30613] pl-4">
                  <div className="font-bold text-base">
                    {v.title} <span className="text-slate-400 text-xs font-normal">({v.english})</span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{v.description}</p>
                </div>
              ))}
            </div>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/tuyen-dung"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E30613] hover:bg-[#B8040E] text-white text-sm font-bold"
              >
                <span>Gia nhập đội ngũ Long Hải</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dich-vu"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold"
              >
                <span>Xem giải pháp an ninh</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Branches */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-extrabold text-[#0A192F] mb-6">Mạng lưới Trụ sở & Chi nhánh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {BRANCHES.map((b) => (
            <div key={b.region} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5">
              {b.isHQ && (
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-50 text-[#E30613] text-xs font-bold">
                  Trụ sở chính
                </span>
              )}
              <h3 className="font-bold text-[#0A192F]">{b.region}</h3>
              <p className="text-sm text-slate-600 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#E30613] shrink-0 mt-0.5" />
                <span>{b.address}</span>
              </p>
              <p className="text-sm text-slate-700 font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#0A192F] shrink-0" />
                <a href={`tel:${b.tel}`} className="hover:text-[#E30613]">{b.phone}</a>
              </p>
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0A192F] shrink-0" />
                <span>{b.email}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
