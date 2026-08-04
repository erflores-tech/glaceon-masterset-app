import { useRef, useState } from 'react'
import { useCollection } from '../context/CollectionContext'
import { Download, Upload } from 'lucide-react'

export default function BackupButtons() {
  const { exportJson, importJson } = useCollection()
  const fileRef = useRef(null)
  const [importing, setImporting] = useState(false)

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const count = await importJson(file)
      alert(`Imported ${count} card entries successfully.`)
    } catch (err) {
      alert('Import failed: ' + err.message)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={exportJson}
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
  )
}
