import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { CollectionProvider } from './context/CollectionProvider.jsx'
import { useCollection } from './hooks/useCollection'
import Dashboard from './components/Dashboard'
import CardList from './components/CardList'
import CardDetail from './components/CardDetail'
import Ordered from './pages/Ordered'
import Settings from './pages/Settings'
import Login from './pages/Login'
import AuthButton from './components/AuthButton'
import BackupButtons from './components/BackupButtons'
import InstallPWA from './components/InstallPWA'
import ErrorBoundary from './components/ErrorBoundary'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useState, useMemo } from 'react'
import { Snowflake, LayoutGrid, List, Truck, CloudOff, CloudCheck, CloudSync, RefreshCw, Settings as SettingsIcon } from 'lucide-react'

function AppShell() {
  const [needUpdate, setNeedUpdate] = useState(false)

  const updateServiceWorker = useRegisterSW({
    onNeedRefresh() {
      setNeedUpdate(true)
    },
    onRegisteredSW(swUrl, r) {
      console.log('SW registered:', swUrl, r)
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  const handleReload = () => {
    updateServiceWorker(true)
    setNeedUpdate(false)
  }
  const { syncStatus } = useCollection()
  const location = useLocation()

  const isList = location.pathname === '/' || location.pathname.startsWith('/card/')
  const isDashboard = location.pathname === '/dashboard'
  const isOrdered = location.pathname === '/ordered'
  const isSettings = location.pathname === '/settings'

  const syncIcon = useMemo(() => {
    switch (syncStatus) {
      case 'synced':
        return <CloudCheck className="w-4 h-4 text-emerald-400" />
      case 'syncing':
        return <CloudSync className="w-4 h-4 text-amber-400" />
      case 'error':
        return <CloudOff className="w-4 h-4 text-rose-400" />
      default:
        return <CloudOff className="w-4 h-4 text-ice-300" />
    }
  }, [syncStatus])

  return (
    <div className="min-h-screen flex flex-col bg-snow dark:bg-navy-600 text-navy-600 dark:text-ice-100 transition-colors">
      <header className="sticky top-0 z-30 safe-top bg-navy-600/95 backdrop-blur border-b border-ice-200/10 shadow-card">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white font-semibold tracking-tight">
            <Snowflake className="w-6 h-6 text-glaceon" />
            <span className="hidden sm:inline">Glaceon Master Set</span>
            <span className="sm:hidden">Glaceon MS</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                isList ? 'bg-glaceon text-navy-700' : 'text-ice-100 hover:bg-white/10'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </Link>
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                isDashboard ? 'bg-glaceon text-navy-700' : 'text-ice-100 hover:bg-white/10'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              to="/ordered"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                isOrdered ? 'bg-glaceon text-navy-700' : 'text-ice-100 hover:bg-white/10'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">Ordered</span>
            </Link>
            <Link
              to="/settings"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                isSettings ? 'bg-glaceon text-navy-700' : 'text-ice-100 hover:bg-white/10'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <div title={syncStatus} className="p-1.5 rounded-full hover:bg-white/10 transition">
              {syncIcon}
            </div>
            <AuthButton />
          </nav>
        </div>
      </header>

      {needUpdate && (
        <div className="bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-700 px-4 py-2">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <span className="text-sm text-amber-800 dark:text-amber-200">
              A new version is available with updated card images.
            </span>
            <button
              onClick={handleReload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition"
            >
              <RefreshCw className="w-4 h-4" /> Reload
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-4">
        <Routes>
          <Route path="/" element={<CardList />} />
          <Route path="/card/:cardId" element={<CardDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ordered" element={<Ordered />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>

      <footer className="border-t border-ice-200 dark:border-navy-500 bg-white/50 dark:bg-navy-700/50 safe-bottom">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-navy-400 dark:text-ice-300">
          <FooterSyncText syncStatus={syncStatus} />
          <div className="flex items-center gap-2">
            <BackupButtons />
            <InstallPWA />
          </div>
        </div>
      </footer>
    </div>
  )
}

const FooterSyncText = ({ syncStatus }) => {
  const text = useMemo(() => {
    switch (syncStatus) {
      case 'synced':
        return 'Synced to cloud'
      case 'local':
        return 'Local only'
      case 'error':
        return 'Sync error'
      default:
        return syncStatus
    }
  }, [syncStatus])

  return <span>Offline-first · {text}</span>
}

function AuthGate() {
  const { user, authLoading } = useCollection()

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-navy-600 text-ice-100">
        <div className="w-12 h-12 rounded-full border-4 border-ice-200/30 border-t-glaceon animate-spin mb-4" />
        <div className="text-sm text-ice-300">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-navy-600 flex flex-col">
        <main className="flex-1">
          <Login />
        </main>
      </div>
    )
  }

  return <AppShell />
}

export default function App() {
  return (
    <ErrorBoundary>
      <CollectionProvider>
        <AuthGate />
      </CollectionProvider>
    </ErrorBoundary>
  )
}
