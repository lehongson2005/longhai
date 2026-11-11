import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { submitQuoteRequest } from '../services/publicService';
import { JOB_LOCATIONS, SECURITY_SERVICES } from '../data/companyData';

export default function QuoteRequestForm({ defaultService = '' }) {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState(JOB_LOCATIONS[0]);
  const [serviceType, setServiceType] = useState(defaultService || SECURITY_SERVICES[0].title);
  const [guardCount, setGuardCount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await submitQuoteRequest({
        company_name: companyName,
        contact_name: contactName,
        phone,
        email,
        location,
        service_type: serviceType,
        guard_count: guardCount ? Number(guardCount) : null,
        notes,
      });
      setSubmitted(res);
      setCompanyName('');
      setContactName('');
      setPhone('');
      setEmail('');
      setGuardCount('');
      setNotes('');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
        <h3 className="text-lg font-bold text-[#0A192F]">Đã tiếp nhận yêu cầu khảo sát & báo giá!</h3>
        <p className="text-sm text-slate-600">{submitted.message}</p>
        <div className="text-xs font-semibold text-emerald-800">Mã yêu cầu: #{submitted.id}</div>
        <button
          type="button"
          onClick={() => setSubmitted(null)}
          className="mt-2 inline-flex items-center px-4 py-2 bg-[#0A192F] text-white text-sm font-medium rounded-xl hover:bg-[#13294B] cursor-pointer"
        >
          Gửi thêm yêu cầu khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tên Công ty / Tổ chức <span className="text-[#E30613]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="VD: Công ty TNHH Sản xuất ABC"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Người liên hệ <span className="text-[#E30613]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="VD: Anh Nguyễn Văn Hùng"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Số điện thoại <span className="text-[#E30613]">*</span>
          </label>
          <input
            type="tel"
            required
            placeholder="VD: 0912 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email doanh nghiệp</label>
          <input
            type="email"
            placeholder="contact@congty.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Khu vực mục tiêu <span className="text-[#E30613]">*</span>
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Gói dịch vụ cần tư vấn <span className="text-[#E30613]">*</span>
          </label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
          >
            {SECURITY_SERVICES.map((srv) => (
              <option key={srv.id} value={srv.title}>
                {srv.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Số vị trí / bảo vệ dự kiến</label>
          <input
            type="number"
            min={1}
            placeholder="VD: 8"
            value={guardCount}
            onChange={(e) => setGuardCount(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả nhu cầu mục tiêu</label>
          <input
            type="text"
            placeholder="VD: Cần khảo sát nhà máy KCN VSIP, trực 3 ca 24/7"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0A192F] hover:bg-[#13294B] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition cursor-pointer"
      >
        <Send className="w-4 h-4" />
        <span>{loading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu khảo sát & báo giá'}</span>
      </button>
    </form>
  );
}
