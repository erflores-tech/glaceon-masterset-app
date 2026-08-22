import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const LIST_STATE_KEY = 'glaceon-last-list-state-v3'

export function saveLastListState(params) {
  try {
    const state = {
      params: params.toString(),
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

export function useLastListState() {
  const [searchParams] = useSearchParams()
  const lastParamsRef = useRef(searchParams.toString())

  useEffect(() => {
    lastParamsRef.current = searchParams.toString()
    saveLastListState(searchParams)
  }, [searchParams])

  return { lastParams: lastParamsRef.current }
}
