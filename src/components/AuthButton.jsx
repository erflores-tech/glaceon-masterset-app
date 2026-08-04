import { useCollection } from '../context/CollectionContext'
import { Link, useLocation } from 'react-router-dom'
import { User, LogOut } from 'lucide-react'

export default function AuthButton() {
  const { user, authLoading, signInWithGoogle, signOutUser } = useCollection()
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  if (authLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
    )
  }

  if (user) {
    return (
      <button
        onClick={signOutUser}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-ice-100 text-sm transition"
        title={user.displayName || user.email}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-glaceon flex items-center justify-center">
            <User className="w-4 h-4 text-navy-700" />
          </div>
        )}
        <LogOut className="w-4 h-4" />
      </button>
    )
  }

  return (
    <Link
      to="/login"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-navy-700 text-sm font-medium hover:bg-ice-100 transition shadow-card"
    >
      <User className="w-4 h-4" />
      Sign in
    </Link>
  )
}
