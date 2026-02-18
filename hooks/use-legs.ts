'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Leg } from '@/lib/types'

export function useLegs(raceId: string) {
  const [legs, setLegs] = useState<Leg[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLegs = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('legs')
      .select('*')
      .eq('race_id', raceId)
      .order('leg_number', { ascending: true })

    if (data) setLegs(data as Leg[])
    setLoading(false)
  }, [raceId])

  useEffect(() => {
    fetchLegs()

    const supabase = createClient()
    const channel = supabase
      .channel(`legs-${raceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'legs', filter: `race_id=eq.${raceId}` },
        () => {
          fetchLegs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [raceId, fetchLegs])

  return { legs, loading, refetch: fetchLegs }
}
