import { useEffect } from 'react'

const ANDROID_REGEX = /Android/i

function isTextInput(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

/**
 * On Android, the system back button often sends the key event to the focused
 * text field as a backspace instead of dismissing the keyboard. This hook
 * pushes a dummy history entry whenever a text input is focused and consumes
 * the first popstate while the keyboard is open, blurring the input so the
 * keyboard closes without navigating back.
 */
export function useAndroidBackToDismissKeyboard() {
  useEffect(() => {
    // Only apply on Android browsers where the issue occurs.
    if (!ANDROID_REGEX.test(navigator.userAgent) || !('visualViewport' in window)) {
      return
    }

    let dummyPushed = false
    let focusTimeout = null

    const pushDummy = () => {
      if (!dummyPushed) {
        window.history.pushState({ keyboardDismiss: true }, '')
        dummyPushed = true
      }
    }

    const handleFocusIn = () => {
      if (!isTextInput(document.activeElement)) return
      // Wait briefly so the virtual keyboard has time to open and resize
      // the visual viewport before we push the dummy history entry.
      if (focusTimeout) clearTimeout(focusTimeout)
      focusTimeout = setTimeout(() => {
        const vv = window.visualViewport
        const keyboardOpen = vv && vv.height < window.innerHeight * 0.8
        if (keyboardOpen) pushDummy()
      }, 150)
    }

    const handleFocusOut = () => {
      if (focusTimeout) clearTimeout(focusTimeout)
      // The dummy state will be cleaned up naturally on the next back press.
    }

    const handlePopState = (e) => {
      const active = document.activeElement
      if (dummyPushed && isTextInput(active)) {
        const vv = window.visualViewport
        const keyboardOpen = vv && vv.height < window.innerHeight * 0.8
        if (keyboardOpen) {
          active.blur()
          dummyPushed = false
          // Stop react-router and other listeners from seeing this popstate
          // as a real navigation. The browser has already popped our dummy
          // state, so the app stays on the current page.
          e.stopImmediatePropagation()
        }
      }
    }

    window.addEventListener('focusin', handleFocusIn)
    window.addEventListener('focusout', handleFocusOut)
    window.addEventListener('popstate', handlePopState, true)

    return () => {
      window.removeEventListener('focusin', handleFocusIn)
      window.removeEventListener('focusout', handleFocusOut)
      window.removeEventListener('popstate', handlePopState, true)
      if (focusTimeout) clearTimeout(focusTimeout)
    }
  }, [])
}
