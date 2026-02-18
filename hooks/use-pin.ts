'use client'

import { useState, useCallback, useEffect } from 'react'

/**
 * Manages edit PIN state using sessionStorage.
 * Once a user enters the correct PIN, they can edit for the remainder of their session.
 */
export function usePin(raceId: string) {
  const storageKey = `race-pin-${raceId}`
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(storageKey)
      if (stored === 'true') setIsUnlocked(true)
    }
  }, [storageKey])

  const unlock = useCallback(
    async (enteredPin: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/race/${raceId}/verify-pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: enteredPin }),
        })
        if (!res.ok) return false
        sessionStorage.setItem(storageKey, 'true')
        setIsUnlocked(true)
        return true
      } catch (e) {
        return false
      }
    },
    [raceId, storageKey]
  )

  const lock = useCallback(() => {
    sessionStorage.removeItem(storageKey)
    setIsUnlocked(false)
  }, [storageKey])

  return { isUnlocked, unlock, lock }
}
