import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  if (isInstalled || !deferredPrompt) return null

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-1 px-2 py-1 rounded-md bg-glaceon text-navy-700 font-medium hover:bg-ice-300 transition"
    >
      <Download className="w-4 h-4" />
      Install
    </button>
  )
}
