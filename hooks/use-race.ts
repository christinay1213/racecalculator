'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Race } from '@/lib/types'

export function useRace(raceId: string) {
  const [race, setRace] = useState<Race | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRace = useCallback(async () => {
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('races')
      .select('*')
      .eq('id', raceId)
      .single()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setRace(data as Race)
    setLoading(false)
  }, [raceId])

  useEffect(() => {
    fetchRace()

    const supabase = createClient()
    const channel = supabase
      .channel(`race-${raceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'races', filter: `id=eq.${raceId}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setRace(payload.new as Race)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [raceId, fetchRace])

  return { race, loading, error, refetch: fetchRace }
}
