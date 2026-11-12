import { useState, useEffect, useCallback } from 'react';
import {
  getExpenses,
  getCategories,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../services/expenseService';
import { format } from 'date-fns';
import { Trash2, Edit3, Check, ChevronLeft, ChevronRight, Wallet, X } from 'lucide-react';
import { useToast } from '../components/useToast';
import ConfirmDialog from '../components/ConfirmDialog';

const QUICK_AMOUNTS = [20000, 30000, 50000, 100000, 200000];

function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Inline Form State (always visible with prominent Save button)
  const [editingId, setEditingId] = useState(null);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      const m = format(currentDate, 'MM');
      const y = format(currentDate, 'yyyy');
      const [expRes, catRes] = await Promise.all([getExpenses(m, y), getCategories()]);
      setExpenses(expRes);
      setCategories(catRes);
      if (catRes.length > 0) {
        setCategoryId((prev) => prev || catRes[0].id);
      }
    } catch {
      toast.error('Không thể tải dữ liệu chi tiêu.');
    }
  }, [currentDate, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handlePrevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const formatVND = (val) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

  const resetForm = () => {
    setEditingId(null);
    setAmount('');
    setNote('');
    setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
    if (categories.length > 0) setCategoryId(categories[0].id);
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setAmount(String(item.amount));
    setCategoryId(item.category_id || (categories[0]?.id ?? ''));
    setExpenseDate(item.expense_date);
    setNote(item.note || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.warning('Vui lòng nhập số tiền lớn hơn 0.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        amount: numericAmount,
        category_id: categoryId || null,
        note: note.trim(),
        expense_date: expenseDate,
      };

      if (editingId) {
        await updateExpense(editingId, payload);
        toast.success(`Đã cập nhật khoản chi ${formatVND(numericAmount)}`, 'Cập nhật chi tiêu');
      } else {
        await createExpense(payload);
        const catName = categories.find((c) => Number(c.id) === Number(categoryId))?.name || 'Chi tiêu';
        toast.success(`Đã lưu: ${formatVND(numericAmount)} (${catName})`, 'Lưu chi tiêu');
      }

      // Sync view month to saved expense month if needed
      const [expYear, expMonth] = String(expenseDate).split('-');
      if (expYear && expMonth) {
        const viewM = format(currentDate, 'MM');
        const viewY = format(currentDate, 'yyyy');
        if (expYear !== viewY || expMonth !== viewM) {
          setCurrentDate(new Date(Number(expYear), Number(expMonth) - 1, 1));
        } else {
          await fetchData();
        }
      } else {
        await fetchData();
      }
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu khoản chi tiêu.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExpense(deleteTarget.id);
      toast.success('Đã xóa khoản chi tiêu!', 'Đã xóa');
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa khoản chi tiêu.');
    } finally {
      setDeleting(false);
    }
  };

  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Month Switcher */}
      <div className="flex justify-between items-center bg-white p-3.5 sm:p-4 rounded-2xl shadow-xs border border-slate-200">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
          aria-label="Tháng trước"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="text-center">
          <h1 className="font-extrabold text-base sm:text-lg text-[#0A192F]">
            CHI TIÊU THÁNG {format(currentDate, 'MM/yyyy')}
          </h1>
          <p className="text-[11px] text-slate-500">{expenses.length} khoản chi trong tháng</p>
        </div>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
          aria-label="Tháng sau"
        >
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* Monthly Total Banner */}
      <div className="bg-gradient-to-r from-rose-50 to-red-50 p-5 rounded-2xl border border-rose-200 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Tổng chi tiêu tháng này</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{formatVND(totalExpense)}</h2>
        </div>
        <div className="p-3 rounded-2xl bg-white/80 text-rose-600 border border-rose-100">
          <Wallet className="w-7 h-7" />
        </div>
      </div>

      {/* Always-visible Add / Edit Expense Form */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#0A192F] text-white px-5 py-3.5 flex items-center justify-between">
          <h2 className="font-bold text-sm sm:text-base">
            {editingId ? 'Chỉnh sửa khoản chi tiêu' : 'Ghi khoản chi tiêu mới'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-xs bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hủy sửa</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Số tiền (VNĐ) *</label>
            <input
              type="number"
              inputMode="numeric"
              min={1000}
              step="any"
              required
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-lg font-bold text-[#0A192F] focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ví dụ: 35000"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setAmount(String(val))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  {(val / 1000).toLocaleString('vi-VN')}k
                </button>
              ))}
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Danh mục</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const selected = Number(categoryId) === Number(cat.id);
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={`px-2.5 py-2 border rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                        selected
                          ? 'bg-[#0A192F] border-[#0A192F] text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Ngày chi *</label>
              <input
                type="date"
                required
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Ghi chú</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Cơm ca, xăng xe..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#E30613] hover:bg-[#B8040E] text-white py-3.5 px-5 rounded-xl font-extrabold text-sm sm:text-base shadow-sm transition cursor-pointer disabled:opacity-60"
          >
            <Check className="w-5 h-5" />
            <span>{saving ? 'Đang lưu...' : editingId ? 'Cập nhật chi tiêu' : 'Lưu chi tiêu'}</span>
          </button>
        </form>
      </section>

      {/* Expense History */}
      <section className="space-y-3">
        <h3 className="font-extrabold text-base text-[#0A192F]">Lịch sử chi tiêu</h3>

        {expenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 text-center text-slate-500 py-10 text-sm">
            Chưa có khoản chi tiêu nào trong tháng này.
          </div>
        ) : (
          <div className="space-y-2.5">
            {expenses.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-[#0A192F]">
                      {item.category_name || 'Khác'}
                    </span>
                    <span className="text-xs text-slate-500">{formatDateVN(item.expense_date)}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-700 mt-1 truncate">
                    {item.note || 'Không có ghi chú'}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="font-extrabold text-sm sm:text-base text-rose-600">
                    -{formatVND(item.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-[#0A192F] hover:bg-slate-50 cursor-pointer"
                    aria-label="Sửa khoản chi"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="p-2 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 cursor-pointer"
                    aria-label="Xóa khoản chi"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa khoản chi tiêu?"
        description={
          deleteTarget
            ? `Bạn muốn xóa khoản "${deleteTarget.category_name || 'Chi tiêu'}" trị giá ${formatVND(
                deleteTarget.amount
              )} ngày ${formatDateVN(deleteTarget.expense_date)}?`
            : ''
        }
        confirmLabel="Xóa khoản chi"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
