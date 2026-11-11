import { useState } from 'react';
import { CheckCircle2, Shield, Building2 } from 'lucide-react';
import { CLIENT_SECTORS, SECURITY_SERVICES } from '../../data/companyData';
import QuoteRequestForm from '../../components/QuoteRequestForm';

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState(SECURITY_SERVICES[0].title);

  const handleChooseService = (title) => {
    setSelectedService(title);
    const el = document.getElementById('quote-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Header */}
      <section className="bg-[#0A192F] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF4D58]">
            Dịch vụ & Giải pháp Bảo vệ
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            Giải pháp An ninh Toàn diện Theo Chuẩn Securitas
          </h1>
          <p className="text-slate-300 max-w-3xl text-base">
            Thiết kế phương án bảo vệ linh hoạt cho từng loại hình mục tiêu: kết hợp nhân sự kỷ luật cao, quy trình ISO 9001 và công nghệ giám sát hiện đại.
          </p>
        </div>
      </section>

      {/* Services List */}
      <section className="max-w-7xl mx-auto px-4 py-14 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {SECURITY_SERVICES.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-red-50 text-[#E30613] text-xs font-bold">
                    {srv.badge}
                  </span>
                  <Shield className="w-5 h-5 text-[#0A192F]" />
                </div>
                <h2 className="text-xl font-bold text-[#0A192F]">{srv.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{srv.summary}</p>
                <ul className="space-y-2 pt-2">
                  {srv.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleChooseService(srv.title)}
                className="w-full sm:w-auto self-start px-5 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#13294B] text-white text-sm font-semibold transition cursor-pointer"
              >
                Yêu cầu báo giá dịch vụ này
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Client Sectors */}
      <section className="bg-slate-100 border-y border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-[#0A192F] mb-6">
            Lĩnh vực Mục tiêu Long Hải Đang Phục vụ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CLIENT_SECTORS.map((sector) => (
              <div key={sector} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-[#E30613] shrink-0" />
                <span className="font-semibold text-sm text-[#0A192F]">{sector}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Embedded Quote Form */}
      <section id="quote-section" className="max-w-4xl mx-auto px-4 py-14">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E30613]">
              Tư vấn & Khảo sát Mục tiêu Miễn phí
            </span>
            <h2 className="text-2xl font-extrabold text-[#0A192F] mt-1">
              Đăng ký Nhận Báo giá Dịch vụ An ninh
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Để lại thông tin mục tiêu cần bảo vệ, bộ phận kinh doanh Long Hải Securitas sẽ liên hệ khảo sát và gửi phương án chi tiết.
            </p>
          </div>
          <QuoteRequestForm key={selectedService} defaultService={selectedService} />
        </div>
      </section>
    </div>
  );
}
