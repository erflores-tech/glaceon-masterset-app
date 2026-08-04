import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCollection } from '../context/CollectionContext'
import { useToasts } from '../hooks/useToasts'
import { ToastContainer } from '../components/Toast'
import { Snowflake, AlertCircle, User } from 'lucide-react'

export default function Login() {
  const { user, authLoading, lastError, signInWithGoogle, signInAsGuest } = useCollection()
  const { toasts, addToast, removeToast } = useToasts()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [user, navigate, location])

  useEffect(() => {
    if (lastError) {
      addToast({
        type: 'error',
        title: 'Sign-in failed',
        message: lastError.message || 'Please try again.',
      })
    }
  }, [lastError, addToast])

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-navy-400 dark:text-ice-300">
        <div className="w-12 h-12 rounded-full border-4 border-ice-200 dark:border-navy-500 border-t-glaceon animate-spin mb-4" />
        Checking sign-in status...
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-navy-700 rounded-2xl p-8 border border-ice-200 dark:border-navy-500 shadow-card text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-glaceon to-ice-300 flex items-center justify-center shadow-lg">
            <Snowflake className="w-9 h-9 text-navy-700" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
            Glaceon Master Set
          </h1>
          <p className="text-sm text-navy-400 dark:text-ice-300">
            Sign in to back up your collection to the cloud and sync across devices.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-navy-600 dark:bg-navy-500 border border-navy-500 dark:border-navy-400 text-white font-medium shadow-sm hover:bg-navy-700 dark:hover:bg-navy-400 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={signInAsGuest}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-ice-50 dark:bg-navy-600 border border-ice-200 dark:border-navy-500 text-navy-700 dark:text-white font-medium hover:bg-ice-100 dark:hover:bg-navy-500 transition"
          >
            <User className="w-5 h-5 text-navy-400 dark:text-ice-300" />
            Continue as Guest
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded-xl bg-ice-50 dark:bg-navy-600 p-3 text-left">
            <AlertCircle className="w-4 h-4 text-glaceon mt-0.5 shrink-0" />
            <p className="text-xs text-navy-500 dark:text-ice-300">
              Your collection is always saved locally first. Google sign-in enables cloud backup and cross-device sync.
            </p>
          </div>
          <p className="text-xs text-navy-400 dark:text-ice-300 px-1">
            Guest mode keeps data on this device only. You can sign in with Google later from Settings to back up your progress.
          </p>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  )
}
