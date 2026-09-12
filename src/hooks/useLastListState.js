import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const LIST_STATE_KEY = 'glaceon-last-list-state-v3'

/**
 * Persist the current card-list search params to sessionStorage.
 * This preserves filter state across route changes (e.g. card detail → back).
 *
 * @param {URLSearchParams} params
 */
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

/**
 * Load the previously saved list search params from sessionStorage.
 *
 * @returns {{ params: URLSearchParams } | null}
 */
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

/**
 * Remove any saved list search params from sessionStorage.
 */
export function clearLastListState() {
  try {
    sessionStorage.removeItem(LIST_STATE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Hook that keeps the current card-list search params in sessionStorage so that
 * navigating back from a card detail page can restore the previous filters.
 *
 * @returns {{ lastParams: string }}
 */
export function useLastListState() {
  const [searchParams] = useSearchParams()
  const lastParamsRef = useRef(searchParams.toString())

  useEffect(() => {
    lastParamsRef.current = searchParams.toString()
    saveLastListState(searchParams)
  }, [searchParams])

  return { lastParams: lastParamsRef.current }
}
