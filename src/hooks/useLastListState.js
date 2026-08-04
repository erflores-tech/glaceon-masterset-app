import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const LIST_STATE_KEY = 'glaceon-last-list-state-v2'

export function saveLastListState(params, extra = {}) {
  try {
    const state = {
      params: params.toString(),
      page: extra.page ?? 1,
    }
    sessionStorage.setItem(LIST_STATE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function loadLastListState() {
  try {
    const raw = sessionStorage.getItem(LIST_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      params: new URLSearchParams(parsed.params || ''),
      page: parsed.page || 1,
    }
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

export function useLastListState(extra = {}) {
  const [searchParams] = useSearchParams()
  const lastParamsRef = useRef(searchParams.toString())

  useEffect(() => {
    lastParamsRef.current = searchParams.toString()
    saveLastListState(searchParams, extra)
  }, [searchParams, extra])

  return { lastParams: lastParamsRef.current }
}
