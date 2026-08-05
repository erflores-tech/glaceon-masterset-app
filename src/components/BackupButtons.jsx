import { useCollection } from '../hooks/useCollection'
import { useToasts } from '../hooks/useToasts'
import { ToastContainer } from './Toast'
import { Download } from 'lucide-react'

export default function BackupButtons() {
  const { exportJson } = useCollection()
  const { toasts, addToast, removeToast } = useToasts()
  return (
    <>
      <button
        onClick={() => {
          try {
            exportJson()
            addToast({ type: 'success', title: 'Export complete', message: 'Collection downloaded.' })
          } catch (err) {
            addToast({ type: 'error', title: 'Export failed', message: err.message })
          }
        }}
        className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-navy-600/10 dark:hover:bg-white/10 transition"
        title="Export collection JSON"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
      </button>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </>
  )
}
