import { useState, useEffect } from 'react';
import { getExpenses, getCategories, createExpense, deleteExpense } from '../services/expenseService';
import { format } from 'date-fns';
import { Trash2, Plus } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    const m = format(currentDate, 'MM');
    const y = format(currentDate, 'yyyy');
    const [expRes, catRes] = await Promise.all([
      getExpenses(m, y),
      getCategories()
    ]);
    setExpenses(expRes);
    setCategories(catRes);
    if (catRes.length > 0) setCategoryId(catRes[0].id);
  };

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    await createExpense({
      amount: parseFloat(amount),
      category_id: categoryId,
      note,
      expense_date: expenseDate
    });
    setLoading(false);
    setShowModal(false);
    setAmount('');
    setNote('');
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa khoản chi này?')) {
      await deleteExpense(id);
      fetchData();
    }
  };

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <button onClick={handlePrevMonth} className="px-4 py-2 border rounded-lg hover:bg-gray-50">&lt;</button>
        <h2 className="font-bold text-lg">THÁNG {format(currentDate, 'MM/yyyy')}</h2>
        <button onClick={handleNextMonth} className="px-4 py-2 border rounded-lg hover:bg-gray-50">&gt;</button>
      </div>

      <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-center">
        <p className="text-gray-600 mb-1">Tổng chi tiêu tháng này</p>
        <h2 className="text-3xl font-bold text-red-600">{formatVND(totalExpense)}</h2>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Lịch sử chi tiêu</h3>
        <button onClick={() => setShowModal(true)} className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> <span>Thêm</span>
        </button>
      </div>

      <div className="space-y-3">
        {expenses.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
            <div>
              <div className="font-semibold text-gray-800">{item.category_name}</div>
              <div className="text-sm text-gray-500">{format(new Date(item.expense_date), 'dd/MM/yyyy')} - {item.note}</div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-bold text-red-500">-{formatVND(item.amount)}</span>
              <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {expenses.length === 0 && <div className="text-center text-gray-500 py-10">Chưa có dữ liệu chi tiêu</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:p-4 z-50">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Thêm chi tiêu</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Số tiền</label>
                <input 
                  type="number" 
                  required
                  className="w-full border rounded-lg p-3 focus:ring-blue-500 text-lg"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Ví dụ: 30000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Danh mục</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                    <button 
                      type="button"
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={`p-2 border rounded-lg text-sm transition ${categoryId === cat.id ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngày chi</label>
                <input 
                  type="date" 
                  required
                  className="w-full border rounded-lg p-2 focus:ring-blue-500"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ghi chú</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2 focus:ring-blue-500"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ví dụ: Ăn sáng"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 mt-2">
                Lưu chi tiêu
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
