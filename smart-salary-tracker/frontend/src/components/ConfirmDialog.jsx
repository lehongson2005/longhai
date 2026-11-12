import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title = 'Xác nhận thao tác',
  description = '',
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-[#E30613] hover:bg-[#B8040E] text-white'
      : 'bg-[#0A192F] hover:bg-[#13294B] text-white';

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              variant === 'danger' ? 'bg-red-50 text-[#E30613]' : 'bg-slate-100 text-[#0A192F]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-slate-900">{title}</h3>
            {description && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-100 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-60 ${confirmBtnClass}`}
          >
            {loading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
