import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { BRANCHES, COMPANY_INFO } from '../../data/companyData';
import QuoteRequestForm from '../../components/QuoteRequestForm';

export default function ContactPage() {
  return (
    <div>
      {/* Header */}
      <section className="bg-[#0A192F] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF4D58]">
            Liên hệ & Khảo sát Báo giá
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            Kết nối với Long Hải Securitas Toàn quốc
          </h1>
          <p className="text-slate-300 max-w-2xl text-base">
            Hỗ trợ tư vấn giải pháp an ninh cho doanh nghiệp và giải đáp thông tin tuyển dụng trực tiếp tại 5 văn phòng đại diện trọng điểm.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Branch List */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-extrabold text-[#0A192F]">Trụ sở & Hệ thống Chi nhánh</h2>
          {BRANCHES.map((branch) => (
            <div
              key={branch.region}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-[#0A192F]">{branch.region}</h3>
                {branch.isHQ && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-[#E30613]">
                    HQ
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-600 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#E30613] shrink-0 mt-0.5" />
                <span>{branch.address}</span>
              </div>
              <div className="text-sm text-slate-800 font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#0A192F] shrink-0" />
                <a href={`tel:${branch.tel}`} className="hover:text-[#E30613]">
                  {branch.phone}
                </a>
              </div>
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0A192F] shrink-0" />
                <span>{branch.email}</span>
              </div>
            </div>
          ))}

          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 flex items-start gap-2.5">
            <Clock className="w-5 h-5 text-[#0A192F] shrink-0 mt-0.5" />
            <div>
              <strong>Giờ tiếp nhận hồ sơ & tư vấn trực tiếp:</strong> Thứ 2 – Thứ 7 (08:00 – 17:00). Tổng đài trực an ninh hoạt động 24/7 qua số{' '}
              <a href={COMPANY_INFO.hotlineHref} className="font-bold text-[#E30613]">
                {COMPANY_INFO.hotline}
              </a>.
            </div>
          </div>
        </div>

        {/* Quote Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E30613]">
              Biểu mẫu Trực tuyến
            </span>
            <h2 className="text-2xl font-extrabold text-[#0A192F] mt-1">
              Gửi Yêu cầu Báo giá & Tư vấn An ninh
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Thông tin của quý doanh nghiệp được gửi trực tiếp tới phòng Kinh doanh & Điều hành Long Hải Securitas.
            </p>
          </div>
          <QuoteRequestForm />
        </div>
      </section>
    </div>
  );
}
