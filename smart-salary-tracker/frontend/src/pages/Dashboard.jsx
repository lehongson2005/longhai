import { useEffect, useState } from 'react';
import { getDashboardData } from '../services/dashboardService';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Wallet, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const todayDate = new Date();

  useEffect(() => {
    getDashboardData(todayDate).then(res => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) return <div className="text-center py-10">Đang tải dữ liệu...</div>;
  if (!data) return <div className="text-center py-10 text-red-500">Lỗi tải dữ liệu</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan thu nhập & chi tiêu</h1>
          <p className="text-xs text-slate-500 mt-0.5">Công cụ ước tính tham khảo dành riêng cho nhân viên Long Hải</p>
        </div>
      </div>

      {/* TODAY SECTION */}
      <section className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">HÔM NAY - {format(todayDate, 'dd/MM/yyyy')}</h2>
          {data.today.schedule ? (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
              Ca {data.today.schedule.code} ({data.today.schedule.total_hours}h)
            </span>
          ) : (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded font-medium">Chưa xếp ca</span>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Kiếm khoảng</div>
            <div className="font-bold text-blue-600">{formatVND(data.today.income)}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Đã tiêu</div>
            <div className="font-bold text-red-600">{formatVND(data.today.expense)}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Còn lại</div>
            <div className={`font-bold ${data.today.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatVND(data.today.balance)}
            </div>
          </div>
        </div>
      </section>

      {/* MONTH SECTION */}
      <section className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
        <h2 className="font-semibold text-gray-700 mb-4">THÁNG NÀY</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-gray-600">Tổng thu nhập ước tính</span>
            <span className="font-bold">{formatVND(data.month.income)}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-gray-600">Tổng chi tiêu</span>
            <span className="font-bold text-red-500">{formatVND(data.month.expense)}</span>
          </div>
          <div className="flex justify-between items-center pb-2">
            <span className="text-gray-600">Còn lại</span>
            <span className={`font-bold text-xl ${data.month.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatVND(data.month.balance)}
            </span>
          </div>
        </div>
      </section>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/nhan-vien/expenses" className="flex items-center justify-center space-x-2 bg-white border-2 border-red-100 text-red-600 p-4 rounded-xl font-medium hover:bg-red-50 transition">
          <Wallet size={20} />
          <span>+ THÊM CHI TIÊU</span>
        </Link>
        <Link to="/nhan-vien/schedule" className="flex items-center justify-center space-x-2 bg-white border-2 border-blue-100 text-blue-600 p-4 rounded-xl font-medium hover:bg-blue-50 transition">
          <Calendar size={20} />
          <span>+ NHẬP CA</span>
        </Link>
      </div>

    </div>
  );
}
