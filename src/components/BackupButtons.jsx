import { useRef, useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { useToasts } from '../hooks/useToasts'
import { ToastContainer } from './Toast'
import { Download, Upload, AlertTriangle } from 'lucide-react'

export default function BackupButtons() {
  const { exportJson, importJson } = useCollection()
  const { toasts, addToast, removeToast } = useToasts()
  const fileRef = useRef(null)
  const [importing, setImporting] = useState(false)
  const [pendingImport, setPendingImport] = useState(null)

  const resetFile = () => {
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const result = await importJson(file, { dryRun: true })
      setPendingImport({ file, ...result })
    } catch (err) {
      addToast({ type: 'error', title: 'Import failed', message: err.message })
      resetFile()
    } finally {
      setImporting(false)
    }
  }

  const confirmImport = async () => {
    if (!pendingImport) return
    setImporting(true)
    try {
      const result = await importJson(pendingImport.file, { dryRun: false })
      addToast({
        type: 'success',
        title: 'Import complete',
        message: `${result.imported} card entries imported, ${result.ignored} ignored.`,
      })
    } catch (err) {
      addToast({ type: 'error', title: 'Import failed', message: err.message })
    } finally {
      setImporting(false)
      setPendingImport(null)
      resetFile()
    }
  }

  const cancelImport = () => {
    setPendingImport(null)
    resetFile()
  }

  return (
    <>
      <div className="flex items-center gap-1">
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
        <label
          className={`flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer hover:bg-navy-600/10 dark:hover:bg-white/10 transition ${importing ? 'opacity-50' : ''}`}
          title="Import collection JSON"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Import</span>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImport}
            disabled={importing}
          />
        </label>
      </div>

      {pendingImport && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-navy-700 p-5 shadow-xl border border-ice-200 dark:border-navy-500">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Confirm import</span>
            </div>
            <p className="text-sm text-navy-600 dark:text-ice-200 mb-4">
              This backup contains {pendingImport.imported} card entries.
              {pendingImport.preview.added.length > 0 && (
                <> <strong>{pendingImport.preview.added.length}</strong> will be added.</>
              )}
              {pendingImport.preview.updated.length > 0 && (
                <> <strong>{pendingImport.preview.updated.length}</strong> will be updated.</>
              )}
              {pendingImport.preview.unchanged.length > 0 && (
                <> <strong>{pendingImport.preview.unchanged.length}</strong> are unchanged.</>
              )}
              {pendingImport.ignored > 0 && (
                <> {pendingImport.ignored} unknown entries will be ignored.</>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelImport}
                className="px-4 py-2 rounded-lg text-sm font-medium text-navy-500 hover:bg-ice-100 dark:hover:bg-navy-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={importing}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-glaceon text-navy-700 hover:opacity-90 disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </>
  )
}
