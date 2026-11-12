import { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastContext } from './useToast';

const VARIANTS = {
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-emerald-900/10',
    iconWrap: 'bg-emerald-100 text-emerald-600',
    Icon: CheckCircle2,
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-950 shadow-red-900/10',
    iconWrap: 'bg-red-100 text-red-600',
    Icon: AlertCircle,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-950 shadow-amber-900/10',
    iconWrap: 'bg-amber-100 text-amber-600',
    Icon: AlertTriangle,
  },
  info: {
    container: 'bg-slate-900 border-slate-700 text-white shadow-slate-900/20',
    iconWrap: 'bg-white/10 text-sky-300',
    Icon: Info,
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (type, message, title) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, message, title }]);
      setTimeout(() => {
        removeToast(id);
      }, 3600);
    },
    [removeToast]
  );

  const api = useMemo(
    () => ({
      success: (message, title = 'Thành công') => pushToast('success', message, title),
      error: (message, title = 'Có lỗi xảy ra') => pushToast('error', message, title),
      warning: (message, title = 'Lưu ý') => pushToast('warning', message, title),
      info: (message, title = 'Thông báo') => pushToast('info', message, title),
    }),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[80] pointer-events-none flex flex-col gap-2.5"
      >
        {toasts.map((t) => {
          const style = VARIANTS[t.type] || VARIANTS.info;
          const Icon = style.Icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-xl backdrop-blur flex items-start gap-3 transition-all duration-200 ${style.container}`}
            >
              <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${style.iconWrap}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wide opacity-80">{t.title}</div>
                <div className="text-sm font-medium leading-snug mt-0.5 break-words">{t.message}</div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-lg opacity-60 hover:opacity-100 cursor-pointer shrink-0"
                aria-label="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
