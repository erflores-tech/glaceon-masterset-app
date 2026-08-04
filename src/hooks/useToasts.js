import { useState, useCallback } from 'react'

let toastId = 0

export function useToasts() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = ++toastId
    const item = { id, type: 'info', duration: 4000, ...toast }
    setToasts((prev) => [...prev, item])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearAll = useCallback(() => setToasts([]), [])

  return { toasts, addToast, removeToast, clearAll }
}
