import { useCallback, useState } from 'react'

export function useSessionState(key, initialValue) {
  const storageKey = `sd-induk.${key}`
  const [value, setValue] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      return saved === null ? initialValue : JSON.parse(saved)
    } catch {
      return initialValue
    }
  })

  const updateValue = useCallback((nextValue) => {
    setValue((current) => {
      const resolved = typeof nextValue === 'function' ? nextValue(current) : nextValue
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(resolved))
      } catch {
        // Keep the view usable if browser storage is unavailable.
      }
      return resolved
    })
  }, [storageKey])

  return [value, updateValue]
}
