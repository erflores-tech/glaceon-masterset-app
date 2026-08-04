import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const LIST_STATE_KEY = 'glaceon-last-list-state-v1'

export function saveLastListState(params) {
  try {
    sessionStorage.setItem(LIST_STATE_KEY, params.toString())
  } catch {
    // ignore
  }
}

export function loadLastListState() {
  try {
    const raw = sessionStorage.getItem(LIST_STATE_KEY)
    return raw ? new URLSearchParams(raw) : null
  } catch {
    return null
  }
}

export function clearLastListState() {
  try {
    sessionStorage.removeItem(LIST_STATE_KEY)
  } catch {
    // ignore
  }
}

export function useLastListState() {
  const [searchParams] = useSearchParams()
  const lastParamsRef = useRef(searchParams.toString())

  useEffect(() => {
    lastParamsRef.current = searchParams.toString()
    saveLastListState(searchParams)
  }, [searchParams])

  return { lastParams: lastParamsRef.current }
}
