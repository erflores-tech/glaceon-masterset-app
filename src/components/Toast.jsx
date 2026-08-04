import { useEffect } from 'react'
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts?.length) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-80">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (toast.duration === 0) return
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-glaceon" />,
  }

  const bg = toast.type === 'error'
    ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800'
    : toast.type === 'success'
    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'
    : 'bg-white dark:bg-navy-700 border-ice-200 dark:border-navy-500'

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl shadow-lg border ${bg}`} role="status" aria-live="polite">
      <div className="mt-0.5">{icons[toast.type] || icons.info}</div>
      <div className="flex-1 text-sm text-navy-700 dark:text-ice-100">
        {toast.title && <div className="font-semibold">{toast.title}</div>}
        <div className={toast.title ? 'text-navy-500 dark:text-ice-300' : ''}>{toast.message}</div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-navy-400"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
